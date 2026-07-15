const router = require('express').Router();
const ctrl = require('../controllers/plannerController');
const { authenticate } = require('../middleware/auth');

router.get('/', ctrl.list);
router.get('/me', authenticate, ctrl.getMe);
router.put('/me', authenticate, ctrl.updateMe);
router.put('/me/availability', authenticate, ctrl.updateMeAvailability);
router.get('/:id', ctrl.getById);
router.post('/', authenticate, ctrl.create);
router.put('/:id', authenticate, ctrl.update);
router.get('/:id/portfolio', ctrl.getPortfolio);
router.post('/:id/portfolio', authenticate, ctrl.addPortfolioItem);
router.get('/:id/events', ctrl.getEvents);
router.get('/:id/reviews', ctrl.getReviews);
router.get('/:id/availability', ctrl.getAvailability);

module.exports = router;
