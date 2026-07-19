export function vendorCard(v) {
  const name = v.business_name || v.businessName || v.full_name || 'Unknown Vendor';
  const category = v.category || '';
  const rating = v.rating || 0;
  const stars = '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
  const bio = v.bio || 'No description provided.';
  const imageUrl = v.image_url || '';

  return `
    <div class="card planner-card vendor-card" data-id="${v.id}">
      <div class="planner-card-avatar">
        ${imageUrl ? `<img src="${window.resolveUrl ? window.resolveUrl(imageUrl) : imageUrl}" alt="${name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />` : `<span>${name.charAt(0).toUpperCase()}</span>`}
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
