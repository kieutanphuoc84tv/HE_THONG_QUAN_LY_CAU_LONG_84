const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const giaidau = await prisma.giaiDau.findFirst({ 
    where: { tengiai: "Giải đấu cầu lông 84 tại Vĩnh Long" } 
  });

  if (!giaidau) {
      console.log("Không tìm thấy giải đấu");
      return;
  }
  
  // Lấy 8 người dùng bất kỳ chưa từng đăng ký giải này
  const users = await prisma.nguoiDung.findMany({ 
    take: 8 
  });
  
  const dkData = users.map(u => ({
      id_giaidau: giaidau.id_giaidau,
      id_vadv: u.id_nguoidung,
      trangthai: 'Đã duyệt',
      hangmuc: 'Đơn nam'
  }));
  
  // Xóa đăng ký cũ nếu có để tránh trùng lặp
  await prisma.dkGiaiDau.deleteMany({
      where: { id_giaidau: giaidau.id_giaidau }
  });

  await prisma.dkGiaiDau.createMany({ data: dkData });
  console.log("Đã thêm thành công 8 người vào giải đấu:", giaidau.tengiai);
}

run().catch(console.error).finally(() => prisma.$disconnect());
