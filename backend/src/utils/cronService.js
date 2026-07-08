const cron = require('node-cron');
const prisma = require('../prismaClient');
const { addEmailJob } = require('./queueService');
const { syncTournamentStatuses } = require('./tournamentHelper');

function startCronJobs() {
  console.log('[Cron] Khởi động Scheduled Jobs...');

  // 1. Job chạy mỗi 30 phút: Tự động hủy các đơn "Chờ xác nhận" đã qua thời gian bắt đầu
  cron.schedule('*/30 * * * *', async () => {
    console.log('[Cron] Bắt đầu quét đơn đặt sân quá hạn...');
    try {
      // Vì CSDL tách ngaydat và giobatdau, ta cần duyệt và kết hợp lại
      const pendingBookings = await prisma.datSan.findMany({
        where: { trangthai: 'Chờ xác nhận' }
      });

      const now = new Date();
      let canceledCount = 0;

      for (const booking of pendingBookings) {
        const bd = new Date(booking.ngaydat);
        const timeBd = new Date(booking.giobatdau);
        bd.setHours(timeBd.getHours(), timeBd.getMinutes(), 0, 0);

        // Nếu thời gian bắt đầu đã trôi qua
        if (bd < now) {
          await prisma.datSan.update({
            where: { id_datsan: booking.id_datsan },
            data: { trangthai: 'Đã hủy' }
          });
          canceledCount++;
        }
      }
      if (canceledCount > 0) {
        console.log(`[Cron] Đã tự động hủy ${canceledCount} đơn đặt sân quá hạn.`);
      }
    } catch (err) {
      console.error('[Cron] Lỗi khi quét đơn quá hạn:', err);
    }
  });

  // 2. Job chạy mỗi cuối ngày (23:59): Cập nhật trạng thái "Hoàn thành" cho các đơn đã xác nhận và đã qua thời gian kết thúc
  cron.schedule('59 23 * * *', async () => {
    console.log('[Cron] Bắt đầu dọn dẹp đơn cuối ngày...');
    try {
      const confirmedBookings = await prisma.datSan.findMany({
        where: { trangthai: 'Đã xác nhận' }
      });
      const now = new Date();
      let completedCount = 0;

      for (const booking of confirmedBookings) {
        const kt = new Date(booking.ngaydat);
        const timeKt = new Date(booking.gioketthuc);
        kt.setHours(timeKt.getHours(), timeKt.getMinutes(), 0, 0);

        if (kt < now) {
          await prisma.datSan.update({
            where: { id_datsan: booking.id_datsan },
            data: { trangthai: 'Hoàn thành' }
          });
          completedCount++;
        }
      }
      if (completedCount > 0) {
        console.log(`[Cron] Đã tự động hoàn thành ${completedCount} đơn đặt sân.`);
      }
    } catch (err) {
      console.error('[Cron] Lỗi khi dọn dẹp đơn cuối ngày:', err);
    }
  });

  // 3. Job chạy mỗi 15 phút: Nhắc lịch trước 1 giờ
  cron.schedule('*/15 * * * *', async () => {
    console.log('[Cron] Kiểm tra lịch sắp diễn ra (nhắc trước 1h)...');
    try {
      const now = new Date();
      const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
      const inOneHour15 = new Date(now.getTime() + 75 * 60 * 1000);

      const upcomingBookings = await prisma.datSan.findMany({
        where: { trangthai: 'Đã xác nhận' },
        include: { san: true, nguoiDung: true }
      });

      for (const booking of upcomingBookings) {
        if (!booking.nguoiDung?.email) continue;
        
        const bd = new Date(booking.ngaydat);
        const timeBd = new Date(booking.giobatdau);
        bd.setHours(timeBd.getHours(), timeBd.getMinutes(), 0, 0);

        if (bd >= inOneHour && bd < inOneHour15) {
          const subject = 'Nhắc nhở: Sắp đến giờ đá cầu lông!';
          const html = `
            <h3>Xin chào ${booking.nguoiDung.hoten},</h3>
            <p>Chỉ còn khoảng 1 giờ nữa là đến lịch đặt sân của bạn.</p>
            <ul>
              <li><strong>Sân:</strong> ${booking.san.tensan}</li>
              <li><strong>Thời gian:</strong> ${timeBd.toLocaleTimeString('vi-VN')}</li>
            </ul>
            <p>Vui lòng đến đúng giờ. Hẹn gặp lại!</p>
          `;
          await addEmailJob(booking.nguoiDung.email, subject, html);
        }
      }
    } catch (err) {
      console.error('[Cron] Lỗi khi gửi nhắc nhở:', err);
    }
  });

  // 4. Báo cáo cuối ngày (23:50) gửi cho Admin
  cron.schedule('50 23 * * *', async () => {
    console.log('[Cron] Tổng hợp báo cáo cuối ngày...');
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      const bookings = await prisma.datSan.findMany({
        where: {
          ngaydat: { gte: today, lte: endOfDay }
        },
        include: { hoaDon: true }
      });

      const totalBookings = bookings.length;
      const completed = bookings.filter(b => b.trangthai === 'Hoàn thành').length;
      const cancelled = bookings.filter(b => b.trangthai === 'Đã hủy' || b.trangthai === 'Bị xóa').length;
      const revenue = bookings.reduce((sum, b) => {
        if (b.hoaDon && b.hoaDon.trangthai === 'Đã thanh toán') {
          return sum + Number(b.hoaDon.sotien);
        }
        return sum;
      }, 0);

      const adminUsers = await prisma.nguoiDung.findMany({ where: { vaitro: { in: ['Admin', 'ChuSan'] } } });
      const html = `
        <h2>Báo cáo ngày ${today.toLocaleDateString('vi-VN')}</h2>
        <ul>
          <li><strong>Tổng số lượt đặt:</strong> ${totalBookings}</li>
          <li><strong>Hoàn thành:</strong> ${completed}</li>
          <li><strong>Đã hủy:</strong> ${cancelled}</li>
          <li><strong>Doanh thu:</strong> ${revenue.toLocaleString('vi-VN')} đ</li>
        </ul>
      `;

      for (const admin of adminUsers) {
        if (admin.email) {
          await addEmailJob(admin.email, 'Báo cáo hoạt động cuối ngày', html);
        }
      }
    } catch (err) {
      console.error('[Cron] Lỗi tổng hợp báo cáo:', err);
    }
  });

  // 5. Job chạy mỗi ngày lúc 00:05: Cập nhật trạng thái mã khuyến mãi hết hạn
  cron.schedule('5 0 * * *', async () => {
    console.log('[Cron] Kiểm tra mã khuyến mãi hết hạn...');
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Cập nhật mã đã hết hạn (ngayketthuc < today)
      const expired = await prisma.khuyenMai.updateMany({
        where: {
          trangthai: { in: ['Đang diễn ra', 'Sắp diễn ra'] },
          ngayketthuc: { lt: today }
        },
        data: { trangthai: 'Hết hạn' }
      });

      // Cập nhật mã sắp diễn ra → đang diễn ra (ngaybatdau <= today && ngayketthuc >= today)
      const activated = await prisma.khuyenMai.updateMany({
        where: {
          trangthai: 'Sắp diễn ra',
          ngaybatdau: { lte: today },
          ngayketthuc: { gte: today }
        },
        data: { trangthai: 'Đang diễn ra' }
      });

      if (expired.count > 0) console.log(`[Cron] Đã cập nhật ${expired.count} mã khuyến mãi hết hạn.`);
      if (activated.count > 0) console.log(`[Cron] Đã kích hoạt ${activated.count} mã khuyến mãi mới.`);
    } catch (err) {
      console.error('[Cron] Lỗi khi cập nhật mã khuyến mãi:', err);
    }
  });

  // 6. Job chạy mỗi 15 phút: Đồng bộ trạng thái giải đấu (hết hạn hoặc đã đấu xong)
  cron.schedule('*/15 * * * *', async () => {
    console.log('[Cron] Kiểm tra đồng bộ trạng thái giải đấu...');
    await syncTournamentStatuses();
  });
}

module.exports = { startCronJobs };
