import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { GetSlotsQueryDto } from './dto/get-slots-query.dto.js';
import { SlotResponseDto } from './dto/slot-response.dto.js';
import { SlotsService } from './slots.service.js';

@ApiTags('Slots')
@Controller('api/v1/slots')
export class SlotsController {
  constructor(private readonly slotsService: SlotsService) {}

  @Get()
  @ApiOperation({
    summary: 'List time slots',
    description:
      'Retrieve available (or all) time slots. Supports filtering by date range and availability.',
  })
  @ApiQuery({ name: 'from', required: false, type: String, example: '2026-10-05T00:00:00Z' })
  @ApiQuery({ name: 'to', required: false, type: String, example: '2026-10-07T23:59:59Z' })
  @ApiQuery({ name: 'available', required: false, type: Boolean, example: true })
  @ApiOkResponse({ type: [SlotResponseDto], description: 'List of time slots' })
  findAll(@Query() query: GetSlotsQueryDto) {
    return this.slotsService.findAll(query);
  }
}
