const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../prismaClient');
const { mapNguoiDung, getRole } = require('../utils/csdlMapper');

const JWT_SECRET = process.env.JWT_SECRET || 'caulong84_secret_key';

function uniqueUsername(base) {
  return base.toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 40) || `user${Date.now()}`;
}

exports.register = async (req, res) => {
  try {
    const { hoTen, email, soDienThoai, matKhau } = req.body;

    if (!hoTen || !email || !matKhau) {
      return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin bắt buộc!' });
    }

    const existingEmail = await prisma.nguoiDung.findUnique({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ error: 'Email đã được sử dụng!' });
    }

    if (soDienThoai) {
      const existingPhone = await prisma.nguoiDung.findFirst({ where: { sdt: soDienThoai } });
      if (existingPhone) {
        return res.status(400).json({ error: 'Số điện thoại này đã được đăng ký!' });
      }
    }

    const hashedPassword = await bcrypt.hash(matKhau, 10);
    let tendangnhap = uniqueUsername(email.split('@')[0]);

    const dup = await prisma.nguoiDung.findUnique({ where: { tendangnhap } });
    if (dup) tendangnhap = `${tendangnhap}${Date.now().toString().slice(-4)}`;

    const newUser = await prisma.$transaction(async (tx) => {
      const nguoiDung = await tx.nguoiDung.create({
        data: {
          tendangnhap,
          hoten: hoTen,
          email,
          sdt: soDienThoai || null,
          matkhau: hashedPassword,
          vaitro: 'KhachHang',
        },
      });

      await tx.thanhVienClb.create({
        data: {
          id_nguoidung: nguoiDung.id_nguoidung,
          capbac: 'Thành viên',
          trangthai: 'Hoạt động',
        },
      });

      return nguoiDung;
    });

    res.status(201).json({
      message: 'Đăng ký tài khoản thành công!',
      userId: newUser.id_nguoidung,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi server khi đăng ký' });
  }
};

exports.login = async (req, res) => {
  try {
    const { identifier, matKhau } = req.body;

    if (!identifier || !matKhau) {
      return res.status(400).json({ error: 'Vui lòng nhập email/SĐT và mật khẩu' });
    }

    const user = await prisma.nguoiDung.findFirst({
      where: {
        OR: [{ email: identifier }, { sdt: identifier }, { tendangnhap: identifier }],
      },
      include: { thanhVienClb: true },
    });

    if (!user) {
      return res.status(400).json({ error: 'Tài khoản không tồn tại!' });
    }

    const isValidPassword = await bcrypt.compare(matKhau, user.matkhau);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Sai mật khẩu!' });
    }

    const role = getRole(user);
    const token = jwt.sign({ userId: user.id_nguoidung, role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Đăng nhập thành công',
      token,
      user: {
        id: user.id_nguoidung,
        hoTen: user.hoten || user.tendangnhap,
        email: user.email,
        soDienThoai: user.sdt,
        role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi server khi đăng nhập' });
  }
};

exports.findUserWithRole = async (id) => {
  const user = await prisma.nguoiDung.findUnique({
    where: { id_nguoidung: id },
    include: { thanhVienClb: true },
  });
  return user ? mapNguoiDung(user) : null;
};

const { sendEmail } = require('../utils/emailService');

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Vui lòng nhập email!' });

    const user = await prisma.nguoiDung.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: 'Email không tồn tại trong hệ thống!' });
    if (user.vaitro !== 'KhachHang') return res.status(400).json({ error: 'Tính năng này chỉ dành cho khách hàng!' });

    const resetToken = jwt.sign({ userId: user.id_nguoidung }, JWT_SECRET, { expiresIn: '15m' });
    const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetLink = `${CLIENT_URL}/reset-password?token=${resetToken}`;

    const html = `
      <h3>Yêu cầu đặt lại mật khẩu</h3>
      <p>Xin chào ${user.hoten || user.tendangnhap},</p>
      <p>Bạn đã yêu cầu đặt lại mật khẩu tại hệ thống Cầu Lông 84.</p>
      <p>Vui lòng click vào đường dẫn bên dưới để đặt lại mật khẩu. Link có hiệu lực trong 15 phút.</p>
      <a href="${resetLink}" style="padding: 10px 20px; background: #b7e014; color: #1e293b; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">ĐẶT LẠI MẬT KHẨU</a>
      <p>Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
    `;

    const sent = await sendEmail(user.email, 'Cầu Lông 84 - Khôi phục mật khẩu', html);
    if (!sent) return res.status(500).json({ error: 'Lỗi gửi email! Vui lòng thử lại sau.' });

    res.json({ message: 'Đã gửi link khôi phục qua email của bạn.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi server khi yêu cầu quên mật khẩu' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ error: 'Thiếu thông tin đặt lại mật khẩu!' });

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return res.status(400).json({ error: 'Link khôi phục không hợp lệ hoặc đã hết hạn!' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.nguoiDung.update({
      where: { id_nguoidung: decoded.userId },
      data: { matkhau: hashedPassword }
    });

    res.json({ message: 'Đặt lại mật khẩu thành công!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi server khi đặt lại mật khẩu' });
  }
};
