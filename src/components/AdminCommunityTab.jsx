// travel-tour-frontend/src/components/AdminCommunityTab.jsx
import React, { useState, useEffect } from 'react';
import MeetApiService from '../services/meet-api';
import ResourceUploader from './ResourceUploader';
import ResourceItem from './ResourceItem';
import ExtensionModal from './ExtensionModal';

const AdminCommunityTab = () => {
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [resources, setResources] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '' });
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMyMeeting, setIsMyMeeting] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('userData') || '{}');
    setUserData(user);
    loadActiveMeeting();
    
    const interval = setInterval(loadActiveMeeting, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadActiveMeeting = async () => {
    try {
      setIsLoading(true);
      const response = await MeetApiService.getActiveMeeting();
      console.log('🔍 Active meeting response:', response);
      
      if (response.success && response.meeting) {
        setActiveMeeting(response.meeting);
        
        const isAdminMeeting = response.meeting.adminId === userData?.id;
        setIsMyMeeting(isAdminMeeting);
        
        const resourcesResponse = await MeetApiService.getMeetingResources(response.meeting.id);
        if (resourcesResponse.success) {
          setResources(resourcesResponse.resources || []);
        }
      } else {
        setActiveMeeting(null);
        setResources([]);
        setIsMyMeeting(false);
      }
    } catch (error) {
      console.error('Error loading active meeting:', error);
      setNotification({ type: 'error', message: 'Failed to load meeting data' });
    } finally {
      setIsLoading(false);
    }
  };

  const createMeeting = async () => {
    if (!userData) {
      setNotification({ type: 'error', message: 'User data not found' });
      return;
    }

    setIsCreating(true);
    try {
      const response = await MeetApiService.createMeeting(
        userData.id, 
        'The Conclave Academy Live Stream',
        'Join our community training session',
        userData.name || userData.username
      );

      console.log('🔍 Create meeting response:', response);

      if (response.success) {
        setActiveMeeting(response.meeting);
        setIsMyMeeting(true);
        setNotification({ type: 'success', message: 'Meeting created successfully!' });
        
        if (response.meeting.id) {
          const resourcesResponse = await MeetApiService.getMeetingResources(response.meeting.id);
          if (resourcesResponse.success) {
            setResources(resourcesResponse.resources || []);
          }
        }
      } else {
        setNotification({ type: 'error', message: response.error || 'Failed to create meeting' });
      }
    } catch (error) {
      console.error('Error creating meeting:', error);
      setNotification({ type: 'error', message: 'Failed to create meeting' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleExtendMeeting = async () => {
    if (!activeMeeting || !userData) return;

    try {
      const response = await MeetApiService.extendMeeting(activeMeeting.id, userData.id);
      
      if (response.success) {
        setActiveMeeting(response.meeting);
        setShowExtensionModal(false);
        setNotification({ type: 'success', message: 'Meeting extended successfully!' });
      } else {
        setNotification({ type: 'error', message: response.error || 'Failed to extend meeting' });
      }
    } catch (error) {
      console.error('Error extending meeting:', error);
      setNotification({ type: 'error', message: 'Failed to extend meeting' });
    }
  };

  const handleEndMeeting = async () => {
    if (!activeMeeting || !userData) return;

    try {
      const response = await MeetApiService.endMeeting(activeMeeting.id, userData.id);
      
      if (response.success) {
        setActiveMeeting(null);
        setResources([]);
        setIsMyMeeting(false);
        setNotification({ type: 'success', message: 'Meeting ended successfully!' });
      } else {
        setNotification({ type: 'error', message: response.error || 'Failed to end meeting' });
      }
    } catch (error) {
      console.error('Error ending meeting:', error);
      setNotification({ type: 'error', message: 'Failed to end meeting' });
    }
  };

  const handleClearMeeting = async () => {
    try {
      console.log('🧹 Attempting to clear meetings...');
      
      // Check if the function exists
      if (!MeetApiService.clearAllMeetings) {
        throw new Error('clearAllMeetings function not found in MeetApiService');
      }
      
      const response = await MeetApiService.clearAllMeetings();
      
      if (response.success) {
        setActiveMeeting(null);
        setResources([]);
        setIsMyMeeting(false);
        setNotification({ type: 'success', message: 'All meetings cleared successfully!' });
      } else {
        setNotification({ type: 'error', message: response.error || 'Failed to clear meetings' });
      }
    } catch (error) {
      console.error('❌ Error clearing meetings:', error);
      setNotification({ 
        type: 'error', 
        message: `Failed to clear meetings: ${error.message}` 
      });
    }
  };

  const handleResourceShared = (newResource) => {
    setResources(prev => [newResource, ...prev]);
    setShowShareModal(false);
    setNotification({ type: 'success', message: 'Resource shared successfully and saved permanently!' });
  };

  const clearNotification = () => {
    setNotification({ type: '', message: '' });
  };

  if (isLoading) {
    return (
      <div className="container-fluid py-4">
        <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
          <div className="text-center">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted">Loading community data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      {/* Notification */}
      {notification.message && (
        <div className={`alert alert-${notification.type === 'error' ? 'danger' : 'success'} alert-dismissible fade show`} role="alert">
          {notification.message}
          <button type="button" className="btn-close" onClick={clearNotification}></button>
        </div>
      )}

      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="h3 mb-1">Welcome to The Conclave Streams</h1>
              <p className="text-muted mb-0">Manage your community live streams and training sessions</p>
            </div>
            {!activeMeeting && (
              <button 
                className="btn btn-primary btn-lg"
                onClick={createMeeting}
                disabled={isCreating}
              >
                {isCreating ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Creating Stream...
                  </>
                ) : (
                  <>
                    <i className="fas fa-plus-circle me-2"></i>
                    Create Stream
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Active Meeting Section */}
      {activeMeeting ? (
        <div className="row">
          <div className="col-12">
            {/* Admin Alert for Other User's Meeting */}
            {!isMyMeeting && (
              <div className="alert alert-warning mb-4">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    <strong>Notice:</strong> There's already an active meeting created by another admin.
                  </div>
                  <button 
                    className="btn btn-outline-danger btn-sm"
                    onClick={handleClearMeeting}
                    title="Clear all active meetings"
                  >
                    <i className="fas fa-times me-1"></i>
                    Clear Meeting
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="col-lg-8">
            {/* Meeting Info Card */}
            <div className="card mb-4">
              <div className="card-header bg-primary text-white">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">
                    <i className="fas fa-video me-2"></i>
                    {isMyMeeting ? 'Your Live Stream Active' : 'Active Live Stream'}
                  </h5>
                  <span className="badge bg-success">
                    <i className="fas fa-circle me-1"></i>
                    LIVE
                  </span>
                </div>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-8">
                    <h4 className="text-primary">{activeMeeting.title}</h4>
                    <p className="text-muted">{activeMeeting.description}</p>
                    
                    <div className="row mt-3">
                      <div className="col-sm-6">
                        <small className="text-muted">Started</small>
                        <p className="mb-0 fw-semibold">
                          {new Date(activeMeeting.startTime).toLocaleString()}
                        </p>
                      </div>
                      <div className="col-sm-6">
                        <small className="text-muted">Participants</small>
                        <p className="mb-0 fw-semibold">
                          {activeMeeting.participants?.length || 0} joined
                        </p>
                      </div>
                    </div>

                    {/* 🆕 FIXED: SHARE RESOURCES AND JOIN STREAM IN SAME LINE */}
                    <div className="mt-3 d-flex flex-wrap gap-2 align-items-center">
                      {/* Share Resources Button - Only for meeting owner */}
                      {isMyMeeting && (
                        <button 
                          className="btn btn-info"
                          onClick={() => setShowShareModal(true)}
                        >
                          <i className="fas fa-share-alt me-2"></i>
                          Share Resources
                        </button>
                      )}
                      
                      {/* Join Stream Button */}
                      <a 
                        href={activeMeeting.meetingLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn btn-success"
                      >
                        <i className="fas fa-play-circle me-2"></i>
                        {isMyMeeting ? 'Host Meeting' : 'Join Stream'}
                      </a>
                      
                      {/* End Stream Button - Only for meeting owner */}
                      {isMyMeeting && (
                        <button 
                          className="btn btn-outline-danger"
                          onClick={handleEndMeeting}
                        >
                          <i className="fas fa-stop-circle me-2"></i>
                          End Stream
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="text-center">
                      <div className="bg-light rounded p-3 mb-3">
                        <i className="fas fa-users fa-3x text-primary mb-2"></i>
                        <h4 className="mb-0">{activeMeeting.participants?.length || 0}</h4>
                        <small className="text-muted">Participants</small>
                      </div>
                      <div className="bg-light rounded p-3">
                        <i className={`fas ${isMyMeeting ? 'fa-crown text-warning' : 'fa-user text-info'} fa-3x mb-2`}></i>
                        <h4 className="mb-0">{isMyMeeting ? 'You' : 'Other'}</h4>
                        <small className="text-muted">Stream Owner</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Resource Sharing Section - Now in Modal */}
            {isMyMeeting && (
              <div className="card mb-4">
                <div className="card-header bg-info text-white">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="card-title mb-0">
                      <i className="fas fa-share-alt me-2"></i>
                      Shared Resources ({resources.length})
                    </h5>
                    <span className="badge bg-light text-info">
                      <i className="fas fa-database me-1"></i>
                      Permanent Storage
                    </span>
                  </div>
                </div>
                <div className="card-body p-0">
                  {resources.length > 0 ? (
                    <div className="list-group list-group-flush">
                      {resources.map(resource => (
                        <ResourceItem 
                          key={resource.id} 
                          resource={resource} 
                          user={userData}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <i className="fas fa-folder-open fa-3x text-muted mb-3"></i>
                      <p className="text-muted mb-0">No resources shared yet</p>
                      <small className="text-muted">Share resources using the "Share Resources" button above</small>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="col-lg-4">
            {/* Quick Actions - Only show for meeting owner */}
            {isMyMeeting && (
              <div className="card">
                <div className="card-header">
                  <h5 className="card-title mb-0">
                    <i className="fas fa-bolt me-2"></i>
                    Quick Actions
                  </h5>
                </div>
                <div className="card-body">
                  <div className="d-grid gap-2">
                    <button 
                      className="btn btn-outline-warning"
                      onClick={() => setShowExtensionModal(true)}
                    >
                      <i className="fas fa-clock me-2"></i>
                      Extend Meeting
                    </button>
                    <button 
                      className="btn btn-outline-info"
                      onClick={() => navigator.clipboard.writeText(activeMeeting.meetingLink)}
                    >
                      <i className="fas fa-copy me-2"></i>
                      Copy Meeting Link
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Create New Meeting Button when viewing other admin's meeting */}
            {!isMyMeeting && activeMeeting && (
              <div className="card border-warning">
                <div className="card-header bg-warning text-dark">
                  <h5 className="card-title mb-0">
                    <i className="fas fa-plus-circle me-2"></i>
                    Create Your Own Stream
                  </h5>
                </div>
                <div className="card-body">
                  <p className="small text-muted mb-3">
                    You can create your own live stream even if there's an active meeting.
                  </p>
                  <button 
                    className="btn btn-warning w-100"
                    onClick={createMeeting}
                    disabled={isCreating}
                  >
                    {isCreating ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Creating...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-rocket me-2"></i>
                        Create New Stream
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* No Active Meeting - Welcome State */
        <div className="row justify-content-center">
          <div className="col-md-8 text-center">
            <div className="card border-0 shadow-sm">
              <div className="card-body py-5">
                <div className="mb-4">
                  <i className="fas fa-video fa-5x text-primary mb-4"></i>
                  <h2 className="text-primary">Start a Live Stream</h2>
                  <p className="text-muted lead">
                    Create a video meeting to connect with your community. 
                    Share resources, conduct training, and engage with participants in real-time.
                  </p>
                </div>
                
                <div className="row mt-5">
                  <div className="col-md-4 mb-3">
                    <div className="text-center">
                      <div className="bg-primary bg-opacity-10 rounded-circle p-3 d-inline-flex mb-3">
                        <i className="fas fa-link fa-2x text-primary"></i>
                      </div>
                      <h5>Instant Meeting</h5>
                      <p className="text-muted small">Generate video meeting link instantly</p>
                    </div>
                  </div>
                  <div className="col-md-4 mb-3">
                    <div className="text-center">
                      <div className="bg-success bg-opacity-10 rounded-circle p-3 d-inline-flex mb-3">
                        <i className="fas fa-share-alt fa-2x text-success"></i>
                      </div>
                      <h5>Resource Sharing</h5>
                      <p className="text-muted small">Share files and links with participants</p>
                    </div>
                  </div>
                  <div className="col-md-4 mb-3">
                    <div className="text-center">
                      <div className="bg-warning bg-opacity-10 rounded-circle p-3 d-inline-flex mb-3">
                        <i className="fas fa-database fa-2x text-warning"></i>
                      </div>
                      <h5>Permanent Storage</h5>
                      <p className="text-muted small">Resources saved permanently in database</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <button 
                    className="btn btn-primary btn-lg px-5"
                    onClick={createMeeting}
                    disabled={isCreating}
                  >
                    {isCreating ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Creating Your Stream...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-rocket me-2"></i>
                        Launch Live Stream
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Resources Modal */}
      {showShareModal && (
        <div className="modal show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-info text-white">
                <h5 className="modal-title">
                  <i className="fas fa-share-alt me-2"></i>
                  Share Resources with Participants
                </h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={() => setShowShareModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-info mb-4">
                  <div className="d-flex">
                    <i className="fas fa-info-circle fa-2x me-3 text-info"></i>
                    <div>
                      <h6 className="alert-heading mb-2">Resource Sharing Guide</h6>
                      <p className="mb-2">
                        <strong>Resources shared here are permanently saved</strong> and will be available to users during and after the live call.
                      </p>
                      <p className="mb-0 small">
                        <i className="fas fa-lightbulb me-1 text-warning"></i>
                        <strong>Tip:</strong> Share documents, links, and files here for participants to access anytime. 
                        Video files are not supported to save storage space.
                      </p>
                    </div>
                  </div>
                </div>
                
                <ResourceUploader 
                  meetingId={activeMeeting?.id}
                  user={userData}
                  onResourceShared={handleResourceShared}
                />
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowShareModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Extension Modal */}
      <ExtensionModal 
        visible={showExtensionModal}
        meeting={activeMeeting}
        user={userData}
        onExtend={handleExtendMeeting}
        onClose={() => setShowExtensionModal(false)}
      />
    </div>
  );
};

export default AdminCommunityTab;