import axios from 'axios';

// Create an Axios instance configured for the backend API
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchHealthStatus = async () => {
  const response = await api.get('/health');
  return response.data;
};

export const pingServer = async () => {
  const response = await api.get('/health/ping');
  return response.data;
};

export default api;
