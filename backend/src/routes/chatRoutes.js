const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.use(verifyToken);

router.get('/contacts', chatController.getContacts);
router.get('/conversations/:userId', chatController.getConversation);
router.put('/conversations/:userId/read', chatController.markConversationRead);
router.post('/messages', chatController.sendMessage);

module.exports = router;
