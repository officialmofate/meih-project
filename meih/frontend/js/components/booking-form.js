import { api } from '../api.js';

export function initBookingForm(formEl) {
  formEl.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(formEl));
    try {
      const booking = await api.post('/bookings', data);
      window.location.href = `/dashboard-client.html?booking=${booking.id}`;
    } catch (err) {
      alert(err.message);
    }
  });
}
