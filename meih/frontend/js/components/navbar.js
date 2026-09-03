import { store } from '../state.js';

const THEME_KEY = 'meih_theme';

const HUB_PAGES = {
  event: ['events.html', 'create-event.html', 'event-detail.html', 'dashboard-planner.html', 'dashboard-vendor.html', 'dashboard-client.html', 'planners.html', 'planner-detail.html', 'vendors.html', 'vendor-detail.html'],
  innovation: ['innovation.html', 'submit-innovation.html', 'innovation-detail.html', 'leaderboard.html', 'dashboard-judge.html', 'dashboard-admin.html', 'dashboard-innovator-manager.html', 'dashboard-innovator.html', 'dashboard-reviewer.html', 'dashboard-public-voter.html'],
};

function getStoredTheme() {
  try { return localStorage.getItem(THEME_KEY) || 'dark'; } catch (e) { return 'dark'; }
}

export function applyTheme(theme) {
  const t = theme || getStoredTheme();
  document.documentElement.setAttribute('data-theme', t);
  store.set({ theme: t });
  try { localStorage.setItem(THEME_KEY, t); } catch (e) {}
}

function detectHub() {
  const path = window.location.pathname.toLowerCase();
  if (HUB_PAGES.event.some(p => path.includes(p))) return 'event';
  if (HUB_PAGES.innovation.some(p => path.includes(p))) return 'innovation';
  return null;
}

function isRootPage() {
  const path = window.location.pathname;
  const depth = path.split('/').filter(Boolean).length;
  const lastSegment = path.split('/').pop() || '';
  return lastSegment === 'index.html' || lastSegment === '' || lastSegment === '/';
}

function p(href) {
  return isRootPage() ? 'pages/' + href : href;
}

function a(href) {
  return isRootPage() ? 'assets/' + href : '../assets/' + href;
}

function logoUrl() {
  return a('logo/MOFATE-LOGO-FULLCOLOR.png');
}

export function renderNavbar() {
  const el = document.getElementById('navbar-root');
  if (!el) return;
  applyTheme();
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
      innovator: 'dashboard-innovator.html',
      judge: 'dashboard-judge.html',
      reviewer: 'dashboard-reviewer.html',
      admin: 'dashboard-admin.html',
      superadmin: 'dashboard-admin.html',
      public_voter: 'dashboard-public-voter.html',
      innovator_manager: 'dashboard-innovator-manager.html',
    };
    dashboardLink = `<a href="${p(dashMap[user.role] || 'dashboard-client.html')}" data-i18n="nav.dashboard">Dashboard</a>`;
  }

  let hubLinks = '';
  if (hub === 'event') {
    hubLinks = `
      <a href="/">Home</a>
      <a href="${p('events.html')}" class="active" data-i18n="nav.browse_events">Browse Events</a>
      <a href="${p('planners.html')}">Planners</a>
      <a href="${p('vendors.html')}">Vendors</a>
      ${dashboardLink}
    `;
  } else if (hub === 'innovation') {
    hubLinks = `
      <a href="/">Home</a>
      <a href="${p('innovation.html')}" class="active" data-i18n="nav.browse_innovations">Browse Innovations</a>
      <a href="${p('leaderboard.html')}" data-i18n="nav.leaderboard">Leaderboard</a>
      ${dashboardLink}
    `;
  } else {
    hubLinks = `
      <a href="/" class="active">Home</a>
      <a href="${p('events.html')}" data-i18n="nav.events">Event Hub</a>
      <a href="${p('planners.html')}">Planners</a>
      <a href="${p('vendors.html')}">Vendors</a>
      <a href="${p('innovation.html')}" data-i18n="nav.innovation">Innovation Hub</a>
      ${dashboardLink}
    `;
  }

  el.innerHTML = `
    <nav class="navbar">
      <a href="/" class="navbar-logo">
        <img src="${logoUrl()}" alt="MOFATE" class="navbar-logo-img" />
        <span class="navbar-logo-text">MOFATE</span>
      </a>
      <div class="navbar-links">
        ${hubLinks}
        <button id="lang-toggle" class="btn-ghost lang-toggle-btn" title="${langTitle}">${langLabel}</button>
        <button id="theme-toggle" class="btn-ghost theme-toggle-btn" title="Switch theme"></button>
        <button id="ai-assistant-toggle" class="btn-ghost" style="font-size:18px;padding:4px 10px;border:1px solid var(--color-border);border-radius:var(--radius-md);" title="AI Assistant" data-i18n="nav.ai">AI ✦</button>
        ${user
          ? `<button id="nav-logout" class="btn-nav-logout" data-i18n="nav.logout">Logout</button>`
          : `<a href="${p('register.html')}" class="btn btn-ghost" style="padding:6px 14px;font-size:13px;" data-i18n="nav.signup">Sign Up</a>
             <a href="${p('login.html')}" class="btn btn-primary" style="padding:6px 18px;" data-i18n="nav.login">Login</a>`}
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

  // Theme toggle
  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    themeBtn.textContent = current === 'dark' ? '☀' : '☾';
    themeBtn.title = current === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
    themeBtn.addEventListener('click', () => {
      const next = (document.documentElement.getAttribute('data-theme') === 'dark') ? 'light' : 'dark';
      applyTheme(next);
      themeBtn.textContent = next === 'dark' ? '☀' : '☾';
      themeBtn.title = next === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';
    });
  }

  // Logout
  const logoutBtn = document.getElementById('nav-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('meih_token');
      localStorage.removeItem('meih_user');
      sessionStorage.removeItem('meih_token');
      sessionStorage.removeItem('meih_user');
      store.set({ user: null });
      window.location.href = p('login.html');
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
