const express = require('express');
const router = express.Router();
const c = require('../controllers/notificationController');
const { verifyToken, requireAdmin } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, c.getAll);
router.put('/:id/read', verifyToken, c.markRead);
router.put('/read-all', verifyToken, c.markAllRead);

module.exports = router;
