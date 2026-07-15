// Simple client-side router mapping paths to page render functions
const routes = new Map();

export function registerRoute(path, renderFn) {
  routes.set(path, renderFn);
}

export function navigate(path) {
  window.history.pushState({}, '', path);
  render();
}

function render() {
  const path = window.location.pathname;
  const renderFn = routes.get(path) || routes.get('/404');
  const root = document.getElementById('app-root');
  if (root && renderFn) root.innerHTML = renderFn();
}

window.addEventListener('popstate', render);

export function initRouter() {
  render();
}
