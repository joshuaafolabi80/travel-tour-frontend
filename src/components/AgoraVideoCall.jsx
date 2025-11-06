import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import socketService from '../services/socketService';
import './AgoraVideoCall.css';

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
  
  const localStreamRef = useRef(null);
  const remoteStreamsRef = useRef({});
  const agoraClientRef = useRef(null);
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

  // Setup socket listeners for community coordination
  useEffect(() => {
    if (!isOpen) return;

    const handleCallStarted = (event) => {
      console.log('📞 Call started event received:', event.detail);
      setCallId(event.detail.callId);
    };

    const handleCallEnded = (event) => {
      console.log('📞 Call ended event received');
      if (isJoined) {
        leaveCall();
      }
      setCallId(null);
    };

    const handleNewMessage = (event) => {
      console.log('💬 New message received:', event.detail);
      setMessages(prev => [...prev, event.detail]);
    };

    window.addEventListener('community_call_started', handleCallStarted);
    window.addEventListener('community_call_ended', handleCallEnded);
    window.addEventListener('new_message', handleNewMessage);

    return () => {
      window.removeEventListener('community_call_started', handleCallStarted);
      window.removeEventListener('community_call_ended', handleCallEnded);
      window.removeEventListener('new_message', handleNewMessage);
    };
  }, [isOpen, isJoined]);

  // Auto-remove notifications after 4 seconds
  useEffect(() => {
    if (notifications.length > 0) {
      const timer = setTimeout(() => {
        setNotifications(prev => prev.slice(1));
      }, 4000);
      
      return () => clearTimeout(timer);
    }
  }, [notifications]);

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
    
    // When a remote user joins and publishes
    client.on('user-published', async (user, mediaType) => {
      console.log(`👤 User ${user.uid} published ${mediaType}`);
      
      try {
        await client.subscribe(user, mediaType);
        
        if (mediaType === 'video') {
          const remotePlayer = document.getElementById(`remote-video-${user.uid}`);
          if (remotePlayer) {
            user.videoTrack.play(`remote-video-${user.uid}`);
          }
          
          setRemoteUsers(prev => {
            const exists = prev.find(u => u.uid === user.uid);
            if (!exists) {
              return [...prev, { 
                uid: user.uid, 
                userName: user.userName || `User ${user.uid}`,
                hasVideo: true,
                hasAudio: true 
              }];
            }
            return prev.map(u => 
              u.uid === user.uid ? { ...u, hasVideo: true } : u
            );
          });

          addNotification(`User ${user.userName || user.uid} joined with video`);
        }
        
        if (mediaType === 'audio') {
          user.audioTrack.play();
          setRemoteUsers(prev => {
            const exists = prev.find(u => u.uid === user.uid);
            if (!exists) {
              return [...prev, { 
                uid: user.uid, 
                userName: user.userName || `User ${user.uid}`,
                hasVideo: false,
                hasAudio: true 
              }];
            }
            return prev.map(u => 
              u.uid === user.uid ? { ...u, hasAudio: true } : u
            );
          });
          addNotification(`User ${user.userName || user.uid} joined with audio`);
        }
      } catch (error) {
        console.error('Error subscribing to user:', error);
      }
    });

    // When a remote user stops publishing
    client.on('user-unpublished', (user, mediaType) => {
      console.log(`👤 User ${user.uid} unpublished ${mediaType}`);
      
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

    // When a remote user leaves the channel
    client.on('user-left', (user) => {
      console.log(`👤 User ${user.uid} left the channel`);
      addNotification(`User ${user.userName || user.uid} left the stream`);
      setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
    });

    // Handle connection state changes
    client.on('connection-state-change', (curState, prevState) => {
      console.log(`🔄 Connection state changed: ${prevState} -> ${curState}`);
      
      if (curState === 'DISCONNECTED' || curState === 'FAILED') {
        addNotification('Connection lost. Attempting to reconnect...');
      } else if (curState === 'CONNECTED') {
        addNotification('Connection established');
      }
    });
  };

  const joinCall = async () => {
    if (!currentUserName) {
      alert('Please set your display name first');
      return;
    }

    setIsLoading(true);
    
    try {
      // Generate token from backend - with enhanced error handling
      const tokenResponse = await api.post('/agora/generate-token', {
        channelName: 'the-conclave-community',
        uid: userData?.id || Date.now().toString(),
        userName: currentUserName // Send userName for display
      });

      if (!tokenResponse.data.success) {
        throw new Error(tokenResponse.data.message || 'Failed to generate token');
      }

      const { token, appId, channel, uid, userName } = tokenResponse.data;

      // Validate Agora SDK is loaded
      if (!window.AgoraRTC) {
        throw new Error('Video services not available. Please refresh the page.');
      }

      // Join the channel with user data
      await agoraClientRef.current.join(appId, channel, token, uid);
      console.log('✅ Successfully joined Agora channel:', channel);

      // Create local tracks with enhanced error handling
      let audioTrack, videoTrack;
      try {
        audioTrack = await window.AgoraRTC.createMicrophoneAudioTrack();
        console.log('🎤 Audio track created successfully');
      } catch (audioError) {
        console.error('Microphone error:', audioError);
        throw new Error('Microphone access denied. Please check permissions.');
      }

      try {
        videoTrack = await window.AgoraRTC.createCameraVideoTrack();
        console.log('📹 Video track created successfully');
        
        // Play local video immediately
        const localPlayer = document.getElementById('local-video');
        if (localPlayer) {
          videoTrack.play('local-video');
        }
      } catch (videoError) {
        console.error('Camera error:', videoError);
        // If video fails but audio works, continue with audio only
        if (!audioTrack) {
          throw new Error('Camera access denied. Please check permissions.');
        }
        // Continue with audio only
        videoTrack = null;
      }

      localTracksRef.current.audioTrack = audioTrack;
      localTracksRef.current.videoTrack = videoTrack;

      // Publish available tracks
      const tracksToPublish = [];
      if (audioTrack) tracksToPublish.push(audioTrack);
      if (videoTrack) tracksToPublish.push(videoTrack);

      if (tracksToPublish.length > 0) {
        await agoraClientRef.current.publish(tracksToPublish);
        console.log('📤 Published tracks:', tracksToPublish.map(t => t.kind));
      }

      setIsJoined(true);
      
      // Notify via socket that user joined the community call
      if (callId) {
        socketService.joinCommunityCall(callId);
      }
      
      // Add notification instead of system message
      addNotification(`${currentUserName} joined the stream`);

    } catch (error) {
      console.error('Error joining call:', error);
      
      let errorMessage = 'Failed to join stream. ';
      if (error.message.includes('permissions') || error.message.includes('access denied')) {
        errorMessage += 'Please allow camera and microphone access in your browser settings.';
      } else if (error.message.includes('token')) {
        errorMessage += 'Authentication failed. Please try again.';
      } else if (error.message.includes('not available')) {
        errorMessage += 'Video services are temporarily unavailable. Please refresh the page.';
      } else {
        errorMessage += 'Please check your internet connection and try again.';
      }
      
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const leaveCall = async () => {
    try {
      console.log('🚪 Leaving call...');
      
      // Stop screen share if active
      if (isScreenSharing) {
        await stopScreenShare();
      }

      // Notify via socket that user left the community call
      if (callId && isJoined) {
        socketService.leaveCommunityCall(callId);
      }

      // Stop and close local tracks
      if (localTracksRef.current.audioTrack) {
        localTracksRef.current.audioTrack.stop();
        localTracksRef.current.audioTrack.close();
        console.log('🎤 Audio track closed');
      }
      if (localTracksRef.current.videoTrack) {
        localTracksRef.current.videoTrack.stop();
        localTracksRef.current.videoTrack.close();
        console.log('📹 Video track closed');
      }
      if (localTracksRef.current.screenTrack) {
        localTracksRef.current.screenTrack.stop();
        localTracksRef.current.screenTrack.close();
        console.log('🖥️ Screen track closed');
      }

      // Leave the channel
      await agoraClientRef.current.leave();
      console.log('✅ Left Agora channel');

      // Reset state
      setIsJoined(false);
      setRemoteUsers([]);
      setIsScreenSharing(false);
      localTracksRef.current = { 
        audioTrack: null, 
        videoTrack: null,
        screenTrack: null 
      };

      // Add notification instead of system message
      addNotification(`${currentUserName} left the stream`);

    } catch (error) {
      console.error('Error leaving call:', error);
    }
  };

  const toggleAudio = async () => {
    if (localTracksRef.current.audioTrack) {
      const newMutedState = !localAudioMuted;
      await localTracksRef.current.audioTrack.setMuted(newMutedState);
      setLocalAudioMuted(newMutedState);
      
      if (newMutedState) {
        addNotification(`${currentUserName} muted microphone`);
      } else {
        addNotification(`${currentUserName} unmuted microphone`);
      }
    }
  };

  const toggleVideo = async () => {
    if (localTracksRef.current.videoTrack) {
      const newMutedState = !localVideoMuted;
      await localTracksRef.current.videoTrack.setMuted(newMutedState);
      setLocalVideoMuted(newMutedState);
      
      if (newMutedState) {
        addNotification(`${currentUserName} turned off video`);
      } else {
        addNotification(`${currentUserName} turned on video`);
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
      const screenTrack = await window.AgoraRTC.createScreenVideoTrack({
        encoderConfig: '1080p_1',
      });

      // Stop current video track if exists
      if (localTracksRef.current.videoTrack) {
        await agoraClientRef.current.unpublish(localTracksRef.current.videoTrack);
        localTracksRef.current.videoTrack.stop();
        localTracksRef.current.videoTrack.close();
      }

      localTracksRef.current.screenTrack = screenTrack;
      await agoraClientRef.current.publish(screenTrack);

      // Play screen share in local video element
      const localPlayer = document.getElementById('local-video');
      if (localPlayer) {
        screenTrack.play('local-video');
      }

      setIsScreenSharing(true);
      addNotification(`${currentUserName} started screen sharing`);

      // Handle when user stops screen share via browser UI
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

      // Restore camera video
      if (!localTracksRef.current.videoTrack) {
        const videoTrack = await window.AgoraRTC.createCameraVideoTrack();
        localTracksRef.current.videoTrack = videoTrack;
        await agoraClientRef.current.publish(videoTrack);
        
        const localPlayer = document.getElementById('local-video');
        if (localPlayer) {
          videoTrack.play('local-video');
        }
      } else {
        await agoraClientRef.current.publish(localTracksRef.current.videoTrack);
        const localPlayer = document.getElementById('local-video');
        if (localPlayer && localTracksRef.current.videoTrack) {
          localTracksRef.current.videoTrack.play('local-video');
        }
      }

      setIsScreenSharing(false);
      addNotification(`${currentUserName} stopped screen sharing`);

    } catch (error) {
      console.error('Error stopping screen share:', error);
    }
  };

  const sendMessage = () => {
    if (newMessage.trim()) {
      const message = {
        id: Date.now() + Math.random(),
        sender: currentUserName,
        text: newMessage.trim(),
        timestamp: new Date(),
        isAdmin: isAdmin
      };
      setMessages(prev => [...prev.slice(-99), message]); // Keep last 100 messages
      setNewMessage('');

      // Send message via socket if in a community call
      if (callId && isJoined) {
        socketService.sendCommunityMessage({
          text: newMessage.trim(),
          callId: callId
        });
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleClose = () => {
    leaveCall();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="agora-video-call-modal">
      <div className="agora-modal-content">
        {/* Header */}
        <div className="agora-header">
          <div className="agora-header-content">
            <h3>The Conclave Streams</h3>
            {isJoined && (
              <div className="connection-status">
                <span className="status-indicator connected"></span>
                <span>{remoteUsers.length + 1} online</span>
              </div>
            )}
          </div>
          <button className="agora-close-btn" onClick={handleClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="notifications-container">
            {notifications.map(notification => (
              <div key={notification.id} className="notification">
                {notification.text}
              </div>
            ))}
          </div>
        )}

        {/* Main Content */}
        <div className="agora-main-content">
          {/* Video Area */}
          <div className="agora-video-container">
            {!isJoined ? (
              <div className="agora-join-prompt">
                <div className="join-prompt-content">
                  <i className="fas fa-video fa-3x mb-3"></i>
                  <h4>Join The Conclave Stream</h4>
                  <p>Connect with the community through live video and audio</p>
                  <div className="permissions-note">
                    <small>
                      <i className="fas fa-info-circle me-1"></i>
                      You'll be asked to allow camera and microphone access
                    </small>
                  </div>
                  <button 
                    onClick={joinCall} 
                    disabled={isLoading}
                    className="join-stream-btn"
                  >
                    {isLoading ? (
                      <>
                        <i className="fas fa-spinner fa-spin me-2"></i>
                        Joining...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-play me-2"></i>
                        Join Stream
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="video-grid">
                {/* Local Video */}
                <div className="video-wrapper local-video-wrapper">
                  <div className="video-header">
                    <span className="user-name">{currentUserName} (You)</span>
                    <div className="status-indicators">
                      {localAudioMuted && <i className="fas fa-microphone-slash muted" title="Microphone muted"></i>}
                      {localVideoMuted && <i className="fas fa-video-slash muted" title="Video off"></i>}
                      {isScreenSharing && <i className="fas fa-desktop sharing" title="Screen sharing"></i>}
                    </div>
                  </div>
                  <div id="local-video" className="video-player">
                    {isScreenSharing && (
                      <div className="screen-share-indicator">
                        <i className="fas fa-desktop me-2"></i>
                        Screen Sharing
                      </div>
                    )}
                  </div>
                </div>

                {/* Remote Users Videos */}
                {remoteUsers.map(user => (
                  <div key={user.uid} className="video-wrapper remote-video-wrapper">
                    <div className="video-header">
                      <span className="user-name">{user.userName}</span>
                      <div className="status-indicators">
                        {!user.hasVideo && <i className="fas fa-video-slash muted" title="Video off"></i>}
                        {!user.hasAudio && <i className="fas fa-microphone-slash muted" title="Audio muted"></i>}
                      </div>
                    </div>
                    <div id={`remote-video-${user.uid}`} className="video-player"></div>
                  </div>
                ))}

                {/* Only show empty state for admin when no one has joined */}
                {isAdmin && remoteUsers.length === 0 && (
                  <div className="video-wrapper empty-video-wrapper">
                    <div className="empty-video-placeholder">
                      <i className="fas fa-user-plus fa-2x"></i>
                      <p>Waiting for others to join...</p>
                      <small>Share this stream with others to connect</small>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Chat Sidebar */}
          <div className="agora-chat-sidebar">
            <div className="chat-header">
              <h5>Community Chat</h5>
              <span className="online-count">{remoteUsers.length + 1} online</span>
            </div>
            
            <div className="chat-messages-container">
              <div className="chat-messages">
                {messages.length === 0 ? (
                  <div className="no-messages">
                    <i className="fas fa-comments fa-2x"></i>
                    <p>No messages yet</p>
                    <small>Start the conversation!</small>
                  </div>
                ) : (
                  messages.map(message => (
                    <div 
                      key={message.id} 
                      className={`message ${message.isAdmin ? 'admin-message' : ''}`}
                    >
                      <div className="message-sender">
                        {message.sender}
                        {message.isAdmin && <span className="admin-badge">Admin</span>}
                      </div>
                      <div className="message-text">{message.text}</div>
                      <div className="message-time">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {isJoined && (
              <div className="chat-input-container">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message to the community..."
                  className="chat-input"
                  maxLength={500}
                  rows="1"
                />
                <button 
                  onClick={sendMessage} 
                  disabled={!newMessage.trim()}
                  className="send-message-btn"
                  title="Send message"
                >
                  <i className="fas fa-paper-plane"></i>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        {isJoined && (
          <div className="agora-controls">
            <button 
              onClick={toggleAudio}
              className={`control-btn ${localAudioMuted ? 'muted' : ''}`}
              title={localAudioMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              <i className={`fas ${localAudioMuted ? 'fa-microphone-slash' : 'fa-microphone'}`}></i>
              {localAudioMuted ? 'Unmute' : 'Mute'}
            </button>
            
            <button 
              onClick={toggleVideo}
              className={`control-btn ${localVideoMuted ? 'muted' : ''}`}
              title={localVideoMuted ? 'Start video' : 'Stop video'}
              disabled={isScreenSharing}
            >
              <i className={`fas ${localVideoMuted ? 'fa-video-slash' : 'fa-video'}`}></i>
              {localVideoMuted ? 'Start Video' : 'Stop Video'}
            </button>

            <button 
              onClick={toggleScreenShare}
              className={`control-btn ${isScreenSharing ? 'sharing' : ''}`}
              title={isScreenSharing ? 'Stop screen share' : 'Share screen'}
            >
              <i className={`fas ${isScreenSharing ? 'fa-stop' : 'fa-desktop'}`}></i>
              {isScreenSharing ? 'Stop Share' : 'Share Screen'}
            </button>
            
            <button 
              onClick={leaveCall}
              className="control-btn leave-btn"
              title="Leave stream"
            >
              <i className="fas fa-phone-slash"></i>
              Leave Stream
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgoraVideoCall;