const express = require('express');
const router = express.Router();
const c = require('../controllers/rentalController');
const { verifyToken, requireAdmin } = require('../middlewares/authMiddleware');

router.get('/available', c.getAvailable);
router.post('/order', verifyToken, c.createOrder);
router.get('/my-orders', verifyToken, c.getMyOrders);
router.get('/admin/all', verifyToken, requireAdmin, c.getAllOrders);
router.put('/:id/approve', verifyToken, requireAdmin, c.approveOrder);
router.put('/:id/return', verifyToken, requireAdmin, c.returnItem);
router.put('/:id/cancel', verifyToken, c.cancelOrder);
router.post('/:id/notify', verifyToken, requireAdmin, c.notifyCustomer);
router.delete('/:id', verifyToken, requireAdmin, c.deleteOrder);

module.exports = router;
