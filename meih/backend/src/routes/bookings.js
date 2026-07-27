const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const ctrl = require('../controllers/bookingController');
const { authenticate, authorize } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../../uploads/payments'),
  filename: (req, file, cb) => {
    const unique = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname) || '.png';
    cb(null, `booking-screenshot-${Date.now()}-${unique}${ext}`);
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

router.post('/', authenticate, authorize('client', 'vendor'), upload.single('screenshot'), ctrl.create);
router.get('/', authenticate, ctrl.list);
router.get('/:id', authenticate, ctrl.getById);
router.put('/:id', authenticate, ctrl.update);
router.post('/:id/confirm', authenticate, authorize('planner', 'admin'), ctrl.confirm);
router.post('/:id/cancel', authenticate, authorize('planner', 'admin'), ctrl.cancel);
router.get('/:id/invoice', authenticate, ctrl.getInvoice);
router.get('/:id/ticket', ctrl.getTicket);
router.get('/:id/ticket-pdf', ctrl.getTicketPDF);
router.put('/:id/deposit', authenticate, ctrl.setDeposit);

module.exports = router;
