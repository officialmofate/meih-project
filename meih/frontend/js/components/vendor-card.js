export function vendorCard(v) {
  const name = v.business_name || v.businessName || v.full_name || 'Unknown Vendor';
  const category = v.category || '';
  const rating = v.rating ?? 'N/A';
  const verified = v.verified;

  return `
    <div class="card vendor-card">
      <div class="vendor-card-header">
        <h3>${name}</h3>
        ${verified ? '<span class="badge badge-success">Verified</span>' : ''}
      </div>
      <p class="vendor-card-category">${category}</p>
      <div class="vendor-card-footer">
        <span class="vendor-card-rating">${rating !== 'N/A' ? '&#9733; ' + Number(rating).toFixed(1) : 'No ratings yet'}</span>
      </div>
    </div>
  `;
}
