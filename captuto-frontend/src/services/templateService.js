import api from './api';

export const templateService = {
  list: () => api.get('/templates'),
  create: (data) => api.post('/templates', data),
  get: (id) => api.get(`/templates/${id}`),
  delete: (id) => api.delete(`/templates/${id}`),
};
