export function vendorCard(v) {
  const name = v.business_name || v.businessName || v.full_name || 'Unknown Vendor';
  const category = v.category || '';
  const rating = v.rating || 0;
  const stars = '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
  const bio = v.bio || 'No description provided.';
  const imageUrl = v.image_url || '';
  const initial = name.charAt(0).toUpperCase();

  return `
    <div class="card planner-card vendor-card" data-id="${v.id}">
      <div class="planner-card-avatar">
        ${imageUrl ? `<img src="${window.resolveUrl ? window.resolveUrl(imageUrl) : imageUrl}" alt="${name}" onerror="this.style.display='none';this.parentElement.querySelector('.avatar-fallback').style.display='flex';" /><span class="avatar-fallback" style="display:none;font-size:28px;font-weight:800;color:#fff;">${initial}</span>` : `<span>${initial}</span>`}
      </div>
      <div class="planner-card-body">
        <h3>${name}</h3>
        ${category ? `<p class="planner-card-owner">${category}</p>` : ''}
        <p class="planner-card-bio">${bio.length > 100 ? bio.substring(0, 100) + '...' : bio}</p>
        <div class="planner-card-rating">
          <span class="stars">${stars}</span>
          <span class="rating-num">${rating > 0 ? rating.toFixed(1) : 'No ratings'}</span>
        </div>
      </div>
    </div>
  `;
}
