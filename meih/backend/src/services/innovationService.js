const db = require('../config/database');

exports.listCompetitions = async () => {
  const { rows } = await db.query(
    `SELECT c.*,
            (SELECT COUNT(*)::int FROM innovation_submissions s WHERE s.competition_id = c.id) AS submission_count
     FROM innovation_competitions c
     ORDER BY c.created_at DESC`
  );
  return rows;
};

exports.getCompetition = async (id) => {
  const { rows } = await db.query(
    `SELECT c.*,
            (SELECT COUNT(*)::int FROM innovation_submissions s WHERE s.competition_id = c.id) AS submission_count
     FROM innovation_competitions c
     WHERE c.id = $1`,
    [id]
  );
  return rows[0];
};

exports.createCompetition = async (payload) => {
  const { rows } = await db.query(
    `INSERT INTO innovation_competitions (title, opens_at, closes_at, status)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [payload.title, payload.opensAt, payload.closesAt, payload.status || 'draft']
  );
  return rows[0];
};

exports.updateCompetition = async (id, payload) => {
  const { rows } = await db.query(
    `UPDATE innovation_competitions SET
       title = COALESCE($2, title),
       opens_at = COALESCE($3, opens_at),
       closes_at = COALESCE($4, closes_at),
       status = COALESCE($5, status)
     WHERE id = $1 RETURNING *`,
    [id, payload.title, payload.opensAt, payload.closesAt, payload.status]
  );
  return rows[0];
};

exports.listSubmissions = async ({ page = 1, limit = 50, category, status, competitionId } = {}) => {
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];
  let idx = 1;

  if (category) {
    conditions.push(`s.category = $${idx++}`);
    params.push(category);
  }
  if (status) {
    conditions.push(`s.status = $${idx++}`);
    params.push(status);
  }
  if (competitionId) {
    conditions.push(`s.competition_id = $${idx++}`);
    params.push(competitionId);
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  params.push(limit, offset);

  const { rows } = await db.query(
    `SELECT s.*, u.full_name AS author_name,
            (SELECT COUNT(*)::int FROM innovation_votes v WHERE v.submission_id = s.id) AS vote_count,
            c.title AS competition_title
     FROM innovation_submissions s
     LEFT JOIN users u ON u.id = s.user_id
     LEFT JOIN innovation_competitions c ON c.id = s.competition_id
     ${where}
     ORDER BY s.created_at DESC
     LIMIT $${idx++} OFFSET $${idx}`,
    params
  );
  return rows;
};

exports.getSubmission = async (id) => {
  const { rows } = await db.query(
    `SELECT s.*, u.full_name AS author_name,
            (SELECT COUNT(*)::int FROM innovation_votes v WHERE v.submission_id = s.id) AS vote_count,
            c.title AS competition_title
     FROM innovation_submissions s
     LEFT JOIN users u ON u.id = s.user_id
     LEFT JOIN innovation_competitions c ON c.id = s.competition_id
     WHERE s.id = $1`,
    [id]
  );
  return rows[0];
};

exports.submit = async (userId, competitionId, payload) => {
  const { rows } = await db.query(
    `INSERT INTO innovation_submissions
       (user_id, competition_id, title, category, description, problem, solution, impact, technology, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending_review')
     RETURNING *`,
    [
      userId, competitionId, payload.title, payload.category, payload.description,
      payload.problem, payload.solution, payload.impact, payload.technology,
    ]
  );
  return rows[0];
};

exports.updateSubmission = async (id, userId, payload) => {
  const { rows } = await db.query(
    `UPDATE innovation_submissions SET
       title = COALESCE($3, title),
       category = COALESCE($4, category),
       description = COALESCE($5, description),
       problem = COALESCE($6, problem),
       solution = COALESCE($7, solution),
       impact = COALESCE($8, impact),
       technology = COALESCE($9, technology),
       updated_at = now()
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [id, userId, payload.title, payload.category, payload.description,
     payload.problem, payload.solution, payload.impact, payload.technology]
  );
  return rows[0];
};

exports.deleteSubmission = async (id, userId) => {
  const { rowCount } = await db.query(
    'DELETE FROM innovation_submissions WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  return rowCount > 0;
};

exports.listCompetitionSubmissions = async (competitionId) => {
  const { rows } = await db.query(
    `SELECT s.*, u.full_name AS author_name,
            (SELECT COUNT(*)::int FROM innovation_votes v WHERE v.submission_id = s.id) AS vote_count
     FROM innovation_submissions s
     LEFT JOIN users u ON u.id = s.user_id
     WHERE s.competition_id = $1
     ORDER BY s.created_at DESC`,
    [competitionId]
  );
  return rows;
};

exports.vote = async (submissionId, voterFingerprint) => {
  await db.query(
    `INSERT INTO innovation_votes (submission_id, voter_fingerprint)
     VALUES ($1, $2)
     ON CONFLICT (submission_id, voter_fingerprint) DO NOTHING`,
    [submissionId, voterFingerprint]
  );
  const { rows } = await db.query(
    'SELECT COUNT(*)::int AS vote_count FROM innovation_votes WHERE submission_id = $1',
    [submissionId]
  );
  return rows[0].vote_count;
};

exports.getVotes = async (submissionId) => {
  const { rows } = await db.query(
    'SELECT COUNT(*)::int AS vote_count FROM innovation_votes WHERE submission_id = $1',
    [submissionId]
  );
  return rows[0].vote_count;
};

exports.leaderboard = async (competitionId) => {
  const query = competitionId
    ? `SELECT s.id, s.title, s.category, COUNT(v.id)::int AS vote_count,
              u.full_name AS author_name
       FROM innovation_submissions s
       LEFT JOIN innovation_votes v ON v.submission_id = s.id
       LEFT JOIN users u ON u.id = s.user_id
       WHERE s.competition_id = $1 AND s.status = 'approved'
       GROUP BY s.id, u.full_name
       ORDER BY vote_count DESC
       LIMIT 100`
    : `SELECT s.id, s.title, s.category, COUNT(v.id)::int AS vote_count,
              u.full_name AS author_name
       FROM innovation_submissions s
       LEFT JOIN innovation_votes v ON v.submission_id = s.id
       LEFT JOIN users u ON u.id = s.user_id
       WHERE s.status = 'approved'
       GROUP BY s.id, u.full_name
       ORDER BY vote_count DESC
       LIMIT 100`;

  const params = competitionId ? [competitionId] : [];
  const { rows } = await db.query(query, params);
  return rows;
};

exports.commentSubmission = async (submissionId, userId, comment) => {
  const { rows } = await db.query(
    `INSERT INTO innovation_comments (submission_id, user_id, comment)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [submissionId, userId, comment]
  );
  return rows[0];
};

exports.getComments = async (submissionId) => {
  const { rows } = await db.query(
    `SELECT c.*, u.full_name AS author_name
     FROM innovation_comments c
     LEFT JOIN users u ON u.id = c.user_id
     WHERE c.submission_id = $1
     ORDER BY c.created_at DESC`,
    [submissionId]
  );
  return rows;
};

exports.submitScore = async (judgeId, payload) => {
  const { rows } = await db.query(
    `INSERT INTO judge_scores
       (submission_id, judge_id, innovation_score, impact_score, feasibility_score,
        scalability_score, sustainability_score, technology_score, business_model_score,
        social_impact_score, market_readiness_score, presentation_score, comments)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     ON CONFLICT (submission_id, judge_id) DO UPDATE SET
       innovation_score = EXCLUDED.innovation_score,
       impact_score = EXCLUDED.impact_score,
       feasibility_score = EXCLUDED.feasibility_score,
       scalability_score = EXCLUDED.scalability_score,
       sustainability_score = EXCLUDED.sustainability_score,
       technology_score = EXCLUDED.technology_score,
       business_model_score = EXCLUDED.business_model_score,
       social_impact_score = EXCLUDED.social_impact_score,
       market_readiness_score = EXCLUDED.market_readiness_score,
       presentation_score = EXCLUDED.presentation_score,
       comments = EXCLUDED.comments
     RETURNING *`,
    [
      payload.submissionId, judgeId,
      payload.innovationScore, payload.impactScore, payload.feasibilityScore,
      payload.scalabilityScore, payload.sustainabilityScore, payload.technologyScore,
      payload.businessModelScore, payload.socialImpactScore, payload.marketReadinessScore,
      payload.presentationScore, payload.comments
    ]
  );
  return rows[0];
};

exports.getJudgeAssignments = async (judgeId) => {
  const { rows } = await db.query(
    `SELECT s.*, u.full_name AS author_name,
            (SELECT COUNT(*)::int FROM innovation_votes v WHERE v.submission_id = s.id) AS vote_count,
            js.innovation_score, js.impact_score, js.feasibility_score
     FROM innovation_submissions s
     LEFT JOIN users u ON u.id = s.user_id
     LEFT JOIN judge_scores js ON js.submission_id = s.id AND js.judge_id = $1
     WHERE s.status = 'approved'
     ORDER BY s.created_at DESC`,
    [judgeId]
  );
  return rows;
};

exports.listCategories = async () => {
  return [
    'Health Innovation', 'Education Innovation', 'Agriculture Innovation',
    'Climate Innovation', 'ICT Innovation', 'Artificial Intelligence',
    'Robotics', 'Biomedical Engineering', 'Digital Health', 'Mental Health',
    'Community Health', 'Business Innovation', 'Women Innovation',
    'Youth Innovation', 'Students Innovation', 'Universities Innovation',
    'Startups Innovation', 'Research Innovation', 'Fintech Innovation',
    'GovTech Innovation', 'EdTech Innovation', 'Green Technology',
    'Clean Energy', 'Food Security', 'Water Innovation'
  ];
};
