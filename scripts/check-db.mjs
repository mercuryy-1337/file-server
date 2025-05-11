import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    const userCount = await prisma.user.count();
    console.log(userCount);
    return userCount;
  } catch (error) {
    console.error('Error checking database:', error);
    return 0;
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
