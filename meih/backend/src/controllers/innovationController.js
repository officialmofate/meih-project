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
    const voterRole = req.user ? req.user.role : 'public_voter';
    const result = await innovationService.vote(req.params.id, fingerprint, voterRole);
    res.json(result);
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

exports.approveSubmission = async (req, res, next) => {
  try {
    const submission = await innovationService.approveSubmission(req.params.id, req.user.id);
    if (!submission) return res.status(404).json({ message: 'Submission not found or not pending review' });
    res.json(submission);
  } catch (err) { next(err); }
};

exports.rejectSubmission = async (req, res, next) => {
  try {
    const submission = await innovationService.rejectSubmission(req.params.id, req.user.id);
    if (!submission) return res.status(404).json({ message: 'Submission not found or not pending review' });
    res.json(submission);
  } catch (err) { next(err); }
};

exports.listManagerSubmissions = async (req, res, next) => {
  try {
    const submissions = await innovationService.listManagerSubmissions(req.user.id);
    res.json(submissions);
  } catch (err) { next(err); }
};

exports.listCategories = async (req, res, next) => {
  try {
    const categories = await innovationService.listCategories();
    res.json(categories);
  } catch (err) { next(err); }
};

exports.listAllJudges = async (req, res, next) => {
  try {
    const judges = await innovationService.listAllJudges();
    res.json(judges);
  } catch (err) { next(err); }
};

exports.submitPayment = async (req, res, next) => {
  try {
    const submission = await innovationService.submitPayment(req.params.id, req.user.id, req.body);
    if (!submission) return res.status(404).json({ message: 'Submission not found' });
    if (submission.unauthorized) return res.status(403).json({ message: 'Not authorized to pay for this submission' });
    res.json(submission);
  } catch (err) { next(err); }
};

exports.confirmPayment = async (req, res, next) => {
  try {
    const submission = await innovationService.confirmInnovationPayment(req.params.id, req.user.id);
    if (!submission) return res.status(404).json({ message: 'Submission not found or not pending payment' });
    res.json(submission);
  } catch (err) { next(err); }
};

exports.rejectPayment = async (req, res, next) => {
  try {
    const submission = await innovationService.rejectInnovationPayment(req.params.id);
    if (!submission) return res.status(404).json({ message: 'Submission not found or not pending payment' });
    res.json(submission);
  } catch (err) { next(err); }
};

exports.getRequirements = async (req, res, next) => {
  try {
    const requirements = await innovationService.getSubmissionRequirements(req.params.id, req.user.id);
    if (!requirements) return res.status(404).json({ message: 'Submission not found' });
    if (requirements.unauthorized) return res.status(403).json({ message: 'Not authorized to view requirements for this submission' });
    res.json(requirements);
  } catch (err) { next(err); }
};

exports.listManagerPendingPayments = async (req, res, next) => {
  try {
    const pagination = { page: parseInt(req.query.page, 10) || 1, limit: parseInt(req.query.limit, 10) || 50 };
    const submissions = await innovationService.listManagerPendingPayments(req.user.id, pagination);
    res.json(submissions);
  } catch (err) { next(err); }
};

exports.uploadScreenshot = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No screenshot uploaded' });
    const url = '/uploads/payments/' + req.file.filename;
    res.json({ screenshot_url: url, url });
  } catch (err) { next(err); }
};

exports.uploadInnovatorImage = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image uploaded' });
    const url = '/uploads/profiles/' + req.file.filename;
    const db = require('../config/database');
    const { rowCount } = await db.query('UPDATE users SET image_url = $1 WHERE id = $2', [url, req.user.id]);
    console.log('[UPLOAD] Saved image for user', req.user.id, '→', url, 'rows updated:', rowCount);
    res.json({ image_url: url, url });
  } catch (err) { next(err); }
};

