// travel-tour-frontend/src/services/blogApi.js
import axios from 'axios';

// Get blog API URL from environment variable or use default
const BLOG_API_URL = import.meta.env.VITE_BLOG_API_URL || 'https://travel-tour-blog-server.onrender.com/api';

console.log('📚 Blog API Configuration:', {
  url: BLOG_API_URL,
  hasEnvVar: !!import.meta.env.VITE_BLOG_API_URL
});

const blogApi = axios.create({
  baseURL: BLOG_API_URL,
  timeout: 30000,
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
    
    console.log(`📚 Blog API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Blog API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for blog API
blogApi.interceptors.response.use(
  (response) => {
    console.log(`✅ Blog API Response: ${response.config.url}`, {
      status: response.status
    });
    return response;
  },
  (error) => {
    console.error('❌ Blog API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    });
    return Promise.reject(error);
  }
);

export default blogApi;