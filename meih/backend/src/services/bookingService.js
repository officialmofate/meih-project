const db = require('../config/database');

exports.create = async (userId, role, payload) => {
  if (!payload.eventId) {
    throw Object.assign(new Error('Event ID is required'), { status: 400 });
  }

  const { rows: events } = await db.query(
    `SELECT id, client_id, status, confirmation_status FROM events WHERE id = $1`,
    [payload.eventId]
  );
  if (!events[0]) {
    throw Object.assign(new Error('Event not found'), { status: 404 });
  }
  if (events[0].client_id === userId) {
    throw Object.assign(new Error('You cannot book your own event'), { status: 400 });
  }
  const ev = events[0];
  if (ev.status !== 'published' || ev.confirmation_status !== 'confirmed') {
    throw Object.assign(new Error('Event is not available for booking'), { status: 400 });
  }

  let clientId = null;
  let vendorId = null;
  let plannerId = null;

  if (role === 'vendor') {
    const { rows: vendorRows } = await db.query(
      `SELECT id FROM vendors WHERE user_id = $1`, [userId]
    );
    if (vendorRows[0]) vendorId = vendorRows[0].id;
  }

  const { rows } = await db.query(
    `INSERT INTO bookings (client_id, event_id, vendor_id, planner_id, deposit_amount, client_name, client_phone, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
     RETURNING *`,
    [clientId, payload.eventId, vendorId || payload.vendorId || null,
     payload.plannerId || null, payload.depositAmount || 0,
     payload.clientName || null, payload.clientPhone || null]
  );
  return rows[0];
};

exports.findById = async (id) => {
  const { rows } = await db.query(
    `SELECT b.*, e.name AS event_name, e.location AS event_location,
            v.business_name AS vendor_name, p.company_name AS planner_name,
            u.full_name AS client_name
     FROM bookings b
     LEFT JOIN events e ON e.id = b.event_id
     LEFT JOIN vendors v ON v.id = b.vendor_id
     LEFT JOIN planners p ON p.id = b.planner_id
     LEFT JOIN users u ON u.id = b.client_id
     WHERE b.id = $1`,
    [id]
  );
  return rows[0];
};

exports.list = async (userId, role, { page = 1, limit = 50 } = {}) => {
  const offset = (page - 1) * limit;
  let query;
  const params = [limit, offset];

  if (role === 'admin') {
    query = `SELECT b.*, e.name AS event_name, v.business_name AS vendor_name,
                    p.company_name AS planner_name
             FROM bookings b
             LEFT JOIN events e ON e.id = b.event_id
             LEFT JOIN vendors v ON v.id = b.vendor_id
             LEFT JOIN planners p ON p.id = b.planner_id
             ORDER BY b.created_at DESC
             LIMIT $1 OFFSET $2`;
  } else if (role === 'vendor') {
    query = `SELECT b.*, e.name AS event_name
             FROM bookings b
             LEFT JOIN events e ON e.id = b.event_id
             LEFT JOIN vendors v ON v.id = b.vendor_id
             WHERE v.user_id = $3
             ORDER BY b.created_at DESC
             LIMIT $1 OFFSET $2`;
    params.splice(2, 0, userId);
  } else if (role === 'planner') {
    query = `SELECT b.*, e.name AS event_name, e.event_date, e.guest_count, e.location AS event_location, u.full_name AS client_name
             FROM bookings b
             LEFT JOIN events e ON e.id = b.event_id
             LEFT JOIN planners p ON p.id = b.planner_id
             LEFT JOIN users u ON u.id = b.client_id
             WHERE p.user_id = $3
             ORDER BY b.created_at DESC
             LIMIT $1 OFFSET $2`;
    params.splice(2, 0, userId);
  } else {
    query = `SELECT b.*, e.name AS event_name, v.business_name AS vendor_name,
                    p.company_name AS planner_name
             FROM bookings b
             LEFT JOIN events e ON e.id = b.event_id
             LEFT JOIN vendors v ON v.id = b.vendor_id
             LEFT JOIN planners p ON p.id = b.planner_id
             WHERE b.client_id = $3
             ORDER BY b.created_at DESC
             LIMIT $1 OFFSET $2`;
    params.splice(2, 0, userId);
  }

  const { rows } = await db.query(query, params);
  return rows;
};

