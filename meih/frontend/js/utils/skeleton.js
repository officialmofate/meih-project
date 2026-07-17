export const skeleton = {
  text(lines = 3) {
    try {
      let html = '<div class="skeleton-group" style="display:flex;flex-direction:column;gap:8px;">';
      for (let i = 0; i < lines; i++) {
        html += `<div class="skeleton skeleton-text" style="margin-bottom:0;"></div>`;
      }
      html += '</div>';
      return html;
    } catch (e) { console.error('[skeleton.text]', e); return ''; }
  },

  title() {
    try {
      return '<div class="skeleton skeleton-title"></div>';
    } catch (e) { console.error('[skeleton.title]', e); return ''; }
  },

  card(count = 3) {
    try {
      let html = '<div class="skeleton-group" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;">';
      for (let i = 0; i < count; i++) {
        html += `
          <div style="border-radius:14px;background:rgba(26,26,46,0.5);padding:16px;display:flex;flex-direction:column;gap:12px;">
            <div class="skeleton skeleton-card" style="height:120px;"></div>
            <div class="skeleton skeleton-title" style="width:70%;"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text" style="width:60%;"></div>
          </div>`;
      }
      html += '</div>';
      return html;
    } catch (e) { console.error('[skeleton.card]', e); return ''; }
  },

  table(rows = 5, cols = 4) {
    try {
      let html = '<div style="width:100%;display:flex;flex-direction:column;gap:8px;">';
      for (let r = 0; r < rows; r++) {
        html += '<div style="display:grid;grid-template-columns:repeat(' + cols + ',1fr);gap:12px;">';
        for (let c = 0; c < cols; c++) {
          html += `<div class="skeleton skeleton-text" style="height:16px;width:${70 + Math.random() * 30}%;"></div>`;
        }
        html += '</div>';
      }
      html += '</div>';
      return html;
    } catch (e) { console.error('[skeleton.table]', e); return ''; }
  },

  avatar() {
    try {
      return '<div class="skeleton skeleton-avatar"></div>';
    } catch (e) { console.error('[skeleton.avatar]', e); return ''; }
  },

  replace(container, type, options) {
    try {
      if (!container) return;
      const el = typeof container === 'string' ? document.querySelector(container) : container;
      if (!el) return;
      el.dataset.skeletonType = type;
      el.innerHTML = skeleton[type] ? skeleton[type](options) : '';
    } catch (e) { console.error('[skeleton.replace]', e); }
  },

  clear(container) {
    try {
      if (!container) return;
      const el = typeof container === 'string' ? document.querySelector(container) : container;
      if (!el) return;
      el.innerHTML = '';
      delete el.dataset.skeletonType;
    } catch (e) { console.error('[skeleton.clear]', e); }
  },
};
