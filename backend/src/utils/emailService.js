const nodemailer = require('nodemailer');

// Sử dụng Ethereal Email để test (tránh lộ thông tin cá nhân và bị spam block)
// Trong thực tế, bạn sẽ dùng Gmail, SendGrid, Amazon SES...
let transporter;

async function initTransporter() {
  if (transporter) return transporter;
  
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      service: 'gmail', // Hoặc SMTP khác
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  } else {
    console.log('Chưa cấu hình EMAIL_USER/PASS. Tạo email test tự động...');
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log(`[Ethereal Email] Dùng account: ${testAccount.user}`);
  }
  return transporter;
}

/**
 * Gửi email thông báo
 * @param {string} to Địa chỉ email người nhận
 * @param {string} subject Tiêu đề email
 * @param {string} html Nội dung email dạng HTML
 */
async function sendEmail(to, subject, html) {
  try {
    const t = await initTransporter();
    const info = await t.sendMail({
      from: '"Cầu Lông 84" <noreply@caulong84.com>',
      to,
      subject,
      html
    });
    console.log(`[Email Sent] To: ${to}, MessageId: ${info.messageId}`);
    if (info.messageId && !process.env.EMAIL_USER) {
      console.log(`[Preview URL] Xem thử email tại: ${nodemailer.getTestMessageUrl(info)}`);
    }
    return true;
  } catch (error) {
    console.error('[Email Error]', error);
    return false;
  }
}

module.exports = {
  sendEmail
};
