const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'caulong84_secret_key';

exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Không có token xác thực' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(403).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};

exports.requireAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Chưa đăng nhập' });
  if (!['Admin', 'QuanLy'].includes(req.user.role)) return res.status(403).json({ error: 'Không có quyền Admin' });
  next();
};

exports.requireAuth = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Chưa đăng nhập' });
  next();
};
