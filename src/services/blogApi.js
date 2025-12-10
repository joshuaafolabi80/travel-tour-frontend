// travel-tour-frontend/src/services/blogApi.js
import axios from 'axios';

// Get blog API URL from environment variable or use default
const BLOG_API_URL = import.meta.env.VITE_BLOG_API_URL || 'https://travel-tour-blog-server.onrender.com/api';

// Cache busting version
const API_VERSION = 'no-retry-v2-' + Date.now();
console.log(`🚀 Blog API ${API_VERSION} - NO RETRY VERSION LOADED`);

const blogApi = axios.create({
  baseURL: BLOG_API_URL,
  timeout: 60000, // 60 seconds - shorter timeout
  headers: {
    'Content-Type': 'application/json',
    'X-Cache-Bust': API_VERSION
  }
});

// SIMPLE request interceptor - NO RETRY LOGIC
blogApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log('📤 API Request (NO RETRY):', {
      url: config.url,
      method: config.method,
      timeout: config.timeout
    });
    
    return config;
  }
);

// SIMPLE response interceptor - NO RETRY LOGIC
blogApi.interceptors.response.use(
  (response) => {
    console.log('✅ API Success:', {
      url: response.config.url,
      status: response.status
    });
    return response;
  },
  (error) => {
    console.log('❌ API Error (No Retry):', {
      url: error.config?.url,
      message: error.message,
      code: error.code
    });
    return Promise.reject(error);
  }
);

export default blogApi;