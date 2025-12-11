// travel-tour-frontend/src/services/blogApi.js
import axios from 'axios';
import { io } from 'socket.io-client';

// Get blog API URL from environment variable or use default
const BLOG_API_URL = import.meta.env.VITE_BLOG_API_URL || 'https://travel-tour-blog-server.onrender.com/api';

console.log(`🚀 Blog API - WITH REAL-TIME DASHBOARD`);

// Create socket connection for real-time updates - SINGLE EXPORT
const socketUrl = BLOG_API_URL.replace('/api', '');
export const socket = io(socketUrl, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
});

// Socket event listeners - No duplicate export here
socket.on('connect', () => {
    console.log('🔌 Socket connected:', socket.id);
});

socket.on('disconnect', () => {
    console.log('🔌 Socket disconnected');
});

// Create axios instance for API calls
const blogApi = axios.create({
    baseURL: BLOG_API_URL,
    timeout: 180000, // ⚡ 180 SECONDS (3 minutes) for Render.com
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