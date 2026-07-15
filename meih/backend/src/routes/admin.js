const router = require('express').Router();
const ctrl = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

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

module.exports = router;
