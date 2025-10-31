import React, { useState, useEffect, useRef } from 'react';
import MessageThread from './MessageThread';
import AudioVisualizer from './AudioVisualizer';
import webrtcService from '../services/webrtcService';
import socketService from '../services/socketService';

const CommunityCallModal = ({ 
  isOpen, 
  onClose, 
  participants, 
  messages, 
  onSendMessage, 
  isAdmin,
  currentUserName 
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [remoteStreams, setRemoteStreams] = useState([]);
  const [audioContext, setAudioContext] = useState(null);
  const [analyser, setAnalyser] = useState(null);
  const [allMuted, setAllMuted] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState({});

  const localAudioRef = useRef(null);
  const remoteAudioRefs = useRef(new Map());
  const speakingDetectionRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    console.log('🎮 Initializing CommunityCallModal with participants:', participants);

    // Initialize WebRTC service with socket
    const socket = socketService.getSocket();
    webrtcService.setSocket(socket);

    // Start local audio stream
    const initializeAudio = async () => {
      try {
        console.log('🎤 Starting audio initialization...');
        const stream = await webrtcService.startLocalStream();
        
        if (localAudioRef.current) {
          localAudioRef.current.srcObject = stream;
          localAudioRef.current.volume = 1.0;
          console.log('✅ Local audio element configured');
        }

        // Get analyser for local stream visualization
        const localAnalyser = webrtcService.getLocalAnalyser();
        setAnalyser(localAnalyser);
        setAudioContext(webrtcService.audioContext);

        // Start speaking detection
        startSpeakingDetection();

        // Create peer connections with all other participants
        participants.forEach(participant => {
          if (!participant.isYou && participant.socketId) {
            console.log(`🔗 Initiating connection to: ${participant.name} (${participant.socketId})`);
            webrtcService.createOffer(participant.socketId, participant.name);
          }
        });

      } catch (error) {
        console.error('❌ Error initializing audio:', error);
        alert('Could not access microphone. Please check permissions and try again.');
      }
    };

    // Listen for remote audio streams
    const handleRemoteAudio = (event) => {
      const { socketId, stream, userName } = event.detail;
      console.log(`🎧 Remote audio event for ${userName} (${socketId})`);
      
      setRemoteStreams(prev => {
        const exists = prev.find(rs => rs.socketId === socketId);
        if (!exists) {
          return [...prev, { socketId, stream, userName }];
        }
        return prev;
      });

      // Create and play remote audio element
      const audioElement = document.createElement('audio');
      audioElement.srcObject = stream;
      audioElement.autoplay = true;
      audioElement.volume = 1.0;
      audioElement.setAttribute('data-socket-id', socketId);
      remoteAudioRefs.current.set(socketId, audioElement);
      
      console.log(`✅ Remote audio element created for ${userName}`);
    };

    // Listen for connection status changes
    const updateConnectionStatus = () => {
      const status = {};
      participants.forEach(participant => {
        if (!participant.isYou && participant.socketId) {
          status[participant.socketId] = webrtcService.getConnectionState(participant.socketId);
        }
      });
      setConnectionStatus(status);
    };

    // Setup event listeners
    window.addEventListener('remoteAudioAdded', handleRemoteAudio);
    
    // Periodically update connection status
    const statusInterval = setInterval(updateConnectionStatus, 3000);

    initializeAudio();

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up CommunityCallModal');
      window.removeEventListener('remoteAudioAdded', handleRemoteAudio);
      clearInterval(statusInterval);
      
      if (speakingDetectionRef.current) {
        clearInterval(speakingDetectionRef.current);
      }

      // Close all peer connections
      participants.forEach(participant => {
        if (!participant.isYou && participant.socketId) {
          webrtcService.closeConnection(participant.socketId);
        }
      });

      // Stop local stream
      webrtcService.stopLocalStream();
      
      // Clear remote audio elements
      remoteAudioRefs.current.forEach(audio => {
        audio.srcObject = null;
      });
      remoteAudioRefs.current.clear();
    };
  }, [isOpen, participants]);

  const startSpeakingDetection = () => {
    if (speakingDetectionRef.current) {
      clearInterval(speakingDetectionRef.current);
    }

    speakingDetectionRef.current = setInterval(() => {
      // Simulate speaking detection - in real app, use audio analysis
      // For now, we'll randomly set speaking state for demo
      if (!isMuted && Math.random() > 0.7) {
        setIsSpeaking(true);
        setTimeout(() => setIsSpeaking(false), 1000);
      }
    }, 2000);
  };

  const toggleMute = () => {
    const newMutedState = !isMuted;
    const success = webrtcService.setMuted(newMutedState);
    
    if (success) {
      setIsMuted(newMutedState);
      console.log(`🔊 ${newMutedState ? 'Muted' : 'Unmuted'} microphone`);
    }
  };

  const toggleVideo = async () => {
    if (!isVideoOn) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
        setIsVideoOn(true);
        console.log('Video sharing started');
      } catch (error) {
        console.error('Error starting video:', error);
        alert('Could not access camera. Please check permissions.');
      }
    } else {
      setIsVideoOn(false);
      console.log('Video sharing stopped');
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
        setIsScreenSharing(true);
        console.log('Screen sharing started');
        
        stream.getTracks().forEach(track => {
          track.onended = () => {
            setIsScreenSharing(false);
            console.log('Screen sharing stopped');
          };
        });
      } catch (error) {
        console.error('Error starting screen share:', error);
      }
    } else {
      setIsScreenSharing(false);
      console.log('Screen sharing stopped');
    }
  };

  const toggleMuteAll = () => {
    setAllMuted(!allMuted);
    // In a real implementation, this would emit a socket event to mute all users
    console.log(allMuted ? 'All users unmuted' : 'All users muted');
  };

  const getConnectionStatus = (participant) => {
    if (participant.isYou) return 'connected';
    if (!participant.socketId) return 'disconnected';
    return connectionStatus[participant.socketId] || 'connecting';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'success';
      case 'connecting': return 'warning';
      case 'failed': return 'danger';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected': return 'fa-check-circle';
      case 'connecting': return 'fa-spinner fa-spin';
      case 'failed': return 'fa-exclamation-circle';
      default: return 'fa-times-circle';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.8)'}} tabIndex="-1">
      <div className="modal-dialog modal-fullscreen">
        <div className="modal-content bg-dark text-white">
          {/* Header */}
          <div className="modal-header border-secondary">
            <div className="d-flex align-items-center">
              <h5 className="modal-title me-3">Community Call</h5>
              <span className="badge bg-primary">
                <i className="fas fa-users me-1"></i>
                {participants.length} participants
              </span>
              {allMuted && (
                <span className="badge bg-warning text-dark ms-2">
                  <i className="fas fa-volume-mute me-1"></i>
                  All Muted
                </span>
              )}
            </div>
            <button 
              type="button" 
              className="btn-close btn-close-white" 
              onClick={onClose}
            ></button>
          </div>

          {/* Main Content */}
          <div className="modal-body d-flex flex-column flex-md-row p-0">
            {/* Video/Audio Area */}
            <div className="flex-grow-1 p-3 d-flex flex-column">
              {/* Simplified Audio Status Bar */}
              <div className="row mb-3">
                <div className="col-12">
                  <div className="d-flex justify-content-between align-items-center p-2 bg-dark bg-opacity-50 rounded">
                    {/* Local Audio Status */}
                    <div className="d-flex align-items-center">
                      <div className={`me-2 ${isMuted ? 'text-danger' : 'text-success'}`}>
                        <i className={`fas ${isMuted ? 'fa-microphone-slash' : 'fa-microphone'}`}></i>
                      </div>
                      <small className="text-muted">Your Audio: </small>
                      <small className={isMuted ? 'text-danger' : 'text-success'}>
                        {isMuted ? 'Muted' : 'Live'}
                      </small>
                    </div>

                    {/* Remote Audio Status */}
                    {remoteStreams.length > 0 && (
                      <div className="d-flex align-items-center">
                        <div className="text-success me-2">
                          <i className="fas fa-headphones"></i>
                        </div>
                        <small className="text-muted">Remote Audio: </small>
                        <small className="text-success ms-1">
                          {remoteStreams.length} connected
                        </small>
                      </div>
                    )}

                    {/* Connection Status Summary */}
                    <div className="d-flex align-items-center">
                      <div className="text-info me-2">
                        <i className="fas fa-signal"></i>
                      </div>
                      <small className="text-muted">Connections: </small>
                      <small className="text-info ms-1">
                        {Object.values(connectionStatus).filter(s => s === 'connected').length} active
                      </small>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hidden audio elements */}
              <audio 
                ref={localAudioRef} 
                autoPlay 
                muted={isMuted}
                style={{ display: 'none' }}
              />
              
              {/* Participants Grid - Simplified */}
              <div className="flex-grow-1 bg-black rounded position-relative">
                <div className="row g-2 h-100 p-2">
                  {participants.map((participant, index) => {
                    const status = getConnectionStatus(participant);
                    const statusColor = getStatusColor(status);
                    const statusIcon = getStatusIcon(status);
                    
                    return (
                      <div 
                        key={participant.id} 
                        className={`col-12 ${participants.length > 1 ? 'col-md-6' : ''} ${participants.length > 2 ? 'col-lg-4' : ''}`}
                      >
                        <div className={`card h-100 ${participant.isYou ? 'border-primary' : 'border-secondary'} ${status === 'connected' ? 'border-success' : ''}`}>
                          <div className="card-body text-center d-flex flex-column justify-content-center bg-dark position-relative">
                            
                            {/* Status Indicators in Top Right */}
                            <div className="position-absolute top-0 end-0 p-2 d-flex flex-column gap-1">
                              {/* Connection Status */}
                              {!participant.isYou && (
                                <span className={`badge bg-${statusColor}`} title={status}>
                                  <i className={`fas ${statusIcon}`}></i>
                                </span>
                              )}
                              
                              {/* Mute Status */}
                              {(isMuted && participant.isYou) && (
                                <span className="badge bg-danger" title="You are muted">
                                  <i className="fas fa-microphone-slash"></i>
                                </span>
                              )}
                              
                              {(allMuted && !participant.isAdmin && !participant.isYou) && (
                                <span className="badge bg-warning text-dark" title="Admin muted all">
                                  <i className="fas fa-volume-mute"></i>
                                </span>
                              )}
                              
                              {/* Admin Badge */}
                              {participant.isAdmin && (
                                <span className="badge bg-warning text-dark" title="Admin">
                                  <i className="fas fa-crown"></i>
                                </span>
                              )}

                              {/* Screen Share Indicator */}
                              {isScreenSharing && participant.isYou && (
                                <span className="badge bg-info" title="Screen sharing">
                                  <i className="fas fa-desktop"></i>
                                </span>
                              )}
                            </div>

                            {/* Video/Audio Placeholder */}
                            <div className="position-relative mb-2 mx-auto" style={{width: '100px', height: '100px'}}>
                              {isVideoOn && participant.isYou ? (
                                <div className="video-feed-placeholder bg-success rounded w-100 h-100 d-flex align-items-center justify-content-center">
                                  <div className="text-center">
                                    <i className="fas fa-video fa-2x mb-1"></i>
                                    <p className="mb-0 small">Live Video</p>
                                  </div>
                                </div>
                              ) : (
                                <div className="rounded-circle bg-secondary w-100 h-100 d-flex align-items-center justify-content-center">
                                  <i className="fas fa-user fa-2x text-light"></i>
                                </div>
                              )}
                              
                              {/* Speaking Indicator */}
                              {(isSpeaking && participant.isYou && !isMuted) && (
                                <div className="position-absolute top-0 start-0">
                                  <span className="badge bg-success pulse">
                                    <i className="fas fa-volume-up"></i>
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            {/* Participant Info */}
                            <div className="mt-2">
                              <h6 className="mb-1">
                                {participant.name}
                                {participant.isYou && <span className="text-info ms-1">(You)</span>}
                              </h6>
                              
                              {/* Simplified Status Text */}
                              <div className="d-flex justify-content-center align-items-center gap-2">
                                <small className={`text-${statusColor}`}>
                                  <i className={`fas ${statusIcon} me-1`}></i>
                                  {status === 'connected' ? 'Connected' :
                                   status === 'connecting' ? 'Connecting' :
                                   'Disconnected'}
                                </small>
                                
                                {/* Audio Status Dot */}
                                <span 
                                  className={`rounded-circle ${
                                    (isMuted && participant.isYou) || (allMuted && !participant.isAdmin && !participant.isYou) 
                                      ? 'bg-danger' 
                                      : (isSpeaking && participant.isYou && !isMuted)
                                      ? 'bg-success pulse'
                                      : status === 'connected'
                                      ? 'bg-success'
                                      : 'bg-secondary'
                                  }`}
                                  style={{
                                    width: '8px',
                                    height: '8px'
                                  }}
                                  title={
                                    (isMuted && participant.isYou) || (allMuted && !participant.isAdmin && !participant.isYou) 
                                      ? 'Muted' 
                                      : (isSpeaking && participant.isYou && !isMuted)
                                      ? 'Speaking'
                                      : status === 'connected'
                                      ? 'Audio Active'
                                      : 'No Audio'
                                  }
                                ></span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Empty slots removed for cleaner interface */}
                </div>
              </div>

              {/* Single Audio Visualizer for Local Stream */}
              <div className="row mt-3">
                <div className="col-12">
                  <div className="bg-dark bg-opacity-50 rounded p-3">
                    <h6 className="text-center mb-3">
                      <i className="fas fa-wave-square me-2"></i>
                      Audio Levels
                    </h6>
                    <div className="row justify-content-center">
                      <div className="col-md-6">
                        <AudioVisualizer
                          audioContext={audioContext}
                          analyser={analyser}
                          isSpeaking={isSpeaking && !isMuted}
                          label={`Your Audio (${isMuted ? 'Muted' : 'Live'})`}
                          size="medium"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Section */}
            <div className="border-start border-secondary" style={{width: '100%', maxWidth: '400px'}}>
              <div className="d-flex flex-column h-100">
                <MessageThread
                  messages={messages}
                  onSendMessage={onSendMessage}
                  currentUser={currentUserName}
                  isAdmin={isAdmin}
                  compact={true}
                />
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="modal-footer border-secondary justify-content-center">
            <div className="d-flex flex-wrap justify-content-center gap-2">
              <button 
                onClick={toggleMute}
                className={`btn ${isMuted ? 'btn-danger' : 'btn-success'} btn-lg`}
                title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
              >
                <i className={`fas ${isMuted ? 'fa-microphone-slash' : 'fa-microphone'}`}></i>
                {isMuted ? ' Unmute' : ' Mute'}
              </button>
              
              <button 
                onClick={toggleVideo}
                className={`btn ${isVideoOn ? 'btn-success' : 'btn-secondary'} btn-lg`}
                title={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
              >
                <i className={`fas ${isVideoOn ? 'fa-video' : 'fa-video-slash'}`}></i>
                {isVideoOn ? ' Video On' : ' Start Video'}
              </button>
              
              <button 
                onClick={toggleScreenShare}
                className={`btn ${isScreenSharing ? 'btn-warning' : 'btn-secondary'} btn-lg`}
                title={isScreenSharing ? 'Stop screen share' : 'Share screen'}
              >
                <i className="fas fa-desktop"></i>
                {isScreenSharing ? ' Stop Share' : ' Share Screen'}
              </button>
              
              {isAdmin && (
                <button 
                  onClick={toggleMuteAll}
                  className={`btn ${allMuted ? 'btn-warning' : 'btn-secondary'} btn-lg`}
                  title={allMuted ? 'Unmute all participants' : 'Mute all participants'}
                >
                  <i className={`fas ${allMuted ? 'fa-volume-up' : 'fa-volume-mute'}`}></i>
                  {allMuted ? ' Unmute All' : ' Mute All'}
                </button>
              )}
              
              <button onClick={onClose} className="btn btn-danger btn-lg" title="Leave call">
                <i className="fas fa-phone-slash"></i>
                Leave Call
              </button>
            </div>
          </div>

          {/* Debug Info */}
          {process.env.NODE_ENV === 'development' && (
            <div className="modal-footer border-top-0">
              <div className="w-100">
                <small className="text-muted">
                  <strong>Debug:</strong> Local Stream: {webrtcService.localStream ? '✅' : '❌'} | 
                  Remote Streams: {remoteStreams.length} | 
                  Peer Connections: {webrtcService.getActiveConnections().length}
                </small>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add pulse animation styles */}
      <style>
        {`
          @keyframes pulse {
            0% {
              transform: scale(1);
              opacity: 1;
            }
            50% {
              transform: scale(1.1);
              opacity: 0.7;
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }
          .pulse {
            animation: pulse 1.5s infinite;
          }
        `}
      </style>
    </div>
  );
};

export default CommunityCallModal;