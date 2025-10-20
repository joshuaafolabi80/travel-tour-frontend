import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect() {
    if (this.socket) return this.socket;

    // Dynamic socket URL - Render for production, local for development
    const getSocketUrl = () => {
      if (window.location.hostname === 'localhost') {
        return 'http://localhost:5000';
      } else {
        // UPDATED: Your actual Render backend URL
        return 'https://travel-tour-academy-backend.onrender.com';
      }
    };

    const socketUrl = getSocketUrl();

    this.socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true
    });

    this.socket.on('connect', () => {
      console.log('🔌 Connected to server');
      this.isConnected = true;
      
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      if (userData.id) {
        this.socket.emit('user_join', {
          userId: userData.id,
          userName: userData.name || userData.username,
          role: userData.role
        });
      }
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 Disconnected from server');
      this.isConnected = false;
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  getSocket() {
    return this.socket;
  }

  isSocketConnected() {
    return this.isConnected && this.socket?.connected;
  }
}

export default new SocketService();