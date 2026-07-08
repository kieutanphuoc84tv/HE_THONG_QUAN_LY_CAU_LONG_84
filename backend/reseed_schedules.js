const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Xóa toàn bộ lịch tập luyện cũ...');
  await prisma.lichTapLuyen.deleteMany({});

  const coaches = await prisma.nguoiDung.findMany({
    where: { vaitro: 'HuanLuyenVien' },
    orderBy: { ngaytao: 'asc' }
  });

  const students = await prisma.nguoiDung.findMany({
    where: { vaitro: 'KhachHang' },
    include: { thanhVienClb: true },
    orderBy: { ngaytao: 'asc' }
  });

  if (coaches.length === 0 || students.length === 0) {
    console.log('Không tìm thấy HLV hoặc Học viên!');
    return;
  }

  // ═══════════════════════════════════════════════════════
  //  30 ô lịch KHÔNG TRÙNG (10 HLV × 3 buổi)
  //  Rải ra 7 ngày, 9 khung giờ khác nhau
  //  Mỗi ô có 1 trạng thái khác nhau
  // ═══════════════════════════════════════════════════════

  const timeSlots = [
    { start: '06:00', end: '07:00' },
    { start: '07:00', end: '08:00' },
    { start: '08:00', end: '09:00' },
    { start: '09:30', end: '10:30' },
    { start: '15:00', end: '16:00' },
    { start: '16:00', end: '17:00' },
    { start: '17:00', end: '18:00' },
    { start: '18:30', end: '19:30' },
    { start: '19:30', end: '20:30' },
    { start: '20:30', end: '21:30' },
  ];

  const allStatuses = [
    'Chờ xếp lịch',
    'Đợi xác nhận',
    'Đã chốt lịch',
    'Hoàn thành',
    'Chờ xác nhận hủy',
    'Đã hủy',
  ];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Tạo bảng lịch: mỗi ô = (ngày, khung giờ)
  // Đảm bảo KHÔNG có 2 HLV nào cùng ngày + cùng giờ
  const usedSlots = new Set(); // key = "dayOffset-slotIndex"

  function getUniqueSlot(preferDay, preferSlot) {
    // Thử ô ưu tiên trước
    let key = `${preferDay}-${preferSlot}`;
    if (!usedSlots.has(key)) {
      usedSlots.add(key);
      return { day: preferDay, slot: preferSlot };
    }
    // Nếu bị trùng, tìm ô trống khác
    for (let d = 0; d < 7; d++) {
      for (let s = 0; s < timeSlots.length; s++) {
        key = `${d}-${s}`;
        if (!usedSlots.has(key)) {
          usedSlots.add(key);
          return { day: d, slot: s };
        }
      }
    }
    // Fallback (không bao giờ xảy ra với 30 buổi / 70 ô)
    return { day: preferDay, slot: preferSlot };
  }

  const pairs = Math.min(coaches.length, students.length);
  let count = 0;
  let statusIdx = 0;

  for (let i = 0; i < pairs; i++) {
    const coach = coaches[i];
    const student = students[i];
    if (!student.thanhVienClb) continue;

    for (let j = 0; j < 3; j++) {
      // Phân bổ ưu tiên: buổi j=0 sáng, j=1 chiều, j=2 tối
      const preferDay = (i * 2 + j) % 7;
      const preferSlot = j * 3 + (i % 3); // 0-2 sáng, 3-5 chiều, 6-8 tối

      const { day: dayOffset, slot: slotIndex } = getUniqueSlot(preferDay, preferSlot);
      const slot = timeSlots[slotIndex];

      const date = new Date(today);
      date.setDate(date.getDate() + dayOffset);

      const [sh, sm] = slot.start.split(':').map(Number);
      const [eh, em] = slot.end.split(':').map(Number);

      const giobatdau = new Date(date);
      giobatdau.setHours(sh, sm, 0, 0);
      const gioketthuc = new Date(date);
      gioketthuc.setHours(eh, em, 0, 0);

      // Mỗi buổi xoay vòng 1 trạng thái khác nhau
      const trangthai = allStatuses[statusIdx % allStatuses.length];
      statusIdx++;

      const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
      const dayName = dayNames[date.getDay()];

      await prisma.lichTapLuyen.create({
        data: {
          id_hlv: coach.id_nguoidung,
          id_thanhvien: student.thanhVienClb.id_thanhvien,
          ngaytap: date,
          giobatdau,
          gioketthuc,
          ghichu: `${student.hoten} tập với HLV ${coach.hoten} (${dayName})`,
          lephi: 150000,
          trangthai,
        }
      });

      console.log(`  ${(coach.hoten).padEnd(20)} → ${(student.hoten).padEnd(20)} | ${dayName} ${date.toLocaleDateString('vi-VN')} | ${slot.start}-${slot.end} | ${trangthai}`);
      count++;
    }
  }

  console.log(`\n✅ Tạo xong ${count} buổi học — KHÔNG trùng lịch, mỗi cái trạng thái khác nhau!`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
