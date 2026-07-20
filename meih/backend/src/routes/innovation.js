const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const ctrl = require('../controllers/innovationController');
const { authenticate, authorize } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../../uploads/payments'),
  filename: (req, file, cb) => {
    const unique = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname) || '.png';
    cb(null, `innovation-pay-${Date.now()}-${unique}${ext}`);
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

const profileStorage = multer.diskStorage({
  destination: path.join(__dirname, '../../../uploads/profiles'),
  filename: (req, file, cb) => {
    const unique = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname) || '.png';
    cb(null, `innovator-${Date.now()}-${unique}${ext}`);
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

router.get('/competitions', ctrl.listCompetitions);
router.get('/competitions/:id', ctrl.getCompetition);
router.post('/competitions', authenticate, authorize('admin', 'innovator_manager'), ctrl.createCompetition);
router.put('/competitions/:id', authenticate, authorize('admin', 'innovator_manager'), ctrl.updateCompetition);
router.get('/competitions/:id/submissions', ctrl.listCompetitionSubmissions);
router.post('/upload-screenshot', authenticate, authorize('innovator'), upload.single('screenshot'), ctrl.uploadScreenshot);
router.post('/upload-profile-image', authenticate, profileUpload.single('image'), ctrl.uploadInnovatorImage);
router.post('/upload-submission-image', authenticate, authorize('innovator'), profileUpload.single('image'), ctrl.uploadSubmissionImage);

router.post('/competitions/:id/submit', authenticate, authorize('innovator'), ctrl.submitInnovation);

router.get('/categories', ctrl.listCategories);
router.get('/submissions', ctrl.listSubmissions);
router.get('/submissions/:id', ctrl.getSubmission);
router.put('/submissions/:id', authenticate, ctrl.updateSubmission);
router.delete('/submissions/:id', authenticate, ctrl.deleteSubmission);
router.post('/submissions/:id/vote', ctrl.voteSubmission);
router.get('/submissions/:id/votes', ctrl.getVotes);
router.post('/submissions/:id/comment', authenticate, ctrl.commentSubmission);
router.get('/submissions/:id/comments', ctrl.getComments);
router.put('/submissions/:id/rate', authenticate, authorize('admin', 'innovator_manager', 'judge'), ctrl.rateSubmission);

router.get('/leaderboard', ctrl.getLeaderboard);
router.get('/leaderboard/:competitionId', ctrl.getCompetitionLeaderboard);

router.post('/judge/score', authenticate, authorize('judge'), ctrl.submitScore);
router.get('/judge/assignments', authenticate, authorize('judge'), ctrl.getJudgeAssignments);
router.get('/judge/assignments/all', authenticate, authorize('admin', 'superadmin'), ctrl.listAllJudgeAssignments);
router.get('/judges', authenticate, authorize('admin', 'superadmin'), ctrl.listAllJudges);
router.post('/judge/assign', authenticate, authorize('admin', 'superadmin'), ctrl.assignJudge);
router.delete('/judge/assign/:id', authenticate, authorize('admin', 'superadmin'), ctrl.removeJudgeAssignment);
router.get('/competitions/:competitionId/judges', authenticate, ctrl.listCompetitionJudges);

router.get('/manager/submissions', authenticate, authorize('admin', 'innovator_manager'), ctrl.listManagerSubmissions);
router.put('/submissions/:id/approve', authenticate, authorize('admin', 'innovator_manager'), ctrl.approveSubmission);
router.put('/submissions/:id/reject', authenticate, authorize('admin', 'innovator_manager'), ctrl.rejectSubmission);

router.post('/submissions/:id/payment', authenticate, authorize('innovator'), ctrl.submitPayment);
router.put('/submissions/:id/confirm-payment', authenticate, authorize('admin', 'innovator_manager'), ctrl.confirmPayment);
router.put('/submissions/:id/reject-payment', authenticate, authorize('admin', 'innovator_manager'), ctrl.rejectPayment);
router.get('/submissions/:id/requirements', authenticate, ctrl.getRequirements);

router.get('/manager/pending-payments', authenticate, authorize('admin', 'innovator_manager'), ctrl.listManagerPendingPayments);

router.get('/submissions/:id/ticket', ctrl.getTicket);
router.get('/submissions/:id/ticket-pdf', ctrl.getTicketPDF);
router.get('/submissions/:id/certificate', ctrl.getCertificate);
router.get('/submissions/:id/certificate-pdf', ctrl.getCertificatePDF);

module.exports = router;
