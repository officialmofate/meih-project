const router = require('express').Router();
const ctrl = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const VALID_ROLES = ['client', 'planner', 'vendor', 'innovator', 'innovator_manager', 'judge', 'public_voter', 'admin', 'superadmin'];
const PRIVILEGED_ROLES = ['admin', 'superadmin'];

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads/payments'),
  filename: (req, file, cb) => {
    const unique = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname) || '.png';
    cb(null, `event-confirm-${Date.now()}-${unique}${ext}`);
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

router.use(authenticate, authorize('admin'));

router.get('/dashboard', ctrl.dashboard);
router.get('/users', ctrl.listUsers);
router.put('/users/:id/role', ctrl.updateUserRole);
router.put('/users/:id/status', ctrl.updateUserStatus);
router.get('/events/all', ctrl.listAllEvents);
router.get('/payments/all', ctrl.listAllPayments);
router.get('/analytics', ctrl.analytics);
router.post('/maintenance/backup', ctrl.triggerBackup);
router.get('/logs', ctrl.getLogs);
router.put('/settings', ctrl.updateSettings);
router.get('/events/pending-confirmation', ctrl.listPendingConfirmations);
router.put('/events/:id/confirm', ctrl.confirmEvent);
router.put('/events/:id/reject', ctrl.rejectEvent);
router.get('/innovation/pending-payment', ctrl.listPendingInnovationPayments);
router.put('/innovation/:id/confirm-payment', ctrl.confirmInnovationPayment);
router.put('/innovation/:id/reject-payment', ctrl.rejectInnovationPayment);

module.exports = router;
