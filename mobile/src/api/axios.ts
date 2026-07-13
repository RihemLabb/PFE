import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: 'http://localhost:3000',
  timeout: 10000,
});

api.interceptors.request.use(
  async (config) => {
    const token = useAuthStore.getState().token;
    console.log('🔑 API Request to:', config.url);
    console.log('🔑 Token exists:', !!token);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Token added to headers');
    } else {
      console.log('❌ No token found!');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;