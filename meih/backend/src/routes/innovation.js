const router = require('express').Router();
const ctrl = require('../controllers/innovationController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/competitions', ctrl.listCompetitions);
router.get('/competitions/:id', ctrl.getCompetition);
router.post('/competitions', authenticate, authorize('admin', 'innovator_manager'), ctrl.createCompetition);
router.put('/competitions/:id', authenticate, authorize('admin', 'innovator_manager'), ctrl.updateCompetition);
router.get('/competitions/:id/submissions', ctrl.listCompetitionSubmissions);
router.post('/competitions/:id/submit', authenticate, ctrl.submitInnovation);

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

module.exports = router;
