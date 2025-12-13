// travel-tour-frontend/src/services/blogApi.js
import axios from 'axios';
import { io } from 'socket.io-client';

// Get blog API URL from environment variable or use default
const BLOG_API_URL = import.meta.env.VITE_BLOG_API_URL || 'https://travel-tour-blog-server.onrender.com/api';

console.log(`🚀 Blog API - WITH REAL-TIME DASHBOARD & NEWSLETTER`);

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

// Listen for new submissions from admin
socket.on('new-submission', (data) => {
    console.log('📝 New submission received via socket:', data.submission?._id);
    // This is handled in AdminSubmissionsDashboard.jsx
});

// Listen for admin replies (user side)
socket.on('admin-reply', (data) => {
    console.log('💬 Admin reply received via socket:', data.submissionId);
    console.log('📧 For email:', data.email);
    console.log('💭 Message:', data.message?.substring(0, 50) + '...');
    // This is handled in UserSubmissionsDashboard.jsx
});

// ============================================
// NEWSLETTER SUBSCRIPTION NOTIFICATION
// ============================================
socket.on('new-newsletter-subscriber', (data) => {
    console.log('📧 New newsletter subscriber received:', data.subscriber?.email);
    console.log('👤 Subscriber name:', data.subscriber?.name);
    console.log('📅 Subscribed at:', data.subscriber?.subscribedAt);
    
    // You can trigger a notification or update state here if needed
    // This will be used in AdminSubmissionsDashboard.jsx to update newsletter stats in real-time
    if (data.notification && data.subscriber) {
        console.log('🔔 Newsletter subscription notification triggered');
        
        // Dispatch a custom event that components can listen to
        const newsletterEvent = new CustomEvent('newsletter-subscription', {
            detail: {
                subscriber: data.subscriber,
                timestamp: new Date().toISOString(),
                type: 'new-newsletter-subscriber'
            }
        });
        window.dispatchEvent(newsletterEvent);
    }
});

// Listen for admin connection confirmation
socket.on('admin-connected-confirm', (data) => {
    console.log('👑 Admin connection confirmed:', data.message);
});

// Listen for user connection confirmation
socket.on('user-connected-confirm', (data) => {
    console.log('👤 User connection confirmed for:', data.email);
});

// Error handling for socket
socket.on('connect_error', (error) => {
    console.error('❌ Socket connection error:', error.message);
});

