const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.nguoiDung.findMany();
  console.log("Users:", JSON.stringify(users, null, 2));

  const courts = await prisma.san.findMany();
  console.log("Courts:", JSON.stringify(courts, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
