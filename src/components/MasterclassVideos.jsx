// travel-tour-frontend/src/components/MasterclassVideos.jsx - COMPLETELY FIXED VERSION
import React, { useState, useEffect } from 'react';
import api from '../services/api';

const MasterclassVideos = ({ navigateTo }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showAccessModal, setShowAccessModal] = useState(true); // Show by default until access verified
  const [accessCode, setAccessCode] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [validating, setValidating] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [hasAccess, setHasAccess] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6); // 6 videos per page
  const [totalItems, setTotalItems] = useState(0);
  
  // User info from localStorage
  const [userInfo, setUserInfo] = useState({
    email: '',
    name: ''
  });

  // Debug state
  const [debugInfo, setDebugInfo] = useState({
    apiCallCount: 0,
    lastValidationAttempt: null,
    lastValidationResult: null
  });

  useEffect(() => {
    // 1. Check for existing Masterclass Video session
    const savedAccess = localStorage.getItem('masterclassVideoAccess');
    const savedEmail = localStorage.getItem('masterclassVideoUserEmail');
    const savedName = localStorage.getItem('masterclassVideoUserName');
    
    // 2. Pre-fill email if user is logged into the main app
    const loggedInUser = JSON.parse(localStorage.getItem('user') || '{}');
    const emailToUse = savedEmail || loggedInUser.email || '';
    const nameToUse = savedName || loggedInUser.name || loggedInUser.username || 'User';
    
    console.log('🔍 Initializing MasterclassVideos:', {
      savedAccess,
      savedEmail,
      loggedInUserEmail: loggedInUser.email,
      emailToUse,
      nameToUse
    });
    
    setUserEmail(emailToUse);
    setUserInfo({
      email: emailToUse,
      name: nameToUse
    });

    if (savedAccess === 'granted' && savedEmail) {
      console.log('✅ User has existing masterclass video access');
      setHasAccess(true);
      setShowAccessModal(false);
      fetchVideos();
    } else {
      console.log('🔒 User needs masterclass video access');
      setShowAccessModal(true);
    }
  }, [currentPage]); // Added currentPage dependency for pagination

  // FIXED: fetchVideos with pagination and proper access check
  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log(`📹 Fetching masterclass videos for page ${currentPage}`);
      
      // Try to fetch masterclass videos with pagination
      const response = await api.get('/videos', {
        params: {
          type: 'masterclass',
          page: currentPage,
          limit: itemsPerPage
        }
      });
      
      console.log('📹 API Response:', response.data);
      
      if (response.data.success) {
        setVideos(response.data.videos || []);
        setTotalItems(response.data.totalCount || 0);
        console.log(`✅ Loaded ${response.data.videos?.length || 0} masterclass videos`);
        
        // Update debug info
        setDebugInfo(prev => ({
          ...prev,
          apiCallCount: prev.apiCallCount + 1
        }));
      } else {
        // If API returns success: false, check if it's an access issue
        if (response.data.message?.includes('No access') || response.data.message?.includes('Access denied')) {
          console.log('🔒 Access denied to masterclass videos');
          setHasAccess(false);
          setShowAccessModal(true);
          setVideos([]);
        } else {
          setError(response.data.message || 'Failed to load videos');
        }
      }
    } catch (error) {
      console.error('❌ Error fetching videos:', error);
      
      if (error.response?.status === 403 || error.response?.data?.message?.includes('Access denied')) {
        console.log('🔒 Access denied (403) - showing access modal');
        setHasAccess(false);
        setShowAccessModal(true);
        setVideos([]);
      } else {
        setError('Failed to load videos. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  // COMPLETELY FIXED: validateAccessCode function with comprehensive error handling
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

    // Prepare data for API call
    const requestData = {
      accessCode: accessCode.trim().toUpperCase(), // Convert to uppercase for consistency
      userEmail: userEmail.trim().toLowerCase()     // Convert to lowercase
    };

    console.log('🔑 Validating access code with data:', requestData);
    
    // Update debug info
    setDebugInfo(prev => ({
      ...prev,
      lastValidationAttempt: {
        timestamp: new Date().toISOString(),
        accessCode: requestData.accessCode,
        userEmail: requestData.userEmail,
        sanitized: {
          accessCode: requestData.accessCode.replace(/./g, '*'),
          userEmail: requestData.userEmail.replace(/./g, '*')
        }
      }
    }));

    try {
      // Try the primary validation endpoint
      const response = await api.post('/videos/validate-masterclass-access', requestData);

      console.log('🔑 Validation Response:', response.data);

      if (response.data.success) {
        console.log('✅ Access granted via validation endpoint');
        
        // Grant access
        setHasAccess(true);
        localStorage.setItem('masterclassVideoAccess', 'granted');
        localStorage.setItem('masterclassVideoUserEmail', requestData.userEmail);
        localStorage.setItem('masterclassVideoUserName', response.data.userName || requestData.userEmail.split('@')[0]);
        
        // Update user info
        setUserInfo({
          email: requestData.userEmail,
          name: response.data.userName || requestData.userEmail.split('@')[0]
        });
        
        setShowAccessModal(false);
        showCustomAlert('Access granted! Welcome to Masterclass Videos.', 'success');
        
        // Update debug info
        setDebugInfo(prev => ({
          ...prev,
          lastValidationResult: {
            success: true,
            message: 'Access granted',
            timestamp: new Date().toISOString()
          }
        }));
        
        // Fetch videos
        await fetchVideos();
      } else {
        // Validation failed but API returned success: false
        console.log('❌ Validation failed:', response.data.message);
        setValidationError(response.data.message || 'Access denied. Please check your credentials.');
        
        // Update debug info
        setDebugInfo(prev => ({
          ...prev,
          lastValidationResult: {
            success: false,
            message: response.data.message,
            timestamp: new Date().toISOString()
          }
        }));
      }
    } catch (error) {
      console.error('❌ Validation Error:', error);
      
      // Enhanced error handling with specific messages
      let errorMessage = 'Network error. Please check your connection and try again.';
      
      if (error.response) {
        console.error('Server Response:', error.response.data);
        console.error('Status:', error.response.status);
        
        if (error.response.status === 400) {
          const errorMsg = error.response.data.message || 'Invalid access code';
          
          if (errorMsg.includes('not found') || errorMsg.includes('Invalid access code')) {
            errorMessage = `The access code "${accessCode}" was not found. Please check the code and try again.`;
          } else if (errorMsg.includes('email')) {
            errorMessage = 'This access code is not assigned to your email address.';
          } else {
            errorMessage = errorMsg;
          }
        } else if (error.response.status === 403) {
          errorMessage = 'Access denied. This access code has already been used or has expired.';
        } else if (error.response.status === 404) {
          errorMessage = 'Validation endpoint not found. Please contact the administrator.';
        } else if (error.response.status === 500) {
          errorMessage = 'Server error. Please try again later or contact the administrator.';
        }
        
        // Update debug info with server error
        setDebugInfo(prev => ({
          ...prev,
          lastValidationResult: {
            success: false,
            message: error.response.data?.message || error.message,
            status: error.response.status,
            timestamp: new Date().toISOString()
          }
        }));
      } else if (error.request) {
        console.error('No response received:', error.request);
        errorMessage = 'No response from server. Please check your internet connection.';
      }
      
      setValidationError(errorMessage);
      
      // NO FALLBACK - Just show error
      console.log('❌ Validation failed, showing error to user');
    } finally {
      setValidating(false);
    }
  };

  const viewVideo = (video) => {
    if (!hasAccess) {
      console.log('🔒 Access required, showing access modal');
      setShowAccessModal(true);
      return;
    }

    console.log('▶️ Viewing video:', video.title);
    setSelectedVideo(video);
    setShowVideoModal(true);
  };

  const closeModal = () => {
    console.log('✖️ Closing video modal');
    setShowVideoModal(false);
    setSelectedVideo(null);
  };

  const closeAccessModal = () => {
    console.log('✖️ Closing access modal');
    setShowAccessModal(false);
    setAccessCode('');
    setValidationError('');
  };

  // FIXED: logout function with proper cleanup
  const logout = () => {
    console.log('🚪 Logging out of masterclass videos');
    
    setHasAccess(false);
    setShowAccessModal(true);
    setAccessCode('');
    setUserEmail('');
    setVideos([]);
    setTotalItems(0);
    setCurrentPage(1);
    
    localStorage.removeItem('masterclassVideoAccess');
    localStorage.removeItem('masterclassVideoUserEmail');
    localStorage.removeItem('masterclassVideoUserName');
    
    showCustomAlert('Logged out. Please enter your access code to continue.', 'info');
    
    // Update debug info
    setDebugInfo(prev => ({
      ...prev,
      lastValidationResult: null
    }));
  };

  const formatVideoDate = (video) => {
    if (video.uploadedAt) return new Date(video.uploadedAt).toLocaleDateString();
    if (video.createdAt) return new Date(video.createdAt).toLocaleDateString();
    if (video.date) return new Date(video.date).toLocaleDateString();
    if (video.updatedAt) return new Date(video.updatedAt).toLocaleDateString();
    return 'Date not available';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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
      <div class="d-flex align-items-center">
        <i class="fas ${
          type === 'success' ? 'fa-check-circle' :
          type === 'error' ? 'fa-exclamation-circle' :
          type === 'info' ? 'fa-info-circle' : 'fa-bell'
        } me-2 fs-5"></i>
        <div>${message}</div>
      </div>
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
      if (alertDiv.parentNode) {
        alertDiv.parentNode.removeChild(alertDiv);
      }
    }, 3000);
  };

  // NEW: Pagination functions
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <nav aria-label="Videos pagination">
        <ul className="pagination justify-content-center">
          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
            <button
              className="page-link"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>
          </li>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
              <button className="page-link" onClick={() => setCurrentPage(page)}>
                {page}
              </button>
            </li>
          ))}
          
          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
            <button
              className="page-link"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </li>
        </ul>
      </nav>
    );
  };

  // NEW: Debug panel component
  const DebugPanel = () => {
    if (!debugInfo.lastValidationAttempt) return null;
    
    return (
      <div className="mt-3 p-3 border rounded bg-light">
        <h6 className="text-muted mb-2">
          <i className="fas fa-bug me-2"></i>Debug Info
        </h6>
        <div className="small">
          <p className="mb-1">
            <strong>Last Validation Attempt:</strong><br />
            Time: {new Date(debugInfo.lastValidationAttempt.timestamp).toLocaleTimeString()}<br />
            Access Code: {debugInfo.lastValidationAttempt.accessCode}<br />
            Email: {debugInfo.lastValidationAttempt.userEmail}
          </p>
          {debugInfo.lastValidationResult && (
            <p className="mb-1">
              <strong>Result:</strong> {debugInfo.lastValidationResult.success ? '✅ Success' : '❌ Failed'}<br />
              Message: {debugInfo.lastValidationResult.message}<br />
              {debugInfo.lastValidationResult.status && `Status: ${debugInfo.lastValidationResult.status}`}
            </p>
          )}
          <p className="mb-0">
            <strong>API Calls:</strong> {debugInfo.apiCallCount}<br />
            <strong>Total Videos:</strong> {totalItems}
          </p>
        </div>
      </div>
    );
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
                      placeholder="Enter your access code"
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value)}
                      disabled={validating}
                      style={{ 
                        letterSpacing: '2px', 
                        fontFamily: 'monospace', 
                        textTransform: 'uppercase' 
                      }}
                    />
                    <small className="text-muted">
                      Enter the code provided by the administrator (case-insensitive)
                    </small>
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

                  {/* Debug Information */}
                  <DebugPanel />

                  <div className="mt-4">
                    <div className="card bg-light">
                      <div className="card-body">
                        <h6>Important Notes:</h6>
                        <ul className="small mb-0">
                          <li>Each access code is tied to a specific email address</li>
                          <li>You must use the same email address provided to the administrator</li>
                          <li>Access codes are case-insensitive</li>
                          <li>Contact the administrator if you need a new code</li>
                          <li>For testing: Try code <code>GBENGA</code> (uppercase)</li>
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
                <p className="text-muted">Page {currentPage} of {totalPages || '...'}</p>
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
        {/* Header - WITH USER EMAIL AND LOGOUT BUTTON */}
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
                      Welcome, {userInfo.name || userInfo.email || 'User'}
                    </p>
                  </div>
                  <div className="col-md-4 text-md-end">
                    <div className="d-flex align-items-center justify-content-end">
                      <div className="bg-dark rounded p-3 d-inline-block text-warning me-3">
                        <h4 className="mb-0 fw-bold">{totalItems}</h4>
                        <small>Masterclass Videos</small>
                      </div>
                      <button 
                        className="btn btn-dark"
                        onClick={logout}
                      >
                        <i className="fas fa-sign-out-alt me-2"></i>Logout
                      </button>
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
                  <small className="text-muted">
                    Valid until: Unlimited
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page info display */}
        <div className="row mb-3">
          <div className="col-12">
            <div className="alert alert-light border-0 shadow-sm">
              <div className="row align-items-center">
                <div className="col-md-6">
                  <p className="mb-0">
                    Showing {videos.length} videos (Page {currentPage} of {totalPages})
                  </p>
                </div>
                <div className="col-md-6 text-md-end">
                  <p className="mb-0 text-muted">
                    Total: {totalItems} masterclass videos
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Videos Grid - UPDATED: 6 videos per page layout (3x2 on large, 2x3 on medium) */}
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
                  <div key={video._id} className="col-md-6 col-lg-4 mb-4">
                    <div className="card video-card h-100 shadow-sm border-warning">
                      <div className="card-header bg-warning text-dark border-0">
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="badge bg-dark fs-6">
                            <i className="fas fa-crown me-1"></i>
                            Masterclass
                          </span>
                          {video.accessCode && (
                            <small className="text-muted" title="Access Code">
                              <i className="fas fa-key me-1"></i>
                              {video.accessCode.substring(0, 3)}...
                            </small>
                          )}
                        </div>
                      </div>
                      <div className="card-img-top position-relative">
                        <div 
                          className="video-thumbnail bg-dark d-flex align-items-center justify-content-center"
                          style={{ height: '200px', cursor: 'pointer' }}
                          onClick={() => viewVideo(video)}
                        >
                          {video.thumbnailUrl ? (
                            <img 
                              src={video.thumbnailUrl} 
                              alt={video.title}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <i className="fas fa-play-circle text-white fa-3x opacity-75"></i>
                          )}
                          <div className="position-absolute bottom-0 start-0 m-2">
                            <span className="badge bg-dark bg-opacity-75">
                              <i className="fas fa-clock me-1"></i>
                              {video.duration || 'N/A'}
                            </span>
                          </div>
                          <div className="position-absolute top-0 end-0 m-2">
                            <span className="badge bg-warning text-dark">
                              <i className="fas fa-play me-1"></i>
                              Watch
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
                          <small className="text-muted d-block">
                            <i className="fas fa-hdd me-1"></i>
                            {formatFileSize(video.fileSize)}
                          </small>
                          <small className="text-muted d-block">
                            <i className="fas fa-calendar me-1"></i>
                            {formatVideoDate(video)}
                          </small>
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="row mt-4">
            <div className="col-12">
              {renderPagination()}
            </div>
          </div>
        )}
      </div>

      {/* Video Modal */}
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
                      autoPlay
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
                      <p className="mb-2">
                        <strong>File Size:</strong> {formatFileSize(selectedVideo.fileSize)}
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
                      <p className="mb-2">
                        <strong>Format:</strong> {selectedVideo.fileFormat || 'MP4'}
                      </p>
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
                  <i className="fas fa-times me-2"></i>Close
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

        .video-thumbnail:hover .badge {
          background-color: #ffc107 !important;
          color: #212529 !important;
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
        
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default MasterclassVideos;