socket.on('error', (error) => {
    console.error('❌ Socket error:', error);
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
    },
    (error) => {
        console.error('❌ Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor
blogApi.interceptors.response.use(
    (response) => {
        console.log('✅ API Success:', {
            url: response.config.url,
            status: response.status,
            success: response.data?.success || false
        });
        return response;
    },
    (error) => {
        console.log('❌ API Error:', {
            url: error.config?.url,
            message: error.message,
            code: error.code,
            status: error.response?.status,
            data: error.response?.data
        });
        
        // Handle specific error cases
        if (error.code === 'ECONNABORTED') {
            console.error('⏰ Request timeout - Server might be waking up');
        }
        
        if (error.response?.status === 401) {
            console.error('🔐 Unauthorized - Token might be expired');
        }
        
        if (error.response?.status === 404) {
            console.error('🔍 Endpoint not found');
        }
        
        return Promise.reject(error);
    }
);

// Newsletter API helper functions
const newsletterApi = {
    // Subscribe to newsletter
    subscribe: async (name, email) => {
        try {
            const response = await blogApi.post('/newsletter/subscribe', {
                name,
                email
            });
            return response.data;
        } catch (error) {
            console.error('❌ Newsletter subscription error:', error);
            throw error;
        }
    },
    
    // Get newsletter subscribers (admin only)
    getSubscribers: async (params = {}) => {
        try {
            const response = await blogApi.get('/newsletter/subscribers', { params });
            return response.data;
        } catch (error) {
            console.error('❌ Get subscribers error:', error);
            throw error;
        }
    },
    
    // Get newsletter statistics
    getStats: async () => {
        try {
            const response = await blogApi.get('/newsletter/stats');
            return response.data;
        } catch (error) {
            console.error('❌ Get newsletter stats error:', error);
            throw error;
        }
    },
    
    // Export subscribers to CSV
    exportSubscribers: async () => {
        try {
            const response = await blogApi.get('/newsletter/export', {
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            console.error('❌ Export subscribers error:', error);
            throw error;
        }
    },
    
    // Unsubscribe from newsletter
    unsubscribe: async (email) => {
        try {
            const response = await blogApi.post('/newsletter/unsubscribe', { email });
            return response.data;
        } catch (error) {
            console.error('❌ Unsubscribe error:', error);
            throw error;
        }
    }
};

// Submissions API helper functions
const submissionsApi = {
    // Submit contact form
    submitContact: async (formData) => {
        try {
            const response = await blogApi.post('/contact/submit', formData);
            return response.data;
        } catch (error) {
            console.error('❌ Contact submission error:', error);
            throw error;
        }
    },
    
    // Get admin submissions
    getAdminSubmissions: async () => {
        try {
            const response = await blogApi.get('/submissions/admin');
            return response.data;
        } catch (error) {
            console.error('❌ Get admin submissions error:', error);
            throw error;
        }
    },
    
    // Get user submissions
    getUserSubmissions: async (email) => {
        try {
            const response = await blogApi.get(`/submissions/user/${encodeURIComponent(email)}`);
            return response.data;
        } catch (error) {
            console.error('❌ Get user submissions error:', error);
            throw error;
        }
    },
    
    // Send reply to submission
    sendReply: async (submissionId, adminReply, adminId = 'admin') => {
        try {
            const response = await blogApi.post(`/submissions/${submissionId}/reply`, {
                adminReply,
                adminId
            });
            return response.data;
        } catch (error) {
            console.error('❌ Send reply error:', error);
            throw error;
        }
    },
    
    // Mark as read by admin
    markAsReadAdmin: async (submissionId) => {
        try {
            const response = await blogApi.put(`/submissions/${submissionId}/read-admin`);
            return response.data;
        } catch (error) {
            console.error('❌ Mark as read admin error:', error);
            throw error;
        }
    },
    
    // Mark as read by user
    markAsReadUser: async (submissionId) => {
        try {
            const response = await blogApi.put(`/submissions/${submissionId}/read-user`);
            return response.data;
        } catch (error) {
            console.error('❌ Mark as read user error:', error);
            throw error;
        }
    },
    
    // Get admin unread count
    getAdminUnreadCount: async () => {
        try {
            const response = await blogApi.get('/submissions/admin/unread-count');
            return response.data;
        } catch (error) {
            console.error('❌ Get admin unread count error:', error);
            throw error;
        }
    },
    
    // Get user unread count
    getUserUnreadCount: async (email) => {
        try {
            const response = await blogApi.get(`/submissions/user/${encodeURIComponent(email)}/unread-count`);
            return response.data;
        } catch (error) {
            console.error('❌ Get user unread count error:', error);
            throw error;
        }
    },
    
    // Delete submission
    deleteSubmission: async (submissionId) => {
        try {
            const response = await blogApi.delete(`/submissions/${submissionId}`);
            return response.data;
        } catch (error) {
            console.error('❌ Delete submission error:', error);
            throw error;
        }
    },
    
    // Debug submission
    debugSubmission: async (submissionId) => {
        try {
            const response = await blogApi.get(`/debug-submission/${submissionId}`);
            return response.data;
        } catch (error) {
            console.error('❌ Debug submission error:', error);
            throw error;
        }
    }
};

// Blog API helper functions
const blogApiHelpers = {
    // User blog posts
    getUserPosts: async (params = {}) => {
        try {
            const response = await blogApi.get('/user/blog/posts', { params });
            return response.data;
        } catch (error) {
            console.error('❌ Get user posts error:', error);
            throw error;
        }
    },
    
    // Get single blog post
    getPost: async (postId) => {
        try {
            const response = await blogApi.get(`/user/blog/posts/${postId}`);
            return response.data;
        } catch (error) {
            console.error('❌ Get post error:', error);
            throw error;
        }
    },
    
    // Admin blog posts
    getAdminPosts: async (params = {}) => {
        try {
            const response = await blogApi.get('/admin/blog/posts', { params });
            return response.data;
        } catch (error) {
            console.error('❌ Get admin posts error:', error);
            throw error;
        }
    },
    
    // Create blog post
    createPost: async (postData) => {
        try {
            const response = await blogApi.post('/admin/blog/posts', postData);
            return response.data;
        } catch (error) {
            console.error('❌ Create post error:', error);
            throw error;
        }
    },
    
    // Update blog post
    updatePost: async (postId, postData) => {
        try {
            const response = await blogApi.put(`/admin/blog/posts/${postId}`, postData);
            return response.data;
        } catch (error) {
            console.error('❌ Update post error:', error);
            throw error;
        }
    },
    
    // Delete blog post
    deletePost: async (postId) => {
        try {
            const response = await blogApi.delete(`/admin/blog/posts/${postId}`);
            return response.data;
        } catch (error) {
            console.error('❌ Delete post error:', error);
            throw error;
        }
    }
};

// Combine all API helpers
export const api = {
    newsletter: newsletterApi,
    submissions: submissionsApi,
    blog: blogApiHelpers,
    socket: socket,
    raw: blogApi // For direct axios access if needed
};

// Export the default blogApi for backward compatibility
export default blogApi;