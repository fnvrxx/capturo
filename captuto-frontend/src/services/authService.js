import api from './api';

export const authService = {
  register: (data) => api.post('/auth/register', data, { timeout: 45000 }),
  login: (data) => api.post('/auth/login', data, { timeout: 45000 }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};
