import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const appointmentStatusEnum = pgEnum('appointment_status', [
  'CONFIRMED',
  'CANCELLED',
]);

export const slots = pgTable(
  'slots',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    startTime: timestamp('start_time', { withTimezone: true }).notNull(),
    endTime: timestamp('end_time', { withTimezone: true }).notNull(),
    isBooked: boolean('is_booked').notNull().default(false),
    version: integer('version').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('idx_slots_is_booked_start').on(t.isBooked, t.startTime),
  ],
);

export const appointments = pgTable(
  'appointments',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    slotId: text('slot_id').notNull().unique().references(() => slots.id),
    clientName: text('client_name').notNull(),
    clientEmail: text('client_email').notNull(),
    status: appointmentStatusEnum('status').notNull().default('CONFIRMED'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('idx_appointments_status').on(t.status),
  ],
);

export type Slot = typeof slots.$inferSelect;
export type NewSlot = typeof slots.$inferInsert;
export type Appointment = typeof appointments.$inferSelect;
export type NewAppointment = typeof appointments.$inferInsert;
export type AppointmentStatus = 'CONFIRMED' | 'CANCELLED';
