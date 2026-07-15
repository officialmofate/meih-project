export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
export const isPhone = (v) => /^\+?[0-9]{9,15}$/.test(v);
export const isRequired = (v) => v !== undefined && v !== null && String(v).trim() !== '';
export const minLength = (v, n) => String(v ?? '').length >= n;
