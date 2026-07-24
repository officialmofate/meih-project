const db = require('../config/database');
const emailNotification = require('./emailNotificationService');

const INTERVAL_MS = parseInt(process.env.SCHEDULER_INTERVAL_MS || '300000', 10); // default 5 minutes
let timer = null;

async function closeExpiredCompetitions() {
  if (!db.isAvailable()) return;
  try {
    const { rows } = await db.query(
      `UPDATE innovation_competitions
       SET status = 'completed'
       WHERE status IN ('open', 'voting')
         AND closes_at IS NOT NULL
         AND closes_at < now()
       RETURNING id, title`
    );
    for (const comp of rows) {
      console.log(`[SCHEDULER] Competition "${comp.title}" (${comp.id}) auto-closed`);
      emailNotification.onCompetitionVotingClosed(comp.title).catch(() => {});
    }
    if (rows.length > 0) {
      console.log(`[SCHEDULER] Auto-closed ${rows.length} expired competition(s)`);
    }
  } catch (err) {
    console.error('[SCHEDULER] Error closing competitions:', err.message);
  }
}

async function autoCompletePastEvents() {
  if (!db.isAvailable()) return;
  try {
    const { rows } = await db.query(
      `UPDATE events
       SET status = 'completed', updated_at = now()
       WHERE status IN ('published', 'confirmed')
         AND event_date IS NOT NULL
         AND event_date < now() - interval '1 day'
       RETURNING id, name, client_id`
    );
    for (const ev of rows) {
      console.log(`[SCHEDULER] Event "${ev.name}" (${ev.id}) auto-completed`);
      if (ev.client_id) {
        emailNotification.onEventBookingConfirmed(ev.client_id, ev.name).catch(() => {});
      }
    }
    if (rows.length > 0) {
      console.log(`[SCHEDULER] Auto-completed ${rows.length} past event(s)`);
    }
  } catch (err) {
    console.error('[SCHEDULER] Error auto-completing events:', err.message);
  }
}

async function runAllJobs() {
  console.log('[SCHEDULER] Running scheduled jobs...');
  await closeExpiredCompetitions();
  await autoCompletePastEvents();
}

function start() {
  if (timer) return;
  console.log(`[SCHEDULER] Starting scheduler (interval: ${INTERVAL_MS}ms)`);
  timer = setInterval(runAllJobs, INTERVAL_MS);
  // Run once immediately on start (after a short delay to let DB initialize)
  setTimeout(runAllJobs, 10000);
}

function stop() {
  if (timer) {
    clearInterval(timer);
    timer = null;
    console.log('[SCHEDULER] Scheduler stopped');
  }
}

module.exports = { start, stop, runAllJobs };
