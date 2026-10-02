/**
 * Seed script — generates 3 days × 8 hourly slots (9am–5pm).
 * Run with: pnpm db:seed
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { addDays, addHours, setHours, startOfTomorrow } from 'date-fns';
import * as schema from './schema.js';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set');

const client = postgres(url);
const db = drizzle(client, { schema });

async function main() {
  console.log('🌱 Seeding database...');

  await db.delete(schema.appointments);
  await db.delete(schema.slots);

  const tomorrow = startOfTomorrow();
  const slotData: schema.NewSlot[] = [];

  for (let day = 0; day < 3; day++) {
    for (let hour = 9; hour < 17; hour++) {
      const base = addDays(setHours(tomorrow, 0), day);
      const startTime = addHours(base, hour);
      const endTime = addHours(startTime, 1);
      slotData.push({
        id: crypto.randomUUID(),
        startTime,
        endTime,
        isBooked: false,
        version: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  await db.insert(schema.slots).values(slotData);
  console.log(`✅ Created ${slotData.length} slots.`);
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
