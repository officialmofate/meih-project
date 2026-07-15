const innovationService = require('../services/innovationService');

exports.listCompetitions = async (req, res, next) => {
  try {
    const competitions = await innovationService.listCompetitions();
    res.json(competitions);
  } catch (err) { next(err); }
};

exports.getCompetition = async (req, res, next) => {
  try {
    const competition = await innovationService.getCompetition(req.params.id);
    if (!competition) return res.status(404).json({ message: 'Competition not found' });
    res.json(competition);
  } catch (err) { next(err); }
};

exports.createCompetition = async (req, res, next) => {
  try {
    const competition = await innovationService.createCompetition(req.body);
    res.status(201).json(competition);
  } catch (err) { next(err); }
};

exports.updateCompetition = async (req, res, next) => {
  try {
    const competition = await innovationService.updateCompetition(req.params.id, req.body);
    if (!competition) return res.status(404).json({ message: 'Competition not found' });
    res.json(competition);
  } catch (err) { next(err); }
};

exports.listSubmissions = async (req, res, next) => {
  try {
    const submissions = await innovationService.listSubmissions(req.query);
    res.json(submissions);
  } catch (err) { next(err); }
};

exports.getSubmission = async (req, res, next) => {
  try {
    const submission = await innovationService.getSubmission(req.params.id);
    if (!submission) return res.status(404).json({ message: 'Submission not found' });
    res.json(submission);
  } catch (err) { next(err); }
};

exports.submitInnovation = async (req, res, next) => {
  try {
    const submission = await innovationService.submit(req.user.id, req.params.id, req.body);
    res.status(201).json(submission);
  } catch (err) { next(err); }
};

exports.updateSubmission = async (req, res, next) => {
  try {
    const submission = await innovationService.updateSubmission(req.params.id, req.user.id, req.body);
    if (!submission) return res.status(404).json({ message: 'Submission not found or unauthorized' });
    res.json(submission);
  } catch (err) { next(err); }
};

exports.deleteSubmission = async (req, res, next) => {
  try {
    const deleted = await innovationService.deleteSubmission(req.params.id, req.user.id);
    if (!deleted) return res.status(404).json({ message: 'Submission not found or unauthorized' });
    res.status(204).end();
  } catch (err) { next(err); }
};

exports.listCompetitionSubmissions = async (req, res, next) => {
  try {
    const submissions = await innovationService.listCompetitionSubmissions(req.params.id);
    res.json(submissions);
  } catch (err) { next(err); }
};

exports.voteSubmission = async (req, res, next) => {
  try {
    const fingerprint = req.headers['x-voter-fingerprint'] || req.ip;
    const voteCount = await innovationService.vote(req.params.id, fingerprint);
    res.json({ voteCount });
  } catch (err) { next(err); }
};

exports.getVotes = async (req, res, next) => {
  try {
    const voteCount = await innovationService.getVotes(req.params.id);
    res.json({ voteCount });
  } catch (err) { next(err); }
};

exports.commentSubmission = async (req, res, next) => {
  try {
    const comment = await innovationService.commentSubmission(req.params.id, req.user.id, req.body.comment);
    res.status(201).json(comment);
  } catch (err) { next(err); }
};

exports.getComments = async (req, res, next) => {
  try {
    const comments = await innovationService.getComments(req.params.id);
    res.json(comments);
  } catch (err) { next(err); }
};

exports.getLeaderboard = async (req, res, next) => {
  try {
    const leaderboard = await innovationService.leaderboard();
    res.json(leaderboard);
  } catch (err) { next(err); }
};

exports.getCompetitionLeaderboard = async (req, res, next) => {
  try {
    const leaderboard = await innovationService.leaderboard(req.params.competitionId);
    res.json(leaderboard);
  } catch (err) { next(err); }
};

exports.submitScore = async (req, res, next) => {
  try {
    const score = await innovationService.submitScore(req.user.id, req.body);
    res.status(201).json(score);
  } catch (err) { next(err); }
};

exports.getJudgeAssignments = async (req, res, next) => {
  try {
    const assignments = await innovationService.getJudgeAssignments(req.user.id);
    res.json(assignments);
  } catch (err) { next(err); }
};

exports.listCategories = async (req, res, next) => {
  try {
    const categories = await innovationService.listCategories();
    res.json(categories);
  } catch (err) { next(err); }
};
