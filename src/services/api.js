import axios from 'axios';

// Dynamic API base URL - Render for production, local for development
const getApiBaseUrl = () => {
  if (window.location.hostname === 'localhost') {
    return 'http://localhost:5000/api';
  } else {
    // UPDATED: Your actual Render backend URL
    return 'https://travel-tour-academy-backend.onrender.com/api';
  }
};

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      // Optional: redirect to login
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;