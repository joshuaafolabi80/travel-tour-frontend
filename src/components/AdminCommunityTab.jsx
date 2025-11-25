import React, { useState, useEffect } from 'react';
import MeetApiService from '../services/meet-api';
import ResourceUploader from './ResourceUploader';
import ExtensionModal from './ExtensionModal';
import ResourceViewer from './ResourceViewer';

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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewingResource, setViewingResource] = useState(null);
  const [isJoining, setIsJoining] = useState(false);
  const [hostHasJoined, setHostHasJoined] = useState(false);

  // 🎯 PERMANENT GOOGLE MEET LINK (This is the Master Link - Everyone uses this)
  const PERMANENT_MEET_LINK = "https://meet.google.com/moc-zgvj-jfn";

  // Pagination & Search State
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

  // 🛠️ FIXED: Admin joins the PERMANENT link (not random DB links)
  const handleAdminJoinFirst = async () => {
    if (!activeMeeting) return;
    
    setIsJoining(true);
    try {
      console.log('🎯 Admin joining first...');
      
      // 🔴 FIXED: Force the PERMANENT link - ignore any DB-generated links
      const streamLink = PERMANENT_MEET_LINK;

      console.log('🔗 Admin using permanent stream link:', streamLink);

      // Open in new tab
      const newTab = window.open(streamLink, `conclave-admin-stream`);
      
      if (newTab) {
        newTab.focus();
        
        // Track admin join in DB (so users know host is in)
        await MeetApiService.joinMeeting(activeMeeting.id, userData);
        
        console.log('✅ Admin joined permanent room successfully');
        setHostHasJoined(true);
        showTemporaryNotification('success', '✅ You have joined as host! Users can now join the meeting.');
        
        // 🆕 FIXED: Use the new status update function
        await MeetApiService.updateMeetingStatus(activeMeeting.id, 'host_joined');

      } else {
        // Popup blocked
        const userAction = confirm(
          `📢 Popup blocked!\n\nPlease click OK to copy the meeting link, then paste it in your browser.`
        );
        
        if (userAction) {
          navigator.clipboard.writeText(streamLink);
          showTemporaryNotification('success', '🔗 Meeting link copied! Paste it in your browser to join as host.');
        }
      }
      
    } catch (error) {
      console.error('❌ Admin join error:', error);
      showTemporaryNotification('error', `❌ Failed to join: ${error.message}`);
    } finally {
      setIsJoining(false);
    }
  };

  // Join Webinar Room (for re-joining after host has joined)
  const handleJoinWebinarRoom = () => {
    console.log('🎯 Joining Webinar Room:', PERMANENT_MEET_LINK);
    
    // Directly open the permanent Google Meet link
    const newTab = window.open(PERMANENT_MEET_LINK, 'conclave-webinar-room');
    
    if (newTab) {
      newTab.focus();
      console.log('✅ Webinar Room opened successfully');
      showTemporaryNotification('info', '🌐 Opening webinar room...');
    } else {
      // Popup blocked - fallback
      const userAction = confirm(
        '📢 Popup blocked!\n\nPlease click OK to copy the meeting link, then paste it in your browser.'
      );
      
      if (userAction) {
        navigator.clipboard.writeText(PERMANENT_MEET_LINK);
        showTemporaryNotification('success', '🔗 Meeting link copied! Paste it in your browser.');
      }
    }
  };

  const extractMeetingCode = (meetingLink) => {
    if (!meetingLink) return '';
    
    const patterns = [
      /meet\.google\.com\/([a-z]+-[a-z]+-[a-z]+)/i,
      /meet\.google\.com\/([a-z]{3}-[a-z]{4}-[a-z]{3})/i,
      /meet\.google\.com\/([a-zA-Z0-9-]+)/
    ];
    
    for (let pattern of patterns) {
      const match = meetingLink.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return '';
  };

  // 🆕 COMPLETELY FIXED: Load active meeting with archive support
  const loadActiveMeeting = async () => {
    try {
      setIsRefreshing(true);
      const response = await MeetApiService.getActiveMeeting();
      console.log('🔍 Active meeting response:', response);
      
      if (response.success && response.meeting) {
        const meeting = response.meeting;
        
        // 🔴 FIXED: Override any DB links with our permanent link
        meeting.meetingLink = PERMANENT_MEET_LINK;
        meeting.directJoinLink = PERMANENT_MEET_LINK;
        
        // Ensure meeting has all required codes
        if (!meeting.meetingCode) {
          meeting.meetingCode = extractMeetingCode(PERMANENT_MEET_LINK);
        }
        
        setActiveMeeting(meeting);
        
        const isAdminMeeting = meeting.adminId === userData?.id;
        setIsMyMeeting(isAdminMeeting);
        
        // Check if host has joined
        setHostHasJoined(meeting.status === 'host_joined');
        
        // 🆕 FETCH RESOURCES FOR ACTIVE MEETING
        const resourcesResponse = await MeetApiService.getMeetingResources(meeting.id);
        if (resourcesResponse.success) {
          setResources(resourcesResponse.resources || []);
          console.log('✅ Loaded active meeting resources:', resourcesResponse.resources.length);
        }
      } else {
        setActiveMeeting(null);
        setIsMyMeeting(false);
        setHostHasJoined(false);
        
        // 🆕 CRITICAL FIX: LOAD ARCHIVED RESOURCES WHEN NO ACTIVE MEETING
        console.log('📚 No active meeting - loading archived resources...');
        const archivedResponse = await MeetApiService.getArchivedResources();
        
        if (archivedResponse.success) {
          setResources(archivedResponse.resources || []);
          console.log('✅ Loaded archived resources:', archivedResponse.resources.length);
        } else {
          console.log('📚 Could not load archived resources, keeping current state');
          // Don't clear resources - keep whatever we have
        }
      }
    } catch (error) {
      console.error('Error loading active meeting:', error);
      setNotification({ type: 'error', message: 'Failed to load meeting data' });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleManualRefresh = async () => {
    await loadActiveMeeting();
    showTemporaryNotification('info', '📊 Data refreshed successfully!');
  };

  const showTemporaryNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification({ type: '', message: '' });
    }, 5000);
  };

  // 🛠️ FIXED: Create meeting but use permanent link
  const createMeeting = async () => {
    if (!userData) {
      setNotification({ type: 'error', message: 'User data not found' });
      return;
    }

    setIsCreating(true);
    try {
      const response = await MeetApiService.createMeeting(
        userData.id, 
        'The Conclave Academy - Webinar Room',
        'Join our dedicated webinar room for live training sessions',
        userData.name || userData.username
      );

      console.log('🔍 Create meeting response:', response);

      if (response.success) {
        // 🔴 FIXED: Override the DB-generated link with our permanent link
        const meetingWithPermanentLink = {
          ...response.meeting,
          meetingLink: PERMANENT_MEET_LINK,
          directJoinLink: PERMANENT_MEET_LINK,
          meetingCode: extractMeetingCode(PERMANENT_MEET_LINK)
        };
        
        setActiveMeeting(meetingWithPermanentLink);
        setIsMyMeeting(true);
        setHostHasJoined(false); // Host hasn't joined yet
        showTemporaryNotification('success', '🎉 Webinar room created! Click "Join as Host" to start the session.');
        
        if (response.meeting.id) {
          const resourcesResponse = await MeetApiService.getMeetingResources(response.meeting.id);
          if (resourcesResponse.success) {
            setResources(resourcesResponse.resources || []);
          }
        }
      } else {
        setNotification({ 
          type: 'error', 
          message: response.error || 'Failed to create webinar room' 
        });
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
        showTemporaryNotification('success', '⏰ Meeting extended successfully!');
      } else {
        setNotification({ type: 'error', message: response.error || 'Failed to extend meeting' });
      }
    } catch (error) {
      console.error('Error extending meeting:', error);
      setNotification({ type: 'error', message: 'Failed to extend meeting' });
    }
  };

  // 🆕 FIXED: End meeting without clearing resources
  const handleEndMeeting = async () => {
    if (!activeMeeting || !userData) return;

    try {
      const response = await MeetApiService.endMeeting(activeMeeting.id, userData.id);
      
      if (response.success) {
        setActiveMeeting(null);
        // 🆕 FIXED: DON'T CLEAR RESOURCES - Keep them visible in archive
        setIsMyMeeting(false);
        setHostHasJoined(false);
        showTemporaryNotification('success', '🛑 Webinar session ended successfully! All shared resources remain available in the archive.');
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
    setShowShareModal(false);
    showTemporaryNotification('success', '📁 Resource shared successfully!');
  };

  const handleDeleteResource = async (resourceId) => {
    try {
      console.log('🗑️ Deleting resource:', resourceId);
      
      // Get admin ID from user data
      const adminId = userData?.id;
      
      if (!adminId) {
        setNotification({ type: 'error', message: 'Admin ID not found. Please log in again.' });
        return;
      }
      
      const response = await MeetApiService.deleteResource(resourceId, adminId); // Pass adminId
      
      if (response.success) {
        setResources(prev => prev.filter(r => r.id !== resourceId));
        showTemporaryNotification('success', '🗑️ Resource deleted successfully!');
      } else {
        setNotification({ type: 'error', message: response.error || 'Failed to delete resource' });
      }
    } catch (error) {
      console.error('Error deleting resource:', error);
      setNotification({ type: 'error', message: 'Failed to delete resource' });
    }
  };

  const handleViewResource = (resource) => {
    console.log('🔍 Viewing resource:', resource);
    
    if (userData) {
      MeetApiService.recordResourceAccess(resource.id, userData.id, 'view')
        .then(result => console.log('✅ Resource access tracked:', result))
        .catch(error => console.error('❌ Error tracking resource access:', error));
    }
    
    setViewingResource(resource);
  };

  const clearNotification = () => {
    setNotification({ type: '', message: '' });
  };

  // Pagination & Search Functions
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
              <h1 className="h3 mb-1">The Conclave Academy Streams</h1>
              <p className="text-muted mb-0">Travel, Tours, Hotels & Tourism Training Platform</p>
            </div>
            <div className="d-flex gap-2">
              <button 
                className="btn btn-outline-secondary btn-sm"
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                title="Refresh data"
              >
                {isRefreshing ? (
                  <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                ) : (
                  <i className="fas fa-sync-alt me-1"></i>
                )}
                Refresh
              </button>
              
              {!activeMeeting && (
                <button 
                  className="btn btn-primary btn-lg"
                  onClick={createMeeting}
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Creating Webinar Room...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-plus-circle me-2"></i>
                      Create Webinar Room
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PERMANENT WEBINAR ROOM SECTION */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-success">
            <div className="card-header bg-success text-white">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">
                  <i className="fas fa-video me-2"></i>
                  The Conclave Academy - Webinar Room
                </h5>
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-warning text-dark">
                    <i className="fas fa-home me-1"></i>
                    PERMANENT ROOM
                  </span>
                  {hostHasJoined && (
                    <span className="badge bg-info">
                      <i className="fas fa-check-circle me-1"></i>
                      HOST JOINED
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col-md-8">
                  <h3 className="text-success mb-3">Webinar Room Control Panel</h3>
                  <p className="text-muted mb-3">
                    Manage your dedicated webinar room for live training sessions. 
                    As host, you must join first before participants can enter.
                  </p>
                  
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    <span className="badge bg-primary">
                      <i className="fas fa-user-shield me-1"></i>
                      Host Control
                    </span>
                    <span className="badge bg-info">
                      <i className="fas fa-clock me-1"></i>
                      Open 24/7
                    </span>
                    <span className="badge bg-secondary">
                      <i className="fas fa-users me-1"></i>
                      Secure Access
                    </span>
                  </div>

                  {/* Host Join Button */}
                  {activeMeeting && isMyMeeting && !hostHasJoined && (
                    <div className="mb-3">
                      <button 
                        onClick={handleAdminJoinFirst}
                        className="btn btn-success btn-lg"
                        disabled={isJoining}
                      >
                        {isJoining ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                            Joining as Host...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-crown me-2"></i>
                            Join as Host First
                          </>
                        )}
                      </button>
                      <div className="mt-2">
                        <small className="text-muted">
                          <i className="fas fa-info-circle me-1 text-info"></i>
                          You must join first before participants can enter the meeting
                        </small>
                      </div>
                    </div>
                  )}

                  {hostHasJoined && (
                    <div className="mb-3">
                      <div className="alert alert-success mb-3">
                        <i className="fas fa-check-circle me-2"></i>
                        <strong>You're in the meeting!</strong> Participants can now join the webinar room.
                      </div>
                      <button 
                        onClick={handleJoinWebinarRoom}
                        className="btn btn-outline-success me-2"
                      >
                        <i className="fas fa-door-open me-2"></i>
                        Re-join Webinar Room
                      </button>
                      <button 
                        className="btn btn-outline-primary me-2"
                        onClick={() => setShowShareModal(true)}
                      >
                        <i className="fas fa-share-alt me-2"></i>
                        Share Resources
                      </button>
                    </div>
                  )}

                  {/* Meeting Info */}
                  <div className="mt-3 p-3 bg-light rounded">
                    <small className="text-muted">
                      <i className="fas fa-info-circle me-1 text-info"></i>
                      Video call link: <strong>{PERMANENT_MEET_LINK}</strong>
                    </small>
                  </div>
                </div>
                <div className="col-md-4 text-center">
                  <div className="bg-success bg-opacity-10 rounded-circle p-4 d-inline-flex mb-3">
                    <i className="fas fa-user-shield fa-3x text-success"></i>
                  </div>
                  <p className="text-muted small">
                    Host-controlled webinar room with secure participant access
                  </p>
                  
                  {activeMeeting && isMyMeeting && (
                    <div className="mt-3">
                      <button 
                        className="btn btn-outline-danger btn-sm"
                        onClick={handleEndMeeting}
                      >
                        <i className="fas fa-stop-circle me-2"></i>
                        End Webinar Session
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resources Section */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header bg-info text-white">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">
                  <i className="fas fa-share-alt me-2"></i>
                  Training Resources ({resources.length})
                </h5>
                <span className="badge bg-light text-info">
                  <i className="fas fa-database me-1"></i>
                  Permanent Storage
                </span>
              </div>
            </div>
            <div className="card-body">
              {/* Search and Filters */}
              <div className="row mb-3">
                <div className="col-md-6">
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="fas fa-search"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search by name, description, or uploader..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                    />
                  </div>
                </div>
                <div className="col-md-3">
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
                <div className="col-md-3">
                  <div className="d-flex gap-2">
                    <span className="text-muted small align-self-center">
                      {sortedResources.length} items
                    </span>
                  </div>
                </div>
              </div>

              {/* Resources Table */}
              {currentResources.length > 0 ? (
                <>
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead className="table-light">
                        <tr>
                          <th 
                            style={{ cursor: 'pointer', width: '35%' }}
                            onClick={() => handleSort('title')}
                          >
                            Resource
                            {sortField === 'title' && (
                              <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ms-1`}></i>
                            )}
                          </th>
                          <th style={{ width: '15%' }}>Type</th>
                          <th style={{ width: '25%' }}>Details</th>
                          <th style={{ width: '15%' }}>Date</th>
                          <th style={{ width: '10%' }}>Actions</th>
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
                                {resource.description || resource.content?.substring(0, 50)}
                                {resource.content && resource.content.length > 50 && '...'}
                                {resource.fileSize && (
                                  <div className="mt-1">
                                    <i className="fas fa-hdd me-1"></i>
                                    {formatFileSize(resource.fileSize)}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td>
                              <small className="text-muted">
                                {formatDate(resource.createdAt || resource.sharedAt)}
                              </small>
                            </td>
                            <td>
                              <div className="btn-group btn-group-sm">
                                <button
                                  className="btn btn-outline-primary"
                                  onClick={() => handleViewResource(resource)}
                                  title="View Resource"
                                >
                                  <i className="fas fa-eye"></i>
                                </button>
                                <button
                                  className="btn btn-outline-danger"
                                  onClick={() => {
                                    if (window.confirm('Are you sure you want to delete this resource? This action cannot be undone.')) {
                                      handleDeleteResource(resource.id);
                                    }
                                  }}
                                  title="Delete Resource"
                                >
                                  <i className="fas fa-trash"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <nav className="mt-3">
                      <ul className="pagination justify-content-center">
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
                <div className="text-center py-5">
                  <i className="fas fa-folder-open fa-3x text-muted mb-3"></i>
                  <p className="text-muted mb-0">No resources found</p>
                  <small className="text-muted">
                    {searchTerm || searchType !== 'all' ? 'Try adjusting your search filters' : 'Share resources using the button above'}
                  </small>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

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
                        <strong>Resources shared here are permanently saved</strong> and will be available to users during and after the webinar.
                      </p>
                      <p className="mb-0 small">
                        <i className="fas fa-lightbulb me-1 text-warning"></i>
                        <strong>Tip:</strong> Share documents, links, and files here for participants to access anytime.
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

      {/* Resource Viewer Modal */}
      {viewingResource && (
        <ResourceViewer
          resource={viewingResource}
          onClose={() => setViewingResource(null)}
        />
      )}
    </div>
  );
};

export default AdminCommunityTab;