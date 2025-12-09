// travel-tour-frontend/src/services/blogApi.js
import axios from 'axios';

// Get blog API URL from environment variable or use default
const BLOG_API_URL = import.meta.env.VITE_BLOG_API_URL || 'https://travel-tour-blog-server.onrender.com/api';

console.log('📚 Blog API Configuration:', {
  url: BLOG_API_URL,
  envVar: import.meta.env.VITE_BLOG_API_URL,
  hasEnvVar: !!import.meta.env.VITE_BLOG_API_URL,
  computedUrl: BLOG_API_URL
});

const blogApi = axios.create({
  baseURL: BLOG_API_URL,
  timeout: 60000, // Increased to 60 seconds for Render cold starts
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for blog API
blogApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // 🔍 DEBUG: Log the full URL being called
    const fullUrl = config.baseURL + config.url;
    console.log('🔗 Blog API Full URL:', fullUrl);
    console.log(`📚 Blog API Request: ${config.method?.toUpperCase()} ${config.url}`, {
      baseURL: config.baseURL,
      fullUrl: fullUrl,
      timeout: config.timeout,
      hasAuth: !!token
    });
    
    return config;
  },
  (error) => {
    console.error('❌ Blog API Request Error:', {
      message: error.message,
      config: error.config
    });
    return Promise.reject(error);
  }
);

// Response interceptor for blog API
blogApi.interceptors.response.use(
  (response) => {
    console.log(`✅ Blog API Response: ${response.config.url}`, {
      status: response.status,
      data: response.data,
      fullUrl: response.config.baseURL + response.config.url
    });
    return response;
  },
  (error) => {
    console.error('❌ Blog API Error Details:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      fullUrl: error.config?.baseURL + error.config?.url,
      method: error.config?.method,
      timeout: error.config?.timeout
    });
    return Promise.reject(error);
  }
);

export default blogApi;