import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    // ✅ UPDATED: Use Vite environment variable with import.meta.env
    this.SOCKET_URL = import.meta.env.VITE_EXPERIENCES_SOCKET_URL || 'http://localhost:5002';
    this.listeners = new Map();
  }

  /**
   * Connect to the Socket.IO server
   * @returns {Socket} The socket instance
   */
  connect() {
    if (!this.socket) {
      console.log('🔄 Connecting to Socket.IO server at:', this.SOCKET_URL);
      
      this.socket = io(this.SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000,
        autoConnect: true,
        forceNew: false,
        withCredentials: false
      });

      // Set up event listeners
      this.setupEventListeners();
    }
    
    return this.socket;
  }

  /**
   * Set up all Socket.IO event listeners
   */
  setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ Connected to Experiences WebSocket:', this.socket.id);
      this.joinExperiencesRoom();
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
      this.notifyListeners('connection-error', { error: error.message });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from Experiences WebSocket. Reason:', reason);
      this.notifyListeners('disconnected', { reason });
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Reconnected to WebSocket (attempt ${attemptNumber})`);
      this.joinExperiencesRoom();
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('❌ Reconnection error:', error);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ Failed to reconnect to WebSocket');
    });

    // Application-specific events
    this.socket.on('new-experience', (data) => {
      console.log('📨 New experience received:', data);
      this.notifyListeners('new-experience', data);
    });

    this.socket.on('experience-like-updated', (data) => {
      console.log('👍 Experience like update:', data);
      this.notifyListeners('experience-like-updated', data);
    });

    this.socket.on('experience-approved', (data) => {
      console.log('✅ Experience approved:', data);
      this.notifyListeners('experience-approved', data);
    });

    this.socket.on('experience-rejected', (data) => {
      console.log('❌ Experience rejected:', data);
      this.notifyListeners('experience-rejected', data);
    });
  }

  /**
   * Join the experiences room on the server
   */
  joinExperiencesRoom() {
    if (this.socket && this.socket.connected) {
      this.socket.emit('join-experiences-room');
      console.log('🏠 Joined experiences room');
    }
  }

  /**
   * Disconnect from the Socket.IO server
   */
  disconnect() {
    if (this.socket) {
      console.log('🛑 Disconnecting from Socket.IO server');
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }

  /**
   * Check if socket is connected
   * @returns {boolean} Connection status
   */
  isConnected() {
    return this.socket && this.socket.connected;
  }

  /**
   * Get socket connection ID
   * @returns {string|null} Socket ID or null
   */
  getSocketId() {
    return this.socket ? this.socket.id : null;
  }

  // ==================== EMIT EVENTS ====================

  /**
   * Emit when an experience is submitted
   * @param {Object} experience - The experience data
   */
  emitExperienceSubmitted(experience) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('experience-submitted', experience);
      console.log('📤 Emitted experience-submitted:', experience._id || experience.title);
    } else {
      console.warn('⚠️ Cannot emit: Socket not connected');
    }
  }

  /**
   * Emit when an experience is liked
   * @param {string} experienceId - The experience ID
   * @param {number} likes - The new like count
   */
  emitExperienceLiked(experienceId, likes) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('experience-liked', { experienceId, likes });
      console.log('📤 Emitted experience-liked:', { experienceId, likes });
    } else {
      console.warn('⚠️ Cannot emit: Socket not connected');
    }
  }

  /**
   * Emit when user views an experience
   * @param {string} experienceId - The experience ID
   */
  emitExperienceViewed(experienceId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('experience-viewed', { experienceId });
    }
  }

  /**
   * Emit when user joins as admin
   * @param {string} adminId - Admin user ID
   */
  emitJoinAdminRoom(adminId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('join-admin-room', { adminId });
    }
  }

  // ==================== LISTENER MANAGEMENT ====================

  /**
   * Add a listener for a specific event
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  addListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    
    this.listeners.get(event).push(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * Remove a specific listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function to remove
   */
  removeListener(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
    
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Remove all listeners for an event
   * @param {string} event - Event name
   */
  removeAllListeners(event) {
    if (this.socket) {
      this.socket.removeAllListeners(event);
    }
    
    if (this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
  }

  /**
   * Notify all listeners of an event
   * @param {string} event - Event name
   * @param {Object} data - Event data
   */
  notifyListeners(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      // Use setTimeout to prevent blocking
      setTimeout(() => {
        callbacks.forEach(callback => {
          try {
            callback(data);
          } catch (error) {
            console.error(`❌ Error in ${event} listener:`, error);
          }
        });
      }, 0);
    }
  }

  // ==================== NEW METHODS ADDED ====================

  /**
   * Listen for new experience events
   * @param {Function} callback - Callback function for new experiences
   */
  onNewExperience(callback) {
    if (this.socket) {
      this.socket.on('new-experience', callback);
    } else {
      // Store the callback for when socket connects
      console.log('⚠️ Socket not connected yet, storing callback');
      this.addListener('new-experience', callback);
    }
  }

  /**
   * Listen for experience like updated events
   * @param {Function} callback - Callback function for like updates
   */
  onLikeUpdated(callback) {
    if (this.socket) {
      this.socket.on('experience-like-updated', callback);
    } else {
      this.addListener('experience-like-updated', callback);
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Get the raw socket instance
   * @returns {Socket|null} Socket instance or null
   */
  getSocket() {
    return this.socket;
  }

  /**
   * Reconnect to the server
   */
  reconnect() {
    if (this.socket) {
      this.socket.connect();
    }
  }

  /**
   * Get connection status
   * @returns {Object} Connection status information
   */
  getStatus() {
    return {
      connected: this.isConnected(),
      socketId: this.getSocketId(),
      url: this.SOCKET_URL,
      listeners: Array.from(this.listeners.keys())
    };
  }
}

// Create and export singleton instance
const socketService = new SocketService();

// For debugging in development
if (import.meta.env.DEV) {
  window.socketService = socketService;
}

export default socketService;