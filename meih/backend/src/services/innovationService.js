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

exports.vote = async (submissionId, voterFingerprint, voterRole) => {
  const points = voterRole === 'judge' ? 10 : 5;
  const role = voterRole || 'public_voter';

  const { rows: sub } = await db.query(
    `SELECT s.competition_id, s.status,
            c.opens_at, c.closes_at, c.status AS comp_status
     FROM innovation_submissions s
     LEFT JOIN innovation_competitions c ON c.id = s.competition_id
     WHERE s.id = $1`,
    [submissionId]
  );
  if (!sub[0]) throw Object.assign(new Error('Submission not found'), { status: 404 });
  if (sub[0].status !== 'approved') throw Object.assign(new Error('Voting is only open for approved innovations'), { status: 400 });

  const now = new Date();
  if (sub[0].opens_at && now < new Date(sub[0].opens_at)) {
    throw Object.assign(new Error('Voting has not opened yet'), { status: 400 });
  }
  if (sub[0].closes_at && now > new Date(sub[0].closes_at)) {
    throw Object.assign(new Error('Voting period has ended'), { status: 400 });
  }
  if (sub[0].comp_status && !['open', 'voting'].includes(sub[0].comp_status)) {
    throw Object.assign(new Error('Competition is not accepting votes'), { status: 400 });
  }

  await db.query(
    `INSERT INTO innovation_votes (submission_id, voter_fingerprint, points, voter_role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (submission_id, voter_fingerprint) DO NOTHING`,
    [submissionId, voterFingerprint, points, role]
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
  const { rows } = await db.query(
    `SELECT DISTINCT s.*, u.full_name AS author_name, u.image_url AS author_image,
            COALESCE((SELECT SUM(v.points) FROM innovation_votes v WHERE v.submission_id = s.id), 0)::int AS total_points,
            (SELECT COUNT(*)::int FROM innovation_votes v WHERE v.submission_id = s.id) AS vote_count,
            js.innovation_score, js.impact_score, js.feasibility_score,
            js.scalability_score, js.sustainability_score, js.technology_score,
            js.business_model_score, js.social_impact_score, js.market_readiness_score,
            js.presentation_score, js.comments AS judge_comments
     FROM judge_assignments ja
     INNER JOIN innovation_submissions s ON (
       (ja.submission_id IS NOT NULL AND s.id = ja.submission_id)
       OR
       (ja.submission_id IS NULL AND s.competition_id = ja.competition_id AND s.status = 'approved')
     )
     LEFT JOIN users u ON u.id = s.user_id
     LEFT JOIN judge_scores js ON js.submission_id = s.id AND js.judge_id = $1
     WHERE ja.judge_id = $1 AND s.status = 'approved'
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
       payment_method = $6,
       updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [id, payload.amount, payload.paymentNumber, payload.paymentName,
     payload.screenshotUrl || null, payload.method || 'mobile_money']
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
    `SELECT id, full_name, name, email, role FROM users WHERE role = 'judge' ORDER BY full_name`
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
      id: 'voting',
      label: 'Public Voting',
      description: 'Your innovation is open for public votes.',
      status: subData.status === 'approved' ? 'in_progress' : 'pending',
      voteCount: subData.vote_count || 0,
    },
    {
      id: 'judging',
      label: 'Judge Evaluation',
      description: 'Expert judges score your innovation across 10 dimensions.',
      status: scores.length > 0 ? 'completed' : (subData.status === 'approved' && subData.payment_status === 'confirmed') ? 'in_progress' : 'pending',
      score: avgScore,
      ratedCount: scores.length,
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
    `SELECT s.*, u.full_name AS author_name, u.email AS author_email, u.image_url AS author_image,
            c.title AS competition_title, c.closes_at AS competition_closes,
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
  return rows[0];
};
