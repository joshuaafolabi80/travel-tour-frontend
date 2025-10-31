import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect() {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    // Dynamic socket URL
    const getSocketUrl = () => {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:5000';
      } else {
        return 'https://travel-tour-academy-backend.onrender.com';
      }
    };

    const socketUrl = getSocketUrl();
    console.log(`🔌 Connecting to socket server: ${socketUrl}`);

    this.socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      timeout: 20000
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to server with ID:', this.socket.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      if (userData.id) {
        this.socket.emit('user_join', {
          userId: userData.id,
          userName: userData.name || userData.username || 'User',
          role: userData.role || 'student'
        });
        console.log(`👤 Sent user_join for: ${userData.name || userData.username}`);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from server:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error.message);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('💥 Max reconnection attempts reached');
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Reconnected after ${attemptNumber} attempts`);
      this.isConnected = true;
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 Reconnection attempt ${attemptNumber}`);
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('❌ Reconnection error:', error);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('💥 Reconnection failed');
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting socket...');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  getSocket() {
    if (!this.socket || !this.socket.connected) {
      return this.connect();
    }
    return this.socket;
  }

  isSocketConnected() {
    return this.isConnected && this.socket?.connected;
  }

  // WebRTC signaling methods
  sendWebRTCOffer(targetSocketId, offer, senderName) {
    if (this.isSocketConnected()) {
      this.socket.emit('webrtc_offer', {
        targetSocketId,
        offer,
        senderName
      });
    }
  }

  sendWebRTCAnswer(targetSocketId, answer) {
    if (this.isSocketConnected()) {
      this.socket.emit('webrtc_answer', {
        targetSocketId,
        answer
      });
    }
  }

  sendWebRTCICECandidate(targetSocketId, candidate) {
    if (this.isSocketConnected()) {
      this.socket.emit('webrtc_ice_candidate', {
        targetSocketId,
        candidate
      });
    }
  }
}

export default new SocketService();