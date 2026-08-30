import axios, { type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json', 'X-Client-Platform': 'web' },
});

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken() {
  const { setToken } = useAuthStore.getState();

  const { data } = await axios.post(
    `${baseURL}/auth/refresh`,
    {},
    { withCredentials: true, headers: { 'Content-Type': 'application/json', 'X-Client-Platform': 'web' } },
  );

  setToken(data.access_token);
  return data.access_token as string;
}

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as RetryConfig | undefined;
    const requestUrl = originalRequest?.url || '';
    const isAuthenticationRequest = [
      '/auth/login',
      '/auth/register',
      '/auth/refresh',
    ].some((path) => requestUrl.includes(path));

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthenticationRequest
    ) {
      originalRequest._retry = true;

      try {
        refreshPromise ??= refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
        const accessToken = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
