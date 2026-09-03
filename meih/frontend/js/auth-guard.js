(function () {
  var s = document.querySelector('[data-meih-guard]');
  var roles = s ? s.getAttribute('data-meih-guard').split(',') : [];
  function clr() {
    ['meih_token', 'meih_user'].forEach(function (k) {
      try { localStorage.removeItem(k); } catch (e) {}
      try { sessionStorage.removeItem(k); } catch (e) {}
    });
  }
  var t = null;
  try { t = localStorage.getItem('meih_token') || sessionStorage.getItem('meih_token'); } catch (e) {}
  if (!t) { clr(); window.location.replace('login.html'); return; }
  try {
    var pl = JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (pl.exp && pl.exp * 1000 < Date.now()) { clr(); window.location.replace('login.html'); return; }
    if (roles.length > 0 && roles[0] !== 'any' && pl.role && roles.indexOf(pl.role) === -1) {
      window.location.replace('login.html');
      return;
    }
  } catch (e) {
    clr();
    window.location.replace('login.html');
  }
})();
