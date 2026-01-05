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

// Create separate meetApi instance for Meet API calls
const meetApi = axios.create({
  baseURL: MEET_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000,
});

// Helper function to get token - checks both possible token locations
const getAuthToken = () => {
  // Check for token in localStorage (your AdminStudents.jsx uses this)
  const token = localStorage.getItem('token');
  if (token) {
    console.log('🔑 Found token in localStorage');
    return token;
  }
  
  // Check for authToken (your current api.js uses this)
  const authToken = localStorage.getItem('authToken');
  if (authToken) {
    console.log('🔑 Found authToken in localStorage, migrating to token...');
    localStorage.setItem('token', authToken);
    return authToken;
  }
  
  console.log('🔑 No token found in localStorage');
  return null;
};

// Request interceptor to add auth token - UPDATED with better logging
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Enhanced logging for debugging
    console.log('📤 API Request:', {
      url: config.url,
      method: config.method?.toUpperCase(),
      hasToken: !!token,
      tokenLength: token?.length,
      headers: config.headers
    });
    
    return config;
  },
  (error) => {
    console.error('📤 Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Request interceptor for meetApi
meetApi.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log('📤 Meet API Request:', {
      url: config.url,
      method: config.method?.toUpperCase(),
      hasToken: !!token
    });
    
    return config;
  },
  (error) => {
    console.error('📤 Meet API Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling - UPDATED with better logging
api.interceptors.response.use(
  (response) => {
    console.log('📥 API Response:', {
      url: response.config.url,
      status: response.status,
      statusText: response.statusText,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.response?.data?.message || error.message,
      headers: error.response?.config?.headers
    });
    
    if (error.response?.status === 401) {
      console.warn('⚠️ Unauthorized (401) - Clearing tokens and redirecting');
      // Clear both possible token locations
      localStorage.removeItem('token');
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      window.location.href = '/';
    }
    
    return Promise.reject(error);
  }
);

// Response interceptor for meetApi
meetApi.interceptors.response.use(
  (response) => {
    console.log('📥 Meet API Response:', {
      url: response.config.url,
      status: response.status
    });
    return response;
  },
  (error) => {
    console.error('❌ Meet API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    });
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      window.location.href = '/';
    }
    
    return Promise.reject(error);
  }
);

export default api;
export { 
  meetApi,
  getApiBaseUrl, 
  getMeetApiBaseUrl,
  getEnvironment,
  MEET_API_BASE_URL,
  getAuthToken  // Export for manual token checking
};