const db = require('../config/database');

const WORD_LIMITS = { title: 20, problem: 50, description: 150, solution: 100, impact: 50 };
function enforceWordLimits(payload) {
  for (const [field, max] of Object.entries(WORD_LIMITS)) {
    if (payload[field] && payload[field].trim().split(/\s+/).length > max) {
      throw new Error(`"${field}" must not exceed ${max} words`);
    }
  }
}

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
    `INSERT INTO innovation_competitions (title, main_theme, sub_themes, opens_at, closes_at, status)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [
      payload.title,
      payload.mainTheme || payload.main_theme || null,
      JSON.stringify(payload.subThemes || payload.sub_themes || []),
      payload.opensAt, payload.closesAt, payload.status || 'draft'
    ]
  );
  return rows[0];
};

exports.updateCompetition = async (id, payload) => {
  const { rows } = await db.query(
    `UPDATE innovation_competitions SET
       title = COALESCE($2, title),
       main_theme = COALESCE($3, main_theme),
       sub_themes = COALESCE($4, sub_themes),
       opens_at = COALESCE($5, opens_at),
       closes_at = COALESCE($6, closes_at),
       status = COALESCE($7, status)
     WHERE id = $1 RETURNING *`,
    [
      id, payload.title,
      payload.mainTheme || payload.main_theme || null,
      JSON.stringify(payload.subThemes || payload.sub_themes || null),
      payload.opensAt, payload.closesAt, payload.status
    ]
  );
  return rows[0];
};

exports.closeCompetitionVoting = async (competitionId) => {
  const { rows } = await db.query(
    `UPDATE innovation_competitions
     SET votes_closed_at = now(), updated_at = now()
     WHERE id = $1 RETURNING *`,
    [competitionId]
  );
  const comp = rows[0];
  if (!comp) throw Object.assign(new Error('Competition not found'), { status: 404 });

  const { rows: subs } = await db.query(
    `SELECT id, user_id, title FROM innovation_submissions
     WHERE competition_id = $1 AND status = 'approved'`,
    [competitionId]
  );
  const emailNotification = require('./emailNotificationService');
  for (const s of subs) {
    emailNotification.onVotingClosed(s.user_id, s.title).catch(() => {});
  }
  return comp;
};

exports.deleteCompetition = async (id) => {
  const client = await db.getPool().connect();
  try {
    await client.query('BEGIN');
    const subs = await client.query('SELECT id FROM innovation_submissions WHERE competition_id = $1', [id]);
    for (const s of subs.rows) {
      await client.query('DELETE FROM innovation_votes WHERE submission_id = $1', [s.id]);
      await client.query('DELETE FROM innovation_comments WHERE submission_id = $1', [s.id]);
      await client.query('DELETE FROM judge_scores WHERE submission_id = $1', [s.id]);
      await client.query('DELETE FROM reviewer_scores WHERE submission_id = $1', [s.id]);
      await client.query('DELETE FROM judge_assignments WHERE submission_id = $1', [s.id]);
      await client.query('DELETE FROM reviewer_assignments WHERE submission_id = $1', [s.id]);
      await client.query('DELETE FROM innovation_submissions WHERE id = $1', [s.id]);
    }
    await client.query('DELETE FROM innovation_competitions WHERE id = $1', [id]);
    await client.query('COMMIT');
    return true;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
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
    `SELECT s.*, u.full_name AS author_name, u.image_url AS author_image,
            COALESCE((SELECT SUM(v.points) FROM innovation_votes v WHERE v.submission_id = s.id), 0)::int AS total_points,
            (SELECT COUNT(*)::int FROM innovation_votes v WHERE v.submission_id = s.id) AS vote_count,
            c.title AS competition_title
     FROM innovation_submissions s
     LEFT JOIN users u ON u.id = s.user_id
     LEFT JOIN innovation_competitions c ON c.id = s.competition_id
     ${where}
     ORDER BY total_points DESC, s.created_at DESC
     LIMIT $${idx++} OFFSET $${idx}`,
    params
  );
  return rows;
};

exports.getSubmission = async (id) => {
  const { rows } = await db.query(
    `SELECT s.*, u.full_name AS author_name, u.image_url AS author_image,
            COALESCE((SELECT SUM(v.points) FROM innovation_votes v WHERE v.submission_id = s.id), 0)::int AS total_points,
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
  enforceWordLimits(payload);
  const { rows } = await db.query(
    `INSERT INTO innovation_submissions
       (user_id, competition_id, title, category, main_theme, sub_theme, description, problem, solution, impact, technology, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending_review')
     RETURNING *`,
    [
      userId, competitionId, payload.title, payload.category,
      payload.mainTheme || payload.main_theme || null,
      payload.subTheme || payload.sub_theme || null,
      payload.description,
      payload.problem, payload.solution, payload.impact, payload.technology,
    ]
  );
  return rows[0];
};

