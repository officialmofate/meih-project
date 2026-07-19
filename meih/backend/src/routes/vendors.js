const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const ctrl = require('../controllers/vendorController');
const { authenticate } = require('../middleware/auth');

const profileStorage = multer.diskStorage({
  destination: path.join(__dirname, '../../../uploads/profiles'),
  filename: (req, file, cb) => {
    const unique = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname) || '.png';
    cb(null, `vendor-${Date.now()}-${unique}${ext}`);
  }
});
const profileUpload = multer({
  storage: profileStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp)$/i;
    if (allowed.test(path.extname(file.originalname))) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  }
});

router.get('/categories', ctrl.listCategories);
router.get('/', ctrl.list);
router.get('/me', authenticate, ctrl.getMe);
router.put('/me', authenticate, ctrl.updateMe);
router.get('/me/bookings', authenticate, ctrl.getMeBookings);
router.get('/me/reviews', authenticate, ctrl.getMeReviews);
router.get('/me/matching-events', authenticate, ctrl.getMatchingEvents);
router.post('/me/images', authenticate, profileUpload.array('images', 3), ctrl.uploadImages);
router.get('/:id', ctrl.getById);
router.post('/', authenticate, ctrl.create);
router.put('/:id', authenticate, ctrl.update);
router.get('/:id/portfolio', ctrl.getPortfolio);
router.post('/:id/portfolio', authenticate, ctrl.addPortfolioItem);
router.get('/:id/bookings', authenticate, ctrl.getBookings);
router.get('/:id/reviews', ctrl.getReviews);
router.get('/:id/availability', ctrl.getAvailability);

module.exports = router;
