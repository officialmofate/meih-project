const BASE_URL = window.MEIH_API_URL || '/api/v1';
const MAX_RETRIES = 2;
const RETRY_DELAY = 3000;
const DEFAULT_TIMEOUT = 15000;

const inflightRequests = new Map();
const cache = new Map();
const DEFAULT_CACHE_TTL = 30000;

const cacheTTLs = {};

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function buildQueryString(params) {
  if (!params || typeof params !== 'object') return '';
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  return entries.length ? '?' + new URLSearchParams(entries).toString() : '';
}

function getCacheKey(path, method, queryString) {
  return `${method}:${path}${queryString}`;
}

async function request(path, { method = 'GET', body, headers = {}, isFormData = false, _retry = 0, params, timeout = DEFAULT_TIMEOUT } = {}) {
  const token = localStorage.getItem('meih_token') || sessionStorage.getItem('meih_token');
  const fetchHeaders = {};

  if (!isFormData && body) {
    fetchHeaders['Content-Type'] = 'application/json';
  }

  if (token) {
    fetchHeaders['Authorization'] = `Bearer ${token}`;
  }

  const queryString = buildQueryString(params);
  const fullUrl = `${BASE_URL}${path}${queryString}`;
  const cacheKey = getCacheKey(path, method, queryString);

  if (method === 'GET') {
    const pending = inflightRequests.get(cacheKey);
    if (pending) return pending;

    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.ts < (cacheTTLs[path] || DEFAULT_CACHE_TTL)) {
      return cached.data;
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  const promise = (async () => {
    try {
      const res = await fetch(fullUrl, {
        method,
        headers: { ...fetchHeaders, ...headers },
        body: isFormData ? body : (body ? JSON.stringify(body) : undefined),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(err.message || 'Request failed');
      }

      if (res.status === 204 || res.status === 205) return null;

      const data = await res.json();

      if (method === 'GET') {
        cache.set(cacheKey, { data, ts: Date.now() });
      }

      return data;
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error('Request timed out');
      }
      const isNetworkError = err.message === 'Failed to fetch' || err.message === 'NetworkError' || err.name === 'TypeError';
      if (isNetworkError && _retry < MAX_RETRIES) {
        await sleep(RETRY_DELAY);
        return request(path, { method, body, headers, isFormData, _retry: _retry + 1, params, timeout });
      }
      if (isNetworkError && _retry >= MAX_RETRIES) {
        throw new Error('Server is starting up, please try again in a few seconds.');
      }
      throw err;
    } finally {
      clearTimeout(timer);
      inflightRequests.delete(cacheKey);
    }
  })();

  if (method === 'GET') {
    inflightRequests.set(cacheKey, promise);
  }

  return promise;
}

export const api = {
  get(path, options = {}) {
    return request(path, { method: 'GET', params: options.params, timeout: options.timeout });
  },
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  del: (path) => request(path, { method: 'DELETE' }),
  upload: (path, formData) => request(path, { method: 'POST', body: formData, isFormData: true }),
  putUpload: (path, formData) => request(path, { method: 'PUT', body: formData, isFormData: true }),
  cache: {
    clear() {
      cache.clear();
      inflightRequests.clear();
    },
    setTTL(path, ttl) {
      cacheTTLs[path] = ttl;
    },
  },
};

export function showLoading(btn) {
  if (!btn) return;
  btn.disabled = true;
  btn.dataset.originalHtml = btn.innerHTML;
  const label = btn.textContent.trim();
  btn.innerHTML = '<span class="spinner" style="width:14px;height:14px;border-width:2px;margin-right:6px;vertical-align:middle;"></span> ' + label;
}

export function hideLoading(btn) {
  if (!btn) return;
  btn.disabled = false;
  if (btn.dataset.originalHtml) {
    btn.innerHTML = btn.dataset.originalHtml;
    delete btn.dataset.originalHtml;
  }
}