exports.update = async (id, userId, payload) => {
  const { rows } = await db.query(
    `UPDATE bookings SET
       deposit_amount = COALESCE($3, deposit_amount),
       updated_at = now()
     WHERE id = $1 AND client_id = $2
     RETURNING *`,
    [id, userId, payload.depositAmount]
  );
  return rows[0];
};

exports.confirm = async (id, userId, role) => {
  if (role === 'planner') {
    const { rows } = await db.query(
      `UPDATE bookings SET status = 'confirmed', updated_at = now()
       WHERE id = $1 AND status = 'pending'
       AND planner_id IN (SELECT id FROM planners WHERE user_id = $2)
       RETURNING *`,
      [id, userId]
    );
    return rows[0];
  }
  const { rows } = await db.query(
    `UPDATE bookings SET status = 'confirmed', updated_at = now()
     WHERE id = $1 AND status = 'pending'
     RETURNING *`,
    [id]
  );
  return rows[0];
};

exports.cancel = async (id) => {
  const { rows } = await db.query(
    `UPDATE bookings SET status = 'cancelled', updated_at = now()
     WHERE id = $1 AND status IN ('pending', 'confirmed')
     RETURNING *`,
    [id]
  );
  return rows[0];
};

exports.setDeposit = async (id, plannerUserId, amount) => {
  const { rows } = await db.query(
    `UPDATE bookings SET deposit_amount = $3, updated_at = now()
     WHERE id = $1 AND planner_id IN (SELECT id FROM planners WHERE user_id = $2)
     RETURNING *`,
    [id, plannerUserId, amount]
  );
  return rows[0];
};

exports.getInvoice = async (id) => {
  const { rows } = await db.query(
    `SELECT b.*, e.name AS event_name, e.location AS event_location, e.event_date,
            v.business_name AS vendor_name, p.company_name AS planner_name,
            u.full_name AS client_name, u.email AS client_email,
            pay.amount AS payment_amount, pay.method AS payment_method,
            pay.status AS payment_status, pay.reference AS payment_reference
     FROM bookings b
     LEFT JOIN events e ON e.id = b.event_id
     LEFT JOIN vendors v ON v.id = b.vendor_id
     LEFT JOIN planners p ON p.id = b.planner_id
     LEFT JOIN users u ON u.id = b.client_id
     LEFT JOIN payments pay ON pay.booking_id = b.id
     WHERE b.id = $1`,
    [id]
  );
  return rows[0];
};

exports.getTicketData = async (id) => {
  const { rows } = await db.query(
    `SELECT b.*, e.name AS event_name, e.location AS event_location,
            e.event_date, e.category_id, e.budget, e.guest_count,
            v.business_name AS vendor_name, p.company_name AS planner_name,
            u.full_name AS client_name, u.email AS client_email
     FROM bookings b
     LEFT JOIN events e ON e.id = b.event_id
     LEFT JOIN vendors v ON v.id = b.vendor_id
     LEFT JOIN planners p ON p.id = b.planner_id
     LEFT JOIN users u ON u.id = b.client_id
     WHERE b.id = $1`,
    [id]
  );
  return rows[0];
};

