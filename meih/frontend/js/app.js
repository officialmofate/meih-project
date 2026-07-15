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
  const [authMod, navbarMod, footerMod, aiMod, i18nMod] = await Promise.all([
    loadComponent('auth', () => import('./auth.js')),
    loadComponent('navbar', () => import('./components/navbar.js')),
    loadComponent('footer', () => import('./components/footer.js')),
    loadComponent('ai-assistant', () => import('./components/ai-assistant.js')),
    loadComponent('i18n', () => import('./i18n.js')),
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
})();
