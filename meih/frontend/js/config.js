// MEIH Frontend Config
// Set your backend API URL here before deploying
window.MEIH_API_URL = 'https://meih.onrender.com/api/v1';
window.MEIH_BACKEND_URL = 'https://meih.onrender.com';

window.resolveUrl = function (path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  var backend = window.MEIH_BACKEND_URL || '';
  if (!backend) return path;
  return backend + path;
};
