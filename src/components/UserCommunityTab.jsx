import React, { useState, useEffect } from 'react';
import MeetApiService from '../services/meet-api';
import ResourceViewer from './ResourceViewer';

const UserCommunityTab = () => {
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [resources, setResources] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewingResource, setViewingResource] = useState(null);

  // PAGINATION & SEARCH STATE
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('userData') || '{}');
    setUserData(user);
    loadActiveMeeting();
  }, []);

  // 🆕 ADD NEW TAB FUNCTIONALITY
  const handleJoinMeetingInNewTab = async (meeting) => {
    try {
      console.log('🎯 User opening Google Meet in new tab...');
      
      // OPEN GOOGLE MEET IN NEW TAB
      const windowFeatures = [
        'width=1200,height=800',
        'left=100,top=100',
        'scrollbars=yes',
        'resizable=yes'
      ].join(',');

      const newTab = window.open(
        meeting.meetingLink, 
        `google-meet-${meeting.id}`,
        windowFeatures
      );
      
      if (newTab) {
        // FOCUS ON THE NEW TAB
        newTab.focus();
        
        // RECORD JOIN ATTEMPT IN DATABASE
        await MeetApiService.joinMeeting(meeting.id, {
          userId: userData?.id,
          userName: userData?.name || userData?.username,
          action: 'join-new-tab'
        });
        
        console.log('✅ Google Meet opened in new tab for user');
      } else {
        // POPUP BLOCKER HANDLING
        const userAction = confirm(
          'Popup blocked! Please allow popups for this site and try again, or click OK to copy the meeting link.'
        );
        
        if (userAction) {
          navigator.clipboard.writeText(meeting.meetingLink);
          alert('🔗 Meeting link copied to clipboard!');
        }
      }
    } catch (error) {
      console.error('❌ Error opening meeting in new tab:', error);
      // Fallback
      window.open(meeting.meetingLink, '_blank', 'noopener,noreferrer');
    }
  };

  const loadActiveMeeting = async () => {
    try {
      setIsRefreshing(true);
      const response = await MeetApiService.getActiveMeeting();
      console.log('🔍 User - Active meeting response:', response);
      
      if (response.success && response.meeting) {
        setActiveMeeting(response.meeting);
        await loadMeetingResources(response.meeting.id);
      } else {
        setActiveMeeting(null);
        setResources([]);
      }
    } catch (error) {
      console.error('Error loading active meeting:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
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
      const joinResponse = await MeetApiService.joinMeeting(
        activeMeeting.id, 
        userData.id, 
        userData.name || userData.username
      );
      
      if (joinResponse.success) {
        console.log('✅ Successfully joined meeting in system');
        window.open(activeMeeting.meetingLink, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('Error joining meeting:', error);
      window.open(activeMeeting.meetingLink, '_blank', 'noopener,noreferrer');
    }
  };

  const handleViewResource = (resource) => {
    console.log('🔍 User viewing resource:', resource);
    
    // Track resource access
    if (userData) {
      MeetApiService.recordResourceAccess(resource.id, userData.id, 'view')
        .then(result => console.log('✅ Resource access tracked:', result))
        .catch(error => console.error('❌ Error tracking resource access:', error));
    }
    
    setViewingResource(resource);
  };

  const handleManualRefresh = async () => {
    await loadActiveMeeting();
  };

  // PAGINATION & SEARCH FUNCTIONS
  const filteredResources = resources.filter(resource => {
    const matchesSearch = searchTerm === '' || 
      resource.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.uploadedByName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = searchType === 'all' || 
      (resource.resourceType || resource.type) === searchType;

    return matchesSearch && matchesType;
  });

  const sortedResources = [...filteredResources].sort((a, b) => {
    const aValue = a[sortField] || '';
    const bValue = b[sortField] || '';
    
    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentResources = sortedResources.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedResources.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getResourceIcon = (resourceType) => {
    switch (resourceType) {
      case 'link': return 'fas fa-link text-primary';
      case 'document': return 'fas fa-file-alt text-info';
      case 'pdf': return 'fas fa-file-pdf text-danger';
      case 'image': return 'fas fa-image text-success';
      case 'text': return 'fas fa-sticky-note text-warning';
      default: return 'fas fa-file text-secondary';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? 'Unknown date' : date.toLocaleString();
    } catch (error) {
      return 'Unknown date';
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const mb = bytes / 1024 / 1024;
    return mb >= 1 ? `${mb.toFixed(2)} MB` : `${(bytes / 1024).toFixed(2)} KB`;
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
            <p className="text-muted mb-0">Join our webinars, live training sessions and access shared resources</p>
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

                    {/* 🆕 UPDATED JOIN BUTTON - OPENS IN NEW TAB */}
                    <button 
                      onClick={() => handleJoinMeetingInNewTab(activeMeeting)}
                      className="btn btn-success btn-lg"
                    >
                      <i className="fas fa-external-link-alt me-2"></i>
                      Join Live Stream (New Tab)
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
                        Take notes during the session
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
            {/* ENHANCED RESOURCES TABLE */}
            <div className="card">
              <div className="card-header bg-primary text-white">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">
                    <i className="fas fa-file-alt me-2"></i>
                    Training Resources ({resources.length})
                  </h5>
                  <button 
                    className="btn btn-sm btn-light"
                    onClick={handleManualRefresh}
                    disabled={resourcesLoading || isRefreshing}
                    title="Refresh resources"
                  >
                    {resourcesLoading || isRefreshing ? (
                      <span className="spinner-border spinner-border-sm" role="status"></span>
                    ) : (
                      <i className="fas fa-sync-alt"></i>
                    )}
                  </button>
                </div>
              </div>
              <div className="card-body">
                {/* RESOURCE INFO BANNER */}
                <div className="alert alert-info mb-3">
                  <div className="d-flex align-items-center">
                    <i className="fas fa-info-circle me-2"></i>
                    <small>
                      <strong>All resources are permanently saved</strong> and will remain available even after the meeting ends.
                    </small>
                  </div>
                </div>

                {/* SEARCH AND FILTERS */}
                <div className="row mb-3">
                  <div className="col-md-6">
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="fas fa-search"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search resources..."
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setCurrentPage(1);
                        }}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <select
                      className="form-select"
                      value={searchType}
                      onChange={(e) => {
                        setSearchType(e.target.value);
                        setCurrentPage(1);
                      }}
                    >
                      <option value="all">All Types</option>
                      <option value="text">Text</option>
                      <option value="link">Link</option>
                      <option value="document">Document</option>
                      <option value="pdf">PDF</option>
                      <option value="image">Image</option>
                    </select>
                  </div>
                </div>

                {/* RESOURCES TABLE */}
                {currentResources.length > 0 ? (
                  <>
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead className="table-light">
                          <tr>
                            <th 
                              style={{ cursor: 'pointer', width: '40%' }}
                              onClick={() => handleSort('title')}
                            >
                              Resource
                              {sortField === 'title' && (
                                <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ms-1`}></i>
                              )}
                            </th>
                            <th style={{ width: '15%' }}>Type</th>
                            <th style={{ width: '30%' }}>Details</th>
                            <th style={{ width: '15%' }}>View</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentResources.map((resource) => (
                            <tr key={resource.id}>
                              <td>
                                <div className="d-flex align-items-center">
                                  <i className={`${getResourceIcon(resource.resourceType || resource.type)} me-2`}></i>
                                  <div>
                                    <div className="fw-semibold text-primary">
                                      {resource.title}
                                    </div>
                                    <small className="text-muted">
                                      by {resource.uploadedByName || 'Unknown'}
                                    </small>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span className={`badge ${
                                  (resource.resourceType || resource.type) === 'link' ? 'bg-primary' :
                                  (resource.resourceType || resource.type) === 'document' ? 'bg-info' :
                                  (resource.resourceType || resource.type) === 'pdf' ? 'bg-danger' :
                                  (resource.resourceType || resource.type) === 'image' ? 'bg-success' : 'bg-secondary'
                                }`}>
                                  {resource.resourceType || resource.type}
                                </span>
                              </td>
                              <td>
                                <div className="small text-muted">
                                  {resource.description || resource.content?.substring(0, 60)}
                                  {resource.content && resource.content.length > 60 && '...'}
                                  {resource.fileSize && (
                                    <div className="mt-1">
                                      <i className="fas fa-hdd me-1"></i>
                                      {formatFileSize(resource.fileSize)}
                                    </div>
                                  )}
                                  <div className="mt-1">
                                    <i className="fas fa-calendar me-1"></i>
                                    {formatDate(resource.createdAt || resource.sharedAt)}
                                  </div>
                                </div>
                              </td>
                              <td>
                                <button
                                  className="btn btn-outline-primary btn-sm"
                                  onClick={() => handleViewResource(resource)}
                                  title="View Resource"
                                >
                                  <i className="fas fa-eye me-1"></i>
                                  View
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* PAGINATION */}
                    {totalPages > 1 && (
                      <nav className="mt-3">
                        <ul className="pagination justify-content-center pagination-sm">
                          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                            <button 
                              className="page-link" 
                              onClick={() => paginate(currentPage - 1)}
                              disabled={currentPage === 1}
                            >
                              <i className="fas fa-chevron-left"></i>
                            </button>
                          </li>
                          
                          {[...Array(totalPages)].map((_, index) => {
                            const pageNumber = index + 1;
                            if (
                              pageNumber === 1 ||
                              pageNumber === totalPages ||
                              (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                            ) {
                              return (
                                <li 
                                  key={pageNumber} 
                                  className={`page-item ${currentPage === pageNumber ? 'active' : ''}`}
                                >
                                  <button 
                                    className="page-link" 
                                    onClick={() => paginate(pageNumber)}
                                  >
                                    {pageNumber}
                                  </button>
                                </li>
                              );
                            } else if (
                              pageNumber === currentPage - 2 ||
                              pageNumber === currentPage + 2
                            ) {
                              return (
                                <li key={pageNumber} className="page-item disabled">
                                  <span className="page-link">...</span>
                                </li>
                              );
                            }
                            return null;
                          })}
                          
                          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                            <button 
                              className="page-link" 
                              onClick={() => paginate(currentPage + 1)}
                              disabled={currentPage === totalPages}
                            >
                              <i className="fas fa-chevron-right"></i>
                            </button>
                          </li>
                        </ul>
                      </nav>
                    )}
                  </>
                ) : (
                  <div className="text-center py-4">
                    <i className="fas fa-folder-open fa-2x text-muted mb-3"></i>
                    <p className="text-muted mb-0">No resources found</p>
                    <small className="text-muted">
                      {searchTerm || searchType !== 'all' ? 'Try adjusting your search filters' : 'No resources have been shared yet'}
                    </small>
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
                
                <div className="mt-3 pt-3 border-top">
                  <p className="small text-muted mb-2">
                    <strong>Resource Access:</strong>
                  </p>
                  <ul className="small text-muted ps-3 mb-0">
                    <li>Click "View" to access resources</li>
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
                    onClick={handleManualRefresh}
                    disabled={isRefreshing}
                  >
                    {isRefreshing ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Checking...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-sync-alt me-2"></i>
                        Check Again
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RESOURCE VIEWER MODAL */}
      {viewingResource && (
        <ResourceViewer
          resource={viewingResource}
          onClose={() => setViewingResource(null)}
        />
      )}
    </div>
  );
};

export default UserCommunityTab;