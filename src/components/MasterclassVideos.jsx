// travel-tour-frontend/src/components/MasterclassVideos.jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';

const MasterclassVideos = ({ navigateTo }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showAccessModal, setShowAccessModal] = useState(true);
  const [accessCode, setAccessCode] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [validating, setValidating] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    // 1. Check for existing Masterclass Video session
    const savedAccess = localStorage.getItem('masterclassVideoAccess');
    const savedEmail = localStorage.getItem('masterclassVideoUserEmail');
    
    // 2. Pre-fill email if user is logged into the main app
    const loggedInUser = JSON.parse(localStorage.getItem('user') || '{}');
    const emailToUse = savedEmail || loggedInUser.email || '';
    setUserEmail(emailToUse);

    if (savedAccess === 'granted' && savedEmail) {
      setHasAccess(true);
      setShowAccessModal(false);
      fetchVideos();
    } else {
      setShowAccessModal(true);
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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail.trim())) {
      setValidationError('Please enter a valid email address');
      return;
    }

    setValidating(true);
    setValidationError('');

    try {
      // Logic aligns with Team Access (allowedEmails check on backend)
      const response = await api.post('/videos/validate-masterclass-access', {
        accessCode: accessCode.trim().toUpperCase(),
        userEmail: userEmail.trim().toLowerCase()
      });

      if (response.data.success) {
        setHasAccess(true);
        localStorage.setItem('masterclassVideoAccess', 'granted');
        localStorage.setItem('masterclassVideoUserEmail', userEmail.trim().toLowerCase());
        setShowAccessModal(false);
        showCustomAlert('Access granted! Enjoy the Masterclass Videos.', 'success');
        await fetchVideos();
      }
    } catch (error) {
      setValidationError(error.response?.data?.message || 'Invalid access code or unauthorized email.');
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
    localStorage.removeItem('masterclassVideoAccess');
    localStorage.removeItem('masterclassVideoUserEmail');
    setVideos([]);
    showCustomAlert('Logged out of Masterclass Videos.', 'info');
  };

  const formatVideoDate = (video) => {
    const date = video.uploadedAt || video.createdAt || video.date;
    return date ? new Date(date).toLocaleDateString() : 'Date not available';
  };

  const showCustomAlert = (message, type = 'success') => {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} position-fixed`;
    alertDiv.style.cssText = `top: 100px; right: 20px; z-index: 9999; animation: slideInRight 0.3s ease-out;`;
    alertDiv.innerHTML = message;
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 3000);
  };

  if (!hasAccess) {
    return (
      <div className="masterclass-access bg-light min-vh-100 py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-6 col-lg-5">
              <div className="card shadow-lg border-warning">
                <div className="card-header bg-warning text-center py-4">
                  <i className="fas fa-play-circle fa-3x mb-3 text-dark"></i>
                  <h1 className="h3 fw-bold text-dark">Masterclass Videos</h1>
                </div>
                <div className="card-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-bold">Email Address *</label>
                    <input
                      type="email"
                      className="form-control"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="Email assigned to code"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Access Code *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value)}
                      style={{ letterSpacing: '2px', fontFamily: 'monospace' }}
                      placeholder="Enter code"
                    />
                  </div>
                  {validationError && <div className="alert alert-danger small">{validationError}</div>}
                  <button className="btn btn-warning w-100 btn-lg fw-bold" onClick={validateAccessCode} disabled={validating}>
                    {validating ? 'Validating...' : 'Unlock Videos'}
                  </button>
                  <div className="mt-3 text-center">
                    <button className="btn btn-link btn-sm text-muted" onClick={() => navigateTo('contact-us')}>
                      Request Access
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="masterclass-videos bg-light min-vh-100 py-4">
      <div className="container-fluid">
        {/* Header */}
        <div className="card bg-warning shadow-sm mb-4 border-0">
          <div className="card-body d-flex justify-content-between align-items-center">
            <div>
              <h1 className="h2 fw-bold text-dark mb-0"><i className="fas fa-crown me-2"></i>Video Masterclass</h1>
              <p className="text-dark mb-0 small">{userEmail}</p>
            </div>
            <button className="btn btn-dark btn-sm" onClick={logout}>Logout</button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-warning"></div>
          </div>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : (
          <div className="row">
            {videos.length === 0 ? (
              <div className="col-12 text-center py-5">
                <i className="fas fa-video-slash fa-3x text-muted mb-3"></i>
                <p>No masterclass videos found.</p>
              </div>
            ) : (
              videos.map((video) => (
                <div key={video._id} className="col-md-6 col-lg-4 mb-4">
                  <div className="card h-100 shadow-sm video-card border-0">
                    <div 
                      className="bg-dark d-flex align-items-center justify-content-center position-relative" 
                      style={{ height: '200px', cursor: 'pointer' }}
                      onClick={() => viewVideo(video)}
                    >
                      <i className="fas fa-play-circle text-warning fa-3x"></i>
                      <span className="position-absolute bottom-0 end-0 m-2 badge bg-dark opacity-75">
                        {video.duration || 'Video'}
                      </span>
                    </div>
                    <div className="card-body">
                      <h5 className="fw-bold">{video.title}</h5>
                      <p className="text-muted small mb-3">
                        {video.description?.substring(0, 100)}...
                      </p>
                      <button className="btn btn-outline-warning btn-sm w-100" onClick={() => viewVideo(video)}>
                        Watch Now
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Video Player Modal */}
        {showVideoModal && selectedVideo && (
          <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.9)'}}>
            <div className="modal-dialog modal-xl modal-dialog-centered">
              <div className="modal-content bg-dark border-secondary">
                <div className="modal-header border-secondary">
                  <h5 className="modal-title text-white">{selectedVideo.title}</h5>
                  <button className="btn-close btn-close-white" onClick={closeModal}></button>
                </div>
                <div className="modal-body p-0">
                  <video 
                    controls 
                    controlsList="nodownload" 
                    className="w-100" 
                    style={{ maxHeight: '70vh' }}
                    onContextMenu={e => e.preventDefault()}
                    autoPlay
                  >
                    <source src={selectedVideo.videoUrl} type="video/mp4" />
                  </video>
                  <div className="p-4 text-white">
                    <p className="opacity-75">{selectedVideo.description}</p>
                    <hr className="border-secondary" />
                    <small className="text-muted">Category: {selectedVideo.category || 'General'}</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .video-card { transition: transform 0.2s; }
        .video-card:hover { transform: translateY(-5px); }
      `}</style>
    </div>
  );
};

export default MasterclassVideos;