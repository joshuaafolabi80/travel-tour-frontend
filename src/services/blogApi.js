// travel-tour-frontend/src/services/blogApi.js
import axios from 'axios';

// Get blog API URL from environment variable or use default
const BLOG_API_URL = import.meta.env.VITE_BLOG_API_URL || 'https://travel-tour-blog-server.onrender.com/api';

console.log(`🚀 Blog API - RENDER.COM EDITION`);

const blogApi = axios.create({
  baseURL: BLOG_API_URL,
  timeout: 180000, // ⚡ INCREASED TO 180 SECONDS (3 minutes) for Render.com
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
blogApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log('📤 API Request:', {
      url: config.url,
      method: config.method,
      timeout: config.timeout
    });
    
    return config;
  }
);

// Response interceptor
blogApi.interceptors.response.use(
  (response) => {
    console.log('✅ API Success:', {
      url: response.config.url,
      status: response.status
    });
    return response;
  },
  (error) => {
    console.log('❌ API Error:', {
      url: error.config?.url,
      message: error.message,
      code: error.code
    });
    return Promise.reject(error);
  }
);

export default blogApi;