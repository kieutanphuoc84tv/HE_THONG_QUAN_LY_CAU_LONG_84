const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  await prisma.giaiDau.updateMany({
    where: { tengiai: "Giải đấu cầu lông 84 tại Vĩnh Long" },
    data: { trangthai: "DangDienRa" }
  });
  
  await prisma.giaiDau.updateMany({
    where: { tengiai: "Giải giao hữu Phường 1 Trà Vinh" },
    data: { trangthai: "SapDienRa" }
  });

  await prisma.giaiDau.updateMany({
    where: { tengiai: "Giải phong trào Cầu Lông 84 - Tứ Hùng" },
    data: { trangthai: "SapDienRa" }
  });

  console.log("Updated statuses successfully");
}

run().catch(console.error).finally(() => prisma.$disconnect());
