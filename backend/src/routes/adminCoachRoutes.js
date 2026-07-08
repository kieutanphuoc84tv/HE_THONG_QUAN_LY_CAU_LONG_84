const express = require('express');
const router = express.Router();
const coachController = require('../controllers/coachController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.use(verifyToken);
// We should check if the user is Admin (or Manager). We can rely on a custom middleware or just assume if they hit this, they are admin from frontend, but let's be safe.
const checkAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'Admin' || req.user.role === 'QuanLy')) next();
  else res.status(403).json({ error: 'Truy cập bị từ chối' });
};
router.use(checkAdmin);

router.get('/schedules', coachController.getAdminCoachSchedules);
router.put('/schedules/:id', coachController.adminUpdateSchedule);
router.delete('/schedules/:id', coachController.adminDeleteSchedule);
router.put('/schedules/:id/status', coachController.adminUpdateScheduleStatus);
router.post('/schedules/:id/notify-conflict', coachController.notifyCoachScheduleConflict);

router.get('/', coachController.getAllCoaches);
router.post('/', coachController.createCoach);
router.put('/:id', coachController.updateCoach);
router.delete('/:id', coachController.deleteCoach);

module.exports = router;
