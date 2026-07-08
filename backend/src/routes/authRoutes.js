const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const jwt = require('jsonwebtoken');
const authController = require('../controllers/authController');
const { ADMIN_ROLES } = require('../utils/csdlMapper');

const JWT_SECRET = process.env.JWT_SECRET || 'caulong84_secret_key';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Helper tạo token và redirect về frontend
const handleOAuthSuccess = (req, res) => {
  const user = req.user;
  let isMobile = false;
  let mobileRedirectUrl = null;

  // Đọc state từ callback nếu có (đảm bảo không bị mất như session cookie)
  if (req.query.state) {
    try {
      const stateStr = Buffer.from(req.query.state, 'base64').toString('utf8');
      const stateObj = JSON.parse(stateStr);
      isMobile = stateObj.isMobile;
      mobileRedirectUrl = stateObj.redirectUrl;
    } catch (e) {
      console.error('Lỗi parse state:', e.message);
    }
  }

  // Fallback về session nếu state không hợp lệ
  if (!isMobile && req.session.isMobile) {
    isMobile = req.session.isMobile;
    mobileRedirectUrl = req.session.mobileRedirectUrl;
  }

  const fallbackRedirect = isMobile && mobileRedirectUrl ? mobileRedirectUrl : `${CLIENT_URL}/login`;

  if (!user) return res.redirect(`${fallbackRedirect}?error=no_user`);

  const role = ADMIN_ROLES.includes(user.vaitro) ? user.vaitro : 'Customer';
  const token = jwt.sign({ userId: user.MaNguoiDung, role }, JWT_SECRET, { expiresIn: '7d' });
  const userData = encodeURIComponent(JSON.stringify({
    id: user.MaNguoiDung,
    hoTen: user.HoTen,
    email: user.Email,
    soDienThoai: user.SoDienThoai,
    avatar: user.Avatar,
    role
  }));

  if (isMobile && mobileRedirectUrl) {
    // Redirect về điện thoại qua deep link, ví dụ: exp://192.168.1.100:8081/--/auth/callback?token=...
    res.redirect(`${mobileRedirectUrl}?token=${token}&user=${userData}`);
  } else {
    // Redirect về Website
    res.redirect(`${CLIENT_URL}/auth/callback?token=${token}&user=${userData}`);
  }
};

// ── Email/Password ───────────────────────────────────────────
router.post('/register', authController.register);
router.post('/login', authController.login);

// ── Google OAuth ─────────────────────────────────────────────
router.get('/google/mobile', (req, res, next) => {
  const stateData = Buffer.from(JSON.stringify({ isMobile: true, redirectUrl: req.query.redirectUrl })).toString('base64');
  passport.authenticate('google', { scope: ['profile', 'email'], state: stateData })(req, res, next);
});

router.get('/google', (req, res, next) => {
  req.session.isMobile = false;
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${CLIENT_URL}/login?error=google` }),
  handleOAuthSuccess
);

// ── Facebook OAuth ───────────────────────────────────────────
router.get('/facebook/mobile', (req, res, next) => {
  const stateData = Buffer.from(JSON.stringify({ isMobile: true, redirectUrl: req.query.redirectUrl })).toString('base64');
  passport.authenticate('facebook', { scope: ['public_profile'], state: stateData })(req, res, next);
});

router.get('/facebook', (req, res, next) => {
  req.session.isMobile = false;
  passport.authenticate('facebook', { scope: ['public_profile'] })(req, res, next);
});
router.get('/facebook/callback', (req, res, next) => {
  // Không dùng session:false ở đây — Facebook cần session để verify state
  passport.authenticate('facebook', (err, user, info) => {
    if (err) {
      console.error('[Facebook CB Error]:', err.message);
      console.error('[Facebook CB Stack]:', err.stack);
      return res.redirect(`${CLIENT_URL}/login?error=facebook_server`);
    }
    if (!user) {
      console.error('[Facebook CB No User]:', JSON.stringify(info));
      return res.redirect(`${CLIENT_URL}/login?error=facebook_nouser`);
    }
    req.user = user;
    handleOAuthSuccess(req, res);
  })(req, res, next);
});

router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
