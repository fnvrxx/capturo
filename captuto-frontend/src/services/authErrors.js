export const isAuthSubmission = (url = '') => /\/auth\/(login|register)$/.test(url);

export function authErrorMessage(error) {
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return 'Server terlalu lama merespons. Silakan coba lagi.';
  }
  if (!error.response) {
    return 'Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.';
  }
  if (error.response.status >= 500) {
    return 'Server mengalami gangguan. Silakan coba lagi nanti.';
  }
  const payload = error.response.data;
  const validationMessage = payload?.errors && Object.values(payload.errors).flat()[0];
  if (typeof validationMessage === 'string') return validationMessage;
  if (typeof payload?.message === 'string') return payload.message;
  return `Permintaan gagal (HTTP ${error.response.status}). Silakan coba lagi.`;
}
