const router = require('express').Router();
const ctrl = require('../controllers/aiController');

router.get('/status', ctrl.status);
router.post('/chat', ctrl.chat);

module.exports = router;
