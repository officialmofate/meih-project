const bookingService = require('../services/bookingService');
const emailNotification = require('../services/emailNotificationService');

exports.create = async (req, res, next) => {
  try {
    const booking = await bookingService.create(req.user.id, req.user.role, req.body);
    res.status(201).json(booking);
  } catch (err) { next(err); }
};

exports.list = async (req, res, next) => {
  try {
    const bookings = await bookingService.list(req.user.id, req.user.role, req.query);
    res.json(bookings);
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const booking = await bookingService.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.json(booking);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const booking = await bookingService.update(req.params.id, req.user.id, req.body);
    if (!booking) return res.status(404).json({ message: 'Booking not found or unauthorized' });
    res.json(booking);
  } catch (err) { next(err); }
};

exports.confirm = async (req, res, next) => {
  try {
    const booking = await bookingService.confirm(req.params.id, req.user.id, req.user.role);
    if (!booking) return res.status(404).json({ message: 'Booking not found or already processed' });
    if (booking.client_id) {
      const fullBooking = await bookingService.findById(booking.id);
      emailNotification.onEventBookingConfirmed(booking.client_id, fullBooking?.event_name || 'Event').catch(() => {});
    }
    res.json(booking);
  } catch (err) { next(err); }
};

exports.cancel = async (req, res, next) => {
  try {
    const booking = await bookingService.cancel(req.params.id, req.user.id, req.user.role);
    if (!booking) return res.status(404).json({ message: 'Booking not found or already processed' });
    if (booking.client_id) {
      const fullBooking = await bookingService.findById(booking.id);
      emailNotification.onEventBookingCancelled(booking.client_id, fullBooking?.event_name || 'Event').catch(() => {});
    }
    res.json(booking);
  } catch (err) { next(err); }
};

exports.getInvoice = async (req, res, next) => {
  try {
    const invoice = await bookingService.getInvoice(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.json(invoice);
  } catch (err) { next(err); }
};

exports.setDeposit = async (req, res, next) => {
  try {
    const booking = await bookingService.setDeposit(req.params.id, req.user.id, req.body.amount);
    if (!booking) return res.status(404).json({ message: 'Booking not found or unauthorized' });
    res.json(booking);
  } catch (err) { next(err); }
};

exports.getTicket = async (req, res, next) => {
  try {
    const ticket = await bookingService.getTicketData(req.params.id);
    if (!ticket) return res.status(404).send('<h1>Ticket not found</h1>');

    const qrData = JSON.stringify({
      ticketId: ticket.id,
      event: ticket.event_name,
      client: ticket.client_name,
      date: ticket.event_date,
      location: ticket.event_location,
      platform: 'MEIH - MOFATE Event & Innovation Hub'
    });
    const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=' + encodeURIComponent(qrData);

    const eventDate = ticket.event_date
      ? new Date(ticket.event_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      : 'To Be Determined';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Event Ticket — ${ticket.event_name || 'MEIH'}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Inter',sans-serif; background:#1a1a2e; color:#fff; display:flex; justify-content:center; align-items:center; min-height:100vh; padding:20px; }
  .ticket { width:100%; max-width:640px; background:linear-gradient(145deg,#16213e,#0f3460); border-radius:20px; overflow:hidden; box-shadow:0 20px 60px rgba(0,0,0,0.4); }
  .ticket-header { background:linear-gradient(135deg,#0984e3,#74b9ff); padding:28px 32px; text-align:center; }
  .ticket-header h1 { font-size:13px; font-weight:600; letter-spacing:0.15em; text-transform:uppercase; opacity:0.85; }
  .ticket-header h2 { font-size:11px; font-weight:600; letter-spacing:0.12em; text-transform:uppercase; opacity:0.7; margin-top:4px; }
  .ticket-header .event-name { font-size:26px; font-weight:900; margin-top:6px; line-height:1.2; }
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
  .print-btn { display:inline-block; margin:24px auto 0; padding:10px 28px; background:linear-gradient(135deg,#0984e3,#74b9ff); color:#fff; border:none; border-radius:8px; font-size:14px; font-weight:600; cursor:pointer; }
  @media print { body { background:#fff; padding:0; margin:0; } .ticket { box-shadow:none; border:2px solid #0984e3; max-width:100%; } .print-btn { display:none !important; } .ticket-header, .ticket-footer, .ticket { -webkit-print-color-adjust:exact; print-color-adjust:exact; color-adjust:exact; } .qr-section img { border:1px solid #ccc; } }
</style>
</head>
<body>
<div class="ticket">
  <div class="ticket-header">
    <h1>MOFATE</h1>
    <h2>Event Hub Ticket</h2>
    <div class="event-name">${ticket.event_name || 'Event'}</div>
  </div>
  <div class="ticket-body">
    <div class="ticket-grid">
      <div class="ticket-field"><label>Attendee</label><div class="value">${ticket.client_name || 'Guest'}</div></div>
      <div class="ticket-field"><label>Event Date</label><div class="value">${eventDate}</div></div>
      <div class="ticket-field"><label>Location</label><div class="value">${ticket.event_location || 'TBD'}</div></div>
      <div class="ticket-field"><label>Guests</label><div class="value">${ticket.guest_count || '—'}</div></div>
      <div class="ticket-field"><label>Planner</label><div class="value">${ticket.planner_name || '—'}</div></div>
      <div class="ticket-field"><label>Status</label><div class="value" style="color:${ticket.status === 'confirmed' ? '#00b894' : '#fdcb6e'};">${(ticket.status || 'pending').toUpperCase()}</div></div>
    </div>
    <hr class="divider"/>
    <div class="qr-section">
      <img src="${qrUrl}" alt="Ticket QR Code" />
      <div class="qr-label">Scan to verify ticket</div>
    </div>
  </div>
  <div class="ticket-footer">
    <div class="ticket-barcode" id="barcode"></div>
    <div class="ticket-id">TICKET #${ticket.id.substring(0, 8).toUpperCase()}</div>
    <p>This ticket is issued by MOFATE — Mobile Facilitation Team.<br/>Present this ticket at the event entrance. Non-transferable.</p>
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
    const pdfBuf = await Promise.race([
      bookingService.generateTicketPDF(req.params.id),
      new Promise((_, reject) => setTimeout(() => reject(new Error('PDF generation timed out')), 30000))
    ]);
    if (!pdfBuf) {
      return res.status(404).send('Ticket not found');
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="ticket-' + req.params.id.substring(0, 8) + '.pdf"');
    res.send(pdfBuf);
  } catch (err) {
    if (err.message === 'PDF generation timed out') {
      return res.redirect('/api/v1/bookings/' + req.params.id + '/ticket?token=' + (req.query.token || ''));
    }
    next(err);
  }
};
