const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // ═══════════════════════════════════════════════
  //  LẤY DỮ LIỆU CẦN THIẾT
  // ═══════════════════════════════════════════════
  const allUsers = await prisma.nguoiDung.findMany({
    where: { vaitro: { in: ['KhachHang', 'HuanLuyenVien'] } },
    orderBy: { ngaytao: 'asc' }
  });

  const courts = await prisma.san.findMany({ orderBy: { tensan: 'asc' } });
  const services = await prisma.dichVu.findMany({ orderBy: { tendichvu: 'asc' } });

  console.log(`Tìm thấy ${allUsers.length} user, ${courts.length} sân, ${services.length} dịch vụ/thiết bị`);

  if (courts.length === 0) {
    console.log('⚠️ Chưa có sân nào trong DB. Bỏ qua đặt sân.');
  }
  if (services.length === 0) {
    console.log('⚠️ Chưa có dịch vụ nào trong DB. Bỏ qua thuê đồ.');
  }
  if (allUsers.length === 0) {
    console.log('⚠️ Chưa có user nào. Dừng lại.');
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // ═══════════════════════════════════════════════
  //  1. ĐẶT SÂN — mỗi người đặt 2 lần, giờ khác nhau
  // ═══════════════════════════════════════════════
  if (courts.length > 0) {
    // Xóa dữ liệu cũ
    await prisma.hoaDon.deleteMany({});
    await prisma.datSan.deleteMany({});
    console.log('\n🏟️ Tạo dữ liệu đặt sân...');

    const bookingSlots = [
      { start: '06:00', end: '07:30' },
      { start: '07:30', end: '09:00' },
      { start: '09:00', end: '10:30' },
      { start: '10:30', end: '12:00' },
      { start: '14:00', end: '15:30' },
      { start: '15:30', end: '17:00' },
      { start: '17:00', end: '18:30' },
      { start: '18:30', end: '20:00' },
      { start: '20:00', end: '21:30' },
    ];

    const bookingStatuses = [
      'Đã xác nhận',
      'Chờ xác nhận',
      'Đã xác nhận',
      'Đã hủy',
      'Đã xác nhận',
      'Chờ xác nhận',
      'Hoàn thành',
      'Đã xác nhận',
      'Chờ xác nhận',
    ];

    let slotIdx = 0;
    let bookingCount = 0;

    for (let i = 0; i < allUsers.length; i++) {
      const user = allUsers[i];

      for (let round = 0; round < 2; round++) {
        const dayOffset = (i + round * 3) % 7;
        const date = new Date(today);
        date.setDate(date.getDate() + dayOffset);

        const court = courts[(i + round) % courts.length];
        const slot = bookingSlots[slotIdx % bookingSlots.length];
        const status = bookingStatuses[slotIdx % bookingStatuses.length];
        slotIdx++;

        const [sh, sm] = slot.start.split(':').map(Number);
        const [eh, em] = slot.end.split(':').map(Number);

        const giobatdau = new Date('2000-01-01T00:00:00Z');
        giobatdau.setUTCHours(sh, sm, 0, 0);
        const gioketthuc = new Date('2000-01-01T00:00:00Z');
        gioketthuc.setUTCHours(eh, em, 0, 0);

        const booking = await prisma.datSan.create({
          data: {
            id_nguoidung: user.id_nguoidung,
            id_san: court.id_san,
            ngaydat: date,
            giobatdau,
            gioketthuc,
            trangthai: status,
            ghichu: `${user.hoten || user.tendangnhap} đặt ${court.tensan} - ${slot.start} đến ${slot.end}`,
          }
        });

        // Tạo hóa đơn cho các đơn đã xác nhận/hoàn thành
        if (status === 'Đã xác nhận' || status === 'Hoàn thành') {
          const gia = court.giathue ? Number(court.giathue) : 80000;
          await prisma.hoaDon.create({
            data: {
              id_datsan: booking.id_datsan,
              sotien: gia * 1.5, // 1.5 giờ
              phuongthuc: ['Tiền mặt', 'Chuyển khoản', 'VNPay'][bookingCount % 3],
              trangthai: status === 'Hoàn thành' ? 'Đã thanh toán' : 'Chờ thanh toán',
            }
          });
        }

        console.log(`  ${(user.hoten || user.tendangnhap).padEnd(22)} | ${court.tensan.padEnd(12)} | ${date.toLocaleDateString('vi-VN')} | ${slot.start}-${slot.end} | ${status}`);
        bookingCount++;
      }
    }
    console.log(`✅ Tạo xong ${bookingCount} lượt đặt sân!`);
  }

  // ═══════════════════════════════════════════════
  //  2. THUÊ ĐỒ — mỗi người thuê 1-2 món khác nhau
  // ═══════════════════════════════════════════════
  if (services.length > 0) {
    await prisma.donThue.deleteMany({});
    console.log('\n🏸 Tạo dữ liệu thuê đồ...');

    const rentalStatuses = ['DangThue', 'DaTraDo', 'DangThue', 'DaTraDo', 'DangThue'];
    let rentalCount = 0;

    for (let i = 0; i < allUsers.length; i++) {
      const user = allUsers[i];

      // Mỗi user thuê 1-2 món
      const numRentals = (i % 2 === 0) ? 2 : 1;

      for (let j = 0; j < numRentals; j++) {
        const service = services[(i * 2 + j) % services.length];
        const qty = 1 + (i % 3); // 1, 2, hoặc 3
        const hours = 1 + (i % 3); // 1h, 2h, hoặc 3h
        const giaThue = service.giathue ? Number(service.giathue) : (service.gia ? Number(service.gia) * 0.1 : 15000);
        const totalPrice = giaThue * qty * hours;
        const status = rentalStatuses[rentalCount % rentalStatuses.length];

        await prisma.donThue.create({
          data: {
            id_nguoidung: user.id_nguoidung,
            id_dichvu: service.id_dichvu,
            soluong: qty,
            sogio: hours,
            tongtien: totalPrice,
            ghichu: `${user.hoten || user.tendangnhap} thuê ${qty} ${service.tendichvu} trong ${hours}h`,
            trangthai: status,
          }
        });

        console.log(`  ${(user.hoten || user.tendangnhap).padEnd(22)} | ${service.tendichvu.substring(0, 30).padEnd(32)} | SL: ${qty} | ${hours}h | ${totalPrice.toLocaleString('vi-VN')}đ | ${status}`);
        rentalCount++;
      }
    }
    console.log(`✅ Tạo xong ${rentalCount} đơn thuê đồ!`);
  }

  console.log('\n🎉 Hoàn tất tạo dữ liệu đặt sân & thuê đồ!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
