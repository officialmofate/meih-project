const router = require('express').Router();
const ctrl = require('../controllers/vendorController');
const { authenticate } = require('../middleware/auth');

router.get('/categories', ctrl.listCategories);
router.get('/', ctrl.list);
router.get('/me', authenticate, ctrl.getMe);
router.put('/me', authenticate, ctrl.updateMe);
router.get('/me/bookings', authenticate, ctrl.getMeBookings);
router.get('/me/reviews', authenticate, ctrl.getMeReviews);
router.get('/:id', ctrl.getById);
router.post('/', authenticate, ctrl.create);
router.put('/:id', authenticate, ctrl.update);
router.get('/:id/portfolio', ctrl.getPortfolio);
router.post('/:id/portfolio', authenticate, ctrl.addPortfolioItem);
router.get('/:id/bookings', authenticate, ctrl.getBookings);
router.get('/:id/reviews', ctrl.getReviews);
router.get('/:id/availability', ctrl.getAvailability);

module.exports = router;
