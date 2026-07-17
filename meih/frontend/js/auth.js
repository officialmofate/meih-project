import { api } from './api.js';
import { store } from './state.js';

function decodeJWT(token) {
  try {
    const payload = token.split('.')[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (e) {
    return null;
  }
}

function isTokenExpired(token) {
  try {
    const payload = decodeJWT(token);
    if (!payload || !payload.exp) return false;
    return payload.exp * 1000 < Date.now();
  } catch (e) {
    return false;
  }
}

function persistAuth(token, user) {
  try {
    localStorage.setItem('meih_token', token);
    sessionStorage.setItem('meih_token', token);
    if (user) {
      const userStr = JSON.stringify(user);
      localStorage.setItem('meih_user', userStr);
      sessionStorage.setItem('meih_user', userStr);
    }
  } catch (e) { /* storage full or unavailable */ }
}

function clearAuth() {
  try {
    localStorage.removeItem('meih_token');
    localStorage.removeItem('meih_user');
    sessionStorage.removeItem('meih_token');
    sessionStorage.removeItem('meih_user');
  } catch (e) { /* silent */ }
}

export const auth = {
  async login(email, password) {
    const data = await api.post('/auth/login', { email, password });
    persistAuth(data.token, data.user);
    if (data.user) {
      store.set({ user: data.user });
    }
    return data;
  },
  async register(payload) {
    return api.post('/auth/register', payload);
  },
  logout() {
    clearAuth();
    store.set({ user: null });
  },
  isAuthenticated() {
    const token = localStorage.getItem('meih_token') || sessionStorage.getItem('meih_token');
    return Boolean(token);
  },
  getValidToken() {
    try {
      const token = localStorage.getItem('meih_token') || sessionStorage.getItem('meih_token');
      if (!token) return null;
      if (isTokenExpired(token)) {
        this.logout();
        return null;
      }
      return token;
    } catch (e) {
      return null;
    }
  },
  isEmailVerified() {
    try {
      const raw = localStorage.getItem('meih_user') || sessionStorage.getItem('meih_user');
      if (raw) {
        const user = JSON.parse(raw);
        return user.email_verified === true;
      }
    } catch {}
    return false;
  },
  getUser() {
    try {
      const raw = localStorage.getItem('meih_user') || sessionStorage.getItem('meih_user');
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
  },
  restore() {
    const token = localStorage.getItem('meih_token') || sessionStorage.getItem('meih_token');
    if (token && isTokenExpired(token)) {
      this.logout();
      return;
    }
    const raw = localStorage.getItem('meih_user') || sessionStorage.getItem('meih_user');
    if (raw) {
      try {
        const user = JSON.parse(raw);
        store.set({ user });
        persistAuth(token, user);
      } catch {}
    }
  },
};