exports.updateSubmission = async (id, userId, payload) => {
  enforceWordLimits(payload);
  const { rows } = await db.query(
    `UPDATE innovation_submissions SET
       title = COALESCE($3, title),
       category = COALESCE($4, category),
       main_theme = COALESCE($5, main_theme),
       sub_theme = COALESCE($6, sub_theme),
       description = COALESCE($7, description),
       problem = COALESCE($8, problem),
       solution = COALESCE($9, solution),
       impact = COALESCE($10, impact),
       technology = COALESCE($11, technology),
       updated_at = now()
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [id, userId, payload.title, payload.category,
     payload.mainTheme || payload.main_theme || null,
     payload.subTheme || payload.sub_theme || null,
     payload.description, payload.problem, payload.solution, payload.impact, payload.technology]
  );
  return rows[0];
};

exports.deleteSubmission = async (id, userId, userRole) => {
  const canDeleteAny = userRole === 'admin' || userRole === 'superadmin' || userRole === 'innovator_manager';
  if (canDeleteAny) {
    const { rowCount } = await db.query('DELETE FROM innovation_submissions WHERE id = $1', [id]);
    return rowCount > 0;
  }
  const { rowCount } = await db.query(
    'DELETE FROM innovation_submissions WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  return rowCount > 0;
};

exports.listCompetitionSubmissions = async (competitionId) => {
  const { rows } = await db.query(
    `SELECT s.*, u.full_name AS author_name, u.image_url AS author_image,
            COALESCE((SELECT SUM(v.points) FROM innovation_votes v WHERE v.submission_id = s.id), 0)::int AS total_points,
            (SELECT COUNT(*)::int FROM innovation_votes v WHERE v.submission_id = s.id) AS vote_count
     FROM innovation_submissions s
     LEFT JOIN users u ON u.id = s.user_id
     WHERE s.competition_id = $1
     ORDER BY total_points DESC, s.created_at DESC`,
    [competitionId]
  );
  return rows;
};

exports.vote = async (submissionId, voterId, otp) => {
  const { rows: voter } = await db.query(
    'SELECT id, role, status, vote_otp FROM users WHERE id = $1',
    [voterId]
  );
  if (!voter[0]) throw Object.assign(new Error('Voter account not found'), { status: 401 });
  if (voter[0].role !== 'public_voter') {
    throw Object.assign(new Error('Only Public Voters are allowed to vote'), { status: 403 });
  }
  if (voter[0].status !== 'active') {
    throw Object.assign(new Error('Your account is not active'), { status: 403 });
  }
  if (!otp || String(otp).trim() !== String(voter[0].vote_otp || '').trim()) {
    throw Object.assign(new Error('Invalid OTP. Please enter the 6-digit OTP shown on your Public Voter dashboard'), { status: 400 });
  }

  const points = 5;
  const role = 'public_voter';

  const { rows: sub } = await db.query(
    `SELECT s.competition_id, s.status,
            c.opens_at, c.closes_at, c.status AS comp_status, c.votes_closed_at
     FROM innovation_submissions s
     LEFT JOIN innovation_competitions c ON c.id = s.competition_id
     WHERE s.id = $1`,
    [submissionId]
  );
  if (!sub[0]) throw Object.assign(new Error('Submission not found'), { status: 404 });
  if (sub[0].status !== 'approved') throw Object.assign(new Error('Voting is only open for approved innovations'), { status: 400 });

  const hasRevScore = await exports.hasReviewerScore(submissionId);
  if (!hasRevScore) throw Object.assign(new Error('Voting has not opened yet: waiting for reviewer evaluation'), { status: 400 });
  const hasJdgScore = await exports.hasJudgeScore(submissionId);
  if (!hasJdgScore) throw Object.assign(new Error('Voting has not opened yet: waiting for judge evaluation'), { status: 400 });

  const now = new Date();
  if (sub[0].opens_at && now < new Date(sub[0].opens_at)) {
    throw Object.assign(new Error('Voting has not opened yet'), { status: 400 });
  }
  if (sub[0].closes_at && now > new Date(sub[0].closes_at)) {
    throw Object.assign(new Error('Voting period has ended'), { status: 400 });
  }
  if (sub[0].votes_closed_at) {
    throw Object.assign(new Error('Voting has been closed by the innovation manager'), { status: 400 });
  }
  if (sub[0].comp_status && !['open', 'voting'].includes(sub[0].comp_status)) {
    throw Object.assign(new Error('Competition is not accepting votes'), { status: 400 });
  }

  const { rows: existing } = await db.query(
    'SELECT id FROM innovation_votes WHERE submission_id = $1 AND voter_id = $2',
    [submissionId, voterId]
  );
  if (existing.length > 0) {
    throw Object.assign(new Error('You have already voted for this innovation'), { status: 400 });
  }

  await db.query(
    `INSERT INTO innovation_votes (submission_id, voter_fingerprint, voter_id, points, voter_role)
     VALUES ($1, $2, $3, $4, $5)`,
    [submissionId, voterId, voterId, points, role]
  );
  const { rows } = await db.query(
    'SELECT COALESCE(SUM(points), 0)::int AS total_points, COUNT(*)::int AS vote_count FROM innovation_votes WHERE submission_id = $1',
    [submissionId]
  );
  return { voteCount: rows[0].vote_count, totalPoints: rows[0].total_points };
};

exports.getVotes = async (submissionId) => {
  const { rows } = await db.query(
    'SELECT COALESCE(SUM(points), 0)::int AS total_points, COUNT(*)::int AS vote_count FROM innovation_votes WHERE submission_id = $1',
    [submissionId]
  );
  return { voteCount: rows[0].vote_count, totalPoints: rows[0].total_points };
};

exports.leaderboard = async (competitionId) => {
  const query = competitionId
    ? `SELECT s.id, s.title, s.category, s.admin_rating,
              COALESCE(SUM(v.points), 0)::int AS total_points,
              COUNT(v.id)::int AS vote_count,
              u.full_name AS author_name, u.image_url AS author_image
       FROM innovation_submissions s
       LEFT JOIN innovation_votes v ON v.submission_id = s.id
       LEFT JOIN users u ON u.id = s.user_id
       WHERE s.competition_id = $1 AND s.status = 'approved'
       GROUP BY s.id, s.admin_rating, u.full_name, u.image_url
       ORDER BY total_points DESC
       LIMIT 100`
    : `SELECT s.id, s.title, s.category, s.admin_rating,
              COALESCE(SUM(v.points), 0)::int AS total_points,
              COUNT(v.id)::int AS vote_count,
              u.full_name AS author_name, u.image_url AS author_image
       FROM innovation_submissions s
       LEFT JOIN innovation_votes v ON v.submission_id = s.id
       LEFT JOIN users u ON u.id = s.user_id
       WHERE s.status = 'approved'
       GROUP BY s.id, s.admin_rating, u.full_name, u.image_url
       ORDER BY total_points DESC
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
    `SELECT c.*, u.full_name AS author_name, u.role AS author_role
     FROM innovation_comments c
     LEFT JOIN users u ON u.id = c.user_id
     WHERE c.submission_id = $1
     ORDER BY c.created_at DESC`,
    [submissionId]
  );
  return rows;
};

