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
  timeout: 120000, // 120 seconds (2 minutes) for Render cold starts
  headers: {
    'Content-Type': 'application/json'
  }
});

// Retry logic for failed requests
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds between retries

// Request interceptor for blog API
blogApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Initialize retry count if not present
    config._retryCount = config._retryCount || 0;
    
    // 🔍 DEBUG: Log the full URL being called
    const fullUrl = config.baseURL + config.url;
    console.log('🔗 Blog API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      fullUrl: fullUrl,
      timeout: config.timeout,
      retryCount: config._retryCount,
      hasAuth: !!token
    });
    
    return config;
  },
  (error) => {
    console.error('❌ Blog API Request Error:', error.message);
    return Promise.reject(error);
  }
);

// Response interceptor with retry logic
blogApi.interceptors.response.use(
  (response) => {
    console.log(`✅ Blog API Response: ${response.config.url}`, {
      status: response.status,
      retryCount: response.config._retryCount || 0
    });
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // If it's a timeout error and we haven't retried enough times
    const isTimeoutError = error.code === 'ECONNABORTED' || error.message?.includes('timeout');
    
    if (isTimeoutError && originalRequest && (!originalRequest._retryCount || originalRequest._retryCount < MAX_RETRIES)) {
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
      
      // Calculate delay: 5s, 10s, 15s for retries
      const delay = originalRequest._retryCount * RETRY_DELAY;
      
      console.log(`🔄 Retry ${originalRequest._retryCount}/${MAX_RETRIES} in ${delay/1000}s for:`, originalRequest.url);
      
      // Wait and retry
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Increase timeout for retry
      originalRequest.timeout = 150000; // 150 seconds for retry
      
      return blogApi(originalRequest);
    }
    
    // Final error after all retries
    console.error('❌ Blog API Final Error:', {
      url: originalRequest?.url,
      method: originalRequest?.method,
      status: error.response?.status,
      message: error.message,
      retries: originalRequest?._retryCount || 0,
      maxRetries: MAX_RETRIES
    });
    
    return Promise.reject(error);
  }
);

export default blogApi;