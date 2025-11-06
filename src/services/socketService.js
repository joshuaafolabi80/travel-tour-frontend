// travel-tour-frontend/src/services/socketService.js
import { io } from 'socket.io-client';
import { getSocketURL } from './api';

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

    const socketUrl = getSocketURL();
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
      
      // Re-send user join on reconnect
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      if (userData.id) {
        this.socket.emit('user_join', {
          userId: userData.id,
          userName: userData.name || userData.username || 'User',
          role: userData.role || 'student'
        });
      }
    });

    // Community call events - FIXED: Include user data
    this.socket.on('call_started', (data) => {
      console.log('📞 Call started by admin:', data);
      window.dispatchEvent(new CustomEvent('community_call_started', { detail: data }));
    });

    this.socket.on('call_ended', (data) => {
      console.log('📞 Call ended:', data);
      window.dispatchEvent(new CustomEvent('community_call_ended', { detail: data }));
    });

    this.socket.on('user_joined_call', (data) => {
      console.log(`👤 ${data.userName} joined the call`);
      window.dispatchEvent(new CustomEvent('user_joined_call', { detail: data }));
    });

    this.socket.on('user_left_call', (data) => {
      console.log(`👤 ${data.userName} left the call`);
      window.dispatchEvent(new CustomEvent('user_left_call', { detail: data }));
    });

    this.socket.on('new_message', (data) => {
      console.log('💬 New message received:', data);
      window.dispatchEvent(new CustomEvent('new_message', { detail: data }));
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

  // Community call methods - FIXED: Include user data
  startCommunityCall(callData = {}) {
    if (this.isSocketConnected()) {
      console.log('🎬 Starting community call...');
      this.socket.emit('admin_start_call', {
        ...callData,
        timestamp: new Date(),
        withAudio: true,
        withVideo: true
      });
    }
  }

  joinCommunityCall(callId, userData = {}) {
    if (this.isSocketConnected()) {
      console.log(`🎬 Joining community call: ${callId} as ${userData.userName}`);
      this.socket.emit('join_call', { 
        callId: callId,
        userId: userData.userId,
        userName: userData.userName,
        isAdmin: userData.isAdmin,
        withAudio: true 
      });
    }
  }

  leaveCommunityCall(callId) {
    if (this.isSocketConnected()) {
      console.log(`🎬 Leaving community call: ${callId}`);
      this.socket.emit('leave_call', { callId: callId });
    }
  }

  endCommunityCall(callId) {
    if (this.isSocketConnected()) {
      console.log(`🎬 Ending community call: ${callId}`);
      this.socket.emit('admin_end_call', { callId: callId });
    }
  }

  sendCommunityMessage(messageData) {
    if (this.isSocketConnected()) {
      console.log('💬 Sending message:', messageData);
      this.socket.emit('send_message', {
        text: messageData.text,
        callId: messageData.callId,
        sender: messageData.sender,
        isAdmin: messageData.isAdmin,
        timestamp: messageData.timestamp
      });
    }
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