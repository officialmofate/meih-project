// Thin fetch wrapper for the MEIH REST API
const BASE_URL = '/api/v1';

async function request(path, { method = 'GET', body, headers = {}, isFormData = false } = {}) {
  const token = localStorage.getItem('meih_token');
  const fetchHeaders = {};

  if (!isFormData && body) {
    fetchHeaders['Content-Type'] = 'application/json';
  }

  if (token) {
    fetchHeaders['Authorization'] = `Bearer ${token}`;
  }

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
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  del: (path) => request(path, { method: 'DELETE' }),
  upload: (path, formData) => request(path, { method: 'POST', body: formData, isFormData: true }),
  putUpload: (path, formData) => request(path, { method: 'PUT', body: formData, isFormData: true }),
};