exports.listMyComments = async (userId) => {
  const { rows } = await db.query(
    `SELECT c.id, c.submission_id, c.comment, c.created_at,
            s.title AS submission_title,
            u.full_name AS author_name, u.role AS author_role
     FROM innovation_comments c
     JOIN innovation_submissions s ON s.id = c.submission_id
     LEFT JOIN users u ON u.id = c.user_id
     WHERE s.user_id = $1
     ORDER BY c.created_at DESC`,
    [userId]
  );
  return rows;
};

exports.submitScore = async (judgeId, payload) => {
  const hasReviewer = await exports.hasReviewerScore(payload.submissionId);
  if (!hasReviewer) {
    throw Object.assign(new Error('Cannot score: this submission needs at least one reviewer score first.'), { status: 400 });
  }

  const { rows: scoreRows } = await db.query(
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

  if (payload.rating && payload.rating >= 1 && payload.rating <= 5) {
    await db.query(
      `UPDATE innovation_submissions SET admin_rating = $2, updated_at = now() WHERE id = $1`,
      [payload.submissionId, payload.rating]
    );
  } else {
    const scores = [payload.innovationScore, payload.impactScore, payload.feasibilityScore,
      payload.scalabilityScore, payload.sustainabilityScore, payload.technologyScore,
      payload.businessModelScore, payload.socialImpactScore, payload.marketReadinessScore,
      payload.presentationScore].filter(s => s != null && s !== undefined);
    if (scores.length > 0) {
      const avg = scores.reduce((a, b) => a + Number(b), 0) / scores.length;
      const starRating = Math.min(5, Math.max(1, Math.round(avg / 2)));
      await db.query(
        `UPDATE innovation_submissions SET admin_rating = $2, updated_at = now() WHERE id = $1`,
        [payload.submissionId, starRating]
      );
    }
  }

  return scoreRows[0];
};

exports.getJudgeAssignments = async (judgeId) => {
  console.log('[JUDGE-SRV] Fetching assignments for judge:', judgeId);
  try {
    const { rows } = await db.query(
      `SELECT DISTINCT s.*, u.full_name AS author_name, u.image_url AS author_image,
              COALESCE((SELECT SUM(v.points) FROM innovation_votes v WHERE v.submission_id = s.id), 0)::int AS total_points,
              (SELECT COUNT(*)::int FROM innovation_votes v WHERE v.submission_id = s.id) AS vote_count,
              js.innovation_score, js.impact_score, js.feasibility_score,
              js.scalability_score, js.sustainability_score, js.technology_score,
              js.business_model_score, js.social_impact_score, js.market_readiness_score,
              js.presentation_score, js.comments AS judge_comments
       FROM judge_assignments ja
       INNER JOIN innovation_submissions s ON
         (ja.submission_id IS NOT NULL AND s.id = ja.submission_id)
         OR
         (ja.submission_id IS NULL AND s.competition_id = ja.competition_id)
       LEFT JOIN users u ON u.id = s.user_id
       LEFT JOIN judge_scores js ON js.submission_id = s.id AND js.judge_id = $1
       WHERE ja.judge_id = $1
       ORDER BY s.created_at DESC`,
      [judgeId]
    );
    console.log('[JUDGE-SRV] Found', rows.length, 'assignments for judge:', judgeId);
    if (rows.length === 0) {
      const { rows: jaRows } = await db.query(
        'SELECT id, judge_id, competition_id, submission_id FROM judge_assignments WHERE judge_id = $1',
        [judgeId]
      );
      console.log('[JUDGE-SRV] judge_assignments rows for this judge:', jaRows.length, JSON.stringify(jaRows));
    }
    return rows;
  } catch (err) {
    console.error('[JUDGE-SRV] Query error for judge', judgeId, ':', err.message);
    throw err;
  }
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

exports.submitPayment = async (id, userId, payload) => {
  const { rows: sub } = await db.query(
    'SELECT id, user_id FROM innovation_submissions WHERE id = $1', [id]
  );
  if (!sub[0]) return null;
  if (sub[0].user_id !== userId) return { unauthorized: true };

  const { rows } = await db.query(
    `UPDATE innovation_submissions SET
       payment_status = 'pending',
       payment_amount = $2,
       payment_number = $3,
       payment_name = $4,
       payment_screenshot_url = $5,
       payment_screenshot_base64 = $6,
       payment_method = $7,
       updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [id, payload.amount, payload.paymentNumber, payload.paymentName,
     payload.screenshotUrl || null, payload.screenshotBase64 || null, payload.method || 'mobile_money']
  );
  return rows[0];
};

exports.confirmInnovationPayment = async (id, adminId) => {
  const { rows } = await db.query(
    `UPDATE innovation_submissions SET
       payment_status = 'confirmed',
       payment_confirmed_by = $2,
       payment_confirmed_at = now(),
       updated_at = now()
     WHERE id = $1 AND payment_status = 'pending'
     RETURNING *`,
    [id, adminId]
  );
  return rows[0];
};

exports.rejectInnovationPayment = async (id) => {
  const { rows } = await db.query(
    `UPDATE innovation_submissions SET
       payment_status = 'rejected',
       updated_at = now()
     WHERE id = $1 AND payment_status = 'pending'
     RETURNING *`,
    [id]
  );
  return rows[0];
};

exports.approveSubmission = async (id, managerId) => {
  const { rows } = await db.query(
    `UPDATE innovation_submissions SET
       status = 'approved',
       reviewed_by = $2,
       reviewed_at = now(),
       updated_at = now()
     WHERE id = $1 AND status = 'pending_review'
     RETURNING *`,
    [id, managerId]
  );
  return rows[0];
};

exports.rejectSubmission = async (id, managerId) => {
  const { rows } = await db.query(
    `UPDATE innovation_submissions SET
       status = 'rejected',
       reviewed_by = $2,
       reviewed_at = now(),
       updated_at = now()
     WHERE id = $1 AND status = 'pending_review'
     RETURNING *`,
    [id, managerId]
  );
  return rows[0];
};

exports.listManagerSubmissions = async (managerId) => {
  const { rows } = await db.query(
    `SELECT s.*, u.full_name AS author_name, u.image_url AS author_image,
            COALESCE((SELECT SUM(v.points) FROM innovation_votes v WHERE v.submission_id = s.id), 0)::int AS total_points,
            (SELECT COUNT(*)::int FROM innovation_votes v WHERE v.submission_id = s.id) AS vote_count,
            c.title AS competition_title
     FROM innovation_submissions s
     LEFT JOIN users u ON u.id = s.user_id
     LEFT JOIN innovation_competitions c ON c.id = s.competition_id
     WHERE s.status = 'pending_review'
     ORDER BY s.created_at DESC`
  );
  return rows;
};

exports.listPendingPayment = async ({ page = 1, limit = 50 } = {}) => {
  const offset = (page - 1) * limit;
  const { rows } = await db.query(
    `SELECT s.*, u.full_name AS author_name, c.title AS competition_title
     FROM innovation_submissions s
     LEFT JOIN users u ON u.id = s.user_id
     LEFT JOIN innovation_competitions c ON c.id = s.competition_id
     WHERE s.payment_status = 'pending'
     ORDER BY s.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows;
};

exports.listAllJudges = async () => {
  const { rows } = await db.query(
    `SELECT id, full_name, email, role FROM users WHERE role = 'judge' ORDER BY full_name`
  );
  return rows;
};

exports.assignJudge = async (judgeId, competitionId, submissionId) => {
  if (submissionId) {
    const { rows: existing } = await db.query(
      `SELECT id FROM judge_assignments WHERE judge_id = $1 AND competition_id = $2 AND submission_id = $3`,
      [judgeId, competitionId, submissionId]
    );
    if (existing.length > 0) return existing[0];
    const { rows } = await db.query(
      `INSERT INTO judge_assignments (judge_id, competition_id, submission_id)
       VALUES ($1, $2, $3) RETURNING *`,
      [judgeId, competitionId, submissionId]
    );
    return rows[0];
  }
  const { rows: existing } = await db.query(
    `SELECT id FROM judge_assignments WHERE judge_id = $1 AND competition_id = $2 AND submission_id IS NULL`,
    [judgeId, competitionId]
  );
  if (existing.length > 0) return existing[0];
  const { rows } = await db.query(
    `INSERT INTO judge_assignments (judge_id, competition_id) VALUES ($1, $2) RETURNING *`,
    [judgeId, competitionId]
  );
  return rows[0];
};

exports.adminRateSubmission = async (id, adminId, rating) => {
  if (!rating || rating < 1 || rating > 5) {
    throw Object.assign(new Error('Rating must be between 1 and 5'), { status: 400 });
  }
  const { rows } = await db.query(
    `UPDATE innovation_submissions SET
       admin_rating = $2,
       updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [id, rating]
  );
  return rows[0];
};

exports.removeJudgeAssignment = async (assignmentId) => {
  const { rowCount } = await db.query(
    'DELETE FROM judge_assignments WHERE id = $1',
    [assignmentId]
  );
  return rowCount > 0;
};

exports.listAllJudgeAssignments = async () => {
  const { rows } = await db.query(
    `SELECT ja.id, ja.judge_id, ja.competition_id, ja.submission_id, ja.created_at,
            u.full_name AS judge_name, u.email AS judge_email,
            c.title AS competition_title, s.title AS submission_title
     FROM judge_assignments ja
     LEFT JOIN users u ON u.id = ja.judge_id
     LEFT JOIN innovation_competitions c ON c.id = ja.competition_id
     LEFT JOIN innovation_submissions s ON s.id = ja.submission_id
     ORDER BY ja.created_at DESC`
  );
  return rows;
};

exports.listCompetitionJudges = async (competitionId) => {
  const { rows } = await db.query(
    `SELECT ja.*, u.full_name AS judge_name
     FROM judge_assignments ja
     LEFT JOIN users u ON u.id = ja.judge_id
     WHERE ja.competition_id = $1`,
    [competitionId]
  );
  return rows;
};

exports.getSubmissionRequirements = async (id, userId) => {
  const { rows: sub } = await db.query(
    `SELECT s.*, u.full_name AS author_name,
            c.title AS competition_title, c.opens_at AS competition_opens, c.closes_at AS competition_closes,
            c.votes_closed_at AS competition_votes_closed,
            (SELECT COUNT(*)::int FROM innovation_votes v WHERE v.submission_id = s.id) AS vote_count,
            js.innovation_score, js.impact_score, js.feasibility_score,
            js.scalability_score, js.sustainability_score, js.technology_score,
            js.business_model_score, js.social_impact_score, js.market_readiness_score,
            js.presentation_score, js.comments AS judge_comments
     FROM innovation_submissions s
     LEFT JOIN users u ON u.id = s.user_id
     LEFT JOIN innovation_competitions c ON c.id = s.competition_id
     LEFT JOIN judge_scores js ON js.submission_id = s.id
     WHERE s.id = $1`,
    [id]
  );

  const subData = sub[0];
  if (!subData) return null;
  if (subData.user_id !== userId) return { unauthorized: true };

  const scores = [subData.innovation_score, subData.impact_score, subData.feasibility_score,
    subData.scalability_score, subData.sustainability_score, subData.technology_score,
    subData.business_model_score, subData.social_impact_score, subData.market_readiness_score,
    subData.presentation_score].filter(s => s != null);
  const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + Number(b), 0) / scores.length).toFixed(1) : null;

  let rating = null;
  if (avgScore !== null) {
    const avgNum = parseFloat(avgScore);
    if (avgNum >= 9) rating = 'PLATINUM';
    else if (avgNum >= 7) rating = 'GOLD';
    else if (avgNum >= 5) rating = 'SILVER';
    else if (avgNum >= 3) rating = 'BRONZE';
    else rating = 'PARTICIPANT';
  }

  const hasReviewer = await exports.hasReviewerScore(subData.id);
  const hasJudge = await exports.hasJudgeScore(subData.id);
  const voteOpen = subData.status === 'approved' && hasReviewer && hasJudge && !subData.competition_votes_closed;

  const steps = [
    {
      id: 'submission',
      label: 'Innovation Submitted',
      description: 'Your innovation has been registered and submitted for review.',
      status: 'completed',
      completedAt: subData.created_at,
    },
    {
      id: 'manager_review',
      label: 'Manager Review',
      description: 'The innovation manager reviews your submission for eligibility.',
      status: subData.status === 'pending_review' ? 'in_progress' : (subData.status === 'approved' || subData.status === 'rejected') ? 'completed' : 'pending',
      completedAt: subData.reviewed_at,
    },
    {
      id: 'approval',
      label: 'Submission Approved',
      description: 'Your innovation has been approved by the manager.',
      status: subData.status === 'approved' ? 'completed' : subData.status === 'rejected' ? 'failed' : 'pending',
      completedAt: subData.status === 'approved' ? subData.reviewed_at : null,
    },
    {
      id: 'payment',
      label: 'Innovation Fee Payment',
      description: 'Submit your innovation registration fee via bank transfer or mobile money.',
      status: subData.payment_status === 'confirmed' ? 'completed' : subData.payment_status === 'pending' ? 'in_progress' : subData.payment_status === 'rejected' ? 'failed' : 'pending',
      completedAt: subData.payment_confirmed_at,
    },
    {
      id: 'payment_confirmation',
      label: 'Payment Confirmed',
      description: 'The manager has verified and confirmed your payment.',
      status: subData.payment_status === 'confirmed' ? 'completed' : subData.payment_status === 'pending' ? 'in_progress' : 'pending',
      completedAt: subData.payment_confirmed_at,
    },
    {
      id: 'reviewer_evaluation',
      label: 'Reviewer Evaluation',
      description: 'Expert reviewers score your innovation before judge evaluation.',
      status: hasReviewer ? 'completed' : (subData.status === 'approved' && subData.payment_status === 'confirmed') ? 'in_progress' : 'pending',
    },
    {
      id: 'judging',
      label: 'Judge Evaluation',
      description: 'Expert judges score your innovation across 10 dimensions.',
      status: hasJudge ? 'completed' : hasReviewer ? 'in_progress' : 'pending',
      score: avgScore,
      ratedCount: scores.length,
    },
    {
      id: 'voting',
      label: 'Public Voting',
      description: 'Your innovation is open for public votes.',
      status: voteOpen ? 'in_progress' : 'pending',
      voteCount: subData.vote_count || 0,
    },
    {
      id: 'certificate',
      label: 'Certificate Issued',
      description: 'Your Certificate of Achievement is ready for download.',
      status: (subData.status === 'approved' && subData.payment_status === 'confirmed' && scores.length > 0) ? 'completed' : 'pending',
      rating,
      avgScore,
    },
  ];

  return {
    submissionId: subData.id,
    title: subData.title,
    category: subData.category,
    status: subData.status,
    paymentStatus: subData.payment_status,
    competition: subData.competition_title,
    author: subData.author_name,
    steps,
    currentStep: steps.findIndex(s => s.status === 'in_progress' || s.status === 'pending'),
  };
};

exports.listManagerPendingPayments = async (managerId, { page = 1, limit = 50 } = {}) => {
  const offset = (page - 1) * limit;
  const { rows } = await db.query(
    `SELECT s.*, u.full_name AS author_name, u.email AS author_email,
            c.title AS competition_title
     FROM innovation_submissions s
     LEFT JOIN users u ON u.id = s.user_id
     LEFT JOIN innovation_competitions c ON c.id = s.competition_id
     WHERE s.payment_status = 'pending'
     ORDER BY s.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows;
};

exports.getTicketData = async (id) => {
  const { rows } = await db.query(
    `SELECT s.*, u.full_name AS author_name, u.email AS author_email,
            c.title AS competition_title, c.opens_at AS competition_opens, c.closes_at AS competition_closes
     FROM innovation_submissions s
     LEFT JOIN users u ON u.id = s.user_id
     LEFT JOIN innovation_competitions c ON c.id = s.competition_id
     WHERE s.id = $1`,
    [id]
  );
  return rows[0];
};

exports.getCertificateData = async (id) => {
  const { rows } = await db.query(
    `SELECT s.*, u.full_name AS author_name, u.email AS author_email, u.image_url AS author_image, u.image_base64 AS author_image_b64,
            s.image_url AS submission_image, s.image_base64 AS submission_image_b64,
            c.title AS competition_title, c.closes_at AS competition_closes,
            js.innovation_score, js.impact_score, js.feasibility_score,
            js.scalability_score, js.sustainability_score, js.technology_score,
            js.business_model_score, js.social_impact_score, js.market_readiness_score,
            js.presentation_score, js.comments AS judge_comments,
            (SELECT d.signature_url FROM users d
              WHERE d.role IN ('innovator_manager','admin','superadmin') AND d.signature_url IS NOT NULL
              ORDER BY d.updated_at DESC LIMIT 1) AS director_signature,
            (SELECT d.signature_base64 FROM users d
              WHERE d.role IN ('innovator_manager','admin','superadmin') AND d.signature_base64 IS NOT NULL
              ORDER BY d.updated_at DESC LIMIT 1) AS director_signature_b64,
            (SELECT j.signature_url FROM judge_scores jj
              JOIN users j ON j.id = jj.judge_id
              WHERE jj.submission_id = s.id AND j.signature_url IS NOT NULL
              ORDER BY jj.updated_at DESC LIMIT 1) AS judge_signature,
            (SELECT j.signature_base64 FROM judge_scores jj
              JOIN users j ON j.id = jj.judge_id
              WHERE jj.submission_id = s.id AND j.signature_base64 IS NOT NULL
              ORDER BY jj.updated_at DESC LIMIT 1) AS judge_signature_b64
     FROM innovation_submissions s
     LEFT JOIN users u ON u.id = s.user_id
     LEFT JOIN innovation_competitions c ON c.id = s.competition_id
     LEFT JOIN judge_scores js ON js.submission_id = s.id
     WHERE s.id = $1`,
    [id]
  );
  return rows[0];
};

// ============================================================
// REVIEWER FUNCTIONS
// ============================================================

exports.listAllReviewers = async () => {
  const { rows } = await db.query(
    `SELECT id, full_name, email, role FROM users WHERE role = 'reviewer' ORDER BY full_name`
  );
  return rows;
};

exports.assignReviewer = async (reviewerId, competitionId, submissionId) => {
  if (submissionId) {
    const { rows: existing } = await db.query(
      `SELECT id FROM reviewer_assignments WHERE reviewer_id = $1 AND competition_id = $2 AND submission_id = $3`,
      [reviewerId, competitionId, submissionId]
    );
    if (existing.length > 0) return existing[0];
    const { rows } = await db.query(
      `INSERT INTO reviewer_assignments (reviewer_id, competition_id, submission_id)
       VALUES ($1, $2, $3) RETURNING *`,
      [reviewerId, competitionId, submissionId]
    );
    return rows[0];
  }
  const { rows: existing } = await db.query(
    `SELECT id FROM reviewer_assignments WHERE reviewer_id = $1 AND competition_id = $2 AND submission_id IS NULL`,
    [reviewerId, competitionId]
  );
  if (existing.length > 0) return existing[0];
  const { rows } = await db.query(
    `INSERT INTO reviewer_assignments (reviewer_id, competition_id) VALUES ($1, $2) RETURNING *`,
    [reviewerId, competitionId]
  );
  return rows[0];
};

exports.removeReviewerAssignment = async (assignmentId) => {
  const { rowCount } = await db.query(
    'DELETE FROM reviewer_assignments WHERE id = $1',
    [assignmentId]
  );
  return rowCount > 0;
};

exports.listAllReviewerAssignments = async () => {
  const { rows } = await db.query(
    `SELECT ra.id, ra.reviewer_id, ra.competition_id, ra.submission_id, ra.created_at,
            u.full_name AS reviewer_name, u.email AS reviewer_email,
            c.title AS competition_title, s.title AS submission_title
     FROM reviewer_assignments ra
     LEFT JOIN users u ON u.id = ra.reviewer_id
     LEFT JOIN innovation_competitions c ON c.id = ra.competition_id
     LEFT JOIN innovation_submissions s ON s.id = ra.submission_id
     ORDER BY ra.created_at DESC`
  );
  return rows;
};

exports.getReviewerAssignments = async (reviewerId) => {
  const { rows } = await db.query(
    `SELECT DISTINCT s.*, u.full_name AS author_name, u.image_url AS author_image,
            COALESCE((SELECT SUM(v.points) FROM innovation_votes v WHERE v.submission_id = s.id), 0)::int AS total_points,
            (SELECT COUNT(*)::int FROM innovation_votes v WHERE v.submission_id = s.id) AS vote_count,
            rs.innovation_score, rs.impact_score, rs.feasibility_score,
            rs.scalability_score, rs.sustainability_score, rs.technology_score,
            rs.business_model_score, rs.social_impact_score, rs.market_readiness_score,
            rs.presentation_score, rs.comments AS reviewer_comments,
            c.title AS competition_title
     FROM reviewer_assignments ra
     INNER JOIN innovation_submissions s ON
       (ra.submission_id IS NOT NULL AND s.id = ra.submission_id)
       OR
       (ra.submission_id IS NULL AND s.competition_id = ra.competition_id)
     LEFT JOIN users u ON u.id = s.user_id
     LEFT JOIN innovation_competitions c ON c.id = s.competition_id
     LEFT JOIN reviewer_scores rs ON rs.submission_id = s.id AND rs.reviewer_id = $1
      WHERE ra.reviewer_id = $1
     ORDER BY s.created_at DESC`,
    [reviewerId]
  );
  return rows;
};

exports.submitReviewerScore = async (reviewerId, payload) => {
  const { rows } = await db.query(
    `INSERT INTO reviewer_scores
       (submission_id, reviewer_id, innovation_score, impact_score, feasibility_score,
        scalability_score, sustainability_score, technology_score, business_model_score,
        social_impact_score, market_readiness_score, presentation_score, comments)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     ON CONFLICT (submission_id, reviewer_id) DO UPDATE SET
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
      payload.submissionId, reviewerId,
      payload.innovationScore, payload.impactScore, payload.feasibilityScore,
      payload.scalabilityScore, payload.sustainabilityScore, payload.technologyScore,
      payload.businessModelScore, payload.socialImpactScore, payload.marketReadinessScore,
      payload.presentationScore, payload.comments
    ]
  );
  return rows[0];
};

exports.listCompetitionReviewers = async (competitionId) => {
  const { rows } = await db.query(
    `SELECT ra.*, u.full_name AS reviewer_name
     FROM reviewer_assignments ra
     LEFT JOIN users u ON u.id = ra.reviewer_id
     WHERE ra.competition_id = $1`,
    [competitionId]
  );
  return rows;
};

exports.hasReviewerScore = async (submissionId) => {
  const { rows } = await db.query(
    `SELECT id FROM reviewer_scores WHERE submission_id = $1 LIMIT 1`,
    [submissionId]
  );
  return rows.length > 0;
};

exports.hasJudgeScore = async (submissionId) => {
  const { rows } = await db.query(
    `SELECT id FROM judge_scores WHERE submission_id = $1 LIMIT 1`,
    [submissionId]
  );
  return rows.length > 0;
};