exports.rateSubmission = async (req, res, next) => {
  try {
    const db = require('../config/database');
    const { rating } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    const { rows } = await db.query(
      `UPDATE innovation_submissions SET admin_rating = $2, updated_at = now() WHERE id = $1 RETURNING *`,
      [req.params.id, rating]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Submission not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
};

exports.assignJudge = async (req, res, next) => {
  try {
    const result = await innovationService.assignJudge(req.body.judgeId, req.body.competitionId, req.body.submissionId || null);
    res.status(201).json(result);
  } catch (err) { next(err); }
};

exports.removeJudgeAssignment = async (req, res, next) => {
  try {
    const removed = await innovationService.removeJudgeAssignment(req.params.id);
    if (!removed) return res.status(404).json({ message: 'Assignment not found' });
    res.status(204).end();
  } catch (err) { next(err); }
};

exports.listAllJudgeAssignments = async (req, res, next) => {
  try {
    const assignments = await innovationService.listAllJudgeAssignments();
    res.json(assignments);
  } catch (err) { next(err); }
};

exports.listCompetitionJudges = async (req, res, next) => {
  try {
    const judges = await innovationService.listCompetitionJudges(req.params.competitionId);
    res.json(judges);
  } catch (err) { next(err); }
};

exports.getTicket = async (req, res, next) => {
  try {
    const ticket = await innovationService.getTicketData(req.params.id);
    if (!ticket) return res.status(404).send('<h1>Submission not found</h1>');
    if (ticket.status !== 'approved') {
      return res.status(400).send('<h1>Ticket only available for approved innovations</h1>');
    }

    const competitionDates = ticket.competition_opens && ticket.competition_closes
      ? new Date(ticket.competition_opens).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) + ' – ' + new Date(ticket.competition_closes).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : 'TBD';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Innovation Ticket — ${ticket.title || 'MEIH'}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Inter',sans-serif; background:#1a1a2e; color:#fff; display:flex; justify-content:center; align-items:center; min-height:100vh; padding:20px; }
  .ticket { width:100%; max-width:640px; background:linear-gradient(145deg,#16213e,#0f3460); border-radius:20px; overflow:hidden; box-shadow:0 20px 60px rgba(0,0,0,0.4); }
  .ticket-header { background:linear-gradient(135deg,#6c5ce7,#a855f7); padding:28px 32px; text-align:center; }
  .ticket-header h1 { font-size:13px; font-weight:600; letter-spacing:0.15em; text-transform:uppercase; opacity:0.85; }
  .ticket-header h2 { font-size:11px; font-weight:600; letter-spacing:0.12em; text-transform:uppercase; opacity:0.7; margin-top:4px; }
  .ticket-header .event-name { font-size:24px; font-weight:900; margin-top:6px; line-height:1.2; }
  .ticket-body { padding:28px 32px; }
  .ticket-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:24px; }
  .ticket-field label { font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.08em; color:rgba(255,255,255,0.5); display:block; margin-bottom:4px; }
  .ticket-field .value { font-size:15px; font-weight:600; color:#fff; }
  .divider { border:none; border-top:1px dashed rgba(255,255,255,0.15); margin:0 0 24px 0; }
  .qr-section { text-align:center; padding:16px 0; }
  .qr-section img { width:180px; height:180px; border-radius:12px; background:#fff; padding:8px; }
  .qr-label { font-size:11px; color:rgba(255,255,255,0.5); text-transform:uppercase; letter-spacing:0.1em; margin-top:10px; }
  .ticket-footer { background:rgba(0,0,0,0.2); padding:20px 32px; text-align:center; }
  .ticket-footer p { font-size:12px; color:rgba(255,255,255,0.4); line-height:1.6; }
  .ticket-id { font-family:monospace; font-size:13px; color:rgba(255,255,255,0.5); letter-spacing:0.05em; margin-top:6px; }
  .ticket-barcode { margin-top:16px; display:flex; justify-content:center; gap:2px; }
  .ticket-barcode span { display:inline-block; width:2px; background:rgba(255,255,255,0.3); border-radius:1px; }
  .print-btn { display:inline-block; margin:24px auto 0; padding:10px 28px; background:linear-gradient(135deg,#6c5ce7,#a855f7); color:#fff; border:none; border-radius:8px; font-size:14px; font-weight:600; cursor:pointer; }
  @media print { body { background:#fff; padding:0; margin:0; } .ticket { box-shadow:none; border:2px solid #6c5ce7; max-width:100%; } .print-btn { display:none !important; } .ticket-header, .ticket-footer, .ticket { -webkit-print-color-adjust:exact; print-color-adjust:exact; color-adjust:exact; } .qr-section img { border:1px solid #ccc; } }
</style>
</head>
<body>
<div class="ticket">
  <div class="ticket-header">
    <h1>MOFATE</h1>
    <h2>Innovation Hub Ticket</h2>
    <div class="event-name">${ticket.title || 'Innovation'}</div>
  </div>
  <div class="ticket-body">
    <div class="ticket-grid">
      <div class="ticket-field"><label>Innovator</label><div class="value">${ticket.author_name || 'Guest'}</div></div>
      <div class="ticket-field"><label>Competition</label><div class="value">${ticket.competition_title || '—'}</div></div>
      <div class="ticket-field"><label>Category</label><div class="value">${ticket.category || '—'}</div></div>
      <div class="ticket-field"><label>Competition Dates</label><div class="value">${competitionDates}</div></div>
      <div class="ticket-field"><label>Status</label><div class="value" style="color:#00b894;">APPROVED</div></div>
      <div class="ticket-field"><label>Votes</label><div class="value">${ticket.vote_count || 0}</div></div>
    </div>
    <hr class="divider"/>
    <div class="qr-section">
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent('INNO-TICKET-' + ticket.id)}" alt="Innovation QR Code" />
      <div class="qr-label">Scan to verify innovation</div>
    </div>
  </div>
  <div class="ticket-footer">
    <div class="ticket-barcode" id="barcode"></div>
    <div class="ticket-id">INNOVATION #${ticket.id.substring(0, 8).toUpperCase()}</div>
    <p>This ticket is issued by MOFATE — Mobile Facilitation Team.<br/>Present this ticket at the innovation showcase. Non-transferable.</p>
    <button class="print-btn" onclick="window.print()">Print Ticket</button>
  </div>
</div>
<script>
(function(){
  var bar=document.getElementById('barcode');
  var id='${ticket.id.replace(/-/g,'').substring(0,20)}';
  for(var i=0;i<id.length;i++){
    var c=id.charCodeAt(i);
    for(var j=0;j<3;j++){
      var s=document.createElement('span');
      s.style.height=(12+((c*(j+1))%18))+'px';
      if((c+j)%3===0) s.style.width='1px';
      bar.appendChild(s);
    }
  }
})();
</script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (err) { next(err); }
};

exports.getTicketPDF = async (req, res, next) => {
  try {
    const PDFDocument = require('pdfkit');
    const ticket = await innovationService.getTicketData(req.params.id);
    if (!ticket) return res.status(404).send('Submission not found');
    if (ticket.status !== 'approved') return res.status(400).send('Ticket only available for approved innovations');

    const competitionDates = ticket.competition_opens && ticket.competition_closes
      ? new Date(ticket.competition_opens).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) + ' - ' + new Date(ticket.competition_closes).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : 'TBD';

    const purple = '#6c5ce7';
    const dark = '#1a1a2e';
    const gray = '#636e72';
    const lightGray = '#dfe6e9';

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {
      const buf = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="innovation-ticket-' + req.params.id.substring(0, 8) + '.pdf"');
      res.send(buf);
    });

    doc.rect(0, 0, doc.page.width, 160).fill(purple);
    doc.fillColor('#ffffff').fontSize(12).font('Helvetica')
      .text('MOFATE', 50, 30, { align: 'center' });
    doc.fontSize(10).font('Helvetica')
      .text('INNOVATION HUB TICKET', 50, 48, { align: 'center', letterSpacing: 3 });
    doc.fontSize(24).font('Helvetica-Bold')
      .text(ticket.title || 'Innovation', 50, 70, { align: 'center', width: doc.page.width - 100 });
    doc.fontSize(11).font('Helvetica')
      .text('YOUR INNOVATION SHOWCASE TICKET', 50, 120, { align: 'center', letterSpacing: 2 });

    doc.fillColor(dark);
    const startY = 190;
    function drawField(x, y, label, value) {
      doc.fontSize(9).font('Helvetica').fillColor(gray).text(label.toUpperCase(), x, y, { width: 200 });
      doc.fontSize(13).font('Helvetica-Bold').fillColor(dark).text(value || '\u2014', x, y + 16, { width: 200 });
    }
    drawField(70, startY, 'Innovator', ticket.author_name || 'Guest');
    drawField(310, startY, 'Competition', ticket.competition_title || '\u2014');
    drawField(70, startY + 60, 'Category', ticket.category || '\u2014');
    drawField(310, startY + 60, 'Dates', competitionDates);
    drawField(70, startY + 120, 'Status', 'APPROVED');
    drawField(310, startY + 120, 'Votes', String(ticket.vote_count || 0));

    doc.moveTo(50, startY + 180).lineTo(doc.page.width - 50, startY + 180).lineWidth(1).dash(5, { space: 5 }).strokeColor(lightGray).stroke();
    doc.fontSize(9).font('Helvetica').fillColor(gray)
      .text('SCAN TO VERIFY INNOVATION', 50, startY + 195, { align: 'center', width: doc.page.width - 100 });

    doc.fontSize(8).font('Helvetica').fillColor(gray)
      .text('INNOVATION #' + ticket.id.substring(0, 8).toUpperCase(), 50, doc.page.height - 100, { align: 'center', width: doc.page.width - 100 });
    doc.fontSize(7).fillColor('#b2bec3')
      .text('This ticket is issued by MOFATE \u2014 Mobile Facilitation Team. Present at the innovation showcase. Non-transferable.', 50, doc.page.height - 85, { align: 'center', width: doc.page.width - 100 });
    doc.end();
  } catch (err) { next(err); }
};

exports.getCertificate = async (req, res, next) => {
  try {
    const cert = await innovationService.getCertificateData(req.params.id);
    if (!cert) return res.status(404).send('<h1>Submission not found</h1>');
    if (cert.status !== 'approved') {
      return res.status(400).send('<h1>Certificate only available for approved innovations</h1>');
    }

    const scores = [cert.innovation_score, cert.impact_score, cert.feasibility_score, cert.scalability_score, cert.sustainability_score, cert.technology_score, cert.business_model_score, cert.social_impact_score, cert.market_readiness_score, cert.presentation_score].filter(s => s != null);
    const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + Number(b), 0) / scores.length).toFixed(1) : 'N/A';
    const avgNum = scores.length > 0 ? parseFloat(avgScore) : 0;

    let rating, ratingColor, ratingLabel, ratingBg;
    if (avgNum >= 9) { rating = 'PLATINUM'; ratingColor = '#1a7a5a'; ratingBg = '#e8f5e9'; ratingLabel = 'Exceptional Innovation'; }
    else if (avgNum >= 7) { rating = 'GOLD'; ratingColor = '#b8860b'; ratingBg = '#fff8e1'; ratingLabel = 'Outstanding Innovation'; }
    else if (avgNum >= 5) { rating = 'SILVER'; ratingColor = '#546e7a'; ratingBg = '#eceff1'; ratingLabel = 'Excellent Innovation'; }
    else if (avgNum >= 3) { rating = 'BRONZE'; ratingColor = '#bf360c'; ratingBg = '#fbe9e7'; ratingLabel = 'Notable Innovation'; }
    else { rating = 'PARTICIPANT'; ratingColor = '#37474f'; ratingBg = '#eceff1'; ratingLabel = 'Innovation Showcase Participant'; }

    const issueDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const baseUrl = (req.protocol + '://' + req.get('host')).replace(/\/+$/, '');
    let authorImg = cert.author_image
      ? (cert.author_image.startsWith('http') ? cert.author_image : baseUrl + '/' + cert.author_image.replace(/^\//, ''))
      : '';
    authorImg = authorImg && (authorImg.startsWith('http://localhost') || authorImg.startsWith('http://127.0.0.1')) ? authorImg.replace(/\/+/g, '/').replace(':/', '://') : authorImg;
    console.log('[CERT] author_image:', cert.author_image, '→', authorImg, 'baseUrl:', baseUrl);
    const initials = (cert.author_name || 'IN').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
    const hasRating = cert.admin_rating != null && cert.admin_rating !== '';
    const judgeStars = hasRating ? Math.round(Number(cert.admin_rating)) : 0;
    const starsHtml = Array.from({ length: 5 }, (_, i) =>
      `<span style="font-size:22px;color:${hasRating ? (i < judgeStars ? '#f59e0b' : '#d1d5db') : '#e2e0dc'};">${hasRating ? (i < judgeStars ? '&#9733;' : '&#9734;') : '&#9734;'}</span>`
    ).join('');
    const judgeText = hasRating ? 'Judge Rating: ' + cert.admin_rating + ' / 5' : 'Pending Evaluation';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Certificate — ${cert.title || 'MEIH'}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700&family=Cormorant+Garamond:wght@300;400;500;600;700&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Inter',sans-serif;background:#e8e4df;color:#1a1a2e;display:flex;justify-content:center;align-items:center;min-height:100vh;padding:30px}
  .cert-wrapper{width:100%;max-width:820px}
  .cert{width:100%;background:#ffffff;border-radius:4px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.12),0 1px 4px rgba(0,0,0,0.06);position:relative;padding:0}
  .cert-border{position:relative;margin:12px;border:2px solid #1a3a5c;padding:6px}
  .cert-border-inner{border:1px solid #c9a84c;padding:28px 40px;position:relative}
  .cert-corner{position:absolute;width:40px;height:40px;border-color:#c9a84c}
  .cert-corner.tl{top:-1px;left:-1px;border-top:3px solid #c9a84c;border-left:3px solid #c9a84c}
  .cert-corner.tr{top:-1px;right:-1px;border-top:3px solid #c9a84c;border-right:3px solid #c9a84c}
  .cert-corner.bl{bottom:-1px;left:-1px;border-bottom:3px solid #c9a84c;border-left:3px solid #c9a84c}
  .cert-corner.br{bottom:-1px;right:-1px;border-bottom:3px solid #c9a84c;border-right:3px solid #c9a84c}
  .cert-header{text-align:center;padding-bottom:24px;border-bottom:1px solid #e2e0dc;position:relative}
  .cert-org{font-family:'Inter',sans-serif;font-size:11px;font-weight:600;letter-spacing:0.3em;text-transform:uppercase;color:#1a3a5c;margin-bottom:4px}
  .cert-dept{font-family:'Inter',sans-serif;font-size:9px;font-weight:500;letter-spacing:0.2em;text-transform:uppercase;color:#8a8580;margin-bottom:20px}
  .cert-title{font-family:'Playfair Display',serif;font-size:34px;font-weight:700;color:#1a3a5c;letter-spacing:0.01em;line-height:1.15;margin-bottom:6px}
  .cert-ornament{display:flex;align-items:center;justify-content:center;gap:12px;margin:16px 0}
  .cert-ornament .line{flex:1;max-width:80px;height:1px;background:linear-gradient(90deg,transparent,#c9a84c,transparent)}
  .cert-ornament .diamond{width:8px;height:8px;background:#c9a84c;transform:rotate(45deg);flex-shrink:0}
  .cert-avatar{width:80px;height:80px;border-radius:50%;margin:0 auto 16px;border:3px solid #c9a84c;object-fit:cover;background:#f0ece6;display:flex;align-items:center;justify-content:center;overflow:hidden}
  .cert-avatar img{width:100%;height:100%;object-fit:cover}
  .cert-avatar .initials{font-family:'Playfair Display',serif;font-size:28px;font-weight:700;color:#1a3a5c;line-height:80px;text-align:center}
  .cert-body{text-align:center;padding:28px 0}
  .cert-intro{font-family:'Cormorant Garamond',serif;font-size:14px;font-style:italic;color:#6b6560;margin-bottom:12px;letter-spacing:0.02em}
  .cert-author{font-family:'Playfair Display',serif;font-size:30px;font-weight:700;color:#1a3a5c;margin:4px 0 16px;position:relative;display:inline-block}
  .cert-author::after{content:'';display:block;width:60%;height:2px;background:linear-gradient(90deg,transparent,#c9a84c,transparent);margin:6px auto 0}
  .cert-desc{font-family:'Cormorant Garamond',serif;font-size:14px;color:#5a5550;line-height:1.7;max-width:520px;margin:0 auto 24px}
  .cert-desc strong{color:#1a3a5c;font-weight:600}
  .cert-details{display:grid;grid-template-columns:1fr 1fr;gap:14px 32px;text-align:left;margin:20px 0;padding:20px 24px;background:#fafaf8;border:1px solid #ece9e4;border-radius:4px}
  .cert-field label{font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;color:#8a8580;display:block;margin-bottom:3px;font-family:'Inter',sans-serif}
  .cert-field .value{font-size:13px;font-weight:600;color:#1a1a2e;font-family:'Inter',sans-serif}
  .cert-rating-badge{display:inline-flex;align-items:center;gap:8px;padding:10px 28px;background:${ratingBg};border:1px solid ${ratingColor}33;border-radius:4px;margin:16px 0 8px}
  .cert-rating-badge .label{font-family:'Inter',sans-serif;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${ratingColor}}
  .cert-score-row{display:flex;align-items:center;justify-content:center;gap:28px;margin:16px 0}
  .cert-score-box{text-align:center}
  .cert-score-num{font-family:'Playfair Display',serif;font-size:36px;font-weight:700;color:#1a3a5c;line-height:1}
  .cert-score-label{font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;color:#8a8580;margin-top:4px;font-family:'Inter',sans-serif}
  .cert-judge{text-align:center}
  .cert-judge .stars{font-size:22px;line-height:1;letter-spacing:2px;margin-bottom:4px}
  .cert-judge .judge-label{font-size:10px;color:${hasRating ? '#8a8580' : '#b0aaa3'};font-family:'Inter',sans-serif;letter-spacing:0.05em;font-style:${hasRating ? 'normal' : 'italic'}}
  .cert-divider-vert{width:1px;height:44px;background:#e2e0dc;flex-shrink:0}
  .cert-footer{border-top:1px solid #e2e0dc;padding-top:24px;margin-top:8px}
  .cert-sigs{display:flex;justify-content:space-between;align-items:flex-end;padding:0 20px;margin-bottom:16px}
  .cert-sig{text-align:center;min-width:140px}
  .cert-sig .line{width:140px;height:1px;background:#1a3a5c;margin:0 auto 6px}
  .cert-sig .name{font-family:'Inter',sans-serif;font-size:11px;font-weight:600;color:#1a1a2e}
  .cert-sig .role{font-family:'Inter',sans-serif;font-size:9px;color:#8a8580;margin-top:1px}
  .cert-id{font-family:'Inter',sans-serif;font-size:9px;font-weight:500;letter-spacing:0.08em;color:#b0aaa3;text-align:center;margin-top:16px}
  .cert-seal{position:absolute;bottom:40px;right:40px;width:72px;height:72px;border:2px solid #c9a84c;border-radius:50%;display:flex;align-items:center;justify-content:center;opacity:0.25}
  .cert-seal .inner{width:56px;height:56px;border:1px solid #c9a84c;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-size:11px;font-weight:700;color:#c9a84c;text-transform:uppercase;letter-spacing:0.05em;text-align:center;line-height:1.2}
  .print-btn{display:block;margin:20px auto 0;padding:11px 32px;background:#1a3a5c;color:#fff;border:none;border-radius:4px;font-family:'Inter',sans-serif;font-size:13px;font-weight:600;cursor:pointer;letter-spacing:0.04em;transition:background 0.2s}
  .print-btn:hover{background:#264a6c}
  @media print{body{background:#fff;padding:0;margin:0}.cert-wrapper{max-width:100%}.cert{box-shadow:none}.print-btn{display:none!important}.cert,.cert-border,.cert-border-inner,.cert-header,.cert-body,.cert-footer,.cert-details,.cert-rating-badge,.cert-seal{-webkit-print-color-adjust:exact;print-color-adjust:exact;color-adjust:exact}}
</style>
</head>
<body>
<div class="cert-wrapper">
<div class="cert">
  <div class="cert-border">
    <div class="cert-border-inner">
      <div class="cert-corner tl"></div><div class="cert-corner tr"></div>
      <div class="cert-corner bl"></div><div class="cert-corner br"></div>
      <div class="cert-header">
        <div class="cert-org">MOFATE</div>
        <div class="cert-dept">Mobile Facilitation Team &mdash; Innovation Hub</div>
        <div class="cert-title">Certificate of Achievement</div>
        <div class="cert-ornament"><div class="line"></div><div class="diamond"></div><div class="line"></div></div>
      </div>
      <div class="cert-body">
        ${authorImg ? `<div class="cert-avatar"><img src="${authorImg}" alt="${cert.author_name || ''}" onerror="this.parentElement.innerHTML='<div class=initials>${initials}</div>'" /></div>` : `<div class="cert-avatar"><div class="initials">${initials}</div></div>`}
        <div class="cert-intro">This is proudly presented to</div>
        <div class="cert-author">${cert.author_name || 'Innovator'}</div>
        <div class="cert-desc">
          in recognition of successfully showcasing the innovation
          <strong>&ldquo;${cert.title || 'Untitled'}&rdquo;</strong>
          ${cert.competition_title ? ' in the <strong>' + cert.competition_title + '</strong> competition' : ''}
          ${cert.category ? ' under the <strong>' + cert.category + '</strong> category' : ''}.
        </div>
        <div class="cert-details">
          <div class="cert-field"><label>Innovation Title</label><div class="value">${cert.title || '—'}</div></div>
          <div class="cert-field"><label>Category</label><div class="value">${cert.category || '—'}</div></div>
          <div class="cert-field"><label>Competition</label><div class="value">${cert.competition_title || '—'}</div></div>
          <div class="cert-field"><label>Date of Issue</label><div class="value">${issueDate}</div></div>
        </div>
        <div class="cert-rating-badge"><span class="label">${rating} Innovation</span></div>
        <div class="cert-score-row">
          <div class="cert-score-box">
            <div class="cert-score-num">${avgScore}</div>
            <div class="cert-score-label">Overall Score / 10</div>
          </div>
          <div class="cert-divider-vert"></div>
          <div class="cert-score-box">
            <div class="cert-judge">
              <div class="stars">${starsHtml}</div>
              <div class="judge-label">${judgeText}</div>
            </div>
          </div>
        </div>
        <div style="font-size:11px;color:#8a8580;margin-top:6px;font-style:italic">${ratingLabel}</div>
      </div>
      <div class="cert-footer">
        <div class="cert-sigs">
          <div class="cert-sig">
            <div class="line"></div>
            <div class="name">Innovation Director</div>
            <div class="role">MOFATE</div>
          </div>
          <div class="cert-sig">
            <div class="line"></div>
            <div class="name">Chief Judge</div>
            <div class="role">Innovation Hub</div>
          </div>
        </div>
        <div class="cert-seal"><div class="inner">MOFATE<br/>Seal</div></div>
        <div class="cert-id">Certificate No. MEIH-${cert.id.substring(0, 8).toUpperCase()} &nbsp;&bull;&nbsp; Issued by MOFATE &mdash; Mobile Facilitation Team</div>
      </div>
    </div>
  </div>
</div>
<button class="print-btn" onclick="window.print()">&#128438; Print Certificate</button>
</div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (err) { next(err); }
};

exports.getCertificatePDF = async (req, res, next) => {
  try {
    const PDFDocument = require('pdfkit');
    const https = require('https');
    const http = require('http');
    const cert = await innovationService.getCertificateData(req.params.id);
    if (!cert) return res.status(404).send('Submission not found');
    if (cert.status !== 'approved') return res.status(400).send('Certificate only available for approved innovations');

    const scores = [cert.innovation_score, cert.impact_score, cert.feasibility_score, cert.scalability_score, cert.sustainability_score, cert.technology_score, cert.business_model_score, cert.social_impact_score, cert.market_readiness_score, cert.presentation_score].filter(s => s != null);
    const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + Number(b), 0) / scores.length).toFixed(1) : 'N/A';
    const avgNum = scores.length > 0 ? parseFloat(avgScore) : 0;

    let rating, ratingHex, ratingLabel;
    if (avgNum >= 9) { rating = 'PLATINUM'; ratingHex = '#1a7a5a'; ratingLabel = 'Exceptional Innovation'; }
    else if (avgNum >= 7) { rating = 'GOLD'; ratingHex = '#b8860b'; ratingLabel = 'Outstanding Innovation'; }
    else if (avgNum >= 5) { rating = 'SILVER'; ratingHex = '#546e7a'; ratingLabel = 'Excellent Innovation'; }
    else if (avgNum >= 3) { rating = 'BRONZE'; ratingHex = '#bf360c'; ratingLabel = 'Notable Innovation'; }
    else { rating = 'PARTICIPANT'; ratingHex = '#37474f'; ratingLabel = 'Innovation Showcase Participant'; }

    const issueDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const baseUrl = req.protocol + '://' + req.get('host');
    const navy = '#1a3a5c';
    const gold = '#c9a84c';
    const gray = '#6b6560';
    const lightGray = '#b0aaa3';
    const bg = '#ffffff';
    const hasRating = cert.admin_rating != null && cert.admin_rating !== '';

    function fetchImage(url) {
      return new Promise((resolve, reject) => {
        if (!url) return resolve(null);
        const fullUrl = url.startsWith('http') ? url : baseUrl + url;
        const client = fullUrl.startsWith('https') ? https : http;
        client.get(fullUrl, (response) => {
          if (response.statusCode === 301 || response.statusCode === 302) {
            return fetchImage(response.headers.location).then(resolve).catch(reject);
          }
          const chunks = [];
          response.on('data', chunk => chunks.push(chunk));
          response.on('end', () => resolve(Buffer.concat(chunks)));
          response.on('error', reject);
        }).on('error', reject);
      });
    }

    let authorImage = null;
    try {
      authorImage = await fetchImage(cert.author_image);
    } catch (e) { /* image not available */ }

    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {
      const buf = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="certificate-' + req.params.id.substring(0, 8) + '.pdf"');
      res.send(buf);
    });

    const pageW = doc.page.width;
    const pageH = doc.page.height;

    doc.rect(0, 0, pageW, pageH).fill(bg);

    doc.rect(14, 14, pageW - 28, pageH - 28).lineWidth(2).strokeColor(navy).stroke();
    doc.rect(20, 20, pageW - 40, pageH - 40).lineWidth(0.5).strokeColor(gold).stroke();

    const cornerLen = 30;
    [
      [20, 20, cornerLen, 0, 0, cornerLen],
      [pageW - 20, 20, -cornerLen, 0, 0, cornerLen],
      [20, pageH - 20, cornerLen, 0, 0, -cornerLen],
      [pageW - 20, pageH - 20, -cornerLen, 0, 0, -cornerLen],
    ].forEach(([x, y, dx1, dy1, dx2, dy2]) => {
      doc.moveTo(x, y).lineTo(x + dx1, y + dy1).lineWidth(2.5).strokeColor(gold).stroke();
      doc.moveTo(x, y).lineTo(x + dx2, y + dy2).lineWidth(2.5).strokeColor(gold).stroke();
    });

    let topY = 40;

    doc.fontSize(9).font('Helvetica').fillColor(navy)
      .text('MOFATE', 0, topY, { align: 'center', width: pageW, letterSpacing: 4 });
    topY += 14;
    doc.fontSize(7).font('Helvetica').fillColor(lightGray)
      .text('MOBILE FACILITATION TEAM  \u2014  INNOVATION HUB', 0, topY, { align: 'center', width: pageW, letterSpacing: 2 });
    topY += 22;

    doc.fontSize(26).font('Helvetica-Bold').fillColor(navy)
      .text('Certificate of Achievement', 0, topY, { align: 'center', width: pageW });
    topY += 36;

    const lineW = 60;
    doc.moveTo(pageW / 2 - lineW, topY).lineTo(pageW / 2 + lineW, topY).lineWidth(0.5).strokeColor(gold).stroke();
    topY += 14;

    doc.fontSize(10).font('Helvetica').fillColor(gray)
      .text('This is proudly presented to', 0, topY, { align: 'center', width: pageW });
    topY += 18;

    if (authorImage) {
      try {
        const imgSize = 50;
        doc.saveClip();
        doc.circle(pageW / 2, topY + imgSize / 2, imgSize / 2).clip();
        doc.image(authorImage, pageW / 2 - imgSize / 2, topY, { width: imgSize, height: imgSize });
        doc.restoreClip();
        doc.circle(pageW / 2, topY + imgSize / 2, imgSize / 2 + 1.5).lineWidth(1.5).strokeColor(gold).stroke();
        topY += imgSize + 10;
      } catch (e) {
        const initials = (cert.author_name || 'IN').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
        doc.circle(pageW / 2, topY + 25, 25).lineWidth(1.5).fillAndStroke('#f0ece6', gold);
        doc.fontSize(14).font('Helvetica-Bold').fillColor(navy)
          .text(initials, pageW / 2 - 25, topY + 16, { width: 50, align: 'center' });
        topY += 60;
      }
    } else {
      const initials = (cert.author_name || 'IN').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
      doc.circle(pageW / 2, topY + 25, 25).lineWidth(1.5).fillAndStroke('#f0ece6', gold);
      doc.fontSize(14).font('Helvetica-Bold').fillColor(navy)
        .text(initials, pageW / 2 - 25, topY + 16, { width: 50, align: 'center' });
      topY += 60;
    }

    const authorFontSize = Math.min(22, Math.max(14, 220 / (cert.author_name || 'A').length));
    doc.fontSize(authorFontSize).font('Helvetica-Bold').fillColor(navy)
      .text(cert.author_name || 'Innovator', 0, topY, { align: 'center', width: pageW });
    topY += authorFontSize + 8;

    doc.moveTo(pageW / 2 - 40, topY).lineTo(pageW / 2 + 40, topY).lineWidth(0.5).strokeColor(gold).stroke();
    topY += 12;

    const descText = 'in recognition of successfully showcasing the innovation "' +
      (cert.title || 'Untitled') + '"' +
      (cert.competition_title ? ' in the ' + cert.competition_title + ' competition' : '') +
      (cert.category ? ' under the ' + cert.category + ' category' : '') + '.';
    doc.fontSize(9).font('Helvetica').fillColor(gray)
      .text(descText, pageW / 2 - 220, topY, { align: 'center', width: 440 });
    topY += 38;

    const detailY = topY;
    const leftX = pageW / 2 - 180;
    const rightX = pageW / 2 + 40;

    function drawDetail(x, y, label, value) {
      doc.fontSize(7).font('Helvetica').fillColor(lightGray).text(label.toUpperCase(), x, y, { width: 160 });
      doc.fontSize(10).font('Helvetica-Bold').fillColor(navy).text(value || '\u2014', x, y + 11, { width: 160 });
    }
    drawDetail(leftX, detailY, 'Innovation Title', cert.title);
    drawDetail(rightX, detailY, 'Category', cert.category);
    drawDetail(leftX, detailY + 32, 'Competition', cert.competition_title);
    drawDetail(rightX, detailY + 32, 'Date of Issue', issueDate);

    topY = detailY + 76;

    doc.moveTo(pageW / 2 - 160, topY).lineTo(pageW / 2 + 160, topY).lineWidth(0.5).strokeColor(gold).stroke();
    topY += 12;

    doc.roundedRect(pageW / 2 - 55, topY, 110, 24, 3).fill(navy);
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#ffffff')
      .text(rating.toUpperCase() + ' INNOVATION', pageW / 2 - 55, topY + 7, { align: 'center', width: 110 });

    topY += 34;

    doc.fontSize(26).font('Helvetica-Bold').fillColor(navy)
      .text(avgScore, pageW / 2 - 30, topY, { align: 'left', width: 60 });
    doc.fontSize(8).font('Helvetica').fillColor(gray)
      .text('/ 10', pageW / 2 + 20, topY + 14, { align: 'left', width: 30 });

    const judgeRating = hasRating ? cert.admin_rating : null;
    const starCount = hasRating ? Math.round(Number(judgeRating)) || 0 : 0;

    let starStr = '';
    for (let i = 0; i < 5; i++) {
      if (hasRating) starStr += i < starCount ? '\u2605 ' : '\u2606 ';
      else starStr += '\u2014 ';
    }

    if (hasRating) {
      doc.fontSize(8).font('Helvetica').fillColor(gray)
        .text('Judge Rating: ' + judgeRating + ' / 5', pageW / 2 - 140, topY + 18, { width: 280, align: 'center' });
      doc.fontSize(10).fillColor(gold)
        .text(starStr.trim(), pageW / 2 - 140, topY + 30, { width: 280, align: 'center' });
    } else {
      doc.fontSize(8).font('Helvetica').fillColor(lightGray)
        .text('Pending Evaluation', pageW / 2 - 140, topY + 24, { width: 280, align: 'center' });
    }

    topY += 52;

    doc.fontSize(7).font('Helvetica-Oblique').fillColor(gray)
      .text(ratingLabel, 0, topY, { align: 'center', width: pageW });

    const footerY = pageH - 60;

    const sigLeftX = pageW / 2 - 200;
    const sigRightX = pageW / 2 + 80;
    doc.moveTo(sigLeftX, footerY).lineTo(sigLeftX + 120, footerY).lineWidth(0.5).strokeColor(navy).stroke();
    doc.moveTo(sigRightX, footerY).lineTo(sigRightX + 120, footerY).lineWidth(0.5).strokeColor(navy).stroke();

    doc.fontSize(7).font('Helvetica-Bold').fillColor(navy)
      .text('Innovation Director', sigLeftX, footerY + 4, { width: 120, align: 'center' });
    doc.fontSize(6).font('Helvetica').fillColor(lightGray)
      .text('MOFATE', sigLeftX, footerY + 14, { width: 120, align: 'center' });

    doc.fontSize(7).font('Helvetica-Bold').fillColor(navy)
      .text('Chief Judge', sigRightX, footerY + 4, { width: 120, align: 'center' });
    doc.fontSize(6).font('Helvetica').fillColor(lightGray)
      .text('Innovation Hub', sigRightX, footerY + 14, { width: 120, align: 'center' });

    doc.circle(pageW - 60, footerY - 12, 26).lineWidth(0.8).strokeColor(gold).stroke();
    doc.circle(pageW - 60, footerY - 12, 20).lineWidth(0.4).strokeColor(gold).stroke();
    doc.fontSize(5).font('Helvetica-Bold').fillColor(gold)
      .text('MOFATE', pageW - 60 - 14, footerY - 18, { width: 28, align: 'center' });
    doc.fontSize(4).font('Helvetica').fillColor(gold)
      .text('SEAL', pageW - 60 - 14, footerY - 8, { width: 28, align: 'center' });

    doc.fontSize(6).font('Helvetica').fillColor(lightGray)
      .text('Certificate No. MEIH-' + cert.id.substring(0, 8).toUpperCase() + '  \u2022  Issued by MOFATE \u2014 Mobile Facilitation Team  \u2022  ' + issueDate, 0, pageH - 28, { align: 'center', width: pageW });

    doc.end();
  } catch (err) { next(err); }
};
