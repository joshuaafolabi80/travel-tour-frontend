import React, { useState, useEffect } from 'react';
import CommunityCallModal from './CommunityCallModal';
import MessageThread from './MessageThread';
import socketService from '../services/socketService';
import webrtcService from '../services/webrtcService';

const AdminCommunityTab = () => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [currentCallId, setCurrentCallId] = useState(null);
  const [callParticipants, setCallParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasActiveCall, setHasActiveCall] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const socket = socketService.connect();
    
    // Store socket ID for WebRTC
    socket.on('connect', () => {
      console.log('✅ Admin connected to socket server with ID:', socket.id);
      setIsConnected(true);
      setSocketId(socket.id);
      
      // Join the app with admin data
      socket.emit('user_join', {
        userId: userData.id,
        userName: userData.name || userData.username || 'Admin',
        role: 'admin',
        socketId: socket.id
      });
    });

    // Listen for message history
    socket.on('message_history', (messageHistory) => {
      console.log('📜 Loading message history:', messageHistory.length, 'messages');
      setMessages(prev => [...messageHistory, ...prev]);
    });

    // Listen for call participants updates
    socket.on('call_participants_update', (data) => {
      console.log('📊 Participants updated:', data.participants);
      
      // Add socketId to participants for WebRTC
      const participantsWithSocket = data.participants.map(participant => ({
        ...participant,
        socketId: participant.socketId || participant.id
      }));
      
      setCallParticipants(participantsWithSocket);
      setCurrentCallId(data.callId);
    });

    // Listen for new messages
    socket.on('new_message', (message) => {
      console.log('💬 New message received:', message);
      setMessages(prev => [...prev, message]);
    });

    // Listen for user joining call
    socket.on('user_joined_call', (data) => {
      console.log(`👤 ${data.userName} joined the call with socket ID: ${data.socketId}`);
      
      // Add new participant with socket ID for WebRTC
      const newParticipant = {
        id: data.userId,
        userId: data.userId,
        name: data.userName,
        isMuted: false,
        isAdmin: false,
        isYou: false,
        role: 'student',
        socketId: data.socketId
      };
      
      setCallParticipants(prev => {
        const exists = prev.some(p => p.userId === data.userId);
        if (!exists) {
          return [...prev, newParticipant];
        }
        return prev;
      });

      // If call is active, initiate WebRTC connection with new participant
      if (isCallActive && data.socketId) {
        console.log(`🔗 Initiating WebRTC with new participant: ${data.userName}`);
        webrtcService.createOffer(data.socketId, data.userName);
      }
    });

    // Listen for user leaving call
    socket.on('user_left_call', (data) => {
      console.log(`👤 ${data.userName} left the call`);
      
      setCallParticipants(prev => 
        prev.filter(p => p.name !== data.userName)
      );
      
      // Close WebRTC connection
      if (data.socketId) {
        webrtcService.closeConnection(data.socketId);
      }
    });

    // WebRTC signaling events
    socket.on('webrtc_offer', (data) => {
      console.log('📥 Received WebRTC offer from:', data.senderName);
      webrtcService.handleOffer(data);
    });

    socket.on('webrtc_answer', (data) => {
      console.log('📥 Received WebRTC answer from:', data.senderSocketId);
      webrtcService.handleAnswer(data);
    });

    socket.on('webrtc_ice_candidate', (data) => {
      console.log('🧊 Received ICE candidate from:', data.senderSocketId);
      webrtcService.handleICECandidate(data);
    });

    // Cleanup on unmount
    return () => {
      socket.off('connect');
      socket.off('message_history');
      socket.off('call_participants_update');
      socket.off('new_message');
      socket.off('user_joined_call');
      socket.off('user_left_call');
      socket.off('webrtc_offer');
      socket.off('webrtc_answer');
      socket.off('webrtc_ice_candidate');
      
      // Cleanup WebRTC
      if (isCallActive) {
        webrtcService.stopLocalStream();
      }
    };
  }, [isCallActive]);

  // Initialize call
  const startCall = async () => {
    setIsLoading(true);
    try {
      const socket = socketService.getSocket();
      
      if (!socket) {
        console.error('Socket not connected');
        return;
      }

      console.log('🎤 Admin starting community call with WebRTC audio...');
      
      // Initialize WebRTC service first
      webrtcService.setSocket(socket);
      
      // Start local audio stream
      await webrtcService.startLocalStream();
      
      // Emit event to start call
      socket.emit('admin_start_call', {
        timestamp: new Date(),
        withAudio: true
      });

      // Set local state
      setIsCallActive(true);
      setHasActiveCall(true);
      
      // Add admin as first participant with socket ID
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      setCallParticipants([{
        id: userData.id,
        userId: userData.id,
        name: userData.name || userData.username || 'Admin',
        isMuted: false,
        isAdmin: true,
        isYou: true,
        role: 'admin',
        socketId: socket.id
      }]);
      
      console.log('✅ Community call started with WebRTC audio');
      
    } catch (error) {
      console.error('Error starting call:', error);
      alert('Failed to start call. Please check microphone permissions.');
    } finally {
      setIsLoading(false);
    }
  };

  // End call
  const endCall = () => {
    const socket = socketService.getSocket();
    if (socket && currentCallId) {
      socket.emit('admin_end_call', { callId: currentCallId });
    }
    
    // Cleanup WebRTC
    webrtcService.stopLocalStream();
    callParticipants.forEach(participant => {
      if (!participant.isYou) {
        webrtcService.closeConnection(participant.socketId);
      }
    });
    
    setIsCallActive(false);
    setCurrentCallId(null);
    setCallParticipants([]);
    setHasActiveCall(false);
    
    console.log('🔚 Call ended and WebRTC cleaned up');
  };

  // Add message to thread
  const addMessage = (message) => {
    const socket = socketService.getSocket();
    if (socket) {
      socket.emit('send_message', {
        text: message,
        callId: currentCallId
      });
    }
  };

  return (
    <div className="container-fluid py-3">
      <div className="row">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h2 className="card-title h4 mb-2">Community Hub - Admin</h2>
              <p className="text-muted mb-4">Connect with all users in real-time with voice chat</p>
              <div className="d-flex justify-content-center gap-3">
                <small className={`badge ${isConnected ? 'bg-success' : 'bg-warning'}`}>
                  {isConnected ? '🟢 Connected' : '🟡 Connecting...'}
                </small>
                {hasActiveCall && (
                  <span className="badge bg-info">
                    <i className="fas fa-broadcast-tower me-1"></i>
                    Live Call Active
                  </span>
                )}
                <span className="badge bg-primary">
                  {messages.length} Messages
                </span>
                {socketId && (
                  <span className="badge bg-secondary">
                    ID: {socketId.substring(0, 8)}...
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {!isCallActive ? (
        <div className="row mt-3">
          {/* Call Initiation Card */}
          <div className="col-12 col-lg-6 mb-3">
            <div className="card bg-primary text-white h-100">
              <div className="card-body text-center d-flex flex-column">
                <div className="mb-3">
                  <i className="fas fa-users fa-3x"></i>
                </div>
                <h3 className="h5">Start Community Call</h3>
                <p className="flex-grow-1">
                  Initiate a voice call that all users can join. 
                  <strong> WebRTC audio is now enabled</strong> for real voice communication.
                  Users will be able to hear you and speak back.
                </p>
                <button 
                  onClick={startCall}
                  disabled={isLoading}
                  className="btn btn-light btn-lg mt-auto"
                >
                  {isLoading ? (
                    <>
                      <i className="fas fa-spinner fa-spin me-2"></i>
                      Starting Call...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-phone me-2"></i>
                      Start Voice Call
                    </>
                  )}
                </button>
                <small className="text-light mt-2">
                  <i className="fas fa-info-circle me-1"></i>
                  Requires microphone access. Users can join with audio.
                </small>
              </div>
            </div>
          </div>

          {/* Message Thread */}
          <div className="col-12 col-lg-6">
            <div className="card h-100">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h3 className="h5 mb-0">Community Chat</h3>
                <div className="d-flex gap-2">
                  <span className="badge bg-primary">{messages.length}</span>
                  <button 
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setMessages([])}
                    title="Clear messages"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
              <div className="card-body d-flex flex-column p-0">
                <MessageThread 
                  messages={messages}
                  onSendMessage={addMessage}
                  currentUser="Admin"
                  isAdmin={true}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <CommunityCallModal
          isOpen={isCallActive}
          onClose={endCall}
          participants={callParticipants}
          messages={messages}
          onSendMessage={addMessage}
          isAdmin={true}
          currentUserName="Admin"
        />
      )}
    </div>
  );
};

export default AdminCommunityTab;