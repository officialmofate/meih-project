export const isEmail = (v) => {
  if (!v || typeof v !== 'string') return false;
  const trimmed = v.trim();
  if (trimmed.length > 254) return false;
  const re = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!re.test(trimmed)) return false;
  const parts = trimmed.split('@');
  if (parts.length !== 2) return false;
  const domain = parts[1];
  if (!domain || !domain.includes('.')) return false;
  return true;
};
export const isPhone = (v) => /^\+?[0-9]{9,15}$/.test(v);
export const isRequired = (v) => v !== undefined && v !== null && String(v).trim() !== '';
export const minLength = (v, n) => String(v ?? '').length >= n;
