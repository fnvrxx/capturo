import api from './api';

export const ocrService = {
  process: (formData) =>
    api.post('/ocr/process', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};
