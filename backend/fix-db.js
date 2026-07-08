const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE thanhvienclb ADD COLUMN IF NOT EXISTS diemtichluy INTEGER DEFAULT 0;`);
    console.log("Successfully added diemtichluy column to thanhvienclb table!");
  } catch (error) {
    console.error("Error updating database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
