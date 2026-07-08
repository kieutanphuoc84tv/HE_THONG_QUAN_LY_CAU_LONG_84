import axios from 'axios';
import { clearStoredAuth, getStoredToken } from '../utils/authStorage';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: { 
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true'
  }
});

// Auto-attach JWT token
api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-redirect on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      clearStoredAuth();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
