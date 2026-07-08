const express = require('express');
const router = express.Router();
const c = require('../controllers/serviceController');
const { verifyToken, requireAdmin } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, c.getAllServices);
router.get('/:id', verifyToken, c.getServiceById);
router.post('/', verifyToken, requireAdmin, c.createService);
router.put('/:id', verifyToken, requireAdmin, c.updateService);
router.delete('/:id', verifyToken, requireAdmin, c.deleteService);

module.exports = router;
