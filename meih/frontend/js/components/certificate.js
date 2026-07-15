import { api } from '../api.js';

export async function downloadCertificate(certificateId) {
  try {
    const result = await api.get(`/certificates/${certificateId}`);
    if (result && result.url) {
      window.open(result.url, '_blank');
    } else {
      alert('Certificate not available for download yet.');
    }
  } catch {
    alert('Certificate download is not available yet.');
  }
}
