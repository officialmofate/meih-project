export const formatCurrency = (amount, currency = 'TZS') =>
  new Intl.NumberFormat('en-TZ', { style: 'currency', currency }).format(amount);

export const formatDate = (isoString) =>
  new Date(isoString).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });

export const formatNumber = (n) => new Intl.NumberFormat('en-US').format(n);
