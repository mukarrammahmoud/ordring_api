import { Module } from '@nestjs/common';
import { BookingGateway } from './booking.gateway.js';

@Module({
  providers: [BookingGateway],
  exports: [BookingGateway],
})
export class WebsocketModule {}
