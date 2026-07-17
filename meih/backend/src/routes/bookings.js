const router = require('express').Router();
const ctrl = require('../controllers/bookingController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/', authenticate, authorize('client', 'vendor'), ctrl.create);
router.get('/', authenticate, ctrl.list);
router.get('/:id', authenticate, ctrl.getById);
router.put('/:id', authenticate, ctrl.update);
router.post('/:id/confirm', authenticate, authorize('planner', 'admin'), ctrl.confirm);
router.post('/:id/cancel', authenticate, authorize('planner', 'admin'), ctrl.cancel);
router.get('/:id/invoice', authenticate, ctrl.getInvoice);
router.get('/:id/ticket', authenticate, ctrl.getTicket);
router.get('/:id/ticket-pdf', authenticate, ctrl.getTicketPDF);
router.put('/:id/deposit', authenticate, ctrl.setDeposit);

module.exports = router;
