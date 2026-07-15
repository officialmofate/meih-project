export function innovationCard(inn) {
  const title = inn.title || 'Untitled';
  const category = inn.category || '';
  const voteCount = inn.vote_count ?? inn.voteCount ?? 0;
  const author = inn.author_name || '';

  return `
    <div class="card innovation-card">
      <div class="innovation-card-header">
        <h3>${title}</h3>
        <span class="badge">${category}</span>
      </div>
      ${author ? `<p class="innovation-card-author">by ${author}</p>` : ''}
      <div class="innovation-card-footer">
        <span class="innovation-card-votes">${voteCount} votes</span>
      </div>
    </div>
  `;
}
