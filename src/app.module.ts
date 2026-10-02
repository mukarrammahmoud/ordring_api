import { Module } from '@nestjs/common';
import { DrizzleModule } from './db/drizzle.module.js';
import { AppointmentsModule } from './modules/appointments/appointments.module.js';
import { SlotsModule } from './modules/slots/slots.module.js';

@Module({
  imports: [DrizzleModule, SlotsModule, AppointmentsModule],
})
export class AppModule {}
