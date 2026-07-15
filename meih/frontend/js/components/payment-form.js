import { api } from '../api.js';

export function initPaymentForm(formEl, { onSuccess } = {}) {
  const fileInput = formEl.querySelector('input[type="file"]');

  formEl.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(formEl);

    // Add screenshot if present
    if (fileInput && fileInput.files.length > 0) {
      formData.set('screenshot', fileInput.files[0]);
    }

    // Remove empty fields
    for (const [key, val] of [...formData.entries()]) {
      if (!val || (typeof val === 'string' && !val.trim())) formData.delete(key);
    }

    try {
      const payment = await api.upload('/payments', formData);
      if (onSuccess) {
        onSuccess(payment);
      } else {
        alert('Payment submitted — pending planner confirmation.');
      }
      formEl.reset();
    } catch (err) {
      alert(err.message);
    }
  });
}
