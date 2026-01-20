


// travel-tour-frontend/src/services/importantInfoApi.js - COMPLETE UPDATED VERSION
import axios from 'axios';

const importantInfoApi = axios.create({
    baseURL: 'https://travel-tour-important-info-backend.onrender.com/api',
    headers: {
        'Content-Type': 'application/json'
    },
    timeout: 30000, // 30 second timeout
    withCredentials: true // Important for CORS with credentials
});

// Add token to requests
importantInfoApi.interceptors.request.use(
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

// Enhanced response interceptor
importantInfoApi.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', {
            status: error.response?.status,
            message: error.message,
            config: error.config?.url
        });
        
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            window.location.href = '/';
        }
        
        // Handle CORS errors
        if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
            console.error('Network/CORS error. Check backend CORS configuration.');
        }
        
        return Promise.reject(error);
    }
);

// API methods
export const importantInfoService = {
    // Admin: Create important info
    createImportantInfo: (formData) => {
        return importantInfoApi.post('/important-info/create', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },

    // Admin: Get all messages
    getAllMessages: (page = 1, limit = 10) => {
        return importantInfoApi.get(`/important-info/admin/all?page=${page}&limit=${limit}`);
    },

    // Admin: Update important info
    updateImportantInfo: (messageId, formData) => {
        return importantInfoApi.put(`/important-info/admin/${messageId}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },

    // User: Get user messages
    getUserMessages: (page = 1, limit = 10) => {
        return importantInfoApi.get(`/important-info/user/all?page=${page}&limit=${limit}`);
    },

    // Mark message as read
    markAsRead: (messageId) => {
        return importantInfoApi.put(`/important-info/read/${messageId}`);
    },

    // Get unread count
    getUnreadCount: () => {
        return importantInfoApi.get('/important-info/unread-count');
    },

    // Delete message for user
    deleteMessage: (messageId) => {
        return importantInfoApi.delete(`/important-info/user/${messageId}`);
    },

    // Admin: Delete permanently
    deletePermanently: (messageId) => {
        return importantInfoApi.delete(`/important-info/admin/${messageId}`);
    },

    // Get notifications
    getNotifications: (page = 1, limit = 10) => {
        return importantInfoApi.get(`/important-info/notifications?page=${page}&limit=${limit}`);
    },

    // Mark all notifications as read
    markAllNotificationsAsRead: () => {
        return importantInfoApi.put('/important-info/notifications/mark-all-read');
    },

    // Clear all notifications
    clearAllNotifications: () => {
        return importantInfoApi.delete('/important-info/notifications/clear-all');
    },

    // Upload files
    uploadFiles: (files) => {
        const formData = new FormData();
        files.forEach(file => {
            formData.append('files', file);
        });
        return importantInfoApi.post('/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    }
};

export default importantInfoApi;