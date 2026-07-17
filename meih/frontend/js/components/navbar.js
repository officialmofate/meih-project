import { store } from '../state.js';

const HUB_PAGES = {
  event: ['events.html', 'create-event.html', 'event-detail.html', 'dashboard-planner.html', 'dashboard-vendor.html', 'dashboard-client.html'],
  innovation: ['innovation.html', 'submit-innovation.html', 'innovation-detail.html', 'leaderboard.html', 'dashboard-judge.html', 'dashboard-admin.html'],
};

function detectHub() {
  const path = window.location.pathname.toLowerCase();
  if (HUB_PAGES.event.some(p => path.includes(p))) return 'event';
  if (HUB_PAGES.innovation.some(p => path.includes(p))) return 'innovation';
  return null;
}

function hubLink(href, label, currentHub, targetHub) {
  const active = currentHub === targetHub ? ' active' : '';
  return `<a href="${href}" class="${active}">${label}</a>`;
}

export function renderNavbar() {
  const el = document.getElementById('navbar-root');
  if (!el) return;
  const { user } = store.get();
  const hub = detectHub();

  let langLabel, langTitle;
  try {
    const i18n = window.__meih_i18n;
    langLabel = i18n && i18n.getLang() === 'sw' ? 'EN' : 'SW';
    langTitle = i18n && i18n.getLang() === 'sw' ? 'Switch to English' : 'Badili kuwa Kiswahili';
  } catch (e) {
    langLabel = 'SW';
    langTitle = 'Switch language';
  }

  let dashboardLink = '';
  if (user) {
    const dashMap = {
      client: 'dashboard-client.html',
      planner: 'dashboard-planner.html',
      vendor: 'dashboard-vendor.html',
      innovator: 'dashboard-client.html',
      judge: 'dashboard-judge.html',
      admin: 'dashboard-admin.html',
      superadmin: 'dashboard-admin.html',
      public_voter: 'innovation.html',
      innovator_manager: 'dashboard-admin.html',
    };
    dashboardLink = `<a href="${dashMap[user.role] || 'dashboard-client.html'}" data-i18n="nav.dashboard">Dashboard</a>`;
  }

  let hubLinks = '';
  if (hub === 'event') {
    hubLinks = `
      <a href="events.html" class="active" data-i18n="nav.browse_events">Browse Events</a>
      <a href="create-event.html" data-i18n="nav.register_event">Register Event</a>
      ${dashboardLink}
    `;
  } else if (hub === 'innovation') {
    hubLinks = `
      <a href="innovation.html" class="active" data-i18n="nav.browse_innovations">Browse Innovations</a>
      <a href="submit-innovation.html" data-i18n="nav.register_innovation">Register Innovation</a>
      <a href="leaderboard.html" data-i18n="nav.leaderboard">Leaderboard</a>
      ${dashboardLink}
    `;
  } else {
    hubLinks = `
      <a href="events.html" data-i18n="nav.events">Event Hub</a>
      <a href="innovation.html" data-i18n="nav.innovation">Innovation Hub</a>
      ${dashboardLink}
    `;
  }

  el.innerHTML = `
    <nav class="navbar">
      <a href="/" class="navbar-logo">MEIH</a>
      <div class="navbar-links">
        ${hubLinks}
        <button id="lang-toggle" class="btn-ghost lang-toggle-btn" title="${langTitle}">${langLabel}</button>
        <button id="ai-assistant-toggle" class="btn-ghost" style="font-size:18px;padding:4px 10px;border:1px solid var(--color-border);border-radius:var(--radius-md);" title="AI Assistant" data-i18n="nav.ai">AI ✦</button>
        ${user
          ? `<button id="nav-logout" class="btn-link" style="font-weight:600" data-i18n="nav.logout">Logout</button>`
          : `<a href="register.html" class="btn btn-ghost" style="padding:6px 14px;font-size:13px;" data-i18n="nav.signup">Sign Up</a>
             <a href="login.html" class="btn btn-primary" style="padding:6px 18px;" data-i18n="nav.login">Login</a>`}
      </div>
      <button id="mobile-menu-toggle" class="navbar-toggle" aria-label="Toggle menu">&#9776;</button>
    </nav>
  `;

  // Mobile toggle
  const mobileToggle = document.getElementById('mobile-menu-toggle');
  if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
      el.querySelector('.navbar-links').classList.toggle('open');
    });
  }

  // Language toggle
  const langBtn = document.getElementById('lang-toggle');
  if (langBtn) {
    langBtn.addEventListener('click', async () => {
      try {
        const i18n = await import('../i18n.js');
        i18n.toggleLang();
        renderNavbar();
      } catch (e) { console.error('[MEIH]', e); }
    });
  }

  // Logout
  const logoutBtn = document.getElementById('nav-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('meih_token');
      store.set({ user: null });
      window.location.href = 'login.html';
    });
  }

  // AI assistant toggle
  const aiToggle = document.getElementById('ai-assistant-toggle');
  if (aiToggle) {
    aiToggle.addEventListener('click', () => {
      const panel = document.getElementById('ai-chat-panel');
      if (panel) panel.classList.toggle('open');
    });
  }
}
