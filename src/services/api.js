// travel-tour-frontend/src/services/api.js
import axios from 'axios';

// Environment detection and logging
const isProduction = import.meta.env.PROD;
const isDevelopment = import.meta.env.DEV;
const environment = import.meta.env.MODE;

// Log environment information
console.log('🚀 Environment Detection:', {
  mode: environment,
  isProduction: isProduction,
  isDevelopment: isDevelopment,
  baseURL: import.meta.env.VITE_API_BASE_URL || 'Not set',
  meetAPIBaseURL: import.meta.env.VITE_MEET_API_BASE_URL || 'Not set'
});

// Dynamic API base URL
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    console.log('🌐 Using VITE_API_BASE_URL from environment:', import.meta.env.VITE_API_BASE_URL);
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('🌐 Using localhost development URL');
    return 'http://localhost:5000/api';
  }
  
  console.log('🌐 Using fallback Render backend URL');
  return 'https://travel-tour-academy-backend.onrender.com/api';
};

const API_BASE_URL = getApiBaseUrl();

// Meet API URL helper
const getMeetApiBaseUrl = () => {
  if (import.meta.env.VITE_MEET_API_BASE_URL) {
    console.log('🎯 Using VITE_MEET_API_BASE_URL from environment:', import.meta.env.VITE_MEET_API_BASE_URL);
    return import.meta.env.VITE_MEET_API_BASE_URL;
  }
  
  // Fallback - use main API base URL with /meet path
  const base = API_BASE_URL.replace('/api', '');
  console.log('🎯 Using fallback meet API URL:', `${base}/api/meet`);
  return `${base}/api/meet`;
};

const MEET_API_BASE_URL = getMeetApiBaseUrl();

// Environment helper functions
const getEnvironment = () => ({
  isProduction,
  isDevelopment,
  mode: environment,
  baseURL: API_BASE_URL,
  meetAPIBaseURL: MEET_API_BASE_URL
});

// Final URL logging
console.log('🎯 Final Configuration:', {
  environment: environment,
  apiBaseURL: API_BASE_URL,
  meetAPIBaseURL: MEET_API_BASE_URL,
  hostname: window.location.hostname
});

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
    
    if (isDevelopment) {
      console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request Interceptor Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    if (isDevelopment) {
      console.log(`✅ API Response: ${response.config.url}`, {
        status: response.status
      });
    }
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    });
    
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
    }
    
    return Promise.reject(error);
  }
);

export default api;
export { 
  getApiBaseUrl, 
  getMeetApiBaseUrl,
  getEnvironment,
  MEET_API_BASE_URL 
};