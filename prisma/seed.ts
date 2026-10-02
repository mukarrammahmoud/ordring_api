import { PrismaClient } from '@prisma/client';
import { addDays, addHours, startOfTomorrow } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean up
  await prisma.appointment.deleteMany();
  await prisma.slot.deleteMany();

  const tomorrow = startOfTomorrow();
  const slots: { startTime: Date; endTime: Date }[] = [];

  // Generate 3 days × 8 slots/day (hourly, 9am-5pm)
  for (let day = 0; day < 3; day++) {
    for (let hour = 9; hour < 17; hour++) {
      const startTime = addHours(addDays(tomorrow, day), hour);
      const endTime = addHours(startTime, 1);
      slots.push({ startTime, endTime });
    }
  }

  const created = await prisma.slot.createMany({ data: slots });
  console.log(`✅ Created ${created.count} slots.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
