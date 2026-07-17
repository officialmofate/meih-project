const router = require('express').Router();
const ctrl = require('../controllers/bookingController');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, ctrl.create);
router.get('/', authenticate, ctrl.list);
router.get('/:id', authenticate, ctrl.getById);
router.put('/:id', authenticate, ctrl.update);
router.post('/:id/confirm', authenticate, ctrl.confirm);
router.post('/:id/cancel', authenticate, ctrl.cancel);
router.get('/:id/invoice', authenticate, ctrl.getInvoice);
router.put('/:id/deposit', authenticate, ctrl.setDeposit);

module.exports = router;
