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

exports.assignJudge = async (req, res, next) => {
  try {
    const result = await innovationService.assignJudge(req.body.judgeId, req.body.competitionId);
    res.status(201).json(result);
  } catch (err) { next(err); }
};

exports.removeJudgeAssignment = async (req, res, next) => {
  try {
    const removed = await innovationService.removeJudgeAssignment(req.params.judgeId, req.params.competitionId);
    if (!removed) return res.status(404).json({ message: 'Assignment not found' });
    res.status(204).end();
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

    let rating, ratingColor, ratingLabel;
    if (avgNum >= 9) { rating = 'PLATINUM'; ratingColor = '#00b894'; ratingLabel = 'Exceptional Innovation'; }
    else if (avgNum >= 7) { rating = 'GOLD'; ratingColor = '#fdcb6e'; ratingLabel = 'Outstanding Innovation'; }
    else if (avgNum >= 5) { rating = 'SILVER'; ratingColor = '#b2bec3'; ratingLabel = 'Excellent Innovation'; }
    else if (avgNum >= 3) { rating = 'BRONZE'; ratingColor = '#e17055'; ratingLabel = 'Notable Innovation'; }
    else { rating = 'PARTICIPANT'; ratingColor = '#dfe6e9'; ratingLabel = 'Innovation Showcase Participant'; }

    const issueDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Certificate — ${cert.title || 'MEIH'}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Inter',sans-serif; background:#1a1a2e; color:#fff; display:flex; justify-content:center; align-items:center; min-height:100vh; padding:20px; }
  .cert { width:100%; max-width:740px; background:linear-gradient(145deg,#16213e,#0f3460); border-radius:20px; overflow:hidden; box-shadow:0 20px 60px rgba(0,0,0,0.4); }
  .cert-header { background:linear-gradient(135deg,#6c5ce7,#a855f7); padding:32px 32px 24px; text-align:center; }
  .cert-header h1 { font-size:11px; font-weight:700; letter-spacing:0.2em; text-transform:uppercase; opacity:0.8; }
  .cert-header h2 { font-size:10px; font-weight:600; letter-spacing:0.15em; text-transform:uppercase; opacity:0.6; margin-top:3px; }
  .cert-header .org-name { font-size:32px; font-weight:900; margin-top:8px; line-height:1.1; }
  .cert-body { padding:32px 40px; text-align:center; }
  .cert-subtitle { font-size:13px; text-transform:uppercase; letter-spacing:0.15em; color:rgba(255,255,255,0.5); margin-bottom:8px; }
  .cert-title { font-size:22px; font-weight:900; margin-bottom:4px; }
  .cert-name { font-size:28px; font-weight:900; color:${ratingColor}; margin:12px 0; }
  .cert-desc { font-size:13px; color:rgba(255,255,255,0.6); line-height:1.6; max-width:500px; margin:0 auto 20px; }
  .cert-details { display:grid; grid-template-columns:1fr 1fr; gap:16px; text-align:left; margin:20px 0; padding:20px; background:rgba(0,0,0,0.2); border-radius:12px; }
  .cert-field label { font-size:10px; font-weight:600; text-transform:uppercase; letter-spacing:0.08em; color:rgba(255,255,255,0.4); display:block; margin-bottom:2px; }
  .cert-field .value { font-size:14px; font-weight:600; color:#fff; }
  .cert-rating { display:inline-block; padding:8px 24px; background:${ratingColor}; color:#1a1a2e; border-radius:8px; font-size:13px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; margin:16px 0; }
  .cert-score { font-size:36px; font-weight:900; color:${ratingColor}; margin:8px 0; }
  .cert-divider { border:none; border-top:1px dashed rgba(255,255,255,0.15); margin:20px 0; }
  .cert-footer { background:rgba(0,0,0,0.2); padding:20px 32px; text-align:center; }
  .cert-footer p { font-size:11px; color:rgba(255,255,255,0.4); line-height:1.6; }
  .cert-id { font-family:monospace; font-size:12px; color:rgba(255,255,255,0.5); letter-spacing:0.05em; margin-top:6px; }
  .print-btn { display:inline-block; margin:20px auto 0; padding:10px 28px; background:linear-gradient(135deg,#6c5ce7,#a855f7); color:#fff; border:none; border-radius:8px; font-size:14px; font-weight:600; cursor:pointer; }
  @media print { body { background:#fff; padding:0; margin:0; } .cert { box-shadow:none; border:2px solid #6c5ce7; max-width:100%; } .print-btn { display:none !important; } .cert-header, .cert-footer, .cert { -webkit-print-color-adjust:exact; print-color-adjust:exact; color-adjust:exact; } }
</style>
</head>
<body>
<div class="cert">
  <div class="cert-header">
    <h1>MOFATE</h1>
    <h2>Mobile Facilitation Team</h2>
    <div class="org-name">Certificate of Achievement</div>
  </div>
  <div class="cert-body">
    <div class="cert-subtitle">This is to certify that</div>
    <div class="cert-name">${cert.author_name || 'Innovator'}</div>
    <div class="cert-desc">
      has successfully showcased the innovation <strong>"${cert.title || 'Untitled'}"</strong>
      ${cert.competition_title ? ' in the <strong>' + cert.competition_title + '</strong> competition' : ''}
      ${cert.category ? ' under the <strong>' + cert.category + '</strong> category' : ''}.
    </div>

    <div class="cert-details">
      <div class="cert-field"><label>Innovation Title</label><div class="value">${cert.title || '—'}</div></div>
      <div class="cert-field"><label>Category</label><div class="value">${cert.category || '—'}</div></div>
      <div class="cert-field"><label>Competition</label><div class="value">${cert.competition_title || '—'}</div></div>
      <div class="cert-field"><label>Issue Date</label><div class="value">${issueDate}</div></div>
    </div>

    <hr class="cert-divider" />

    <div class="cert-rating">${rating} Innovation</div>
    <div class="cert-score">${avgScore}</div>
    <div style="font-size:12px;color:rgba(255,255,255,0.5);margin-bottom:4px;">Overall Rating Score (out of 10)</div>
    <div style="font-size:13px;color:${ratingColor};font-weight:600;">${ratingLabel}</div>
  </div>
  <div class="cert-footer">
    <div class="cert-id">CERTIFICATE #${cert.id.substring(0, 8).toUpperCase()}</div>
    <p>This certificate is issued by MOFATE \u2014 Mobile Facilitation Team.<br/>Awarded at the Innovation Showcase ${cert.competition_title || ''}.</p>
    <button class="print-btn" onclick="window.print()">Print Certificate</button>
  </div>
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
    const cert = await innovationService.getCertificateData(req.params.id);
    if (!cert) return res.status(404).send('Submission not found');
    if (cert.status !== 'approved') return res.status(400).send('Certificate only available for approved innovations');

    const scores = [cert.innovation_score, cert.impact_score, cert.feasibility_score, cert.scalability_score, cert.sustainability_score, cert.technology_score, cert.business_model_score, cert.social_impact_score, cert.market_readiness_score, cert.presentation_score].filter(s => s != null);
    const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + Number(b), 0) / scores.length).toFixed(1) : 'N/A';
    const avgNum = scores.length > 0 ? parseFloat(avgScore) : 0;

    let rating, ratingHex;
    if (avgNum >= 9) { rating = 'PLATINUM'; ratingHex = '#00b894'; }
    else if (avgNum >= 7) { rating = 'GOLD'; ratingHex = '#fdcb6e'; }
    else if (avgNum >= 5) { rating = 'SILVER'; ratingHex = '#b2bec3'; }
    else if (avgNum >= 3) { rating = 'BRONZE'; ratingHex = '#e17055'; }
    else { rating = 'PARTICIPANT'; ratingHex = '#dfe6e9'; }

    const issueDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const purple = '#6c5ce7';
    const dark = '#1a1a2e';
    const gray = '#636e72';

    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 60 });
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

    doc.rect(0, 0, pageW, pageH).fill(dark);
    doc.rect(20, 20, pageW - 40, pageH - 40).lineWidth(2).strokeColor(purple).stroke();
    doc.rect(30, 30, pageW - 60, pageH - 60).lineWidth(1).strokeColor(purple).stroke();

    doc.fillColor('#ffffff').fontSize(10).font('Helvetica')
      .text('MOFATE', 60, 50, { align: 'center', width: pageW - 120 });
    doc.fontSize(8).font('Helvetica')
      .text('MOBILE FACILITATION TEAM', 60, 65, { align: 'center', width: pageW - 120 });

    doc.fontSize(28).font('Helvetica-Bold')
      .text('Certificate of Achievement', 60, 95, { align: 'center', width: pageW - 120 });

    doc.fontSize(10).font('Helvetica').fillColor(gray)
      .text('This is to certify that', 60, 145, { align: 'center', width: pageW - 120 });

    doc.fontSize(24).font('Helvetica-Bold').fillColor(ratingHex)
      .text(cert.author_name || 'Innovator', 60, 165, { align: 'center', width: pageW - 120 });

    doc.fontSize(10).font('Helvetica').fillColor('#dfe6e9')
      .text('has successfully showcased the innovation', 60, 200, { align: 'center', width: pageW - 120 });

    doc.fontSize(16).font('Helvetica-Bold').fillColor('#ffffff')
      .text('"' + (cert.title || 'Untitled') + '"', 60, 218, { align: 'center', width: pageW - 120 });

    doc.fontSize(10).font('Helvetica').fillColor(gray)
      .text((cert.competition_title || '') + (cert.category ? ' \u2022 ' + cert.category : ''), 60, 245, { align: 'center', width: pageW - 120 });

    doc.rect(pageW / 2 - 60, 280, 120, 40).fill(purple);
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#ffffff')
      .text(rating, pageW / 2 - 60, 290, { align: 'center', width: 120 });

    doc.fontSize(22).font('Helvetica-Bold').fillColor(ratingHex)
      .text(avgScore + ' / 10', 60, 340, { align: 'center', width: pageW - 120 });

    doc.fontSize(9).font('Helvetica').fillColor(gray)
      .text('Certificate #' + cert.id.substring(0, 8).toUpperCase() + ' \u2022 Issued ' + issueDate, 60, pageH - 80, { align: 'center', width: pageW - 120 });
    doc.fontSize(8).fillColor('#636e72')
      .text('Issued by MOFATE \u2014 Mobile Facilitation Team', 60, pageH - 60, { align: 'center', width: pageW - 120 });

    doc.end();
  } catch (err) { next(err); }
};
