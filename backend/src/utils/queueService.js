const { sendEmail } = require('./emailService');

/**
 * Gửi email trực tiếp (không qua Redis/BullMQ)
 */
async function addEmailJob(to, subject, html) {
  try {
    await sendEmail(to, subject, html);
  } catch (err) {
    console.error('[Email] Lỗi gửi email:', err.message);
  }
}

module.exports = { addEmailJob };
