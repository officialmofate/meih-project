export function eventCard(ev) {
  const name = ev.name || ev.title || 'Untitled Event';
  const category = ev.category_name || ev.category || '';
  const location = ev.location || '';
  const budget = ev.budget ?? 0;
  const status = ev.status || '';
  const date = ev.event_date || ev.eventDate || '';
  const statusClass = status === 'completed' ? 'badge-success' : status === 'published' ? 'badge' : 'badge-muted';

  return `
    <div class="card event-card">
      <div class="event-card-header">
        <h3>${name}</h3>
        <span class="badge ${statusClass}">${status}</span>
      </div>
      <p class="event-card-meta">${category}${location ? ' &middot; ' + location : ''}</p>
      ${date ? `<p class="event-card-date">${new Date(date).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })}</p>` : ''}
      <div class="event-card-footer">
        <span class="event-card-budget">Tsh ${Number(budget).toLocaleString()}</span>
      </div>
    </div>
  `;
}
