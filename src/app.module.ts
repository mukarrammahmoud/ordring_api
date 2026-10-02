import { Module } from '@nestjs/common';
import { AppointmentsModule } from './modules/appointments/appointments.module.js';
import { SlotsModule } from './modules/slots/slots.module.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [PrismaModule, SlotsModule, AppointmentsModule],
})
export class AppModule {}
