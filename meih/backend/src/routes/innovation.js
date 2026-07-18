const router = require('express').Router();
const ctrl = require('../controllers/innovationController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/competitions', ctrl.listCompetitions);
router.get('/competitions/:id', ctrl.getCompetition);
router.post('/competitions', authenticate, authorize('admin', 'innovator_manager'), ctrl.createCompetition);
router.put('/competitions/:id', authenticate, authorize('admin', 'innovator_manager'), ctrl.updateCompetition);
router.get('/competitions/:id/submissions', ctrl.listCompetitionSubmissions);
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

router.get('/leaderboard', ctrl.getLeaderboard);
router.get('/leaderboard/:competitionId', ctrl.getCompetitionLeaderboard);

router.post('/judge/score', authenticate, authorize('judge'), ctrl.submitScore);
router.get('/judge/assignments', authenticate, authorize('judge'), ctrl.getJudgeAssignments);
router.get('/judges', authenticate, authorize('admin', 'superadmin'), ctrl.listAllJudges);
router.post('/judge/assign', authenticate, authorize('admin', 'superadmin'), ctrl.assignJudge);
router.delete('/judge/assign/:judgeId/:competitionId', authenticate, authorize('admin', 'superadmin'), ctrl.removeJudgeAssignment);
router.get('/competitions/:competitionId/judges', authenticate, ctrl.listCompetitionJudges);

router.get('/manager/submissions', authenticate, authorize('admin', 'innovator_manager'), ctrl.listManagerSubmissions);
router.put('/submissions/:id/approve', authenticate, authorize('admin', 'innovator_manager'), ctrl.approveSubmission);
router.put('/submissions/:id/reject', authenticate, authorize('admin', 'innovator_manager'), ctrl.rejectSubmission);

module.exports = router;
