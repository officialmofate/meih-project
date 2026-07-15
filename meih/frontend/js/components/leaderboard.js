import { api } from '../api.js';

export async function renderLeaderboard(competitionId, containerEl) {
  try {
    const data = await api.get(`/innovation/leaderboard/${competitionId}`);
    paint(Array.isArray(data) ? data : []);
  } catch {
    // Keep existing content as fallback
  }

  function paint(rows) {
    if (!rows.length) {
      containerEl.innerHTML = '<li class="leaderboard-row"><span class="title">No entries yet</span></li>';
      return;
    }
    containerEl.innerHTML = rows
      .map((r, i) => {
        const votes = r.vote_count ?? r.voteCount ?? 0;
        const author = r.author_name ? ` — ${r.author_name}` : '';
        return `<li class="leaderboard-row rank-${i + 1}">
          <span class="rank">#${i + 1}</span>
          <span class="title">${r.title}${author}</span>
          <span class="votes">${votes} votes</span>
        </li>`;
      })
      .join('');
  }
}
