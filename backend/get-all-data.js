const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("--- BẢNG NGUOIDUNG ---");
  const users = await prisma.nguoiDung.findMany();
  console.log(JSON.stringify(users, null, 2));

  console.log("--- BẢNG SAN ---");
  const courts = await prisma.san.findMany();
  console.log(JSON.stringify(courts, null, 2));

  console.log("--- BẢNG DATSAN ---");
  const datsan = await prisma.datSan.findMany({ include: { nguoiDung: true, san: true } });
  console.log(JSON.stringify(datsan, null, 2));

  console.log("--- BẢNG HOADON ---");
  const hoadon = await prisma.hoaDon.findMany({ include: { datSan: true } });
  console.log(JSON.stringify(hoadon, null, 2));

  console.log("--- BẢNG THANHVIENCLB ---");
  const thanhvien = await prisma.thanhVienClb.findMany({ include: { nguoiDung: true } });
  console.log(JSON.stringify(thanhvien, null, 2));

  console.log("--- BẢNG GIAIDAU ---");
  const giaidau = await prisma.giaiDau.findMany();
  console.log(JSON.stringify(giaidau, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
