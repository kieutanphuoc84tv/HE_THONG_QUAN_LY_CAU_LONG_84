const express = require('express');
const router = express.Router();
const c = require('../controllers/tournamentController');
const { verifyToken, requireAdmin } = require('../middlewares/authMiddleware');

router.get('/', c.getAll);
router.post('/', verifyToken, requireAdmin, c.create);
router.put('/:id', verifyToken, requireAdmin, c.update);
router.delete('/:id', verifyToken, requireAdmin, c.remove);
router.post('/:id/register', verifyToken, c.register);
router.delete('/:id/register', verifyToken, c.unregister);

router.post('/:id/generate-bracket', verifyToken, requireAdmin, c.generateBracket);
router.put('/registrations/:regId/status', verifyToken, requireAdmin, c.updateRegistrationStatus);
router.get('/:id/matches', verifyToken, c.getMatches);
router.put('/:id/matches/:matchId', verifyToken, requireAdmin, c.updateMatch);
router.post('/:id/generate-roundrobin', verifyToken, requireAdmin, c.generateRoundRobin);
router.post('/:id/advance-to-knockout', verifyToken, requireAdmin, c.advanceToKnockout);
router.post('/:id/advance-knockout-round', verifyToken, requireAdmin, c.advanceKnockoutRound);

module.exports = router;
