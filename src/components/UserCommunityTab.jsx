// travel-tour-frontend/src/components/UserCommunityTab.jsx
import React, { useState, useEffect } from 'react';
import MeetApiService from '../services/meet-api';
import ResourceItem from './ResourceItem';

const UserCommunityTab = () => {
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [resources, setResources] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [resourcesLoading, setResourcesLoading] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('userData') || '{}');
    setUserData(user);
    loadActiveMeeting();
    
    // Check for active meeting every 30 seconds
    const interval = setInterval(loadActiveMeeting, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadActiveMeeting = async () => {
    try {
      setIsLoading(true);
      const response = await MeetApiService.getActiveMeeting();
      console.log('🔍 User - Active meeting response:', response);
      
      if (response.success && response.meeting) {
        setActiveMeeting(response.meeting);
        // Load resources for this meeting
        await loadMeetingResources(response.meeting.id);
      } else {
        setActiveMeeting(null);
        setResources([]);
      }
    } catch (error) {
      console.error('Error loading active meeting:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMeetingResources = async (meetingId) => {
    try {
      setResourcesLoading(true);
      const resourcesResponse = await MeetApiService.getMeetingResources(meetingId);
      if (resourcesResponse.success) {
        setResources(resourcesResponse.resources || []);
        console.log('✅ Loaded resources:', resourcesResponse.resources.length);
      }
    } catch (error) {
      console.error('Error loading meeting resources:', error);
    } finally {
      setResourcesLoading(false);
    }
  };

  const handleJoinMeeting = async () => {
    if (!activeMeeting || !userData) return;

    try {
      // Join the meeting in our system
      const joinResponse = await MeetApiService.joinMeeting(
        activeMeeting.id, 
        userData.id, 
        userData.name || userData.username
      );
      
      if (joinResponse.success) {
        console.log('✅ Successfully joined meeting in system');
        
        // Open the real meeting link
        window.open(activeMeeting.meetingLink, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('Error joining meeting:', error);
      // Still open the meeting link even if join tracking fails
      window.open(activeMeeting.meetingLink, '_blank', 'noopener,noreferrer');
    }
  };

  const handleResourceAccess = async (resourceId, action = 'view') => {
    if (!userData) return;
    
    try {
      await MeetApiService.trackResourceAccess(resourceId, userData.id, 'web', action);
    } catch (error) {
      console.error('Error tracking resource access:', error);
    }
  };

  const handleDownloadResource = async (resource) => {
    await handleResourceAccess(resource.id, 'download');
    
    // Create a temporary link to download the resource
    const link = document.createElement('a');
    link.href = resource.content;
    link.download = resource.fileName || resource.title;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const refreshResources = async () => {
    if (activeMeeting) {
      await loadMeetingResources(activeMeeting.id);
    }
  };

  if (isLoading) {
    return (
      <div className="container-fluid py-4">
        <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
          <div className="text-center">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted">Checking for active streams...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="text-center">
            <h1 className="h3 mb-1">Welcome to The Conclave Streams</h1>
            <p className="text-muted mb-0">Join live training sessions and access shared resources</p>
          </div>
        </div>
      </div>

      {/* Active Meeting Section */}
      {activeMeeting ? (
        <div className="row">
          <div className="col-lg-8">
            {/* Meeting Info Card */}
            <div className="card mb-4 border-success">
              <div className="card-header bg-success text-white">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">
                    <i className="fas fa-broadcast-tower me-2"></i>
                    Live Stream Available!
                  </h5>
                  <span className="badge bg-warning text-dark">
                    <i className="fas fa-circle me-1"></i>
                    LIVE NOW
                  </span>
                </div>
              </div>
              <div className="card-body">
                <div className="row align-items-center">
                  <div className="col-md-8">
                    <h3 className="text-success">{activeMeeting.title}</h3>
                    <p className="text-muted mb-3">{activeMeeting.description}</p>
                    
                    <div className="d-flex flex-wrap gap-2 mb-3">
                      <span className="badge bg-primary">
                        <i className="fas fa-user-tie me-1"></i>
                        Host: {activeMeeting.adminName || 'Admin'}
                      </span>
                      <span className="badge bg-secondary">
                        <i className="fas fa-clock me-1"></i>
                        Started: {new Date(activeMeeting.startTime).toLocaleTimeString()}
                      </span>
                      <span className="badge bg-info">
                        <i className="fas fa-users me-1"></i>
                        {activeMeeting.participants?.length || 0} participants
                      </span>
                    </div>

                    <button 
                      onClick={handleJoinMeeting}
                      className="btn btn-success btn-lg"
                    >
                      <i className="fas fa-play-circle me-2"></i>
                      Join Live Stream
                    </button>
                  </div>
                  <div className="col-md-4 text-center">
                    <div className="bg-success bg-opacity-10 rounded-circle p-4 d-inline-flex mb-3">
                      <i className="fas fa-video fa-3x text-success"></i>
                    </div>
                    <p className="text-muted small">
                      Click the button to join the live training session
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="card-title mb-0">
                  <i className="fas fa-lightbulb me-2"></i>
                  Quick Tips for Better Experience
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <ul className="list-unstyled">
                      <li className="mb-2">
                        <i className="fas fa-check-circle text-success me-2"></i>
                        Use headphones for better audio
                      </li>
                      <li className="mb-2">
                        <i className="fas fa-check-circle text-success me-2"></i>
                        Join 5 minutes early to test your setup
                      </li>
                      <li className="mb-2">
                        <i className="fas fa-check-circle text-success me-2"></i>
                        Mute your microphone when not speaking
                      </li>
                    </ul>
                  </div>
                  <div className="col-md-6">
                    <ul className="list-unstyled">
                      <li className="mb-2">
                        <i className="fas fa-check-circle text-success me-2"></i>
                        Use the chat for questions
                      </li>
                      <li className="mb-2">
                        <i className="fas fa-check-circle text-success me-2"></i>
                        Download resources for future reference
                      </li>
                      <li className="mb-2">
                        <i className="fas fa-check-circle text-success me-2"></i>
                        Stay engaged and participate actively
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            {/* Shared Resources Section - ENHANCED */}
            <div className="card">
              <div className="card-header bg-primary text-white">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">
                    <i className="fas fa-file-download me-2"></i>
                    Training Resources ({resources.length})
                  </h5>
                  <button 
                    className="btn btn-sm btn-light"
                    onClick={refreshResources}
                    disabled={resourcesLoading}
                    title="Refresh resources"
                  >
                    {resourcesLoading ? (
                      <span className="spinner-border spinner-border-sm" role="status"></span>
                    ) : (
                      <i className="fas fa-sync-alt"></i>
                    )}
                  </button>
                </div>
              </div>
              <div className="card-body p-0">
                {resources.length > 0 ? (
                  <>
                    {/* 🆕 RESOURCE INFO BANNER */}
                    <div className="alert alert-info m-3 mb-0">
                      <div className="d-flex align-items-center">
                        <i className="fas fa-info-circle me-2"></i>
                        <small>
                          <strong>All resources are permanently saved</strong> and will remain available even after the meeting ends.
                        </small>
                      </div>
                    </div>
                    
                    <div className="list-group list-group-flush">
                      {resources.map(resource => (
                        <ResourceItem 
                          key={resource.id} 
                          resource={resource} 
                          user={userData}
                          onAccess={handleResourceAccess}
                          onDownload={handleDownloadResource}
                          showActions={true}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <i className="fas fa-folder-open fa-2x text-muted mb-3"></i>
                    <p className="text-muted mb-0">No resources shared yet</p>
                    <small className="text-muted">
                      Resources shared by the host will appear here automatically
                    </small>
                    <div className="mt-2">
                      <button 
                        className="btn btn-sm btn-outline-primary"
                        onClick={refreshResources}
                        disabled={resourcesLoading}
                      >
                        {resourcesLoading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                            Checking...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-sync-alt me-1"></i>
                            Check for Resources
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Meeting Information */}
            <div className="card mt-4">
              <div className="card-header">
                <h5 className="card-title mb-0">
                  <i className="fas fa-info-circle me-2"></i>
                  Meeting Information
                </h5>
              </div>
              <div className="card-body">
                <div className="mb-2">
                  <small className="text-muted">Host</small>
                  <p className="mb-0 fw-semibold">{activeMeeting.adminName || 'Admin'}</p>
                </div>
                <div className="mb-2">
                  <small className="text-muted">Started</small>
                  <p className="mb-0 fw-semibold">
                    {new Date(activeMeeting.startTime).toLocaleString()}
                  </p>
                </div>
                <div className="mb-2">
                  <small className="text-muted">Participants</small>
                  <p className="mb-0 fw-semibold">
                    {activeMeeting.participants?.length || 0} joined
                  </p>
                </div>
              </div>
            </div>

            {/* Support Info */}
            <div className="card mt-4">
              <div className="card-header">
                <h5 className="card-title mb-0">
                  <i className="fas fa-headset me-2"></i>
                  Need Help?
                </h5>
              </div>
              <div className="card-body">
                <p className="small text-muted mb-2">
                  If you're having trouble joining the meeting:
                </p>
                <ul className="small text-muted ps-3">
                  <li>Check your internet connection</li>
                  <li>Allow camera and microphone permissions</li>
                  <li>Try using Google Chrome browser</li>
                  <li>Contact support if issues persist</li>
                </ul>
                
                {/* �Resource Access Help */}
                <div className="mt-3 pt-3 border-top">
                  <p className="small text-muted mb-2">
                    <strong>Resource Access:</strong>
                  </p>
                  <ul className="small text-muted ps-3 mb-0">
                    <li>Click on resources to view/download</li>
                    <li>All resources are saved permanently</li>
                    <li>Refresh to see new shared resources</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* No Active Meeting */
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center py-5">
                <div className="mb-4">
                  <i className="fas fa-video-slash fa-5x text-muted mb-4"></i>
                  <h2 className="text-muted">No Active Streams</h2>
                  <p className="text-muted lead">
                    There are no live streams happening right now. 
                    Check back later for upcoming training sessions and community events.
                  </p>
                </div>
                
                <div className="row mt-4">
                  <div className="col-md-6 mb-3">
                    <div className="card border-0 bg-light">
                      <div className="card-body">
                        <i className="fas fa-bell fa-2x text-primary mb-3"></i>
                        <h5>Get Notified</h5>
                        <p className="text-muted small">
                          You'll receive a notification when the next stream starts
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <div className="card border-0 bg-light">
                      <div className="card-body">
                        <i className="fas fa-book fa-2x text-success mb-3"></i>
                        <h5>Continue Learning</h5>
                        <p className="text-muted small">
                          Explore courses and materials while you wait
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <button 
                    className="btn btn-outline-primary"
                    onClick={loadActiveMeeting}
                  >
                    <i className="fas fa-sync-alt me-2"></i>
                    Check Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserCommunityTab;