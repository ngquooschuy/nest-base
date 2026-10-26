import 'dotenv/config';
import { faker } from '@faker-js/faker';
import { PrismaPg } from '@prisma/adapter-pg';
import * as argon2 from 'argon2';
import { PrismaClient, Role } from '../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL as string,
  }),
});

async function seedAdmin() {
  const email = (
    process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com'
  ).toLowerCase();
  const exists = await prisma.user.findFirst({
    where: { email, deletedAt: null },
  });
  if (exists) return console.log(`• Admin ${email} đã tồn tại, bỏ qua`);

  await prisma.user.create({
    data: {
      email,
      password: await argon2.hash(
        process.env.SEED_ADMIN_PASSWORD ?? 'Admin@12345',
      ),
      fullName: 'Administrator',
      role: Role.ADMIN,
    },
  });
  console.log(`✓ Đã tạo admin ${email}`);
}

async function seedFakeUsers(target = 30) {
  const current = await prisma.user.count({ where: { role: Role.USER } });
  if (current >= target) return console.log(`• Đã có ${current} user, bỏ qua`);

  const password = await argon2.hash('User@12345'); // hash một lần, dùng chung cho mọi user giả
  await prisma.user.createMany({
    data: Array.from({ length: target - current }, () => ({
      email: faker.internet.email().toLowerCase(),
      password,
      fullName: faker.person.fullName(),
      age: faker.number.int({ min: 18, max: 60 }),
    })),
    skipDuplicates: true,
  });
  console.log(`✓ Đã tạo ${target - current} user giả`);
}

async function main() {
  await seedAdmin();
  await seedFakeUsers();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
