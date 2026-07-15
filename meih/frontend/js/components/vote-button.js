import { api } from '../api.js';

export function voteButton(submissionId) {
  const btn = document.createElement('button');
  btn.className = 'btn btn-primary';
  btn.textContent = 'Vote';
  btn.addEventListener('click', async () => {
    btn.disabled = true;
    try {
      await api.post(`/innovation/submissions/${submissionId}/vote`, {});
      btn.textContent = 'Voted ✓';
    } catch (e) {
      btn.disabled = false;
      alert(e.message);
    }
  });
  return btn;
}
