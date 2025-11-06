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
  socketURL: import.meta.env.VITE_SOCKET_URL || 'Not set'
});

// Dynamic API base URL - Uses Netlify environment variables with fallbacks
const getApiBaseUrl = () => {
  // 1. First priority: Use Netlify environment variables (set in netlify.toml)
  if (import.meta.env.VITE_API_BASE_URL) {
    console.log('🌐 Using VITE_API_BASE_URL from environment:', import.meta.env.VITE_API_BASE_URL);
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // 2. Second priority: Your existing localhost detection
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('🌐 Using localhost development URL');
    return 'http://localhost:5000/api';
  }
  
  // 3. Fallback: Your Render backend URL
  console.log('🌐 Using fallback Render backend URL');
  return 'https://travel-tour-academy-backend.onrender.com/api';
};

const API_BASE_URL = getApiBaseUrl();

// Socket URL helper (for socketService.js)
const getSocketURL = () => {
  // 1. First priority: Netlify environment variable
  if (import.meta.env.VITE_SOCKET_URL) {
    console.log('🔌 Using VITE_SOCKET_URL from environment:', import.meta.env.VITE_SOCKET_URL);
    return import.meta.env.VITE_SOCKET_URL;
  }
  
  // 2. Local development
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('🔌 Using localhost socket URL');
    return 'http://localhost:5000';
  }
  
  // 3. Fallback to Render
  console.log('🔌 Using fallback Render socket URL');
  return 'https://travel-tour-academy-backend.onrender.com';
};

// Environment helper functions
const getEnvironment = () => ({
  isProduction,
  isDevelopment,
  mode: environment,
  baseURL: API_BASE_URL,
  socketURL: getSocketURL()
});

// Check if we're running on Netlify
const isNetlify = () => {
  return window.location.hostname.includes('netlify.app');
};

// Check if we're in development mode
const isDevMode = () => {
  return isDevelopment;
};

// Check if we're in production mode
const isProdMode = () => {
  return isProduction;
};

// Get current environment name
const getEnvName = () => {
  if (isProduction) return 'production';
  if (isDevelopment) return 'development';
  return environment;
};

// Final URL logging
console.log('🎯 Final Configuration:', {
  environment: getEnvName(),
  apiBaseURL: API_BASE_URL,
  socketURL: getSocketURL(),
  isNetlify: isNetlify(),
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
    
    // Enhanced logging in development
    if (isDevelopment) {
      console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
        baseURL: config.baseURL,
        headers: config.headers,
        data: config.data
      });
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
    // Log successful responses in development
    if (isDevelopment) {
      console.log(`✅ API Response: ${response.config.url}`, {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });
    }
    return response;
  },
  (error) => {
    // Enhanced error logging with environment context
    const errorDetails = {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.response?.data?.message || error.message,
      environment: getEnvName(),
      baseURL: API_BASE_URL
    };
    
    console.error('❌ API Error Details:', errorDetails);
    
    if (error.response?.status === 401) {
      console.warn('🔐 Authentication error - clearing local storage');
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      
      // Only redirect if not already on login page and we're in production
      if (!window.location.pathname.includes('/login') && isProduction) {
        console.log('🔄 Redirecting to login page');
        window.location.href = '/';
      }
    }
    
    // Handle network errors (backend down)
    if (!error.response) {
      console.error('🌐 Network Error - Backend might be unavailable', {
        environment: getEnvName(),
        attemptedURL: error.config?.baseURL + error.config?.url
      });
      
      // Show user-friendly message in production
      if (isProduction) {
        error.userMessage = 'Service temporarily unavailable. Please try again later.';
      }
    }
    
    // Add user-friendly message for common errors
    if (error.response?.status >= 500) {
      error.userMessage = 'Server error. Please try again later.';
    } else if (error.response?.status === 404) {
      error.userMessage = 'Requested resource not found.';
    } else if (error.response?.status === 403) {
      error.userMessage = 'You do not have permission to access this resource.';
    }
    
    return Promise.reject(error);
  }
);

// Export everything - SINGLE EXPORT BLOCK (no duplicate exports)
export default api;
export { 
  getApiBaseUrl, 
  getSocketURL, 
  getEnvironment, 
  isNetlify, 
  isDevMode, 
  isProdMode, 
  getEnvName 
};