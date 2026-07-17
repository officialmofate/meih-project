const router = require('express').Router();
const ctrl = require('../controllers/authController');

router.post('/register', ctrl.register);
router.post('/login', ctrl.login);
router.post('/verify-email', ctrl.verifyEmail);
router.post('/resend-verification', ctrl.resendVerification);
router.post('/verify-phone', ctrl.verifyPhone);
router.post('/forgot-password', ctrl.forgotPassword);
router.post('/reset-password', ctrl.resetPassword);
router.post('/refresh-token', ctrl.refreshToken);
router.post('/logout', ctrl.logout);

module.exports = router;
