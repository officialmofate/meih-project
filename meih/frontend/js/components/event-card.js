export function eventCard(ev) {
  const name = ev.name || ev.title || 'Untitled Event';
  const category = ev.category_name || ev.category || '';
  const location = ev.location || '';
  const status = ev.status || '';
  const date = ev.event_date || ev.eventDate || '';
  const statusClass = status === 'completed' ? 'badge-success' : status === 'published' ? 'badge' : 'badge-muted';

  let userRole = '';
  try {
    const raw = localStorage.getItem('meih_user');
    if (raw) userRole = JSON.parse(raw).role || '';
  } catch {}
  const showBudget = userRole === 'planner' || userRole === 'admin' || userRole === 'superadmin';

  return `
    <div class="card event-card">
      <div class="event-card-header">
        <h3>${name}</h3>
        <span class="badge ${statusClass}">${status}</span>
      </div>
      <p class="event-card-meta">${category}${location ? ' &middot; ' + location : ''}</p>
      ${date ? `<p class="event-card-date">${new Date(date).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })}</p>` : ''}
      ${showBudget ? `<div class="event-card-footer"><span class="event-card-budget">Tsh ${Number(ev.budget || 0).toLocaleString()}</span></div>` : ''}
    </div>
  `;
}
