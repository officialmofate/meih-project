const router = require('express').Router();
const ctrl = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/profile', authenticate, ctrl.getProfile);
router.put('/profile', authenticate, ctrl.updateProfile);
router.post('/change-password', authenticate, ctrl.changePassword);
router.get('/:id', authenticate, ctrl.getById);
router.get('/', authenticate, authorize('admin'), ctrl.list);
router.delete('/:id', authenticate, authorize('admin'), ctrl.remove);

module.exports = router;
