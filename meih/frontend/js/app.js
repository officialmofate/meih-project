async function loadComponent(name, loader) {
  try {
    const mod = await loader();
    return mod;
  } catch (e) {
    console.error('[MEIH] Failed to load ' + name + ':', e);
    return null;
  }
}

(async function boot() {
  const [authMod, navbarMod, footerMod, aiMod, i18nMod, scrollRevealMod, lazyLoadMod, toastMod, perfMod] = await Promise.all([
    loadComponent('auth', () => import('./auth.js')),
    loadComponent('navbar', () => import('./components/navbar.js')),
    loadComponent('footer', () => import('./components/footer.js')),
    loadComponent('ai-assistant', () => import('./components/ai-assistant.js')),
    loadComponent('i18n', () => import('./i18n.js')),
    loadComponent('scrollReveal', () => import('./utils/scrollReveal.js')),
    loadComponent('lazyLoad', () => import('./utils/lazyLoad.js')),
    loadComponent('toast', () => import('./utils/toast.js')),
    loadComponent('perf', () => import('./utils/performance.js')),
  ]);

  if (authMod && authMod.auth) {
    try { authMod.auth.restore(); } catch (e) { console.error('[MEIH]', e); }
  }
  if (navbarMod && navbarMod.renderNavbar) {
    try { navbarMod.renderNavbar(); } catch (e) { console.error('[MEIH]', e); }
  }
  if (footerMod && footerMod.renderFooter) {
    try { footerMod.renderFooter(); } catch (e) { console.error('[MEIH]', e); }
  }
  if (aiMod && aiMod.initAIAssistant) {
    try { aiMod.initAIAssistant(); } catch (e) { console.error('[MEIH]', e); }
  }
  if (i18nMod && i18nMod.applyTranslations) {
    try { i18nMod.applyTranslations(); } catch (e) { console.error('[MEIH]', e); }
    if (i18nMod.getLang) {
      document.documentElement.lang = i18nMod.getLang() === 'sw' ? 'sw' : 'en';
    }
  }

  if (scrollRevealMod && scrollRevealMod.initScrollReveal) {
    try { scrollRevealMod.initScrollReveal(); } catch (e) { console.error('[MEIH]', e); }
  }

  if (lazyLoadMod && lazyLoadMod.initLazyLoad) {
    try { lazyLoadMod.initLazyLoad(); } catch (e) { console.error('[MEIH]', e); }
  }

  if (perfMod && perfMod.perf) {
    try {
      perfMod.perf.observeLongTasks();
      perfMod.perf.observeLCP();
      perfMod.perf.observeFID();
      perfMod.perf.observeCLS();
    } catch (e) { console.error('[MEIH]', e); }
  }

  try {
    const mainContent = document.querySelector('main, .main-content, #main-content, .page-content');
    if (mainContent) {
      mainContent.classList.add('page-enter');
    }
  } catch (e) { /* silent */ }
})();

window.addEventListener('error', (e) => {
  console.error('[MEIH] Uncaught error:', e);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('[MEIH] Unhandled rejection:', e.reason);
  import('./utils/toast.js').then((m) => {
    if (m.toast) m.toast.error('An unexpected error occurred.');
  }).catch(() => {});
});

document.addEventListener('DOMContentLoaded', () => {
  try {
    document.body.classList.add('loaded');
  } catch (e) { /* silent */ }
});
