import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { GetSlotsQueryDto } from './dto/get-slots-query.dto.js';

@Injectable()
export class SlotsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: GetSlotsQueryDto) {
    return this.prisma.slot.findMany({
      where: {
        ...(query.available !== undefined && { isBooked: !query.available }),
        ...(query.from || query.to
          ? {
              startTime: {
                ...(query.from && { gte: query.from }),
                ...(query.to && { lte: query.to }),
              },
            }
          : {}),
      },
      orderBy: { startTime: 'asc' },
    });
  }
}
