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
  const [notification, setNotification] = useState({ type: '', message: '' });
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('userData') || '{}');
    setUserData(user);
    loadActiveMeeting();
    
    // Check for meeting every 30 seconds
    const interval = setInterval(loadActiveMeeting, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadActiveMeeting = async () => {
    try {
      const response = await MeetApiService.getActiveMeeting();
      if (response.success && response.active) {
        setActiveMeeting(response.meeting);
        setResources(response.resources || []);
      } else {
        setActiveMeeting(null);
        setResources([]);
      }
    } catch (error) {
      console.error('Error loading active meeting:', error);
      setNotification({ type: 'error', message: 'Failed to load meeting data' });
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
        'Join our community training session'
      );

      if (response.success) {
        setActiveMeeting(response.meeting);
        setNotification({ type: 'success', message: 'Meeting created successfully!' });
        
        // Simulate meeting time warnings (in real app, these would come from push notifications)
        simulateMeetingWarnings(response.meeting);
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

  const simulateMeetingWarnings = (meeting) => {
    // Simulate 10-minute warning after 40 minutes
    setTimeout(() => {
      setShowExtensionModal(true);
    }, 40 * 60 * 1000); // 40 minutes for demo (in production this would be 45 minutes)
  };

  const handleExtendMeeting = async () => {
    if (!activeMeeting || !userData) return;

    try {
      const response = await MeetApiService.extendMeeting(activeMeeting.meetingId, userData.id);
      
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
      const response = await MeetApiService.endMeeting(activeMeeting.meetingId, userData.id);
      
      if (response.success) {
        setActiveMeeting(null);
        setResources([]);
        setNotification({ type: 'success', message: 'Meeting ended successfully!' });
      } else {
        setNotification({ type: 'error', message: response.error || 'Failed to end meeting' });
      }
    } catch (error) {
      console.error('Error ending meeting:', error);
      setNotification({ type: 'error', message: 'Failed to end meeting' });
    }
  };

  const handleResourceShared = (newResource) => {
    setResources(prev => [newResource, ...prev]);
    setNotification({ type: 'success', message: 'Resource shared successfully!' });
  };

  const clearNotification = () => {
    setNotification({ type: '', message: '' });
  };

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
          <div className="col-lg-8">
            {/* Meeting Info Card */}
            <div className="card mb-4">
              <div className="card-header bg-primary text-white">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">
                    <i className="fas fa-video me-2"></i>
                    Live Stream Active
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
                          {new Date(activeMeeting.scheduledStart).toLocaleString()}
                        </p>
                      </div>
                      <div className="col-sm-6">
                        <small className="text-muted">Ends</small>
                        <p className="mb-0 fw-semibold">
                          {new Date(activeMeeting.scheduledEnd).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <a 
                        href={activeMeeting.meetLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn btn-success me-2"
                      >
                        <i className="fas fa-play-circle me-2"></i>
                        Join Google Meet
                      </a>
                      <button 
                        className="btn btn-outline-danger"
                        onClick={handleEndMeeting}
                      >
                        <i className="fas fa-stop-circle me-2"></i>
                        End Stream
                      </button>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="text-center">
                      <div className="bg-light rounded p-3 mb-3">
                        <i className="fas fa-users fa-3x text-primary mb-2"></i>
                        <h4 className="mb-0">{activeMeeting.participantCount || 0}</h4>
                        <small className="text-muted">Participants</small>
                      </div>
                      <div className="bg-light rounded p-3">
                        <i className="fas fa-clock fa-3x text-warning mb-2"></i>
                        <h4 className="mb-0">{activeMeeting.extensions || 0}/2</h4>
                        <small className="text-muted">Extensions Used</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Resource Sharing Section */}
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">
                  <i className="fas fa-share-alt me-2"></i>
                  Share Resources with Participants
                </h5>
              </div>
              <div className="card-body">
                <ResourceUploader 
                  meetingId={activeMeeting.meetingId}
                  user={userData}
                  onResourceShared={handleResourceShared}
                />
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            {/* Shared Resources */}
            <div className="card">
              <div className="card-header">
                <h5 className="card-title mb-0">
                  <i className="fas fa-file-alt me-2"></i>
                  Shared Resources ({resources.length})
                </h5>
              </div>
              <div className="card-body p-0">
                {resources.length > 0 ? (
                  <div className="list-group list-group-flush">
                    {resources.map(resource => (
                      <ResourceItem 
                        key={resource.resourceId} 
                        resource={resource} 
                        user={userData}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <i className="fas fa-folder-open fa-3x text-muted mb-3"></i>
                    <p className="text-muted mb-0">No resources shared yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card mt-4">
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
                    disabled={activeMeeting?.extensions >= activeMeeting?.maxExtensions}
                  >
                    <i className="fas fa-clock me-2"></i>
                    Extend Meeting
                  </button>
                  <button 
                    className="btn btn-outline-info"
                    onClick={() => navigator.clipboard.writeText(activeMeeting.meetLink)}
                  >
                    <i className="fas fa-copy me-2"></i>
                    Copy Meeting Link
                  </button>
                </div>
              </div>
            </div>
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
                    Create a Google Meet session to connect with your community. 
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
                      <p className="text-muted small">Generate Google Meet link instantly</p>
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
                        <i className="fas fa-clock fa-2x text-warning"></i>
                      </div>
                      <h5>Time Management</h5>
                      <p className="text-muted small">Automatic extensions when needed</p>
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