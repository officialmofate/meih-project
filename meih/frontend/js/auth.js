import { api } from './api.js';
import { store } from './state.js';

export const auth = {
  async login(email, password) {
    const data = await api.post('/auth/login', { email, password });
    localStorage.setItem('meih_token', data.token);
    if (data.user) {
      store.set({ user: data.user });
      localStorage.setItem('meih_user', JSON.stringify(data.user));
    }
    return data;
  },
  async register(payload) {
    return api.post('/auth/register', payload);
  },
  logout() {
    localStorage.removeItem('meih_token');
    localStorage.removeItem('meih_user');
    store.set({ user: null });
  },
  isAuthenticated() {
    return Boolean(localStorage.getItem('meih_token'));
  },
  isEmailVerified() {
    try {
      const raw = localStorage.getItem('meih_user');
      if (raw) {
        const user = JSON.parse(raw);
        return user.email_verified === true;
      }
    } catch {}
    return false;
  },
  getUser() {
    try {
      const raw = localStorage.getItem('meih_user');
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
  },
  restore() {
    const raw = localStorage.getItem('meih_user');
    if (raw) {
      try { store.set({ user: JSON.parse(raw) }); } catch {}
    }
  },
};
