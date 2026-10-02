import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { DrizzleService } from '../../db/drizzle.service.js';
import { appointments, slots } from '../../db/schema.js';
import { BookingGateway } from '../websocket/booking.gateway.js';
import { CreateAppointmentDto } from './dto/create-appointment.dto.js';

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly drizzle: DrizzleService,
    private readonly gateway: BookingGateway,
  ) {}

  /**
   * Book a slot using pessimistic locking (SELECT ... FOR UPDATE) inside a
   * transaction to prevent double booking under concurrency.
   */
  async create(dto: CreateAppointmentDto) {
    const appointment = await this.drizzle.db.transaction(async (tx) => {
      // 1. Lock the slot row for the duration of this transaction
      const lockedSlots = await tx.execute(
        sql`SELECT id, is_booked FROM slots WHERE id = ${dto.slotId} FOR UPDATE`,
      );

      if (lockedSlots.length === 0) {
        throw new NotFoundException(`Slot ${dto.slotId} not found`);
      }

      const slot = lockedSlots[0] as { id: string; is_booked: boolean };

      if (slot.is_booked) {
        throw new ConflictException(
          `Slot ${dto.slotId} is already booked. Please choose another slot.`,
        );
      }

      // 2. Mark slot as booked & bump version (optimistic lock counter)
      await tx
        .update(slots)
        .set({ isBooked: true, updatedAt: new Date() })
        .where(eq(slots.id, dto.slotId));

      // 3. Create the appointment
      const [created] = await tx
        .insert(appointments)
        .values({
          slotId: dto.slotId,
          clientName: dto.clientName,
          clientEmail: dto.clientEmail,
          status: 'CONFIRMED',
        })
        .returning();

      // Fetch slot for the response
      const [updatedSlot] = await tx
        .select()
        .from(slots)
        .where(eq(slots.id, dto.slotId));

      return { ...created, slot: updatedSlot };
    });

    // Emit Socket.IO event after successful commit
    this.gateway.emitAppointmentCreated(appointment);

    return appointment;
  }

  /**
   * Cancel an existing appointment and free the slot.
   */
  async cancel(id: string) {
    const [existing] = await this.drizzle.db
      .select()
      .from(appointments)
      .where(eq(appointments.id, id));

    if (!existing) {
      throw new NotFoundException(`Appointment ${id} not found`);
    }

    if (existing.status === 'CANCELLED') {
      throw new BadRequestException(`Appointment ${id} is already cancelled`);
    }

    const updated = await this.drizzle.db.transaction(async (tx) => {
      const [appointment] = await tx
        .update(appointments)
        .set({ status: 'CANCELLED', updatedAt: new Date() })
        .where(eq(appointments.id, id))
        .returning();

      await tx
        .update(slots)
        .set({ isBooked: false, updatedAt: new Date() })
        .where(eq(slots.id, appointment.slotId));

      const [updatedSlot] = await tx
        .select()
        .from(slots)
        .where(eq(slots.id, appointment.slotId));

      return { ...appointment, slot: updatedSlot };
    });

    this.gateway.emitAppointmentCancelled(updated);

    return updated;
  }
}
