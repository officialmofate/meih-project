const router = require('express').Router();
const ctrl = require('../controllers/vendorQuoteController');
const { authenticate } = require('../middleware/auth');

router.post('/events/:eventId/quotes', authenticate, ctrl.submitQuote);
router.get('/events/:eventId/quotes', ctrl.getEventQuotes);
router.get('/events/:eventId/quote-status', authenticate, ctrl.hasQuoted);
router.get('/my-quotes', authenticate, ctrl.getMyQuotes);
router.put('/quotes/:quoteId/status', authenticate, ctrl.updateQuoteStatus);

module.exports = router;
