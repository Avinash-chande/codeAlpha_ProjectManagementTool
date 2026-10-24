import axios from 'axios';

// Create an Axios instance configured for the backend API
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to automatically attach JWT token if present in localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('taskflow_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle unauthenticated 401 errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (localStorage.getItem('taskflow_token')) {
        localStorage.removeItem('taskflow_token');
        localStorage.removeItem('taskflow_user');
      }
    }
    return Promise.reject(error);
  }
);

// Health check endpoints
export const fetchHealthStatus = async () => {
  const response = await api.get('/health');
  return response.data;
};

export const pingServer = async () => {
  const response = await api.get('/health/ping');
  return response.data;
};

// Authentication endpoints
export const registerApi = async ({ name, email, password }) => {
  const response = await api.post('/auth/register', { name, email, password });
  return response.data;
};

export const loginApi = async ({ email, password }) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const getMeApi = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

// Project endpoints
export const getProjectsApi = async () => {
  const response = await api.get('/projects');
  return response.data;
};

export const createProjectApi = async ({ name, description }) => {
  const response = await api.post('/projects', { name, description });
  return response.data;
};

export const getProjectByIdApi = async (projectId) => {
  const response = await api.get(`/projects/${projectId}`);
  return response.data;
};

export const updateProjectApi = async (projectId, updates) => {
  const response = await api.put(`/projects/${projectId}`, updates);
  return response.data;
};

export const deleteProjectApi = async (projectId) => {
  const response = await api.delete(`/projects/${projectId}`);
  return response.data;
};

// Project Membership endpoints
export const addProjectMemberApi = async (projectId, { email, userId }) => {
  const response = await api.post(`/projects/${projectId}/members`, { email, userId });
  return response.data;
};

export const removeProjectMemberApi = async (projectId, memberId) => {
  const response = await api.delete(`/projects/${projectId}/members/${memberId}`);
  return response.data;
};

// Users search / listing
export const getUsersApi = async (search = '') => {
  const response = await api.get(`/users${search ? `?search=${encodeURIComponent(search)}` : ''}`);
  return response.data;
};

// Task endpoints
export const createTaskApi = async (projectId, taskData) => {
  const response = await api.post(`/projects/${projectId}/tasks`, taskData);
  return response.data;
};

export const updateTaskApi = async (taskId, updates) => {
  const response = await api.patch(`/tasks/${taskId}`, updates);
  return response.data;
};

export const deleteTaskApi = async (taskId) => {
  const response = await api.delete(`/tasks/${taskId}`);
  return response.data;
};

// Comment endpoints
export const getTaskCommentsApi = async (taskId) => {
  const response = await api.get(`/tasks/${taskId}/comments`);
  return response.data;
};

export const createTaskCommentApi = async (taskId, message) => {
  const response = await api.post(`/tasks/${taskId}/comments`, { message });
  return response.data;
};

export const deleteCommentApi = async (commentId) => {
  const response = await api.delete(`/comments/${commentId}`);
  return response.data;
};

export default api;
