const express = require('express');
const router = express.Router();
const c = require('../controllers/bookingController');
const { verifyToken, requireAdmin } = require('../middlewares/authMiddleware');

router.get('/',          verifyToken, requireAdmin, c.getAllBookings);
router.get('/my',        verifyToken,               c.getMyBookings);
router.post('/',         verifyToken,               c.createBooking);
router.put('/:id/confirm', verifyToken, requireAdmin, c.confirmBooking);
router.put('/:id/complete', verifyToken, requireAdmin, c.completeBooking);
router.put('/:id/cancel',  verifyToken,             c.cancelBooking);
router.put('/:id',       verifyToken, requireAdmin, c.updateBooking);
router.delete('/:id',    verifyToken, requireAdmin, c.deleteBooking);
router.get('/busy',      verifyToken,               c.getBusySlots);
router.get('/busy-all',  verifyToken,               c.getAllBusySlots);

module.exports = router;
