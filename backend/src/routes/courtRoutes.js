const express = require('express');
const router = express.Router();
const courtController = require('../controllers/courtController');

router.get('/', courtController.getAllCourts);
router.post('/', courtController.createCourt);
router.put('/:id', courtController.updateCourt);
router.delete('/:id', courtController.deleteCourt);

module.exports = router;
