const prisma = require('../prismaClient');

/**
 * Gửi thông báo tới một người dùng cụ thể hoặc toàn bộ hệ thống
 */
async function sendNotification(data) {
  try {
    const { userId, type, title, content, link } = data;
    
    const newNotif = await prisma.thongBao.create({
      data: {
        id_nguoidung: userId || null, // null = Global
        loai: type || 'info', // info, success, warning, global
        tieude: title,
        noidung: content,
        link: link || null,
        dadoct: false
      }
    });

    // Bắn realtime qua Socket.io
    if (global.io) {
      if (userId) {
        global.io.to(userId).emit('new_notification', newNotif);
      } else {
        global.io.emit('new_notification', newNotif); // Gửi tất cả nếu global
      }
    }

    console.log(`[Notification Created] ${title}: ${content}`);
    return newNotif;

  } catch (error) {
    console.error('Lỗi khi tạo thông báo:', error);
    throw error;
  }
}

module.exports = {
  sendNotification
};
