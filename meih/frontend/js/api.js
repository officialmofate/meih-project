const BASE_URL = window.MEIH_API_URL || '/api/v1';
const MAX_RETRIES = 2;
const RETRY_DELAY = 3000;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function request(path, { method = 'GET', body, headers = {}, isFormData = false, _retry = 0 } = {}) {
  const token = localStorage.getItem('meih_token');
  const fetchHeaders = {};

  if (!isFormData && body) {
    fetchHeaders['Content-Type'] = 'application/json';
  }

  if (token) {
    fetchHeaders['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: { ...fetchHeaders, ...headers },
      body: isFormData ? body : (body ? JSON.stringify(body) : undefined),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || 'Request failed');
    }
    return res.json();
  } catch (err) {
    const isNetworkError = err.message === 'Failed to fetch' || err.message === 'NetworkError' || err.name === 'TypeError';
    if (isNetworkError && _retry < MAX_RETRIES) {
      await sleep(RETRY_DELAY);
      return request(path, { method, body, headers, isFormData, _retry: _retry + 1 });
    }
    if (isNetworkError && _retry >= MAX_RETRIES) {
      throw new Error('Server is starting up, please try again in a few seconds.');
    }
    throw err;
  }
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  del: (path) => request(path, { method: 'DELETE' }),
  upload: (path, formData) => request(path, { method: 'POST', body: formData, isFormData: true }),
  putUpload: (path, formData) => request(path, { method: 'PUT', body: formData, isFormData: true }),
};
