const express = require('express');
const router = express.Router();
const c = require('../controllers/paymentController');
const { verifyToken, requireAdmin } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, requireAdmin, c.getAll);
router.get('/my', verifyToken, c.getMy);
router.post('/', verifyToken, requireAdmin, c.create);
router.post('/client-pay', verifyToken, c.clientPay);
router.post('/vnpay/create', verifyToken, c.createVNPay);
router.get('/vnpay/return', c.vnpayReturn); // Không cần auth - VNPay gọi lại
router.get('/vnpay/ipn', c.vnpayIpn); // Webhook server-to-server
router.get('/export/:id', verifyToken, c.exportPDF); // Tải hóa đơn PDF

module.exports = router;
