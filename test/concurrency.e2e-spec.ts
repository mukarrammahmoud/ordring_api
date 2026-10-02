/**
 * Concurrency E2E Test — Race Condition Prevention
 *
 * Seeds one slot then fires N concurrent booking requests simultaneously.
 * Asserts exactly ONE succeeds (201) and all others receive 409 Conflict.
 * Verifies database has exactly one appointment for the slot.
 *
 * Requires a running database (use docker-compose up -d) and migrated schema.
 * Set DATABASE_URL in .env before running.
 */

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { eq } from 'drizzle-orm';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import supertest from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter.js';
import * as schema from '../src/db/schema.js';

const client = postgres(process.env.DATABASE_URL ?? '');
const db: PostgresJsDatabase<typeof schema> = drizzle(client, { schema });

describe('Concurrency: double-booking prevention', () => {
  let app: INestApplication;
  let slotId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await client.end();
  });

  beforeEach(async () => {
    // Clean and seed a single available slot
    await db.delete(schema.appointments);
    await db.delete(schema.slots);

    const [slot] = await db
      .insert(schema.slots)
      .values({
        id: crypto.randomUUID(),
        startTime: new Date('2099-01-01T09:00:00Z'),
        endTime: new Date('2099-01-01T10:00:00Z'),
        isBooked: false,
        version: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    slotId = slot.id;
  });

  it('allows exactly one booking when 10 concurrent requests race for the same slot', async () => {
    const CONCURRENCY = 10;

    const requests = Array.from({ length: CONCURRENCY }, (_, i) =>
      supertest(app.getHttpServer())
        .post('/api/v1/appointments')
        .send({
          slotId,
          clientName: `Client ${i}`,
          clientEmail: `client${i}@example.com`,
        }),
    );

    const results = await Promise.all(requests);

    const created = results.filter((r) => r.status === 201);
    const conflicted = results.filter((r) => r.status === 409);

    // Exactly one booking must succeed
    expect(created).toHaveLength(1);
    expect(conflicted).toHaveLength(CONCURRENCY - 1);

    // Database must have exactly one appointment
    const appts = await db
      .select()
      .from(schema.appointments)
      .where(eq(schema.appointments.slotId, slotId));
    expect(appts).toHaveLength(1);

    // The slot must be marked as booked
    const [slot] = await db
      .select()
      .from(schema.slots)
      .where(eq(schema.slots.id, slotId));
    expect(slot.isBooked).toBe(true);
  });

  it('returns 409 on a second sequential booking attempt for the same slot', async () => {
    const body = {
      slotId,
      clientName: 'First Client',
      clientEmail: 'first@example.com',
    };

    const first = await supertest(app.getHttpServer())
      .post('/api/v1/appointments')
      .send(body);
    expect(first.status).toBe(201);

    const second = await supertest(app.getHttpServer())
      .post('/api/v1/appointments')
      .send({ ...body, clientEmail: 'second@example.com' });
    expect(second.status).toBe(409);
    expect(second.body.message).toMatch(/already booked/i);
  });

  it('frees the slot after cancellation and allows a re-booking', async () => {
    // Book
    const bookRes = await supertest(app.getHttpServer())
      .post('/api/v1/appointments')
      .send({ slotId, clientName: 'Alice', clientEmail: 'alice@example.com' });
    expect(bookRes.status).toBe(201);

    const appointmentId: string = bookRes.body.id;

    // Cancel
    const cancelRes = await supertest(app.getHttpServer()).patch(
      `/api/v1/appointments/${appointmentId}/cancel`,
    );
    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.status).toBe('CANCELLED');

    // Slot should now be free
    const [slot] = await db
      .select()
      .from(schema.slots)
      .where(eq(schema.slots.id, slotId));
    expect(slot.isBooked).toBe(false);

    // Re-book the now-free slot
    const rebook = await supertest(app.getHttpServer())
      .post('/api/v1/appointments')
      .send({ slotId, clientName: 'Bob', clientEmail: 'bob@example.com' });
    expect(rebook.status).toBe(201);
  });
});
