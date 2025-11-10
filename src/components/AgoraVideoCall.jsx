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

  // Socket listeners for community coordination
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
      // Clear "Join stream" availability when admin ends call
      setHasActiveStream(false);
    };

    const handleNewMessage = (event) => {
      console.log('💬 NEW MESSAGE RECEIVED IN VIDEO CALL:', event.detail);
      
      // 🆕 FIXED: Ensure message has proper structure before adding
      if (event.detail && event.detail.text && event.detail.sender) {
        const formattedMessage = {
          id: event.detail.id || `msg_${Date.now()}_${Math.random()}`,
          sender: event.detail.sender,
          text: event.detail.text,
          timestamp: event.detail.timestamp ? new Date(event.detail.timestamp) : new Date(),
          isAdmin: event.detail.isAdmin || false
        };
        
        console.log(`💬 ADDING MESSAGE TO CHAT: ${formattedMessage.sender}: ${formattedMessage.text}`);
        setMessages(prev => [...prev.slice(-99), formattedMessage]);
      } else {
        console.warn('⚠️ Received malformed message:', event.detail);
      }
    };

    const handleUserJoinedCall = (event) => {
      console.log('👤 User joined call:', event.detail);
      setUserNameMap(prev => ({
        ...prev,
        [event.detail.userId]: event.detail.userName
      }));
      
      // 🆕 ADDED: System message when user joins
      if (event.detail.userName && event.detail.userName !== currentUserName) {
        const systemMessage = {
          id: `system_${Date.now()}`,
          sender: 'System',
          text: `${event.detail.userName} joined the stream`,
          timestamp: new Date(),
          isSystem: true
        };
        setMessages(prev => [...prev.slice(-99), systemMessage]);
      }
    };

    const handleUserLeftCall = (event) => {
      console.log('👤 User left call:', event.detail);
      setUserNameMap(prev => {
        const newMap = { ...prev };
        delete newMap[event.detail.userId];
        return newMap;
      });
      
      // 🆕 ADDED: System message when user leaves
      if (event.detail.userName && event.detail.userName !== currentUserName) {
        const systemMessage = {
          id: `system_${Date.now()}`,
          sender: 'System',
          text: `${event.detail.userName} left the stream`,
          timestamp: new Date(),
          isSystem: true
        };
        setMessages(prev => [...prev.slice(-99), systemMessage]);
      }
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
  }, [isOpen, isJoined, currentUserName]); // 🆕 ADDED currentUserName dependency

  // Auto-remove notifications with animation
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
    
    client.on('user-published', async (user, mediaType) => {
      console.log(`👤 User ${user.uid} published ${mediaType}`);
      
      try {
        await client.subscribe(user, mediaType);
        
        const remoteUserName = userNameMap[user.uid] || `User ${user.uid}`;
        
        if (mediaType === 'video') {
          console.log(`🎥 Setting up remote video for user ${user.uid} - ${remoteUserName}`);
          
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
            console.log(`✅ Remote video playing for user ${user.uid}`);
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

          addNotification(`${remoteUserName} joined with video`);
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
          addNotification(`${remoteUserName} joined with audio`);
        }
      } catch (error) {
        console.error('Error subscribing to user:', error);
      }
    });

    client.on('user-unpublished', (user, mediaType) => {
      const remoteUserName = userNameMap[user.uid] || `User ${user.uid}`;
      
      console.log(`👤 User ${user.uid} unpublished ${mediaType}`);
      
      if (mediaType === 'video') {
        setRemoteUsers(prev => prev.map(u => 
          u.uid === user.uid ? { ...u, hasVideo: false } : u
        ));
        
        const videoWrapper = document.getElementById(`video-wrapper-${user.uid}`);
        if (videoWrapper) {
          const videoPlayer = document.getElementById(`remote-video-${user.uid}`);
          if (videoPlayer) {
            videoPlayer.innerHTML = `
              <div class="w-100 h-100 d-flex flex-column align-items-center justify-content-center bg-dark text-muted">
                <i class="fas fa-video-slash fa-2x mb-2"></i>
                <small>Video Off</small>
              </div>
            `;
          }
        }
      }
      if (mediaType === 'audio') {
        setRemoteUsers(prev => prev.map(u => 
          u.uid === user.uid ? { ...u, hasAudio: false } : u
        ));
      }
    });

    client.on('user-left', (user) => {
      const remoteUserName = userNameMap[user.uid] || `User ${user.uid}`;
      console.log(`👤 User ${user.uid} left the channel`);
      addNotification(`${remoteUserName} left the stream`);
      
      setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
      
      const videoWrapper = document.getElementById(`video-wrapper-${user.uid}`);
      if (videoWrapper) {
        videoWrapper.remove();
      }
    });

    client.on('connection-state-change', (curState, prevState) => {
      console.log(`🔄 Connection state changed: ${prevState} -> ${curState}`);
      
      if (curState === 'DISCONNECTED' || curState === 'FAILED') {
        addNotification('Connection lost. Attempting to reconnect...');
      } else if (curState === 'CONNECTED') {
        addNotification('Connection established');
      }
    });
  };

  // Request permissions before joining call
  const requestPermissions = async () => {
    try {
      console.log('🔐 Requesting camera and microphone permissions...');
      
      // Request camera permission
      const videoStream = await navigator.mediaDevices.getUserMedia({ 
        video: true,
        audio: false 
      });
      videoStream.getTracks().forEach(track => track.stop());
      
      // Request microphone permission  
      const audioStream = await navigator.mediaDevices.getUserMedia({ 
        video: false,
        audio: true 
      });
      audioStream.getTracks().forEach(track => track.stop());
      
      console.log('✅ Camera and microphone permissions granted');
      setPermissionsGranted(true);
      return true;
      
    } catch (error) {
      console.error('❌ Permission denied:', error);
      let errorMessage = 'Permission denied. ';
      
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Please allow camera and microphone access in your browser settings to join the stream.';
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'Camera or microphone not found. Please check your device.';
      } else {
        errorMessage += 'Unable to access camera and microphone.';
      }
      
      alert(errorMessage);
      return false;
    }
  };

  const joinCall = async () => {
    if (!currentUserName) {
      alert('Please set your display name first');
      return;
    }

    // Request permissions first
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
      console.log('✅ Successfully joined Agora channel:', channel);

      let audioTrack, videoTrack;
      try {
        audioTrack = await window.AgoraRTC.createMicrophoneAudioTrack();
        console.log('🎤 Audio track created successfully');
      } catch (audioError) {
        console.error('Microphone error:', audioError);
        throw new Error('Microphone access denied. Please check permissions.');
      }

      try {
        videoTrack = await window.AgoraRTC.createCameraVideoTrack({
          encoderConfig: '720p_1'
        });
        console.log('📹 Video track created successfully');
        
        const localPlayer = document.getElementById('local-video-player');
        if (localPlayer) {
          videoTrack.play('local-video-player');
          console.log('✅ Local video playing');
        }
      } catch (videoError) {
        console.error('Camera error:', videoError);
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
        console.log('📤 Published tracks:', tracksToPublish.map(t => t.kind));
      }

      setIsJoined(true);
      
      if (callId) {
        socketService.joinCommunityCall(callId, {
          userId: uid,
          userName: currentUserName,
          isAdmin: isAdmin
        });
      }
      
      setUserNameMap(prev => ({
        ...prev,
        [uid]: currentUserName
      }));

      addNotification(`You joined the stream as ${currentUserName}`);

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
      
      if (isScreenSharing) {
        await stopScreenShare();
      }

      if (callId && isJoined) {
        socketService.leaveCommunityCall(callId);
      }

      if (localTracksRef.current.audioTrack) {
        localTracksRef.current.audioTrack.stop();
        localTracksRef.current.audioTrack.close();
        localTracksRef.current.audioTrack = null;
      }
      if (localTracksRef.current.videoTrack) {
        localTracksRef.current.videoTrack.stop();
        localTracksRef.current.videoTrack.close();
        localTracksRef.current.videoTrack = null;
      }
      if (localTracksRef.current.screenTrack) {
        localTracksRef.current.screenTrack.stop();
        localTracksRef.current.screenTrack.close();
        localTracksRef.current.screenTrack = null;
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

      addNotification(`You left the stream`);

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
        addNotification('You muted microphone');
      } else {
        addNotification('You unmuted microphone');
      }
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
      
      if (newMutedState) {
        addNotification('You turned off video');
      } else {
        addNotification('You turned on video');
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
      addNotification('You started screen sharing');

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

      if (!localTracksRef.current.videoTrack) {
        const videoTrack = await window.AgoraRTC.createCameraVideoTrack();
        localTracksRef.current.videoTrack = videoTrack;
        await agoraClientRef.current.publish(videoTrack);
        
        const localPlayer = document.getElementById('local-video-player');
        if (localPlayer) {
          videoTrack.play('local-video-player');
        }
      } else {
        await agoraClientRef.current.publish(localTracksRef.current.videoTrack);
        const localPlayer = document.getElementById('local-video-player');
        if (localPlayer && localTracksRef.current.videoTrack) {
          localTracksRef.current.videoTrack.play('local-video-player');
        }
      }

      setIsScreenSharing(false);
      addNotification('You stopped screen sharing');

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
      
      // 🆕 FIXED: Add to local state immediately for instant feedback
      setMessages(prev => [...prev.slice(-99), message]);
      setNewMessage('');

      // 🆕 FIXED: Proper socket message formatting with all required fields
      if (callId && isJoined) {
        console.log(`💬 SENDING CHAT MESSAGE: ${currentUserName}: ${newMessage.trim()}`);
        
        socketService.sendCommunityMessage({
          text: newMessage.trim(),
          callId: callId,
          sender: currentUserName, // 🆕 ENSURES SENDER NAME IS INCLUDED
          isAdmin: isAdmin, // 🆕 ENSURES ADMIN STATUS IS INCLUDED
          timestamp: new Date().toISOString()
        });
      } else {
        console.warn('⚠️ Cannot send message: No active call or not joined');
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

  // Fix for issue #1: Stop video button crash
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
          
          {/* Header */}
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

          {/* Notifications - Fixed issue #6: Animated notifications in bottom-left */}
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

          {/* Main Content */}
          <div className="modal-body p-0 d-flex flex-column h-100">
            
            {/* Video Area */}
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
                  {/* Local Video - Always First */}
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

                  {/* Remote Users */}
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

                  {/* Empty State for Admin */}
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

            {/* Chat Sidebar - Fixed issue #3: Mobile view improvements */}
            <div className="border-top border-secondary bg-dark">
              <div className="p-3">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="mb-0 text-light">Community Chat</h6>
                  <span className="badge bg-primary">{remoteUsers.length + 1} online</span>
                </div>
                
                {/* Messages */}
                <div 
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
                            {/* 🆕 FIXED: Proper sender display with admin badge */}
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

                {/* Chat Input */}
                {isJoined && (
                  <div className="d-flex gap-2 chat-input-container">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type a message..."
                      className="form-control bg-light text-dark border-secondary"
                      maxLength={500}
                    />
                    <button 
                      onClick={sendMessage} 
                      disabled={!newMessage.trim()}
                      className="btn btn-primary"
                    >
                      <i className="fas fa-paper-plane"></i>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Controls - Fixed issue #5: Leave call functions same as close button */}
          {isJoined && (
            <div className="modal-footer border-top border-secondary p-3">
              <div className="d-flex flex-wrap justify-content-center gap-2 w-100">
                <button 
                  onClick={toggleAudio}
                  className={`btn ${localAudioMuted ? 'btn-danger' : 'btn-outline-light'}`}
                >
                  <i className={`fas ${localAudioMuted ? 'fa-microphone-slash' : 'fa-microphone'} me-1`}></i>
                  <span className="d-none d-sm-inline">{localAudioMuted ? 'Unmute' : 'Mute'}</span>
                </button>
                
                <button 
                  onClick={toggleVideo}
                  className={`btn ${localVideoMuted ? 'btn-danger' : 'btn-outline-light'}`}
                  disabled={isScreenSharing}
                >
                  <i className={`fas ${localVideoMuted ? 'fa-video-slash' : 'fa-video'} me-1`}></i>
                  <span className="d-none d-sm-inline">{localVideoMuted ? 'Start Video' : 'Stop Video'}</span>
                </button>

                <button 
                  onClick={toggleScreenShare}
                  className={`btn ${isScreenSharing ? 'btn-warning' : 'btn-outline-light'}`}
                >
                  <i className={`fas ${isScreenSharing ? 'fa-stop' : 'fa-desktop'} me-1`}></i>
                  <span className="d-none d-sm-inline">{isScreenSharing ? 'Stop Share' : 'Share Screen'}</span>
                </button>
                
                {/* Fixed issue #1 & #5: Stop video and Leave call both function the same */}
                <button 
                  onClick={handleStopVideo}
                  className="btn btn-outline-warning"
                >
                  <i className="fas fa-stop me-1"></i>
                  <span className="d-none d-sm-inline">Stop Video</span>
                </button>
                
                <button 
                  onClick={handleClose}
                  className="btn btn-danger"
                >
                  <i className="fas fa-phone-slash me-1"></i>
                  <span className="d-none d-sm-inline">Leave Call</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CSS for notification animations */}
      <style jsx>{`
        @keyframes slideInLeft {
          from {
            transform: translateX(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes slideOutLeft {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(-100%);
            opacity: 0;
          }
        }
        
        .slide-in-left {
          animation: slideInLeft 0.3s ease-out;
        }
        
        /* Mobile-specific styles for chat */
        @media (max-width: 768px) {
          .chat-messages-container {
            max-height: 150px !important;
            min-height: 120px !important;
          }
          
          .modal-body {
            padding: 0.5rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AgoraVideoCall;