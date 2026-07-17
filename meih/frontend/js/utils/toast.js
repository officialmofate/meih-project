let toastCount = 0;
const MAX_VISIBLE = 5;
const activeToasts = new Map();
let container = null;

function ensureContainer() {
  if (container && document.body.contains(container)) return container;
  container = document.createElement('div');
  container.id = 'toast-container';
  container.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:1100;display:flex;flex-direction:column-reverse;gap:8px;pointer-events:none;';
  document.body.appendChild(container);
  return container;
}

function createIcon(type) {
  const icons = {
    success: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>',
    error: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    warning: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    info: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  };
  return icons[type] || icons.info;
}

function getColor(type) {
  const colors = { success: '#00b894', error: '#ff6b6b', warning: '#ffd93d', info: '#6c5ce7' };
  return colors[type] || colors.info;
}

export const toast = {
  show(message, type = 'info', duration = 4000) {
    try {
      const c = ensureContainer();
      const id = `toast-${++toastCount}`;
      const el = document.createElement('div');
      el.id = id;
      el.className = 'toast toast-enter';
      el.style.cssText = `min-width:300px;max-width:420px;padding:16px;border-radius:10px;background:rgba(18,18,26,0.92);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,0.06);box-shadow:0 8px 30px rgba(0,0,0,0.5);font-size:14px;pointer-events:auto;cursor:pointer;display:flex;align-items:center;gap:10px;border-left:3px solid ${getColor(type)};`;

      const iconSpan = document.createElement('span');
      iconSpan.style.cssText = `flex-shrink:0;display:flex;color:${getColor(type)};`;
      iconSpan.innerHTML = createIcon(type);

      const msgSpan = document.createElement('span');
      msgSpan.style.cssText = 'flex:1;color:#e2e8f0;line-height:1.4;';
      msgSpan.textContent = message;

      const closeBtn = document.createElement('button');
      closeBtn.style.cssText = 'flex-shrink:0;background:none;border:none;color:#64748b;cursor:pointer;padding:2px;font-size:16px;line-height:1;';
      closeBtn.innerHTML = '&times;';
      closeBtn.setAttribute('aria-label', 'Dismiss');

      el.appendChild(iconSpan);
      el.appendChild(msgSpan);
      el.appendChild(closeBtn);

      el.addEventListener('click', () => toast.dismiss(id));
      c.appendChild(el);

      const timer = setTimeout(() => toast.dismiss(id), duration);
      activeToasts.set(id, { el, timer });

      while (activeToasts.size > MAX_VISIBLE) {
        const oldest = activeToasts.keys().next().value;
        toast.dismiss(oldest);
      }

      return id;
    } catch (e) {
      console.error('[toast]', e);
    }
  },

  success(message, duration) { return toast.show(message, 'success', duration); },
  error(message, duration) { return toast.show(message, 'error', duration); },
  warning(message, duration) { return toast.show(message, 'warning', duration); },
  info(message, duration) { return toast.show(message, 'info', duration); },

  dismiss(id) {
    try {
      const entry = activeToasts.get(id);
      if (!entry) return;
      clearTimeout(entry.timer);
      activeToasts.delete(id);
      entry.el.classList.remove('toast-enter');
      entry.el.classList.add('toast-exit');
      entry.el.addEventListener('animationend', () => entry.el.remove(), { once: true });
      setTimeout(() => { if (entry.el.parentNode) entry.el.remove(); }, 400);
    } catch (e) {
      console.error('[toast dismiss]', e);
    }
  },

  dismissAll() {
    try {
      for (const id of [...activeToasts.keys()]) {
        toast.dismiss(id);
      }
    } catch (e) {
      console.error('[toast dismissAll]', e);
    }
  },
};
