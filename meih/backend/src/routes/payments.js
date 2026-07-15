const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const ctrl = require('../controllers/paymentController');
const { authenticate, authorize } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads/payments'),
  filename: (req, file, cb) => {
    const unique = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname) || '.png';
    cb(null, `screenshot-${Date.now()}-${unique}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp)$/i;
    if (allowed.test(path.extname(file.originalname))) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  }
});

router.get('/invoices', authenticate, ctrl.listInvoices);
router.get('/invoices/:id', authenticate, ctrl.getInvoice);
router.get('/booking/:bookingId', authenticate, ctrl.getPaymentDetails);
router.post('/', authenticate, upload.single('screenshot'), ctrl.createPayment);
router.get('/', authenticate, ctrl.listPayments);
router.get('/:id', authenticate, ctrl.getPayment);
router.put('/:id/screenshot', authenticate, upload.single('screenshot'), ctrl.uploadScreenshot);
router.put('/:id/confirm', authenticate, authorize('planner', 'admin'), ctrl.confirmPayment);
router.put('/:id/reject', authenticate, authorize('planner', 'admin'), ctrl.rejectPayment);
router.post('/:id/callback', ctrl.paymentCallback);

module.exports = router;
