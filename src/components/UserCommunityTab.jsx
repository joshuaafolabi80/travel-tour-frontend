import React, { useState, useEffect } from 'react';
import AgoraVideoCall from './AgoraVideoCall';
import MessageThread from './MessageThread';
import socketService from '../services/socketService';

const UserCommunityTab = () => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [hasActiveStream, setHasActiveStream] = useState(false);
  const [activeCallInfo, setActiveCallInfo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [userData, setUserData] = useState(null);
  const [userName, setUserName] = useState('');
  const [currentCallId, setCurrentCallId] = useState(null);

  useEffect(() => {
    const storedUserData = JSON.parse(localStorage.getItem('userData') || '{}');
    setUserData(storedUserData);
    setUserName(storedUserData?.name || storedUserData?.username || 'User');
    
    const socket = socketService.connect();
    
    const handleCallStarted = (event) => {
      console.log('📞 Call started event received:', event.detail);
      setHasActiveStream(true);
      setActiveCallInfo(event.detail);
      setCurrentCallId(event.detail.callId);
      addSystemMessage('Admin started a community stream - Join now!');
    };

    const handleCallEnded = (event) => {
      console.log('📞 Call ended event received');
      setHasActiveStream(false);
      setActiveCallInfo(null);
      setCurrentCallId(null);
      
      if (isCallActive) {
        setIsCallActive(false);
      }
      
      addSystemMessage('Admin ended the community stream');
    };

    const handleNewMessage = (event) => {
      console.log('💬 New message received:', event.detail);
      setMessages(prev => [...prev, event.detail]);
    };

    const handleUserJoinedCall = (event) => {
      console.log('👤 User joined call:', event.detail);
      addSystemMessage(`${event.detail.userName} joined the stream`);
    };

    const handleUserLeftCall = (event) => {
      console.log('👤 User left call:', event.detail);
      addSystemMessage(`${event.detail.userName} left the stream`);
    };

    window.addEventListener('community_call_started', handleCallStarted);
    window.addEventListener('community_call_ended', handleCallEnded);
    window.addEventListener('new_message', handleNewMessage);
    window.addEventListener('user_joined_call', handleUserJoinedCall);
    window.addEventListener('user_left_call', handleUserLeftCall);

    return () => {
      window.removeEventListener('community_call_started', handleCallStarted);
      window.removeEventListener('community_call_ended', handleCallEnded);
      window.removeEventListener('new_message', handleNewMessage);
      window.removeEventListener('user_joined_call', handleUserJoinedCall);
      window.removeEventListener('user_left_call', handleUserLeftCall);
    };
  }, [isCallActive]);

  const joinStream = () => {
    if (!currentCallId) {
      console.error('No active call ID available');
      return;
    }

    console.log('🎬 User joining community call:', currentCallId);
    
    socketService.joinCommunityCall(currentCallId);
    setIsCallActive(true);
    addSystemMessage(`${userName} joined the stream`);
  };

  const leaveStream = () => {
    if (currentCallId) {
      console.log('🎬 User leaving community call:', currentCallId);
      socketService.leaveCommunityCall(currentCallId);
    }
    
    setIsCallActive(false);
    addSystemMessage(`${userName} left the stream`);
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
      sender: userName,
      text: messageText,
      timestamp: new Date(),
      isAdmin: false
    };
    setMessages(prev => [...prev, message]);
    
    if (currentCallId && isCallActive) {
      socketService.sendCommunityMessage({
        text: messageText,
        callId: currentCallId
      });
    }
  };

  // Simulate admin starting a stream (for development only)
  const simulateAdminStart = () => {
    const mockCallInfo = {
      callId: 'dev_call_' + Date.now(),
      adminName: 'Demo Admin',
      message: 'Development demo stream',
      startTime: new Date()
    };
    
    setHasActiveStream(true);
    setActiveCallInfo(mockCallInfo);
    setCurrentCallId(mockCallInfo.callId);
    addSystemMessage('Admin started a community stream - Join now!');
  };

  return (
    <div className="container-fluid py-3">
      <div className="row">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h2 className="card-title h4 mb-2">Community Hub</h2>
              <p className="text-muted mb-0">
                Connect with other learners and admins through live streams and chat
              </p>
              
              {/* Connection Status */}
              <div className="mt-2">
                <small className={`badge ${socketService.isSocketConnected() ? 'bg-success' : 'bg-warning'}`}>
                  {socketService.isSocketConnected() ? '🟢 Connected' : '🟡 Connecting...'}
                </small>
                {hasActiveStream && (
                  <small className="badge bg-info ms-2">
                    <i className="fas fa-broadcast-tower me-1"></i>
                    Live Stream Available
                  </small>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stream Notification - Fixed issue #2: Hide "Join stream" when admin ends call */}
      {hasActiveStream && !isCallActive && activeCallInfo && (
        <div className="row mt-3">
          <div className="col-12">
            <div className="alert alert-warning alert-dismissible fade show" role="alert">
              <div className="d-flex align-items-center justify-content-between flex-column flex-md-row">
                <div className="d-flex align-items-center mb-2 mb-md-0">
                  <i className="fas fa-video fa-2x me-3 text-warning"></i>
                  <div>
                    <strong className="h5 mb-1">Live Stream Available!</strong>
                    <p className="mb-1">
                      {activeCallInfo.adminName} is hosting a live community stream.
                    </p>
                    <small className="text-muted">
                      Started: {new Date(activeCallInfo.startTime).toLocaleTimeString()}
                    </small>
                  </div>
                </div>
                <div className="d-flex gap-2 mt-2 mt-md-0">
                  <button 
                    onClick={joinStream} 
                    className="btn btn-success btn-lg px-4"
                  >
                    <i className="fas fa-play me-2"></i>
                    Join Stream
                  </button>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => setHasActiveStream(false)}
                    aria-label="Close"
                  ></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Demo Admin Stream Button (Remove in production) */}
      {import.meta.env.DEV && !hasActiveStream && (
        <div className="row mt-3">
          <div className="col-12">
            <div className="card border-info">
              <div className="card-body text-center">
                <p className="text-muted mb-2">Development Demo</p>
                <button 
                  onClick={simulateAdminStart}
                  className="btn btn-outline-info btn-sm"
                >
                  Simulate Admin Starting Stream
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isCallActive ? (
        <div className="row mt-3">
          {/* Message Thread - Improved mobile responsiveness */}
          <div className="col-12 col-lg-8 mb-3">
            <div className="card h-100">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h3 className="h5 mb-0">Community Chat</h3>
                <span className="badge bg-primary">
                  {messages.length} messages
                </span>
              </div>
              <div className="card-body d-flex flex-column p-0">
                <MessageThread 
                  messages={messages}
                  onSendMessage={addMessage}
                  currentUser={userName}
                  isAdmin={false}
                />
              </div>
            </div>
          </div>

          {/* Community Info */}
          <div className="col-12 col-lg-4">
            {/* Active Stream Info */}
            {hasActiveStream && !isCallActive && activeCallInfo && (
              <div className="card border-warning mb-3">
                <div className="card-header bg-warning text-dark">
                  <h4 className="h6 mb-0">
                    <i className="fas fa-bell me-2"></i>
                    Live Stream Available
                  </h4>
                </div>
                <div className="card-body">
                  <p className="mb-2">
                    <strong>{activeCallInfo.adminName}</strong> is hosting a live stream.
                  </p>
                  <div className="mb-2">
                    <small className="text-success">
                      <i className="fas fa-video me-1"></i>
                      Video and audio enabled
                    </small>
                  </div>
                  <div className="mb-3">
                    <small className="text-muted">
                      <i className="fas fa-clock me-1"></i>
                      Started: {new Date(activeCallInfo.startTime).toLocaleTimeString()}
                    </small>
                  </div>
                  <button 
                    onClick={joinStream} 
                    className="btn btn-success w-100 mb-2"
                  >
                    <i className="fas fa-play me-2"></i>
                    Join Stream
                  </button>
                  <button 
                    onClick={() => setHasActiveStream(false)}
                    className="btn btn-outline-secondary w-100 btn-sm"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* Community Features */}
            <div className="card">
              <div className="card-header bg-primary text-white">
                <h3 className="h5 mb-0">Community Features</h3>
              </div>
              <div className="card-body">
                <ul className="list-unstyled mb-0">
                  <li className="mb-3 p-2 border rounded">
                    <i className="fas fa-comments text-primary me-2"></i>
                    <strong>Real-time Text Chat</strong>
                    <p className="small text-muted mb-0 mt-1">
                      Chat with other learners and admins
                    </p>
                  </li>
                  <li className="mb-3 p-2 border rounded">
                    <i className="fas fa-video text-primary me-2"></i>
                    <strong>Live Video Streams</strong>
                    <p className="small text-muted mb-0 mt-1">
                      Join community streams with video and audio
                    </p>
                  </li>
                  <li className="mb-3 p-2 border rounded">
                    <i className="fas fa-users text-primary me-2"></i>
                    <strong>Connect with Learners</strong>
                    <p className="small text-muted mb-0 mt-1">
                      Network with other students in your courses
                    </p>
                  </li>
                  <li className="p-2 border rounded">
                    <i className="fas fa-question-circle text-primary me-2"></i>
                    <strong>Get Help</strong>
                    <p className="small text-muted mb-0 mt-1">
                      Ask questions and get support from admins
                    </p>
                  </li>
                </ul>
              </div>
            </div>

            {/* No Active Stream Message */}
            {!hasActiveStream && !isCallActive && (
              <div className="card border-secondary mt-3">
                <div className="card-body text-center py-4">
                  <i className="fas fa-video-slash fa-2x text-muted mb-3"></i>
                  <h5 className="text-muted">No Active Streams</h5>
                  <p className="small text-muted mb-0">
                    When an admin starts a live stream, you'll see a notification here to join.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <AgoraVideoCall
          isOpen={isCallActive}
          onClose={leaveStream}
          isAdmin={false}
          currentUserName={userName}
          userData={userData}
        />
      )}
    </div>
  );
};

export default UserCommunityTab;