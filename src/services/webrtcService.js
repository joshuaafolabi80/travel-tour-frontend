// webrtcService.js - Updated with screen sharing and video support
class WebRTCService {
  constructor() {
    this.localStream = null;
    this.localVideoStream = null;
    this.localScreenStream = null;
    this.remoteStreams = new Map();
    this.peerConnections = new Map();
    this.socket = null;
    this.audioContext = null;
    this.analysers = new Map();
  }

  setSocket(socket) {
    this.socket = socket;
    this.setupSocketListeners();
  }

  async startLocalStream(video = false) {
    try {
      console.log('🎤 Starting local stream...', { video });
      
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 48000,
          sampleSize: 16
        },
        video: video ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        } : false
      };

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);

      console.log('✅ Local stream acquired:', {
        audio: this.localStream.getAudioTracks()[0]?.label,
        video: this.localStream.getVideoTracks()[0]?.label
      });
      
      // Setup audio context for local stream visualization
      if (this.localStream.getAudioTracks().length > 0) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = this.audioContext.createAnalyser();
        analyser.fftSize = 256;
        
        const source = this.audioContext.createMediaStreamSource(this.localStream);
        source.connect(analyser);
        
        this.analysers.set('local', analyser);
      }
      
      return this.localStream;
    } catch (error) {
      console.error('❌ Error accessing media devices:', error);
      throw error;
    }
  }

  async startScreenShare() {
    try {
      console.log('🖥️ Starting screen share...');
      
      this.localScreenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          displaySurface: 'window'
        },
        audio: true
      });

      console.log('✅ Screen share acquired:', {
        video: this.localScreenStream.getVideoTracks()[0]?.label,
        audio: this.localScreenStream.getAudioTracks()[0]?.label
      });

      // Replace video tracks in all peer connections
      this.peerConnections.forEach((peerConnection, socketId) => {
        const videoTrack = this.localScreenStream.getVideoTracks()[0];
        if (videoTrack) {
          const sender = peerConnection.getSenders().find(s => 
            s.track && s.track.kind === 'video'
          );
          if (sender) {
            sender.replaceTrack(videoTrack);
            console.log(`✅ Replaced video track for ${socketId}`);
          }
        }
      });

      // Handle when user stops screen share
      this.localScreenStream.getVideoTracks()[0].onended = () => {
        console.log('🖥️ Screen share ended by user');
        this.stopScreenShare();
      };

      return this.localScreenStream;
    } catch (error) {
      console.error('❌ Error starting screen share:', error);
      throw error;
    }
  }

  stopScreenShare() {
    if (this.localScreenStream) {
      console.log('🖥️ Stopping screen share');
      this.localScreenStream.getTracks().forEach(track => track.stop());
      this.localScreenStream = null;

      // Restore camera video track if available
      if (this.localStream && this.localStream.getVideoTracks().length > 0) {
        this.peerConnections.forEach((peerConnection, socketId) => {
          const videoTrack = this.localStream.getVideoTracks()[0];
          if (videoTrack) {
            const sender = peerConnection.getSenders().find(s => 
              s.track && s.track.kind === 'video'
            );
            if (sender) {
              sender.replaceTrack(videoTrack);
              console.log(`✅ Restored camera video for ${socketId}`);
            }
          }
        });
      }
    }
  }

  async startVideo() {
    try {
      if (!this.localStream) {
        await this.startLocalStream(true);
        return this.localStream;
      }

      // Add video track to existing audio stream
      const videoStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        }
      });

      const videoTrack = videoStream.getVideoTracks()[0];
      this.localStream.addTrack(videoTrack);

      // Add video track to all peer connections
      this.peerConnections.forEach((peerConnection, socketId) => {
        peerConnection.addTrack(videoTrack, this.localStream);
        console.log(`✅ Added video track to ${socketId}`);
      });

      console.log('✅ Video started');
      return this.localStream;
    } catch (error) {
      console.error('❌ Error starting video:', error);
      throw error;
    }
  }

  stopVideo() {
    if (this.localStream) {
      const videoTracks = this.localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.stop();
        this.localStream.removeTrack(track);
      });
      console.log('✅ Video stopped');
    }
  }

  stopLocalStream() {
    if (this.localStream) {
      console.log('🔇 Stopping local stream');
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.localScreenStream) {
      this.localScreenStream.getTracks().forEach(track => track.stop());
      this.localScreenStream = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.analysers.clear();
  }

  async createPeerConnection(targetSocketId, targetUserName) {
    console.log(`🔗 Creating peer connection to ${targetUserName} (${targetSocketId})`);
    
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ],
      iceCandidatePoolSize: 10
    };

    const peerConnection = new RTCPeerConnection(configuration);
    
    // Add local stream to connection
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        console.log(`➕ Adding local track: ${track.kind} to peer connection`);
        peerConnection.addTrack(track, this.localStream);
      });
    }

    // Handle incoming remote stream
    peerConnection.ontrack = (event) => {
      console.log(`🎧 Received remote track from ${targetUserName}`, event.track.kind);
      const [remoteStream] = event.streams;
      
      if (remoteStream.getAudioTracks().length > 0 || remoteStream.getVideoTracks().length > 0) {
        this.remoteStreams.set(targetSocketId, remoteStream);
        
        // Setup analyser for remote audio stream
        if (this.audioContext && remoteStream.getAudioTracks().length > 0) {
          const remoteAnalyser = this.audioContext.createAnalyser();
          remoteAnalyser.fftSize = 256;
          const remoteSource = this.audioContext.createMediaStreamSource(remoteStream);
          remoteSource.connect(remoteAnalyser);
          this.analysers.set(targetSocketId, remoteAnalyser);
        }
        
        // Emit event that remote media is available
        const mediaEvent = new CustomEvent('remoteMediaAdded', {
          detail: { 
            socketId: targetSocketId, 
            stream: remoteStream,
            userName: targetUserName,
            hasAudio: remoteStream.getAudioTracks().length > 0,
            hasVideo: remoteStream.getVideoTracks().length > 0
          }
        });
        window.dispatchEvent(mediaEvent);
        
        console.log(`✅ Remote stream ready for ${targetUserName}`, {
          audio: remoteStream.getAudioTracks().length,
          video: remoteStream.getVideoTracks().length
        });
      }
    };

    // Handle ICE connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log(`🔄 Peer connection state for ${targetUserName}:`, peerConnection.connectionState);
      
      if (peerConnection.connectionState === 'connected') {
        console.log(`✅ Peer connection established with ${targetUserName}`);
      } else if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'disconnected') {
        console.warn(`⚠️ Peer connection issue with ${targetUserName}:`, peerConnection.connectionState);
      }
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log(`🧊 Sending ICE candidate to ${targetUserName}`);
        this.socket.emit('webrtc_ice_candidate', {
          targetSocketId: targetSocketId,
          candidate: event.candidate
        });
      }
    };

    this.peerConnections.set(targetSocketId, peerConnection);
    return peerConnection;
  }

  async createOffer(targetSocketId, targetUserName) {
    try {
      console.log(`📤 Creating offer for ${targetUserName}`);
      const peerConnection = await this.createPeerConnection(targetSocketId, targetUserName);
      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      
      await peerConnection.setLocalDescription(offer);
      console.log(`✅ Offer created for ${targetUserName}`);

      this.socket.emit('webrtc_offer', {
        targetSocketId: targetSocketId,
        offer: offer,
        senderName: targetUserName
      });
    } catch (error) {
      console.error(`❌ Error creating offer for ${targetUserName}:`, error);
    }
  }

  async handleOffer(offerData) {
    const { offer, senderSocketId, senderName } = offerData;
    console.log(`📥 Received offer from ${senderName}`);
    
    try {
      const peerConnection = await this.createPeerConnection(senderSocketId, senderName);
      await peerConnection.setRemoteDescription(offer);
      
      const answer = await peerConnection.createAnswer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      await peerConnection.setLocalDescription(answer);

      console.log(`📤 Sending answer to ${senderName}`);
      this.socket.emit('webrtc_answer', {
        targetSocketId: senderSocketId,
        answer: answer
      });
    } catch (error) {
      console.error(`❌ Error handling offer from ${senderName}:`, error);
    }
  }

  async handleAnswer(answerData) {
    const { answer, senderSocketId } = answerData;
    const peerConnection = this.peerConnections.get(senderSocketId);
    
    if (peerConnection) {
      console.log(`📥 Received answer from ${senderSocketId}`);
      try {
        await peerConnection.setRemoteDescription(answer);
        console.log(`✅ Remote description set for ${senderSocketId}`);
      } catch (error) {
        console.error(`❌ Error setting remote description:`, error);
      }
    }
  }

  async handleICECandidate(candidateData) {
    const { candidate, senderSocketId } = candidateData;
    const peerConnection = this.peerConnections.get(senderSocketId);
    
    if (peerConnection && candidate) {
      try {
        await peerConnection.addIceCandidate(candidate);
        console.log(`✅ Added ICE candidate from ${senderSocketId}`);
      } catch (error) {
        console.error(`❌ Error adding ICE candidate:`, error);
      }
    }
  }

  setupSocketListeners() {
    this.socket.on('webrtc_offer', (data) => this.handleOffer(data));
    this.socket.on('webrtc_answer', (data) => this.handleAnswer(data));
    this.socket.on('webrtc_ice_candidate', (data) => this.handleICECandidate(data));
  }

  closeConnection(targetSocketId) {
    const peerConnection = this.peerConnections.get(targetSocketId);
    if (peerConnection) {
      console.log(`🔚 Closing peer connection to ${targetSocketId}`);
      peerConnection.close();
      this.peerConnections.delete(targetSocketId);
      this.remoteStreams.delete(targetSocketId);
      this.analysers.delete(targetSocketId);
    }
  }

  getRemoteStream(socketId) {
    return this.remoteStreams.get(socketId);
  }

  getAllRemoteStreams() {
    return Array.from(this.remoteStreams.values());
  }

  getAnalyser(socketId) {
    return this.analysers.get(socketId);
  }

  getLocalAnalyser() {
    return this.analysers.get('local');
  }

  isMuted() {
    if (!this.localStream) return true;
    const audioTrack = this.localStream.getAudioTracks()[0];
    return !audioTrack || !audioTrack.enabled;
  }

  setMuted(muted) {
    if (this.localStream) {
      const audioTracks = this.localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !muted;
      });
      console.log(`🔊 ${muted ? 'Muted' : 'Unmuted'} local audio`);
      return !muted;
    }
    return false;
  }

  getConnectionState(targetSocketId) {
    const pc = this.peerConnections.get(targetSocketId);
    return pc ? pc.connectionState : 'disconnected';
  }

  // Get all active peer connections
  getActiveConnections() {
    return Array.from(this.peerConnections.keys());
  }

  // Check if video is available
  hasVideo() {
    return this.localStream && this.localStream.getVideoTracks().length > 0;
  }

  // Check if screen is being shared
  isScreenSharing() {
    return this.localScreenStream !== null;
  }
}

export default new WebRTCService();