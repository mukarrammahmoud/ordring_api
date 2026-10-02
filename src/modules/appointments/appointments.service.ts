import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { BookingGateway } from '../websocket/booking.gateway.js';
import { CreateAppointmentDto } from './dto/create-appointment.dto.js';

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: BookingGateway,
  ) {}

  /**
   * Book a slot using pessimistic locking (SELECT ... FOR UPDATE) inside a
   * Prisma interactive transaction to prevent double booking under concurrency.
   */
  async create(dto: CreateAppointmentDto) {
    const appointment = await this.prisma.$transaction(async (tx) => {
      // 1. Lock the row for the duration of this transaction
      const slots = await tx.$queryRaw<
        { id: string; is_booked: boolean }[]
      >`SELECT id, "isBooked" as is_booked FROM "Slot" WHERE id = ${dto.slotId} FOR UPDATE`;

      if (slots.length === 0) {
        throw new NotFoundException(`Slot ${dto.slotId} not found`);
      }

      const slot = slots[0];

      if (slot.is_booked) {
        throw new ConflictException(
          `Slot ${dto.slotId} is already booked. Please choose another slot.`,
        );
      }

      // 2. Mark slot as booked
      await tx.slot.update({
        where: { id: dto.slotId },
        data: { isBooked: true },
      });

      // 3. Create the appointment
      return tx.appointment.create({
        data: {
          slotId: dto.slotId,
          clientName: dto.clientName,
          clientEmail: dto.clientEmail,
          status: AppointmentStatus.CONFIRMED,
        },
        include: { slot: true },
      });
    });

    // Emit Socket.IO event after successful commit
    this.gateway.emitAppointmentCreated(appointment);

    return appointment;
  }

  /**
   * Cancel an existing appointment and free the slot.
   */
  async cancel(id: string) {
    const existing = await this.prisma.appointment.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException(`Appointment ${id} not found`);
    }

    if (existing.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException(`Appointment ${id} is already cancelled`);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.update({
        where: { id },
        data: { status: AppointmentStatus.CANCELLED },
        include: { slot: true },
      });

      await tx.slot.update({
        where: { id: appointment.slotId },
        data: { isBooked: false },
      });

      return appointment;
    });

    this.gateway.emitAppointmentCancelled(updated);

    return updated;
  }
}
