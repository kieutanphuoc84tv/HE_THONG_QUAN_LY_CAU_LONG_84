const express = require('express');
const router = express.Router();
const c = require('../controllers/trainingController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Public: lấy danh sách HLV
router.get('/coaches', c.getCoaches);

// Protected: đăng ký, xem, hủy lịch tập
router.post('/register', verifyToken, c.registerTraining);
router.get('/my', verifyToken, c.getMyTraining);
router.delete('/:id', verifyToken, c.cancelTraining);

module.exports = router;
