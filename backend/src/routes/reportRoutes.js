const express = require('express');
const router = express.Router();
const c = require('../controllers/reportController');
const { verifyToken, requireAdmin } = require('../middlewares/authMiddleware');

router.get('/dashboard', verifyToken, requireAdmin, c.getDashboard);
router.get('/revenue', verifyToken, requireAdmin, c.getRevenue);
router.get('/courts', verifyToken, requireAdmin, c.getCourtUsage);
router.get('/court-stats', verifyToken, requireAdmin, c.getCourtStats);
router.get('/revenue-breakdown', verifyToken, requireAdmin, c.getRevenueBreakdown);
router.get('/export-excel', verifyToken, requireAdmin, c.exportExcel);
router.get('/advanced-stats', verifyToken, requireAdmin, c.getAdvancedStats);

module.exports = router;
