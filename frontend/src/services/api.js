// frontend/src/services/api.js
import axios from 'axios';

// ✅ Vite uses VITE_ prefix for env vars
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5040';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // ✅ JWT in Authorization header, no cookies needed
});

// ✅ Auto-attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ✅ Optional: Handle 401 (token expired) globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;