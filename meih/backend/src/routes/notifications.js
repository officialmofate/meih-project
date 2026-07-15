const router = require('express').Router();
const ctrl = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, ctrl.list);
router.put('/read-all', authenticate, ctrl.markAllRead);
router.get('/:id', authenticate, ctrl.getById);
router.put('/:id/read', authenticate, ctrl.markRead);
router.delete('/:id', authenticate, ctrl.remove);

module.exports = router;
