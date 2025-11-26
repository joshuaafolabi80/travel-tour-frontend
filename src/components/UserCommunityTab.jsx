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
  const [isJoining, setIsJoining] = useState(false);
  const [hostHasJoined, setHostHasJoined] = useState(false);

  // 🎯 PERMANENT GOOGLE MEET LINK
  const PERMANENT_MEET_LINK = "https://meet.google.com/moc-zgvj-jfn";

  // Pagination & Search State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(4);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('userData') || '{}');
    setUserData(user);
    loadActiveMeeting();
    loadAllResources();
    
    // Set up polling to check for meeting status changes
    const interval = setInterval(() => {
      loadActiveMeeting();
    }, 10000); // Check every 10 seconds
    
    return () => clearInterval(interval);
  }, []);

  // 🆕 UPDATED: Load active meeting with host status check
  // 🆕 SIMPLER APPROACH: If meeting exists, host has joined
  const loadActiveMeeting = async () => {
    try {
      setIsRefreshing(true);
      const response = await MeetApiService.getActiveMeeting();
      console.log('🔍 User - Active meeting response:', response);
      
      if (response.success && response.meeting) {
        const meeting = response.meeting;
        
        // Ensure meeting has all required links
        if (!meeting.meetingCode) {
          meeting.meetingCode = extractMeetingCode(meeting.meetingLink);
        }
        if (!meeting.directJoinLink) {
          meeting.directJoinLink = meeting.meetingLink;
        }
        
        console.log('✅ User loaded meeting:', meeting);
        setActiveMeeting(meeting);
        
        // 🆕 SIMPLE FIX: If meeting exists, assume host has joined
        setHostHasJoined(true);
        
      } else {
        setActiveMeeting(null);
        setHostHasJoined(false);
      }
    } catch (error) {
      console.error('Error loading active meeting:', error);
      setActiveMeeting(null);
      setHostHasJoined(false);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // 🆕 NEW FUNCTION: Load ALL archived resources
  const loadAllResources = async () => {
    try {
      setResourcesLoading(true);
      console.log('🎯 User - Loading ALL archived resources...');
      const response = await MeetApiService.getArchivedResources();
      
      if (response.success) {
        setResources(response.resources || []);
        console.log('✅ User loaded ALL resources:', response.resources.length);
      } else {
        console.error('❌ Failed to load archived resources:', response.error);
      }
    } catch (error) {
      console.error('❌ Error loading all resources:', error);
    } finally {
      setResourcesLoading(false);
    }
  };

  // 🎯 UPDATED: Join function - only works when host has joined
  const handleJoinWebinarRoom = () => {
    if (!hostHasJoined) {
      alert('⏳ The webinar host has not joined yet. Please wait for the host to start the meeting.');
      return;
    }

    console.log('🎯 Joining Google Meet:', PERMANENT_MEET_LINK);
    setIsJoining(true);
    
    // Directly open the permanent Google Meet link
    const newTab = window.open(PERMANENT_MEET_LINK, 'conclave-webinar-room');
    
    if (newTab) {
      newTab.focus();
      console.log('✅ Google Meet opened successfully');
      
      // Track join attempt if user data exists
      if (userData && activeMeeting) {
        MeetApiService.joinMeeting(activeMeeting.id, userData)
          .then(() => console.log('✅ Join tracked'))
          .catch(error => console.error('❌ Join tracking error:', error));
      }
    } else {
      // Popup blocked - fallback
      const userAction = confirm(
        '📢 Popup blocked!\n\nPlease click OK to copy the meeting link, then paste it in your browser.'
      );
      
      if (userAction) {
        navigator.clipboard.writeText(PERMANENT_MEET_LINK);
        alert('🔗 Meeting link copied! Paste it in your browser.');
      }
    }
    
    setIsJoining(false);
  };

  // Join Live Stream (for active meetings)
  const handleJoinStream = async (meeting) => {
    if (!meeting || !hostHasJoined) {
      alert('⏳ The webinar host has not joined yet. Please wait for the host to start the meeting.');
      return;
    }
    
    setIsJoining(true);
    try {
      console.log('🎯 Joining live stream...');
      
      // Use the actual meeting link
      const streamLink = meeting.meetingLink || meeting.meetLink || meeting.directJoinLink;
      
      if (!streamLink) {
        throw new Error('No valid stream link found');
      }

      console.log('🔗 Using stream link:', streamLink);

      // Open in new tab
      const newTab = window.open(streamLink, `conclave-stream-${meeting.id}`);
      
      if (newTab) {
        newTab.focus();
        
        // Track join attempt
        await MeetApiService.joinMeeting(meeting.id, userData);
        
        console.log('✅ Stream opened successfully');
        
      } else {
        // Popup blocked
        const userAction = confirm(
          `📢 Popup blocked!\n\nPlease:\n1. Allow popups for this site\n2. Or click OK to copy the stream link\n\nStream: ${meeting.title}`
        );
        
        if (userAction && streamLink) {
          navigator.clipboard.writeText(streamLink);
          alert('🔗 Stream link copied! Paste it in your browser to join.');
        }
      }
      
    } catch (error) {
      console.error('❌ Join error:', error);
      alert(`❌ Failed to join stream: ${error.message}`);
    } finally {
      setIsJoining(false);
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

  const handleViewResource = (resource) => {
    console.log('🔍 User viewing resource:', resource);
    
    if (userData) {
      MeetApiService.recordResourceAccess(resource.id, userData.id, 'view')
        .then(result => console.log('✅ Resource access tracked:', result))
        .catch(error => console.error('❌ Error tracking resource access:', error));
    }
    
    setViewingResource(resource);
  };

  const handleManualRefresh = async () => {
    await Promise.all([
      loadActiveMeeting(),
      loadAllResources()
    ]);
  };

  // Pagination & Search Functions
  const filteredResources = resources.filter(resource => {
    const matchesSearch = searchTerm === '' || 
      resource.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.uploadedByName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.sharedByName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.content?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = searchType === 'all' || 
      (resource.resourceType || resource.type) === searchType;

    return matchesSearch && matchesType;
  });

  const sortedResources = [...filteredResources].sort((a, b) => {
    let aValue = a[sortField] || '';
    let bValue = b[sortField] || '';
    
    // Handle date sorting
    if (sortField === 'createdAt' || sortField === 'sharedAt') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }
    
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

  // 🆕 Get uploaded by name (compatibility with both field names)
  const getUploadedByName = (resource) => {
    return resource.uploadedByName || resource.sharedByName || 'Unknown';
  };

  if (isLoading) {
    return (
      <div className="container-fluid py-4">
        <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
          <div className="text-center">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted">Loading community resources...</p>
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
            <h1 className="h3 mb-1">The Conclave Academy Streams</h1>
            <p className="text-muted mb-0">Travel, Tours, Hotels & Tourism Training Platform</p>
          </div>
        </div>
      </div>

      {/* WEBINAR ROOM SECTION - DYNAMIC BASED ON HOST STATUS */}
      <div className="row">
        <div className="col-lg-8">
          {/* Webinar Room Card - Shows different content based on host status */}
          <div className={`card mb-4 ${hostHasJoined ? 'border-success' : 'border-secondary'}`}>
            <div className={`card-header ${hostHasJoined ? 'bg-success text-white' : 'bg-secondary text-white'}`}>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">
                  <i className="fas fa-video me-2"></i>
                  The Conclave Academy - Webinar Room
                </h5>
                <div className="d-flex align-items-center gap-2">
                  {hostHasJoined ? (
                    <span className="badge bg-warning text-dark">
                      <i className="fas fa-broadcast-tower me-1"></i>
                      LIVE NOW
                    </span>
                  ) : (
                    <span className="badge bg-light text-dark">
                      <i className="fas fa-clock me-1"></i>
                      WAITING FOR HOST
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col-md-8">
                  {hostHasJoined ? (
                    <>
                      <h3 className="text-success mb-3">Webinar Room is Live! 🎉</h3>
                      <p className="text-muted mb-3">
                        The host has joined the webinar room. You can now join the live session and participate in the training.
                      </p>
                      
                      <div className="d-flex flex-wrap gap-2 mb-3">
                        <span className="badge bg-success">
                          <i className="fas fa-check-circle me-1"></i>
                          Host Online
                        </span>
                        <span className="badge bg-info">
                          <i className="fas fa-users me-1"></i>
                          Ready to Join
                        </span>
                        <span className="badge bg-primary">
                          <i className="fas fa-video me-1"></i>
                          Live Session
                        </span>
                      </div>

                      {/* 🎯 JOIN BUTTON - ONLY SHOWS WHEN HOST HAS JOINED */}
                      <button 
                        onClick={handleJoinWebinarRoom}
                        className="btn btn-success btn-lg"
                        disabled={isJoining}
                      >
                        {isJoining ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                            Joining Webinar Room...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-play-circle me-2"></i>
                            Join Webinar Room
                          </>
                        )}
                      </button>

                      {/* Meeting Info */}
                      <div className="mt-3 p-3 bg-light rounded">
                        <small className="text-muted">
                          <i className="fas fa-info-circle me-1 text-info"></i>
                          Video call link: <strong>{PERMANENT_MEET_LINK}</strong>
                        </small>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="text-secondary mb-3">Webinar Room Not Active</h3>
                      <p className="text-muted mb-3">
                        The webinar room is currently not active. Please wait for the host to start the meeting.
                        You'll be able to join as soon as the host begins the session.
                      </p>
                      
                      <div className="d-flex flex-wrap gap-2 mb-3">
                        <span className="badge bg-secondary">
                          <i className="fas fa-clock me-1"></i>
                          Waiting for Host
                        </span>
                        <span className="badge bg-light text-dark">
                          <i className="fas fa-user-tie me-1"></i>
                          Host Offline
                        </span>
                        <span className="badge bg-info">
                          <i className="fas fa-bell me-1"></i>
                          Auto-refresh Enabled
                        </span>
                      </div>

                      {/* 🎯 DISABLED JOIN BUTTON WITH MESSAGE */}
                      <button 
                        className="btn btn-secondary btn-lg"
                        disabled
                      >
                        <i className="fas fa-clock me-2"></i>
                        Waiting for Host to Join
                      </button>

                      <div className="mt-3 p-3 bg-light rounded">
                        <small className="text-muted">
                          <i className="fas fa-info-circle me-1 text-info"></i>
                          This page automatically refreshes every 10 seconds. The join button will appear as soon as the host starts the meeting.
                        </small>
                      </div>
                    </>
                  )}
                </div>
                <div className="col-md-4 text-center">
                  <div className={`${hostHasJoined ? 'bg-success bg-opacity-10' : 'bg-secondary bg-opacity-10'} rounded-circle p-4 d-inline-flex mb-3`}>
                    <i className={`fas ${hostHasJoined ? 'fa-broadcast-tower text-success' : 'fa-clock text-secondary'} fa-3x`}></i>
                  </div>
                  <p className="text-muted small">
                    {hostHasJoined 
                      ? 'Live webinar session in progress. Join now to participate!'
                      : 'Webinar room will activate when the host joins the meeting'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Active Meeting Section (Optional - keep if you want both) */}
          {activeMeeting && hostHasJoined && (
            <div className="card mb-4 border-primary">
              <div className="card-header bg-primary text-white">
                <h5 className="card-title mb-0">
                  <i className="fas fa-star me-2"></i>
                  Special Live Event
                </h5>
              </div>
              <div className="card-body">
                <h4 className="text-primary">{activeMeeting.title}</h4>
                <p className="text-muted">{activeMeeting.description}</p>
                <div className="d-flex gap-2">
                  <span className="badge bg-info">
                    <i className="fas fa-user-tie me-1"></i>
                    Host: {activeMeeting.adminName}
                  </span>
                  <span className="badge bg-secondary">
                    <i className="fas fa-clock me-1"></i>
                    {new Date(activeMeeting.startTime).toLocaleString()}
                  </span>
                </div>
                <button 
                  onClick={() => handleJoinStream(activeMeeting)}
                  className="btn btn-primary mt-3"
                  disabled={isJoining}
                >
                  {isJoining ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Joining Stream...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-play-circle me-2"></i>
                      Join Special Event
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

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
          {/* Resources Table */}
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
              {/* Resource Info Banner */}
              <div className="alert alert-info mb-3">
                <div className="d-flex align-items-center">
                  <i className="fas fa-info-circle me-2"></i>
                  <small>
                    <strong>All resources are permanently saved</strong> and will remain available.
                    <br />
                    <span className="text-success">
                      <i className="fas fa-database me-1"></i>
                      Showing {resources.length} resources from archive
                    </span>
                  </small>
                </div>
              </div>

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

              {/* Resources Table */}
              {currentResources.length > 0 ? (
                <>
                  <div className="table-responsive" style={{
                    fontSize: '0.875rem',
                    border: '0'
                  }}>
                    <table className="table table-hover">
                      <thead className="table-light">
                        <tr>
                          <th 
                            style={{ 
                              cursor: 'pointer', 
                              width: '40%',
                              minWidth: '120px'
                            }}
                            onClick={() => handleSort('title')}
                          >
                            Resource
                            {sortField === 'title' && (
                              <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'} ms-1`}></i>
                            )}
                          </th>
                          <th style={{ width: '15%', minWidth: '70px' }}>Type</th>
                          <th style={{ width: '25%', minWidth: '100px' }}>Details</th>
                          <th style={{ width: '20%', minWidth: '70px' }}>View</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentResources.map((resource) => (
                          <tr key={resource.id}>
                            <td>
                              <div className="d-flex align-items-center">
                                <i className={`${getResourceIcon(resource.resourceType || resource.type)} me-2`}></i>
                                <div style={{ minWidth: 0, flex: 1 }}>
                                  <div 
                                    className="fw-semibold text-primary" 
                                    style={{ 
                                      wordBreak: 'break-word',
                                      overflow: 'hidden',
                                      display: '-webkit-box',
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: 'vertical',
                                      lineHeight: '1.3',
                                      maxHeight: '2.6em'
                                    }}
                                    title={resource.title}
                                  >
                                    {resource.title}
                                  </div>
                                  <small className="text-muted d-block" style={{ 
                                    wordBreak: 'break-word',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}>
                                    by {getUploadedByName(resource)}
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
                                <div style={{
                                  wordBreak: 'break-word',
                                  overflow: 'hidden',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  lineHeight: '1.3'
                                }}>
                                  {resource.description || resource.content?.substring(0, 50)}
                                  {resource.content && resource.content.length > 50 && '...'}
                                </div>
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
                                className="btn btn-outline-primary btn-sm w-100"
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

                  {/* Pagination */}
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
                If you're having trouble joining:
              </p>
              <ul className="small text-muted ps-3">
                <li>Check your internet connection</li>
                <li>Allow camera and microphone permissions</li>
                <li>Try using Google Chrome browser</li>
                <li>Contact support if issues persist</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

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

export default UserCommunityTab;