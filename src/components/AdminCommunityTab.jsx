import React, { useState, useEffect } from 'react';
import AgoraVideoCall from './AgoraVideoCall';
import MessageThread from './MessageThread';
import socketService from '../services/socketService';

const AdminCommunityTab = () => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [hasActiveStream, setHasActiveStream] = useState(false);
  const [messages, setMessages] = useState([]);
  const [userData, setUserData] = useState(null);
  const [currentCallId, setCurrentCallId] = useState(null);
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    const storedUserData = JSON.parse(localStorage.getItem('userData') || '{}');
    setUserData(storedUserData);
    
    // Connect to socket
    const socket = socketService.connect();
    
    // Setup socket event listeners
    const handleUserJoinedCall = (event) => {
      console.log('👤 User joined call:', event.detail);
      addSystemMessage(`${event.detail.userName} joined the stream`);
      
      setParticipants(prev => {
        const exists = prev.find(p => p.userId === event.detail.userId);
        if (!exists) {
          return [...prev, {
            userId: event.detail.userId,
            userName: event.detail.userName,
            socketId: event.detail.socketId,
            role: event.detail.role
          }];
        }
        return prev;
      });
    };

    const handleUserLeftCall = (event) => {
      console.log('👤 User left call:', event.detail);
      addSystemMessage(`${event.detail.userName} left the stream`);
      
      setParticipants(prev => prev.filter(p => p.userId !== event.detail.userId));
    };

    const handleNewMessage = (event) => {
      console.log('💬 New message received:', event.detail);
      setMessages(prev => [...prev, event.detail]);
    };

    // Listen for socket events
    window.addEventListener('user_joined_call', handleUserJoinedCall);
    window.addEventListener('user_left_call', handleUserLeftCall);
    window.addEventListener('new_message', handleNewMessage);

    return () => {
      window.removeEventListener('user_joined_call', handleUserJoinedCall);
      window.removeEventListener('user_left_call', handleUserLeftCall);
      window.removeEventListener('new_message', handleNewMessage);
    };
  }, []);

  const startCall = () => {
    console.log('🎬 Admin starting community call...');
    
    // Start the call via socket
    socketService.startCommunityCall({
      adminName: userData?.name || 'Admin',
      message: 'Join the community stream!'
    });
    
    setIsCallActive(true);
    setHasActiveStream(true);
    addSystemMessage('Admin started a community stream');
    
    // Add admin as first participant
    setParticipants([{
      userId: userData?.id || 'admin',
      userName: userData?.name || 'Admin',
      role: 'admin',
      isYou: true
    }]);
  };

  const endCall = () => {
    console.log('🛑 Admin ending community call...');
    
    if (currentCallId) {
      socketService.endCommunityCall(currentCallId);
    }
    
    setIsCallActive(false);
    setHasActiveStream(false);
    setCurrentCallId(null);
    setParticipants([]);
    addSystemMessage('Admin ended the community stream');
  };

  const addSystemMessage = (text) => {
    const message = {
      id: Date.now() + Math.random(),
      sender: 'System',
      text: text,
      timestamp: new Date(),
      isSystem: true
    };
    setMessages(prev => [...prev, message]);
  };

  const addMessage = (messageText) => {
    const message = {
      id: Date.now() + Math.random(),
      sender: userData?.name || 'Admin',
      text: messageText,
      timestamp: new Date(),
      isAdmin: true
    };
    setMessages(prev => [...prev, message]);
    
    // Send message via socket if in a call
    if (currentCallId && isCallActive) {
      socketService.sendCommunityMessage({
        text: messageText,
        callId: currentCallId
      });
    }
  };

  const handleCallStarted = (event) => {
    console.log('📞 Call started event received:', event.detail);
    setCurrentCallId(event.detail.callId);
    setHasActiveStream(true);
  };

  const handleCallEnded = (event) => {
    console.log('📞 Call ended event received');
    setCurrentCallId(null);
    setHasActiveStream(false);
    if (isCallActive) {
      setIsCallActive(false);
    }
  };

  // Listen for call events
  useEffect(() => {
    window.addEventListener('community_call_started', handleCallStarted);
    window.addEventListener('community_call_ended', handleCallEnded);

    return () => {
      window.removeEventListener('community_call_started', handleCallStarted);
      window.removeEventListener('community_call_ended', handleCallEnded);
    };
  }, [isCallActive]);

  return (
    <div className="container-fluid py-3">
      <div className="row">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h2 className="card-title h4 mb-2">Community Hub - Admin</h2>
              <p className="text-muted mb-4">
                Start live streams and connect with all users in real-time with video, audio, and chat
              </p>
              
              <div className="d-flex justify-content-center align-items-center gap-3 mb-3">
                {!isCallActive ? (
                  <button 
                    onClick={startCall}
                    className="btn btn-primary btn-lg"
                  >
                    <i className="fas fa-video me-2"></i>
                    Start Live Stream
                  </button>
                ) : (
                  <div className="alert alert-success mb-0">
                    <i className="fas fa-broadcast-tower me-2"></i>
                    Live stream is active - {participants.length} participant(s) connected
                  </div>
                )}
              </div>

              {/* Connection Status */}
              <div className="d-flex justify-content-center gap-3">
                <small className={`badge ${socketService.isSocketConnected() ? 'bg-success' : 'bg-warning'}`}>
                  {socketService.isSocketConnected() ? '🟢 Connected' : '🟡 Connecting...'}
                </small>
                {hasActiveStream && (
                  <small className="badge bg-info">
                    <i className="fas fa-users me-1"></i>
                    {participants.length} online
                  </small>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-4">
        {/* Community Chat */}
        <div className="col-12 col-lg-6 mb-3">
          <div className="card h-100">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h3 className="h5 mb-0">Community Chat</h3>
              <div>
                <span className="badge bg-primary me-2">{messages.length}</span>
                {hasActiveStream && (
                  <span className="badge bg-success">{participants.length} online</span>
                )}
              </div>
            </div>
            <div className="card-body d-flex flex-column p-0">
              <MessageThread 
                messages={messages}
                onSendMessage={addMessage}
                currentUser={userData?.name || 'Admin'}
                isAdmin={true}
              />
            </div>
          </div>
        </div>

        {/* Stream Information & Participants */}
        <div className="col-12 col-lg-6">
          {/* Active Participants */}
          {hasActiveStream && participants.length > 0 && (
            <div className="card border-success mb-3">
              <div className="card-header bg-success text-white">
                <h4 className="h6 mb-0">
                  <i className="fas fa-users me-2"></i>
                  Active Participants ({participants.length})
                </h4>
              </div>
              <div className="card-body">
                <div className="participants-list">
                  {participants.map(participant => (
                    <div key={participant.userId} className="d-flex align-items-center justify-content-between py-2 border-bottom">
                      <div className="d-flex align-items-center">
                        <i className={`fas ${participant.role === 'admin' ? 'fa-crown text-warning' : 'fa-user'} me-2`}></i>
                        <span>
                          {participant.userName}
                          {participant.isYou && <span className="text-info ms-1">(You)</span>}
                        </span>
                      </div>
                      <span className={`badge ${participant.role === 'admin' ? 'bg-warning text-dark' : 'bg-secondary'}`}>
                        {participant.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Stream Features */}
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h3 className="h5 mb-0">Stream Features</h3>
            </div>
            <div className="card-body">
              <ul className="list-unstyled mb-0">
                <li className="mb-3 p-2 border rounded">
                  <i className="fas fa-video text-primary me-2"></i>
                  <strong>Live Video Streaming</strong>
                  <p className="small text-muted mb-0 mt-1">
                    High-quality video calls with multiple participants
                  </p>
                </li>
                <li className="mb-3 p-2 border rounded">
                  <i className="fas fa-microphone text-primary me-2"></i>
                  <strong>Crystal Clear Audio</strong>
                  <p className="small text-muted mb-0 mt-1">
                    Real-time audio with noise cancellation
                  </p>
                </li>
                <li className="mb-3 p-2 border rounded">
                  <i className="fas fa-comments text-primary me-2"></i>
                  <strong>Integrated Text Chat</strong>
                  <p className="small text-muted mb-0 mt-1">
                    Chat with participants during the stream
                  </p>
                </li>
                <li className="p-2 border rounded">
                  <i className="fas fa-users text-primary me-2"></i>
                  <strong>Community Building</strong>
                  <p className="small text-muted mb-0 mt-1">
                    Connect with all users simultaneously
                  </p>
                </li>
              </ul>
            </div>
          </div>

          {/* Stream Instructions */}
          {isCallActive && (
            <div className="card border-warning mt-3">
              <div className="card-header bg-warning text-dark">
                <h4 className="h6 mb-0">
                  <i className="fas fa-info-circle me-2"></i>
                  Stream Active
                </h4>
              </div>
              <div className="card-body">
                <p className="mb-2">
                  <strong>Your stream is live!</strong> Users can now join using the community tab.
                </p>
                <div className="alert alert-info small">
                  <i className="fas fa-lightbulb me-2"></i>
                  Use the controls to mute/unmute audio and video during the stream
                </div>
                <button 
                  onClick={endCall}
                  className="btn btn-outline-danger btn-sm w-100"
                >
                  <i className="fas fa-stop me-2"></i>
                  End Stream for Everyone
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Agora Video Call Modal */}
      <AgoraVideoCall
        isOpen={isCallActive}
        onClose={endCall}
        isAdmin={true}
        currentUserName={userData?.name || 'Admin'}
        userData={userData}
      />
    </div>
  );
};

export default AdminCommunityTab;