exports.generateTicketPDF = async (id) => {
  const PDFDocument = require('pdfkit');
  const https = require('https');
  const http = require('http');

  const ticket = await exports.getTicketData(id);
  if (!ticket) return null;
  if (ticket.status !== 'confirmed') return null;

  const eventDate = ticket.event_date
    ? new Date(ticket.event_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : 'To Be Determined';

  const qrData = JSON.stringify({
    ticketId: ticket.id,
    event: ticket.event_name,
    client: ticket.client_name,
    date: ticket.event_date,
    location: ticket.event_location,
    platform: 'MEIH - MOFATE Event & Innovation Hub'
  });
  const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(qrData);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const purple = '#6c5ce7';
    const dark = '#1a1a2e';
    const gray = '#636e72';
    const lightGray = '#dfe6e9';

    doc.rect(0, 0, doc.page.width, 160).fill(purple);
    doc.fillColor('#ffffff').fontSize(12).font('Helvetica')
      .text('MOFATE EVENT & INNOVATION HUB', 50, 40, { align: 'center' });
    doc.fontSize(26).font('Helvetica-Bold')
      .text(ticket.event_name || 'Event', 50, 65, { align: 'center', width: doc.page.width - 100 });
    doc.fontSize(11).font('Helvetica')
      .text('YOUR EVENT TICKET', 50, 120, { align: 'center', letterSpacing: 3 });

    doc.fillColor(dark);

    const startY = 190;
    const leftCol = 70;
    const rightCol = 310;

    function drawField(x, y, label, value) {
      doc.fontSize(9).font('Helvetica').fillColor(gray).text(label.toUpperCase(), x, y, { width: 200 });
      doc.fontSize(13).font('Helvetica-Bold').fillColor(dark).text(value || '—', x, y + 16, { width: 200 });
    }

    drawField(leftCol, startY, 'Attendee', ticket.client_name || 'Guest');
    drawField(rightCol, startY, 'Event Date', eventDate);
    drawField(leftCol, startY + 60, 'Location', ticket.event_location || 'TBD');
    drawField(rightCol, startY + 60, 'Guests', ticket.guest_count ? String(ticket.guest_count) : '—');
    drawField(leftCol, startY + 120, 'Planner', ticket.planner_name || '—');
    drawField(rightCol, startY + 120, 'Budget', ticket.budget ? 'Tsh ' + Number(ticket.budget).toLocaleString() : '—');

    doc.moveTo(50, startY + 180).lineTo(doc.page.width - 50, startY + 180).lineWidth(1).dash(5, { space: 5 }).strokeColor(lightGray).stroke();

    doc.fontSize(9).font('Helvetica').fillColor(gray)
      .text('SCAN TO VERIFY TICKET', 50, startY + 195, { align: 'center', width: doc.page.width - 100 });

    const fetchQR = (url) => {
      return new Promise((res, rej) => {
        const client = url.startsWith('https') ? https : http;
        client.get(url, { timeout: 10000 }, (resp) => {
          if (resp.statusCode >= 300 && resp.statusCode < 400 && resp.headers.location) {
            return fetchQR(resp.headers.location).then(res).catch(rej);
          }
          const chunks = [];
          resp.on('data', c => chunks.push(c));
          resp.on('end', () => res(Buffer.concat(chunks)));
          resp.on('error', rej);
        }).on('error', rej);
      });
    };

    fetchQR(qrUrl).then(qrBuf => {
      doc.image(qrBuf, (doc.page.width - 150) / 2, startY + 210, { width: 150, height: 150 });

      doc.fontSize(8).font('Helvetica').fillColor(gray)
        .text('TICKET #' + ticket.id.substring(0, 8).toUpperCase(), 50, doc.page.height - 100, { align: 'center', width: doc.page.width - 100 });
      doc.fontSize(7).fillColor('#b2bec3')
        .text('This ticket is issued by MEIH — MOFATE Event & Innovation Hub. Present at event entrance. Non-transferable.', 50, doc.page.height - 85, { align: 'center', width: doc.page.width - 100 });

      doc.end();
    }).catch(() => {
      doc.fontSize(8).font('Helvetica').fillColor(gray)
        .text('TICKET #' + ticket.id.substring(0, 8).toUpperCase(), 50, doc.page.height - 100, { align: 'center', width: doc.page.width - 100 });
      doc.end();
    });
  });
};
