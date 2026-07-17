const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const ctrl = require('../controllers/eventController');
const { authenticate, authorize } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../../uploads/payments'),
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
router.post('/upload-screenshot', authenticate, upload.single('screenshot'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  res.json({ screenshot_url: `/uploads/payments/${req.file.filename}` });
});
router.post('/events/:id/request-confirmation', authenticate, ctrl.requestConfirmation);

module.exports = router;
