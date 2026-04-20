import api from './api';

export const recordService = {
  list: (templateId) => api.get(`/records?template_id=${templateId}`),
  create: (data) => api.post('/records', data),
  export: (templateId) =>
    api.get(`/records/export/${templateId}`, { responseType: 'blob' }),
};
