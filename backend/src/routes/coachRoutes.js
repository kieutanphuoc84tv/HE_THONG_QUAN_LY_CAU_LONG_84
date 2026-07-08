const express = require('express');
const router = express.Router();
const coachController = require('../controllers/coachController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Middleware kiểm tra quyền Huấn Luyện Viên
const checkCoach = (req, res, next) => {
  if (req.user && req.user.role === 'HuanLuyenVien') {
    next();
  } else {
    res.status(403).json({ error: 'Truy cập bị từ chối! Yêu cầu quyền Huấn Luyện Viên.' });
  }
};

router.use(verifyToken);
router.use(checkCoach);

router.get('/schedules', coachController.getSchedules);
router.put('/schedules/:id/status', coachController.updateScheduleStatus);
router.post('/schedules', coachController.createSchedule);
router.put('/schedules/:id', coachController.updateSchedule);
router.delete('/schedules/:id', coachController.deleteSchedule);
router.get('/members', coachController.getAllMembersList);

module.exports = router;
