import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import socketService from '../services/socketService';

const AgoraVideoCall = ({ 
  isOpen, 
  onClose, 
  isAdmin,
  currentUserName,
  userData 
}) => {
  const [isJoined, setIsJoined] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [localAudioMuted, setLocalAudioMuted] = useState(false);
  const [localVideoMuted, setLocalVideoMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [callId, setCallId] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [userNameMap, setUserNameMap] = useState({});
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  
  const localStreamRef = useRef(null);
  const agoraClientRef = useRef(null);
  const chatMessagesRef = useRef(null);
  const localTracksRef = useRef({
    audioTrack: null,
    videoTrack: null,
    screenTrack: null
  });

  // Initialize Agora client
  useEffect(() => {
    if (typeof window !== 'undefined' && window.AgoraRTC) {
      agoraClientRef.current = window.AgoraRTC.createClient({ 
        mode: 'rtc', 
        codec: 'vp8' 
      });
      
      setupEventListeners();
    } else {
      console.error('Agora RTC SDK not loaded');
    }

    return () => {
      leaveCall();
    };
  }, []);

  // Effect to handle chat auto-scrolling
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages]);

  // Socket listeners for community coordination - FIXED MESSAGE HANDLING
  useEffect(() => {
    if (!isOpen) return;

    const handleCallStarted = (event) => {
      console.log('📞 CLIENT: Call started event received:', event.detail);
      setCallId(event.detail.callId);
      console.log(`🎯 CLIENT: Set callId to: ${event.detail.callId}`);
    };

    const handleCallEnded = (event) => {
      console.log('📞 CLIENT: Call ended event received');
      if (isJoined) {
        leaveCall();
      }
      setCallId(null);
    };

    const handleNewMessage = (event) => {
      console.log('💬 CLIENT: NEW MESSAGE RECEIVED IN VIDEO CALL:', event.detail);
      
      // CRITICAL FIX: Validate and process ALL incoming messages
      if (event.detail && event.detail.text && event.detail.sender) {
        const formattedMessage = {
          id: event.detail.id || `msg_${Date.now()}_${Math.random()}`,
          sender: event.detail.sender,
          senderId: event.detail.senderId,
          text: event.detail.text,
          timestamp: event.detail.timestamp ? new Date(event.detail.timestamp) : new Date(),
          isAdmin: event.detail.isAdmin || false,
          userId: event.detail.userId,
          userName: event.detail.userName,
          userRole: event.detail.userRole
        };
        
        console.log(`💬 CLIENT: ADDING MESSAGE TO CHAT: ${formattedMessage.sender}: ${formattedMessage.text} (Admin: ${formattedMessage.isAdmin})`);
        
        // Add to messages state
        setMessages(prev => {
          const newMessages = [...prev, formattedMessage];
          // Keep only last 100 messages to prevent memory issues
          return newMessages.slice(-100);
        });
      } else {
        console.error('❌ CLIENT: Invalid message received:', event.detail);
      }
    };

    const handleUserJoinedCall = (event) => {
      console.log('👤 CLIENT: User joined call:', event.detail);
      setUserNameMap(prev => ({
        ...prev,
        [event.detail.userId]: event.detail.userName
      }));
    };

    const handleUserLeftCall = (event) => {
      console.log('👤 CLIENT: User left call:', event.detail);
      setUserNameMap(prev => {
        const newMap = { ...prev };
        delete newMap[event.detail.userId];
        return newMap;
      });
    };

    // Add event listeners
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
  }, [isOpen, isJoined, currentUserName]);

  const addNotification = (text) => {
    const notification = {
      id: Date.now() + Math.random(),
      text: text,
      timestamp: new Date()
    };
    setNotifications(prev => [...prev, notification]);
  };

  const setupEventListeners = () => {
    const client = agoraClientRef.current;
    if (!client) return;
    
    client.on('user-published', async (user, mediaType) => {
      console.log(`👤 User ${user.uid} published ${mediaType}`);
      
      try {
        await client.subscribe(user, mediaType);
        
        const remoteUserName = userNameMap[user.uid] || `User ${user.uid}`;
        
        if (mediaType === 'video') {
          let remotePlayer = document.getElementById(`remote-video-${user.uid}`);
          if (!remotePlayer) {
            const videoGrid = document.getElementById('video-grid-container');
            if (videoGrid) {
              const videoWrapper = document.createElement('div');
              videoWrapper.className = 'col-12 col-md-6 col-lg-4 p-2';
              videoWrapper.id = `video-wrapper-${user.uid}`;
              videoWrapper.innerHTML = `
                <div class="card bg-dark text-white h-100 position-relative shadow">
                  <div class="card-header p-2 d-flex justify-content-between align-items-center bg-dark bg-opacity-75 position-absolute top-0 w-100 z-1 border-bottom border-secondary">
                    <span class="user-name text-truncate me-2 fw-bold">${remoteUserName}</span>
                    <div class="status-indicators d-flex gap-1">
                      <i class="fas fa-video text-success" title="Video on"></i>
                    </div>
                  </div>
                  <div id="remote-video-${user.uid}" class="video-player w-100 h-100 bg-black rounded-bottom" style="min-height: 200px;"></div>
                </div>
              `;
              videoGrid.appendChild(videoWrapper);
            }
          }
          
          remotePlayer = document.getElementById(`remote-video-${user.uid}`);
          if (remotePlayer) {
            user.videoTrack.play(`remote-video-${user.uid}`);
          }
          
          setRemoteUsers(prev => {
            const exists = prev.find(u => u.uid === user.uid);
            if (!exists) {
              return [...prev, { 
                uid: user.uid, 
                userName: remoteUserName,
                hasVideo: true,
                hasAudio: true 
              }];
            }
            return prev.map(u => 
              u.uid === user.uid ? { ...u, hasVideo: true } : u
            );
          });
        }
        
        if (mediaType === 'audio') {
          user.audioTrack.play();
          setRemoteUsers(prev => {
            const exists = prev.find(u => u.uid === user.uid);
            if (!exists) {
              return [...prev, { 
                uid: user.uid, 
                userName: remoteUserName,
                hasVideo: false,
                hasAudio: true 
              }];
            }
            return prev.map(u => 
              u.uid === user.uid ? { ...u, hasAudio: true } : u
            );
          });
        }
      } catch (error) {
        console.error('Error subscribing to user:', error);
      }
    });

    client.on('user-unpublished', (user, mediaType) => {
      if (mediaType === 'video') {
        setRemoteUsers(prev => prev.map(u => 
          u.uid === user.uid ? { ...u, hasVideo: false } : u
        ));
      }
      if (mediaType === 'audio') {
        setRemoteUsers(prev => prev.map(u => 
          u.uid === user.uid ? { ...u, hasAudio: false } : u
        ));
      }
    });

    client.on('user-left', (user) => {
      setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
      
      const videoWrapper = document.getElementById(`video-wrapper-${user.uid}`);
      if (videoWrapper) {
        videoWrapper.remove();
      }
    });
  };

  const requestPermissions = async () => {
    try {
      const videoStream = await navigator.mediaDevices.getUserMedia({ 
        video: true,
        audio: false 
      });
      videoStream.getTracks().forEach(track => track.stop());
      
      const audioStream = await navigator.mediaDevices.getUserMedia({ 
        video: false,
        audio: true 
      });
      audioStream.getTracks().forEach(track => track.stop());
      
      setPermissionsGranted(true);
      return true;
      
    } catch (error) {
      console.error('❌ Permission denied:', error);
      alert('Please allow camera and microphone access to join the stream.');
      return false;
    }
  };

  const joinCall = async () => {
    if (!currentUserName) {
      alert('Please set your display name first');
      return;
    }

    if (!permissionsGranted) {
      const granted = await requestPermissions();
      if (!granted) {
        return;
      }
    }

    setIsLoading(true);
    
    try {
      const userId = userData?.id || `user_${Date.now()}`;
      
      const tokenResponse = await api.post('/agora/generate-token', {
        channelName: 'the-conclave-community',
        uid: userId,
        userName: currentUserName
      });

      if (!tokenResponse.data.success) {
        throw new Error(tokenResponse.data.message || 'Failed to generate token');
      }

      const { token, appId, channel, uid, userName } = tokenResponse.data;

      if (!window.AgoraRTC) {
        throw new Error('Video services not available. Please refresh the page.');
      }

      await agoraClientRef.current.join(appId, channel, token, uid);

      let audioTrack, videoTrack;
      try {
        audioTrack = await window.AgoraRTC.createMicrophoneAudioTrack();
      } catch (audioError) {
        throw new Error('Microphone access denied. Please check permissions.');
      }

      try {
        videoTrack = await window.AgoraRTC.createCameraVideoTrack();
        
        const localPlayer = document.getElementById('local-video-player');
        if (localPlayer) {
          videoTrack.play('local-video-player');
        }
      } catch (videoError) {
        if (!audioTrack) {
          throw new Error('Camera access denied. Please check permissions.');
        }
        videoTrack = null;
      }

      localTracksRef.current.audioTrack = audioTrack;
      localTracksRef.current.videoTrack = videoTrack;

      const tracksToPublish = [];
      if (audioTrack) tracksToPublish.push(audioTrack);
      if (videoTrack) tracksToPublish.push(videoTrack);

      if (tracksToPublish.length > 0) {
        await agoraClientRef.current.publish(tracksToPublish);
      }

      setIsJoined(true);
      
      // Join socket room with the callId (either from admin or default)
      const targetCallId = callId || 'community_call_default';
      console.log(`🔗 CLIENT: Joining socket call: ${targetCallId}`);
      
      socketService.joinCommunityCall(targetCallId, {
        userId: uid,
        userName: currentUserName,
        isAdmin: isAdmin
      });
      
      setUserNameMap(prev => ({
        ...prev,
        [uid]: currentUserName
      }));

      addNotification(`You joined the stream as ${currentUserName}`);

    } catch (error) {
      console.error('Error joining call:', error);
      alert('Failed to join stream. Please check your connection and permissions.');
    } finally {
      setIsLoading(false);
    }
  };

  const leaveCall = async () => {
    try {
      if (isScreenSharing) {
        await stopScreenShare();
      }

      if (callId && isJoined) {
        socketService.leaveCommunityCall(callId);
      }

      if (localTracksRef.current.audioTrack) {
        localTracksRef.current.audioTrack.stop();
        localTracksRef.current.audioTrack.close();
      }
      if (localTracksRef.current.videoTrack) {
        localTracksRef.current.videoTrack.stop();
        localTracksRef.current.videoTrack.close();
      }
      if (localTracksRef.current.screenTrack) {
        localTracksRef.current.screenTrack.stop();
        localTracksRef.current.screenTrack.close();
      }

      await agoraClientRef.current.leave();

      document.querySelectorAll('[id^="video-wrapper-"]').forEach(wrapper => {
        wrapper.remove();
      });

      setIsJoined(false);
      setRemoteUsers([]);
      setIsScreenSharing(false);
      setPermissionsGranted(false);
      localTracksRef.current = { 
        audioTrack: null, 
        videoTrack: null,
        screenTrack: null 
      };

    } catch (error) {
      console.error('Error leaving call:', error);
    }
  };

  const toggleAudio = async () => {
    if (localTracksRef.current.audioTrack) {
      const newMutedState = !localAudioMuted;
      await localTracksRef.current.audioTrack.setMuted(newMutedState);
      setLocalAudioMuted(newMutedState);
    }
  };

  const toggleVideo = async () => {
    if (localTracksRef.current.videoTrack) {
      const newMutedState = !localVideoMuted;
      await localTracksRef.current.videoTrack.setMuted(newMutedState);
      setLocalVideoMuted(newMutedState);
      
      const localPlayer = document.getElementById('local-video-player');
      if (localPlayer) {
        if (newMutedState) {
          localPlayer.innerHTML = `
            <div class="w-100 h-100 d-flex flex-column align-items-center justify-content-center bg-dark text-muted">
              <i class="fas fa-video-slash fa-2x mb-2"></i>
              <small>Video Off</small>
            </div>
          `;
        } else {
          localPlayer.innerHTML = '';
          localTracksRef.current.videoTrack.play('local-video-player');
        }
      }
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      await stopScreenShare();
    } else {
      await startScreenShare();
    }
  };

  const startScreenShare = async () => {
    try {
      const screenTrack = await window.AgoraRTC.createScreenVideoTrack();

      if (localTracksRef.current.videoTrack) {
        await agoraClientRef.current.unpublish(localTracksRef.current.videoTrack);
        localTracksRef.current.videoTrack.stop();
        localTracksRef.current.videoTrack.close();
        localTracksRef.current.videoTrack = null;
      }

      localTracksRef.current.screenTrack = screenTrack;
      await agoraClientRef.current.publish(screenTrack);

      const localPlayer = document.getElementById('local-video-player');
      if (localPlayer) {
        screenTrack.play('local-video-player');
      }

      setIsScreenSharing(true);

      screenTrack.on('track-ended', () => {
        stopScreenShare();
      });

    } catch (error) {
      console.error('Error starting screen share:', error);
      alert('Failed to start screen sharing. Please check permissions.');
    }
  };

  const stopScreenShare = async () => {
    try {
      if (localTracksRef.current.screenTrack) {
        await agoraClientRef.current.unpublish(localTracksRef.current.screenTrack);
        localTracksRef.current.screenTrack.stop();
        localTracksRef.current.screenTrack.close();
        localTracksRef.current.screenTrack = null;
      }

      // Re-create video track if it was stopped for screen share
      if (!localTracksRef.current.videoTrack) {
        const videoTrack = await window.AgoraRTC.createCameraVideoTrack();
        localTracksRef.current.videoTrack = videoTrack;
        await agoraClientRef.current.publish(videoTrack);
        
        const localPlayer = document.getElementById('local-video-player');
        if (localPlayer) {
          videoTrack.play('local-video-player');
        }
      }

      setIsScreenSharing(false);

    } catch (error) {
      console.error('Error stopping screen share:', error);
    }
  };

  // 🔥 CRITICAL FIX: Send message function
  const sendMessage = (e) => {
    if (e) {
      e.preventDefault();
    }
    
    if (!newMessage.trim()) return;

    console.log(`💬 CLIENT: SENDING CHAT MESSAGE: ${currentUserName}: ${newMessage.trim()}`);
    
    // Create local message immediately for instant feedback
    const messageText = newMessage.trim();
    const localMessage = {
      id: `local_${Date.now()}_${Math.random()}`,
      sender: currentUserName,
      text: messageText,
      timestamp: new Date(),
      isAdmin: isAdmin
    };
    
    // Add to local state immediately for instant feedback
    setMessages(prev => [...prev.slice(-99), localMessage]);
    
    // Clear input
    setNewMessage('');

    // Send via socket
    const targetCallId = callId || 'community_call_default';
    
    if (isJoined) {
      console.log(`💬 CLIENT: Sending to socket with callId: ${targetCallId}`);
      
      // CRITICAL FIX: Send minimal, consistent data to server
      socketService.sendCommunityMessage({
        text: messageText,
        callId: targetCallId,
        // Don't send sender info - server will use socket registry data
        timestamp: new Date().toISOString()
      });
    } else {
      console.warn('⚠️ CLIENT: Cannot send message - not joined to call');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
  };

  const handleClose = () => {
    leaveCall();
    onClose();
  };

  const handleStopVideo = () => {
    if (isJoined) {
      leaveCall();
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0, 0, 0, 0.9)'}}>
      <div className="modal-dialog modal-fullscreen m-0">
        <div className="modal-content bg-dark text-light border-0 vh-100">
          
          <div className="modal-header border-bottom border-secondary p-3">
            <h3 className="modal-title text-light m-0">The Conclave Streams</h3>
            {isJoined && (
              <div className="d-flex align-items-center me-3">
                <span className="badge bg-success rounded-circle me-2" style={{width: '10px', height: '10px'}}></span>
                <span className="text-success">{remoteUsers.length + 1} online</span>
              </div>
            )}
            <button 
              type="button" 
              className="btn-close btn-close-white" 
              onClick={handleClose}
              aria-label="Close"
            ></button>
          </div>

          {notifications.length > 0 && (
            <div className="position-fixed bottom-0 start-0 m-3 z-3">
              {notifications.map((notification, index) => (
                <div 
                  key={notification.id} 
                  className="alert alert-info alert-dismissible fade show mb-2 shadow slide-in-left"
                  role="alert"
                  style={{
                    animation: `slideInLeft 0.3s ease-out, slideOutLeft 0.3s ease-out 3.7s forwards`,
                    maxWidth: '300px'
                  }}
                >
                  <small>{notification.text}</small>
                </div>
              ))}
            </div>
          )}

          <div className="modal-body p-0 d-flex flex-column h-100">
            
            <div className="flex-grow-1 p-3 overflow-auto">
              {!isJoined ? (
                <div className="d-flex align-items-center justify-content-center h-100">
                  <div className="text-center p-5 bg-dark rounded border border-secondary">
                    <i className="fas fa-video fa-3x mb-3 text-primary"></i>
                    <h4 className="text-light mb-3">
                      {isAdmin ? 'Start The Conclave Stream' : 'Join The Conclave Stream'}
                    </h4>
                    <p className="text-muted mb-4">
                      {isAdmin 
                        ? 'Start a live stream for the community with video and audio' 
                        : 'Connect with the community through live video and audio'
                      }
                    </p>
                    <div className="alert alert-warning mb-4">
                      <i className="fas fa-info-circle me-2"></i>
                      You'll be asked to allow camera and microphone access
                    </div>
                    <button 
                      onClick={joinCall} 
                      disabled={isLoading}
                      className="btn btn-primary btn-lg px-5"
                    >
                      {isLoading ? (
                        <>
                          <i className="fas fa-spinner fa-spin me-2"></i>
                          {isAdmin ? 'Creating Stream...' : 'Joining...'}
                        </>
                      ) : (
                        <>
                          <i className="fas fa-play me-2"></i>
                          {isAdmin ? 'Start Stream' : 'Join Stream'}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="row g-3" id="video-grid-container">
                  <div className="col-12 col-md-6 col-lg-4">
                    <div className="card bg-dark text-white h-100 shadow position-relative">
                      <div className="card-header p-2 d-flex justify-content-between align-items-center bg-dark bg-opacity-75 border-bottom border-secondary">
                        <span className="fw-bold text-truncate">{currentUserName} (You)</span>
                        <div className="d-flex gap-2">
                          {localAudioMuted && <i className="fas fa-microphone-slash text-danger" title="Microphone muted"></i>}
                          {localVideoMuted && <i className="fas fa-video-slash text-danger" title="Video off"></i>}
                          {isScreenSharing && <i className="fas fa-desktop text-warning" title="Screen sharing"></i>}
                        </div>
                      </div>
                      <div id="local-video-player" className="w-100 bg-black" style={{minHeight: '250px', aspectRatio: '16/9'}}>
                        {localVideoMuted && !isScreenSharing && (
                          <div className="w-100 h-100 d-flex flex-column align-items-center justify-content-center text-muted">
                            <i className="fas fa-video-slash fa-2x mb-2"></i>
                            <small>Video Off</small>
                          </div>
                        )}
                      </div>
                      {isScreenSharing && (
                        <div className="position-absolute bottom-0 start-0 w-100 bg-warning bg-opacity-90 text-dark text-center py-1">
                          <i className="fas fa-desktop me-2"></i>
                          Screen Sharing
                        </div>
                      )}
                    </div>
                  </div>

                  {remoteUsers.map(user => (
                    <div key={user.uid} className="col-12 col-md-6 col-lg-4">
                      <div className="card bg-dark text-white h-100 shadow">
                        <div className="card-header p-2 d-flex justify-content-between align-items-center bg-dark bg-opacity-75 border-bottom border-secondary">
                          <span className="fw-bold text-truncate">{user.userName}</span>
                          <div className="d-flex gap-2">
                            {!user.hasVideo && <i className="fas fa-video-slash text-danger" title="Video off"></i>}
                            {!user.hasAudio && <i className="fas fa-microphone-slash text-danger" title="Audio muted"></i>}
                            {user.hasVideo && <i className="fas fa-video text-success" title="Video on"></i>}
                          </div>
                        </div>
                        <div id={`remote-video-${user.uid}`} className="w-100 bg-black" style={{minHeight: '250px', aspectRatio: '16/9'}}>
                          {!user.hasVideo && (
                            <div className="w-100 h-100 d-flex flex-column align-items-center justify-content-center text-muted">
                              <i className="fas fa-user fa-2x mb-2"></i>
                              <small>{user.userName}</small>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {isAdmin && remoteUsers.length === 0 && (
                    <div className="col-12">
                      <div className="text-center p-5 bg-dark rounded border border-secondary text-muted">
                        <i className="fas fa-user-plus fa-3x mb-3"></i>
                        <h5>Waiting for others to join...</h5>
                        <p className="mb-0">Share this stream with others to connect</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="border-top border-secondary bg-dark">
              <div className="p-3">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="mb-0 text-light">Community Chat</h6>
                  <span className="badge bg-primary">{remoteUsers.length + 1} online</span>
                </div>
                
                <div 
                  ref={chatMessagesRef}
                  className="mb-3 chat-messages-container" 
                  style={{
                    maxHeight: '200px', 
                    overflowY: 'auto',
                    minHeight: '150px'
                  }}
                >
                  {messages.length === 0 ? (
                    <div className="text-center text-muted py-4">
                      <i className="fas fa-comments fa-2x mb-2"></i>
                      <p className="mb-0">No messages yet</p>
                      <small>Start the conversation!</small>
                    </div>
                  ) : (
                    messages.map(message => (
                      <div 
                        key={message.id} 
                        className={`mb-2 p-2 rounded ${
                          message.sender === currentUserName 
                            ? 'bg-primary text-white ms-4' 
                            : 'bg-secondary text-light me-4'
                        }`}
                      >
                        <div className="d-flex justify-content-between align-items-start mb-1">
                          <small className="fw-bold">
                            {message.sender === currentUserName ? 'You' : message.sender}
                            {message.isAdmin && <span className="badge bg-danger ms-2">Admin</span>}
                          </small>
                          <small className="opacity-75">
                            {message.timestamp 
                              ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : 'Just now'
                            }
                          </small>
                        </div>
                        <div className="message-text">{message.text}</div>
                      </div>
                    ))
                  )}
                </div>

                {isJoined && (
                  <form onSubmit={sendMessage} className="d-flex gap-2 chat-input-container">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={handleInputChange}
                      onKeyPress={handleKeyPress}
                      placeholder="Type a message..."
                      className="form-control bg-light text-dark border-secondary"
                      maxLength={500}
                    />
                    <button 
                      disabled={!newMessage.trim()}
                      className="btn btn-primary"
                      type="submit"
                    >
                      <i className="fas fa-paper-plane"></i>
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>

          {isJoined && (
            <div className="modal-footer border-top border-secondary p-3">
              <div className="d-flex flex-wrap justify-content-center gap-2 w-100">
                <button 
                  onClick={toggleAudio}
                  className={`btn ${localAudioMuted ? 'btn-danger' : 'btn-outline-light'}`}
                  type="button"
                >
                  <i className={`fas ${localAudioMuted ? 'fa-microphone-slash' : 'fa-microphone'} me-1`}></i>
                  <span className="d-none d-sm-inline">{localAudioMuted ? 'Unmute' : 'Mute'}</span>
                </button>
                
                <button 
                  onClick={toggleVideo}
                  className={`btn ${localVideoMuted ? 'btn-danger' : 'btn-outline-light'}`}
                  disabled={isScreenSharing}
                  type="button"
                >
                  <i className={`fas ${localVideoMuted ? 'fa-video-slash' : 'fa-video'} me-1`}></i>
                  <span className="d-none d-sm-inline">{localVideoMuted ? 'Start Video' : 'Stop Video'}</span>
                </button>

                <button 
                  onClick={toggleScreenShare}
                  className={`btn ${isScreenSharing ? 'btn-warning' : 'btn-outline-light'}`}
                  type="button"
                >
                  <i className={`fas ${isScreenSharing ? 'fa-stop' : 'fa-desktop'} me-1`}></i>
                  <span className="d-none d-sm-inline">{isScreenSharing ? 'Stop Share' : 'Share Screen'}</span>
                </button>
                
                <button 
                  onClick={handleStopVideo}
                  className="btn btn-outline-warning"
                  type="button"
                >
                  <i className="fas fa-stop me-1"></i>
                  <span className="d-none d-sm-inline">Stop Video</span>
                </button>
                
                <button 
                  onClick={handleClose}
                  className="btn btn-danger"
                  type="button"
                >
                  <i className="fas fa-phone-slash me-1"></i>
                  <span className="d-none d-sm-inline">Leave Call</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgoraVideoCall;