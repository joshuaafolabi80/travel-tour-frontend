// travel-tour-frontend/src/services/socketService.js

import { io } from 'socket.io-client';

class SocketService {
    constructor() {
        this.socket = null;
        this.userId = null;
        this.isAdmin = false;
    }

    connect() {
        // Updated to check both potential token locations
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        
        if (!token || !userData) {
            console.warn('SocketService: No user data or token found for socket connection');
            return;
        }

        this.userId = userData.id || userData._id;
        this.isAdmin = userData.role === 'admin';

        // Connect to important info socket server
        this.socket = io('https://travel-tour-important-info-backend.onrender.com', {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5
        });

        this.socket.on('connect', () => {
            console.log('Connected to Important Info Socket Server');

            // Join user room
            if (this.userId) {
                this.socket.emit('join-user', this.userId);
            }

            // Join admin room if admin
            if (this.isAdmin) {
                this.socket.emit('join-admin', this.userId);
            }
        });

        this.socket.on('disconnect', (reason) => {
            console.log('Disconnected from socket server:', reason);
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error.message);
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    // Listen for new important info
    onNewImportantInfo(callback) {
        if (this.socket) {
            this.socket.on('new-important-info', callback);
        }
    }

    // Listen for notification updates
    onNotificationUpdate(callback) {
        if (this.socket) {
            this.socket.on('notification-updated', callback);
        }
    }

    // Listen for all notifications read
    onAllNotificationsRead(callback) {
        if (this.socket) {
            this.socket.on('all-notifications-read', callback);
        }
    }

    // Remove listeners
    removeListener(event, callback) {
        if (this.socket) {
            this.socket.off(event, callback);
        }
    }

    // Emit events
    emit(event, data) {
        if (this.socket) {
            this.socket.emit(event, data);
        }
    }
}

export default new SocketService();