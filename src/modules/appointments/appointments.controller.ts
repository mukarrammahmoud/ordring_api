import { Body, Controller, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service.js';
import { AppointmentResponseDto } from './dto/appointment-response.dto.js';
import { CreateAppointmentDto } from './dto/create-appointment.dto.js';

@ApiTags('Appointments')
@Controller('api/v1/appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Book a slot',
    description:
      'Creates a new appointment for the given slot. Concurrent requests are handled safely — only one booking will succeed.',
  })
  @ApiBody({ type: CreateAppointmentDto })
  @ApiCreatedResponse({
    type: AppointmentResponseDto,
    description: 'Appointment successfully created',
  })
  @ApiConflictResponse({ description: 'Slot is already booked (409 Conflict)' })
  @ApiNotFoundResponse({ description: 'Slot not found (404)' })
  create(@Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.create(dto);
  }

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel an appointment',
    description:
      'Cancels an existing CONFIRMED appointment and marks the associated slot as available again.',
  })
  @ApiParam({ name: 'id', description: 'Appointment ID', example: 'clx1xyz789' })
  @ApiOkResponse({
    type: AppointmentResponseDto,
    description: 'Appointment successfully cancelled',
  })
  @ApiNotFoundResponse({ description: 'Appointment not found (404)' })
  cancel(@Param('id') id: string) {
    return this.appointmentsService.cancel(id);
  }
}
