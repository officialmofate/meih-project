export function innovationCard(inn) {
  const title = inn.title || 'Untitled';
  const category = inn.category || '';
  const description = inn.description || inn.summary || '';
  const voteCount = inn.vote_count ?? inn.voteCount ?? 0;
  const author = inn.author_name || '';
  const country = inn.country || '';

  return `
    <div class="card innovation-card">
      <div class="innovation-card-header">
        <h3>${title}</h3>
        ${category ? `<span class="badge">${category}</span>` : ''}
      </div>
      ${description ? `<div class="innovation-card-body"><p>${description}</p></div>` : ''}
      <div class="innovation-card-meta">
        ${author ? `<span class="innovation-card-author">by ${author}</span>` : ''}
        ${country ? `<span class="chip-secondary">${country}</span>` : ''}
      </div>
      <div class="innovation-card-footer">
        <span class="innovation-card-votes">${voteCount} votes</span>
      </div>
    </div>
  `;
}
