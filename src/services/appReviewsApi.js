// trave;-tour-frontend/src/services/appReviewsApi.js

// travel-tour-frontend/src/services/appReviewsApi.js
import axios from 'axios';

const API_BASE_URL = process.env.VITE_APP_REVIEWS_URL || 'https://travel-tour-app-reviews.onrender.com/api';

const appReviewsApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
appReviewsApi.interceptors.request.use(
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

// Response interceptor for error handling
appReviewsApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout:', error.config.url);
      return Promise.reject({
        success: false,
        message: 'Request timeout. Please check your connection.',
        code: 'TIMEOUT'
      });
    }
    
    if (!error.response) {
      console.error('Network error:', error);
      return Promise.reject({
        success: false,
        message: 'Network error. Please check your internet connection.',
        code: 'NETWORK_ERROR'
      });
    }
    
    return Promise.reject(error.response.data);
  }
);

export default appReviewsApi;