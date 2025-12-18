// travel-tour-frontend/src/components/MasterclassVideos.jsx - COMPLETE UNCHANGED
import React, { useState, useEffect } from 'react';
import api from '../services/api';

const MasterclassVideos = ({ navigateTo }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showAccessModal, setShowAccessModal] = useState(true); // CHANGED: Show by default
  const [accessCode, setAccessCode] = useState('');
  const [userEmail, setUserEmail] = useState(''); // NEW: Email field
  const [validating, setValidating] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [hasAccess, setHasAccess] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);

  useEffect(() => {
    // Check if user already has access
    const savedAccess = localStorage.getItem('masterclassVideoAccess');
    const savedEmail = localStorage.getItem('masterclassVideoUserEmail');
    
    if (savedAccess === 'granted' && savedEmail) {
      setHasAccess(true);
      setUserEmail(savedEmail);
      setShowAccessModal(false);
      fetchVideos();
    } else {
      setShowAccessModal(true);
      setAccessChecked(true);
    }
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      
      const response = await api.get('/videos', {
        params: {
          type: 'masterclass',
          page: 1,
          limit: 50
        }
      });
      
      if (response.data.success) {
        setVideos(response.data.videos);
      } else {
        setVideos([]);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
      setError('Failed to load videos. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const validateAccessCode = async () => {
    if (!accessCode.trim() || !userEmail.trim()) {
      setValidationError('Please enter both access code and email address');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail.trim())) {
      setValidationError('Please enter a valid email address');
      return;
    }

    setValidating(true);
    setValidationError('');

    try {
      const response = await api.post('/videos/validate-masterclass-access', {
        accessCode: accessCode.trim(),
        userEmail: userEmail.trim()
      });

      if (response.data.success) {
        // Grant access
        setHasAccess(true);
        localStorage.setItem('masterclassVideoAccess', 'granted');
        localStorage.setItem('masterclassVideoUserEmail', userEmail.trim());
        setShowAccessModal(false);
        showCustomAlert('Access granted! Welcome to Masterclass Videos.', 'success');
        
        // Fetch videos
        await fetchVideos();
      }
    } catch (error) {
      console.error('Error validating access code:', error);
      setValidationError(
        error.response?.data?.message || 
        'Invalid access code or email. Please check your details.'
      );
    } finally {
      setValidating(false);
    }
  };

  const viewVideo = (video) => {
    if (!hasAccess) {
      setShowAccessModal(true);
      return;
    }

    setSelectedVideo(video);
    setShowVideoModal(true);
  };

  const closeModal = () => {
    setShowVideoModal(false);
    setSelectedVideo(null);
  };

  const logout = () => {
    setHasAccess(false);
    setShowAccessModal(true);
    setAccessCode('');
    setUserEmail('');
    setVideos([]);
    localStorage.removeItem('masterclassVideoAccess');
    localStorage.removeItem('masterclassVideoUserEmail');
    showCustomAlert('Logged out. Please enter your access code to continue.', 'info');
  };

  const formatVideoDate = (video) => {
    if (video.uploadedAt) return new Date(video.uploadedAt).toLocaleDateString();
    if (video.createdAt) return new Date(video.createdAt).toLocaleDateString();
    if (video.date) return new Date(video.date).toLocaleDateString();
    return 'Date not available';
  };

  const showCustomAlert = (message, type = 'success') => {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = `
      top: 100px;
      right: 20px;
      z-index: 9999;
      min-width: 300px;
      animation: slideInRight 0.3s ease-out;
    `;
    alertDiv.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
      if (alertDiv.parentNode) {
        alertDiv.parentNode.removeChild(alertDiv);
      }
    }, 3000);
  };

  // If no access, show access modal immediately
  if (!hasAccess) {
    return (
      <div className="masterclass-access" style={{ background: '#f8f9fa', minHeight: '100vh' }}>
        <div className="container-fluid py-5">
          <div className="row justify-content-center">
            <div className="col-12 col-md-6 col-lg-5">
              <div className="card shadow-lg border-warning">
                <div className="card-header bg-warning text-dark text-center py-4">
                  <i className="fas fa-crown fa-3x mb-3"></i>
                  <h1 className="display-5 fw-bold">Masterclass Videos</h1>
                  <p className="lead mb-0">Premium video content requiring access code</p>
                </div>
                
                <div className="card-body p-4">
                  <div className="alert alert-info">
                    <h6><i className="fas fa-info-circle me-2"></i>Access Required</h6>
                    <p className="mb-0">
                      Please enter the access code provided by the administrator along with your email address.
                    </p>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">Your Email Address *</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="Enter your email address"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      disabled={validating}
                    />
                    <small className="text-muted">Must match the email provided to the administrator</small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold">Access Code *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter your 1 to 20-digit access code"
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value)}
                      disabled={validating}
                      maxLength={20}
                      style={{ letterSpacing: '2px', fontFamily: 'monospace' }}
                    />
                    <small className="text-muted">Enter the code provided by the administrator</small>
                  </div>

                  {validationError && (
                    <div className="alert alert-danger">
                      <i className="fas fa-exclamation-triangle me-2"></i>
                      {validationError}
                    </div>
                  )}

                  <button
                    className="btn btn-warning btn-lg w-100"
                    onClick={validateAccessCode}
                    disabled={validating || !accessCode.trim() || !userEmail.trim()}
                  >
                    {validating ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Validating...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-check me-2"></i>
                        Validate Access
                      </>
                    )}
                  </button>

                  <div className="mt-3 text-center">
                    <p className="text-muted">
                      Don't have an access code? 
                      <button 
                        className="btn btn-link p-0 ms-1"
                        onClick={() => navigateTo('contact-us')}
                      >
                        Contact Administrator
                      </button>
                    </p>
                  </div>

                  <div className="mt-4">
                    <div className="card bg-light">
                      <div className="card-body">
                        <h6>Important Notes:</h6>
                        <ul className="small mb-0">
                          <li>Each access code is tied to a specific email address</li>
                          <li>You must use the same email address provided to the administrator</li>
                          <li>Access codes are typically single-use or limited-use</li>
                          <li>Contact the administrator if you need a new code</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading state (when user has access but data is loading)
  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6">
            <div className="card shadow-lg border-0">
              <div className="card-body text-center py-5">
                <div className="spinner-border text-warning mb-3" style={{width: '3rem', height: '3rem'}}>
                  <span className="visually-hidden">Loading...</span>
                </div>
                <h4 className="text-warning">Loading Masterclass Videos...</h4>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid py-4">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6">
            <div className="alert alert-danger text-center">
              <i className="fas fa-exclamation-triangle fa-2x mb-3"></i>
              <h4>Error Loading Videos</h4>
              <p>{error}</p>
              <button className="btn btn-warning" onClick={fetchVideos}>
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // This is the "Access Granted" view that should only show when user has access
  return (
    <div className="masterclass-videos" style={{ background: '#f8f9fa', minHeight: '100vh' }}>
      <div className="container-fluid py-4">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="card text-white bg-warning shadow-lg">
              <div className="card-body py-4">
                <div className="row align-items-center">
                  <div className="col-md-8">
                    <h1 className="display-5 fw-bold mb-2 text-dark">
                      <i className="fas fa-crown me-3"></i>
                      Masterclass Videos
                    </h1>
                    <p className="lead mb-0 opacity-75 text-dark">
                      Premium video content with exclusive access. Watch directly in the app.
                    </p>
                  </div>
                  <div className="col-md-4 text-md-end">
                    <div className="bg-dark rounded p-3 d-inline-block text-warning">
                      <h4 className="mb-0 fw-bold">{videos.length}</h4>
                      <small>Masterclass Videos</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Access Granted Banner */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="alert alert-success border-0 shadow-sm">
              <div className="row align-items-center">
                <div className="col-md-8">
                  <h5 className="mb-1">
                    <i className="fas fa-check-circle me-2"></i>
                    Access Granted
                  </h5>
                  <p className="mb-0">
                    You have access to premium masterclass videos. All videos can be viewed directly in the app.
                  </p>
                </div>
                <div className="col-md-4 text-md-end">
                  <button 
                    className="btn btn-outline-success"
                    onClick={logout}
                  >
                    <i className="fas fa-sign-out-alt me-2"></i>Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Videos Grid */}
        <div className="row">
          <div className="col-12">
            {videos.length === 0 ? (
              <div className="card shadow-lg border-0">
                <div className="card-body text-center py-5">
                  <i className="fas fa-video-slash fa-4x text-muted mb-3"></i>
                  <h3 className="text-muted">No Masterclass Videos Available</h3>
                  <p className="text-muted">
                    There are no masterclass videos available at the moment. 
                    Check back later for new video additions.
                  </p>
                </div>
              </div>
            ) : (
              <div className="row">
                {videos.map((video) => (
                  <div key={video._id} className="col-lg-6 col-xl-4 mb-4">
                    <div className="card video-card h-100 shadow-sm border-warning">
                      <div className="card-header bg-warning text-dark border-0">
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="badge bg-dark fs-6">
                            <i className="fas fa-crown me-1"></i>
                            Masterclass
                          </span>
                          <i className="fas fa-unlock text-success"></i>
                        </div>
                      </div>
                      <div className="card-img-top position-relative">
                        <div 
                          className="video-thumbnail bg-dark d-flex align-items-center justify-content-center"
                          style={{ height: '200px', cursor: 'pointer' }}
                          onClick={() => viewVideo(video)}
                        >
                          <i className="fas fa-play-circle text-white fa-3x opacity-75"></i>
                          <div className="position-absolute bottom-0 start-0 m-2">
                            <span className="badge bg-dark bg-opacity-75">
                              <i className="fas fa-clock me-1"></i>
                              {video.duration || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="card-body">
                        <h5 className="card-title text-dark mb-3">{video.title}</h5>
                        <p className="card-text text-muted mb-3">
                          {video.description ? (video.description.length > 120 
                            ? `${video.description.substring(0, 120)}...` 
                            : video.description) : 'No description available'
                          }
                        </p>
                        
                        <div className="video-meta">
                          {video.category && (
                            <small className="text-muted d-block">
                              <i className="fas fa-tag me-1"></i>
                              {video.category}
                            </small>
                          )}
                          {video.fileSize && (
                            <small className="text-muted d-block">
                              <i className="fas fa-hdd me-1"></i>
                              {(video.fileSize / (1024 * 1024)).toFixed(1)} MB
                            </small>
                          )}
                        </div>
                      </div>
                      <div className="card-footer bg-transparent border-0 pt-0">
                        <div className="d-grid gap-2">
                          <button
                            className="btn btn-warning btn-sm"
                            onClick={() => viewVideo(video)}
                          >
                            <i className="fas fa-play me-2"></i>Watch Video
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Video Modal (EXISTING CODE - NO CHANGES) */}
      {showVideoModal && selectedVideo && (
        <div className="modal fade show" style={{display: 'block', backgroundColor: 'rgba(0,0,0,0.9)'}}>
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content bg-dark">
              <div className="modal-header bg-dark text-white border-secondary">
                <h5 className="modal-title">
                  <i className="fas fa-crown me-2"></i>
                  {selectedVideo.title}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={closeModal}
                ></button>
              </div>
              
              <div className="modal-body p-0">
                <div className="video-container position-relative">
                  {selectedVideo.videoUrl ? (
                    <video
                      key={selectedVideo.videoUrl}
                      controls
                      controlsList="nodownload"
                      style={{ width: '100%', height: '60vh', backgroundColor: '#000' }}
                      onContextMenu={(e) => e.preventDefault()}
                    >
                      <source src={selectedVideo.videoUrl} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <div className="text-center text-white py-5" style={{ height: '60vh' }}>
                      <i className="fas fa-exclamation-triangle fa-3x mb-3"></i>
                      <h4>Video Not Available</h4>
                      <p>The video content is currently unavailable.</p>
                    </div>
                  )}
                </div>
                
                {/* Video Info */}
                <div className="p-4 text-white">
                  <h6>Video Information</h6>
                  <div className="row">
                    <div className="col-md-6">
                      <p className="mb-2">
                        <strong>Type:</strong> Masterclass Video
                      </p>
                      <p className="mb-2">
                        <strong>Uploaded:</strong> {formatVideoDate(selectedVideo)}
                      </p>
                    </div>
                    <div className="col-md-6">
                      <p className="mb-2">
                        <strong>Category:</strong> {selectedVideo.category || 'Not specified'}
                      </p>
                      {selectedVideo.duration && (
                        <p className="mb-2">
                          <strong>Duration:</strong> {selectedVideo.duration}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {selectedVideo.description && (
                    <div className="mt-3">
                      <h6>Description</h6>
                      <p className="text-light">{selectedVideo.description}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="modal-footer bg-dark border-secondary">
                <button
                  className="btn btn-outline-light"
                  onClick={closeModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .video-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .video-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(255, 193, 7, 0.2) !important;
        }

        .video-thumbnail:hover {
          opacity: 0.8;
        }

        video::-webkit-media-controls-fullscreen-button {
          display: none;
        }
        
        video {
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }
      `}</style>
    </div>
  );
};

export default MasterclassVideos;