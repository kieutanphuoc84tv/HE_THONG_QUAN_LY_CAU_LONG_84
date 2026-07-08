const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log("Seeding new tables...");

  // 1. GoiHoiVien
  await prisma.$executeRawUnsafe(`
    INSERT INTO goihoivien (id_goi, tengoi, thoihan, giatien, mota, trangthai)
    VALUES 
      (gen_random_uuid(), 'Gói Sinh Viên (1 Tháng)', 1, 300000, 'Giảm 10% tiền thuê sân, tặng 1 nước suối/buổi', 'Đang bán'),
      (gen_random_uuid(), 'Gói Phổ Thông (3 Tháng)', 3, 850000, 'Giảm 15% tiền thuê sân, ưu tiên đặt sân giờ vàng', 'Đang bán'),
      (gen_random_uuid(), 'Gói VIP (1 Năm)', 12, 3000000, 'Giảm 30% tiền thuê sân, tặng 1 áo CLB, miễn phí giữ xe', 'Đang bán')
  `);

  // 2. KhuyenMai
  await prisma.$executeRawUnsafe(`
    INSERT INTO khuyenmai (id_khuyenmai, makhuyenmai, tenkhuyenmai, phantramgiam, giamtoida, ngaybatdau, ngayketthuc, soluong, trangthai)
    VALUES 
      (gen_random_uuid(), 'SUMMER2026', 'Chào Hè Rực Rỡ 2026', 20, 100000, '2026-06-01', '2026-06-30', 50, 'Đang diễn ra'),
      (gen_random_uuid(), 'NEWBIE10', 'Giảm giá thành viên mới', 10, 50000, '2026-01-01', '2026-12-31', 999, 'Đang diễn ra'),
      (gen_random_uuid(), 'FLASH50', 'Flash Sale Cuối Tuần', 50, 150000, '2026-06-15', '2026-06-16', 20, 'Sắp diễn ra')
  `);

  // 3. CaLamViec
  const users = await prisma.$queryRawUnsafe(`SELECT id_nguoidung, hoten FROM nguoidung LIMIT 3`);
  if (users && users.length >= 2) {
    const id_nhanvien1 = users[0].id_nguoidung;
    const id_nhanvien2 = users[1].id_nguoidung;
    await prisma.$executeRawUnsafe(`
      INSERT INTO calamviec (id_calamviec, id_nhanvien, ngaylamviec, cathi, trangthai)
      VALUES 
        (gen_random_uuid(), '${id_nhanvien1}', '2026-06-13', 'Ca Sáng (06:00 - 14:00)', 'Đã chấm công'),
        (gen_random_uuid(), '${id_nhanvien2}', '2026-06-13', 'Ca Chiều (14:00 - 22:00)', 'Chờ chấm công'),
        (gen_random_uuid(), '${id_nhanvien1}', '2026-06-14', 'Ca Sáng (06:00 - 14:00)', 'Chờ chấm công')
    `);
  }


  console.log("Seeding completed!");
}

run().catch(e => console.error(e)).finally(() => prisma.$disconnect());
