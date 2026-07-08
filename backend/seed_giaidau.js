const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const admin = await prisma.nguoiDung.findFirst({ where: { vaitro: 'Admin' } });
  const adminId = admin ? admin.id_nguoidung : null;

  await prisma.giaiDau.createMany({
    data: [
      {
        tengiai: "Giải đấu cầu lông 84 tại Vĩnh Long",
        ngaybatdau: new Date('2026-07-01'),
        ngayketthuc: new Date('2026-07-02'),
        lephi: 150000,
        soluongtoida: 8,
        hinhthuc: "KnockOut",
        trangthai: "Sắp diễn ra",
        id_nguoitochuc: adminId
      },
      {
        tengiai: "Giải giao hữu Phường 1 Trà Vinh",
        ngaybatdau: new Date('2026-07-15'),
        ngayketthuc: new Date('2026-07-16'),
        lephi: 100000,
        soluongtoida: 8,
        hinhthuc: "Đấu vòng tròn",
        trangthai: "Đang đăng ký",
        id_nguoitochuc: adminId
      },
      {
        tengiai: "Giải phong trào Cầu Lông 84 - Tứ Hùng",
        ngaybatdau: new Date('2026-08-01'),
        ngayketthuc: new Date('2026-08-03'),
        lephi: 200000,
        soluongtoida: 8,
        hinhthuc: "Đấu vòng tròn",
        trangthai: "Chưa bắt đầu",
        id_nguoitochuc: adminId
      }
    ]
  });
  console.log("Inserted 3 tournaments.");
}
run().catch(console.error).finally(() => prisma.$disconnect());
