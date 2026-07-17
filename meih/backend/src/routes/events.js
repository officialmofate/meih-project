const router = require('express').Router();
const ctrl = require('../controllers/eventController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/categories', ctrl.listCategories);
router.get('/categories/:id', ctrl.getCategory);
router.post('/events', authenticate, authorize('planner'), ctrl.createEvent);
router.get('/events', ctrl.listEvents);
router.get('/events/:id', ctrl.getEvent);
router.put('/events/:id', authenticate, ctrl.updateEvent);
router.delete('/events/:id', authenticate, ctrl.deleteEvent);
router.post('/events/:id/publish', authenticate, ctrl.publishEvent);
router.get('/events/:id/bookings', authenticate, ctrl.listEventBookings);
router.post('/events/:id/quotes', authenticate, ctrl.createQuote);
router.get('/events/:id/quotes', authenticate, ctrl.listQuotes);
router.put('/events/:id/status', authenticate, ctrl.updateStatus);

module.exports = router;
