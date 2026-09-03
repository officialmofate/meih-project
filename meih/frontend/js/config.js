// MEIH Frontend Config
// The frontend is served by the same backend container, so we use RELATIVE URLs.
// This makes the app work on any domain (localhost, Render, Dokploy, your domain)
// without re-editing this file.
window.MEIH_API_URL = '/api/v1';
window.MEIH_BACKEND_URL = '';

window.resolveUrl = function (path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('data:')) return path;
  var backend = window.MEIH_BACKEND_URL || '';
  if (!backend) return path;
  if (path.startsWith('/uploads/')) {
    return backend + '/uploads/serve/' + path.substring('/uploads/'.length);
  }
  return backend + path;
};
