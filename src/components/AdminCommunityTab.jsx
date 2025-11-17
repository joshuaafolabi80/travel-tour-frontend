// travel-tour-frontend/src/components/AdminCommunityTab.jsx
import React, { useState, useEffect } from 'react';
import MeetApiService from '../services/meet-api';
import ResourceUploader from './ResourceUploader';
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
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 🆕 PAGINATION & SEARCH STATE
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

  const loadActiveMeeting = async () => {
    try {
      setIsRefreshing(true);
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
    }, 3000);
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
        showTemporaryNotification('success', '🎉 Meeting created successfully!');
        
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
        showTemporaryNotification('success', '⏰ Meeting extended successfully!');
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
        showTemporaryNotification('success', '🛑 Meeting ended successfully!');
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
      
      const response = await MeetApiService.clearAllMeetings();
      
      if (response.success) {
        setActiveMeeting(null);
        setResources([]);
        setIsMyMeeting(false);
        showTemporaryNotification('success', '🧹 All meetings cleared successfully!');
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
    showTemporaryNotification('success', '📁 Resource shared successfully!');
  };

  const handleDeleteResource = async (resourceId) => {
    try {
      console.log('💀 Deleting resource:', resourceId);
      const response = await MeetApiService.deleteResource(resourceId);
      
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

  const clearNotification = () => {
    setNotification({ type: '', message: '' });
  };

  // 🆕 PAGINATION & SEARCH FUNCTIONS
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
              <h1 className="h3 mb-1">Welcome to The Conclave Streams</h1>
              <p className="text-muted mb-0">Manage your community live streams and training sessions</p>
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
      </div>

      {/* Active Meeting Section */}
      {activeMeeting ? (
        <div className="row">
          <div className="col-12">
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
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-success">
                      <i className="fas fa-circle me-1"></i>
                      LIVE
                    </span>
                    <span className="badge bg-info">
                      <i className="fas fa-users me-1"></i>
                      {activeMeeting.participants?.length || 0}
                    </span>
                  </div>
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
                        <small className="text-muted">Host</small>
                        <p className="mb-0 fw-semibold">
                          {activeMeeting.adminName || 'Admin'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 d-flex flex-wrap gap-2 align-items-center">
                      {isMyMeeting && (
                        <button 
                          className="btn btn-info"
                          onClick={() => setShowShareModal(true)}
                        >
                          <i className="fas fa-share-alt me-2"></i>
                          Share Resources
                        </button>
                      )}
                      
                      <a 
                        href={activeMeeting.meetingLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn btn-success"
                      >
                        <i className="fas fa-play-circle me-2"></i>
                        {isMyMeeting ? 'Host Meeting' : 'Join Stream'}
                      </a>
                      
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

            {/* 🆕 ENHANCED RESOURCES TABLE */}
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
                <div className="card-body">
                  {/* 🆕 SEARCH AND FILTERS */}
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

                  {/* 🆕 RESOURCES TABLE */}
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
                                      onClick={() => {
                                        if (resource.resourceType === 'link' || resource.type === 'link') {
                                          window.open(resource.content, '_blank', 'noopener,noreferrer');
                                        } else {
                                          // For other resources, show content in modal or new tab
                                          const win = window.open('', '_blank');
                                          win.document.write(`
                                            <html>
                                              <head><title>${resource.title}</title></head>
                                              <body style="padding: 20px; font-family: Arial, sans-serif;">
                                                <h2>${resource.title}</h2>
                                                <p><strong>Type:</strong> ${resource.resourceType || resource.type}</p>
                                                <p><strong>Uploaded by:</strong> ${resource.uploadedByName}</p>
                                                <p><strong>Date:</strong> ${formatDate(resource.createdAt || resource.sharedAt)}</p>
                                                <hr>
                                                <div>${resource.content}</div>
                                              </body>
                                            </html>
                                          `);
                                        }
                                      }}
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

                      {/* 🆕 PAGINATION */}
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
            )}
          </div>

          <div className="col-lg-4">
            {/* Quick Actions */}
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
                      onClick={() => {
                        navigator.clipboard.writeText(activeMeeting.meetingLink);
                        showTemporaryNotification('success', '🔗 Meeting link copied to clipboard!');
                      }}
                    >
                      <i className="fas fa-copy me-2"></i>
                      Copy Meeting Link
                    </button>
                    <button 
                      className="btn btn-outline-primary"
                      onClick={handleManualRefresh}
                      disabled={isRefreshing}
                    >
                      {isRefreshing ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Refreshing...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-sync-alt me-2"></i>
                          Refresh Data
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

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
        /* No Active Meeting */
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