import { api } from '../api.js';

export function voteButton(submissionId) {
  const btn = document.createElement('button');
  btn.className = 'btn btn-primary';
  btn.textContent = 'Vote';
  btn.addEventListener('click', async () => {
    const otp = window.prompt('Enter your 6-digit Public Voter OTP (shown on your dashboard):');
    if (!otp || !/^\d{6}$/.test(otp.trim())) return;
    btn.disabled = true;
    try {
      const result = await api.post(`/innovation/submissions/${submissionId}/vote`, { otp: otp.trim() });
      btn.textContent = 'Voted ✓';
      return result;
    } catch (e) {
      btn.disabled = false;
      alert(e.message);
    }
  });
  return btn;
}
