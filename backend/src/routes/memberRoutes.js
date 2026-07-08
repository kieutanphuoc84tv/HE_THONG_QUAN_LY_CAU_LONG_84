const express = require('express');
const router = express.Router();
const c = require('../controllers/memberController');
const { verifyToken, requireAdmin } = require('../middlewares/authMiddleware');

const upload = require('../middlewares/uploadMiddleware');

router.get('/', verifyToken, requireAdmin, c.getAllMembers);
router.post('/', verifyToken, requireAdmin, c.createMember);
router.get('/profile', verifyToken, c.getProfile);
router.put('/profile', verifyToken, c.updateProfile);
router.post('/profile/avatar', verifyToken, upload.single('avatar'), c.uploadAvatar);
router.put('/profile/upgrade', verifyToken, c.upgradeMembership);
router.get('/config', verifyToken, requireAdmin, c.getMembershipConfig);
router.put('/config', verifyToken, requireAdmin, c.updateMembershipConfig);
router.get('/memberships/list', verifyToken, requireAdmin, c.getAllMemberships);
router.put('/memberships/:id', verifyToken, requireAdmin, c.updateMembershipByAdmin);
router.get('/:id', verifyToken, requireAdmin, c.getMemberById);
router.put('/:id/status', verifyToken, requireAdmin, c.updateMemberStatus);
router.put('/:id', verifyToken, requireAdmin, c.updateMemberByAdmin);
router.delete('/:id', verifyToken, requireAdmin, c.deleteMember);

module.exports = router;
