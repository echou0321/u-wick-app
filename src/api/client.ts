import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const client = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 15000,
});

client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().clearAuth();
    }
    if (__DEV__ && err.response) {
      // Dev-only: surface failing URL + server response body so we can diagnose
      // eslint-disable-next-line no-console
      console.warn(
        `[API ${err.response.status}] ${err.config?.method?.toUpperCase()} ${err.config?.url}`,
        { params: err.config?.params, data: err.response.data },
      );
    }
    return Promise.reject(err);
  },
);

export default client;
