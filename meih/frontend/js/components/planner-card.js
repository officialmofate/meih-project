export function plannerCard(p) {
  const name = p.company_name || p.full_name || 'Event Planner';
  const bio = p.bio || 'No description provided.';
  const rating = p.rating || 0;
  const stars = '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
  const fullName = p.full_name || '';
  const imageUrl = p.image_url || '';
  const initial = name.charAt(0).toUpperCase();

  return `
    <div class="card planner-card">
      <div class="planner-card-avatar">
        ${imageUrl ? `<img src="${window.resolveUrl ? window.resolveUrl(imageUrl) : imageUrl}" alt="${name}" onerror="this.style.display='none';this.parentElement.querySelector('.avatar-fallback').style.display='flex';" /><span class="avatar-fallback" style="display:none;font-size:28px;font-weight:800;color:#fff;">${initial}</span>` : `<span>${initial}</span>`}
      </div>
      <div class="planner-card-body">
        <h3>${name}</h3>
        ${fullName ? `<p class="planner-card-owner">${fullName}</p>` : ''}
        <p class="planner-card-bio">${bio.length > 100 ? bio.substring(0, 100) + '...' : bio}</p>
        <div class="planner-card-rating">
          <span class="stars">${stars}</span>
          <span class="rating-num">${rating > 0 ? rating.toFixed(1) : 'No ratings'}</span>
        </div>
      </div>
    </div>
  `;
}
