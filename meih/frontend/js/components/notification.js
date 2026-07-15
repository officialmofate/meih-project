export function showNotification(message, type = 'info') {
  const el = document.createElement('div');
  el.className = `notification notification-${type}`;
  el.textContent = message;

  Object.assign(el.style, {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    padding: '12px 20px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    zIndex: '9999',
    animation: 'fadeIn 0.3s ease',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    maxWidth: '400px',
  });

  const colors = {
    info: { bg: '#0f766e', color: '#fff' },
    success: { bg: '#16a34a', color: '#fff' },
    error: { bg: '#dc2626', color: '#fff' },
    warning: { bg: '#f59e0b', color: '#1e293b' },
  };

  const c = colors[type] || colors.info;
  el.style.background = c.bg;
  el.style.color = c.color;

  document.body.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.3s ease';
    setTimeout(() => el.remove(), 300);
  }, 4000);
}
