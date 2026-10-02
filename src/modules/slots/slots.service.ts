import { Injectable } from '@nestjs/common';
import { and, asc, eq, gte, lte } from 'drizzle-orm';
import { DrizzleService } from '../../db/drizzle.service.js';
import { slots } from '../../db/schema.js';
import { GetSlotsQueryDto } from './dto/get-slots-query.dto.js';

@Injectable()
export class SlotsService {
  constructor(private readonly drizzle: DrizzleService) {}

  async findAll(query: GetSlotsQueryDto) {
    const conditions = [];

    if (query.available !== undefined) {
      conditions.push(eq(slots.isBooked, !query.available));
    }
    if (query.from) {
      conditions.push(gte(slots.startTime, query.from));
    }
    if (query.to) {
      conditions.push(lte(slots.startTime, query.to));
    }

    return this.drizzle.db
      .select()
      .from(slots)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(slots.startTime));
  }
}
