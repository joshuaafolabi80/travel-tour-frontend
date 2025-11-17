// travel-tour-frontend/src/components/ResourceItem.jsx
import React, { useState } from 'react';
import MeetApiService from '../services/meet-api';

const ResourceItem = ({ resource, user, onAccess, onDownload, showActions = false, onResourceDeleted }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });

  // Custom notification function
  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => {
      setNotification({ show: false, type: '', message: '' });
    }, 4000);
  };

  // 🆕 ADDED: Format date properly to prevent "Invalid Date"
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Unknown date';
      }
      return date.toLocaleString();
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Unknown date';
    }
  };

  const getResourceIcon = () => {
    switch (resource.resourceType || resource.type) {
      case 'link':
        return 'fas fa-link text-primary';
      case 'document':
      case 'file':
        return 'fas fa-file-alt text-info';
      case 'pdf':
        return 'fas fa-file-pdf text-danger';
      case 'image':
        return 'fas fa-image text-success';
      case 'text':
        return 'fas fa-sticky-note text-warning';
      default:
        return 'fas fa-file text-secondary';
    }
  };

  const handleResourceClick = () => {
    if (onAccess && resource.id) {
      onAccess(resource.id, 'view');
    }

    if (resource.resourceType === 'link' || resource.type === 'link') {
      window.open(resource.content, '_blank', 'noopener,noreferrer');
    } else if (onDownload && (resource.fileName || resource.title)) {
      onDownload(resource);
    }
  };

  const handleDownload = (e) => {
    e.stopPropagation();
    if (onDownload) {
      onDownload(resource);
    }
    if (onAccess && resource.id) {
      onAccess(resource.id, 'download');
    }
  };

  // 🆕 ADDED: Delete resource function
  const handleDeleteResource = async () => {
    if (!resource.id && !resource.resourceId) {
      showNotification('error', 'Cannot delete resource: No resource ID found');
      return;
    }

    // Use resourceId if available, otherwise use id
    const resourceIdToDelete = resource.resourceId || resource.id;
    
    if (!resourceIdToDelete) {
      showNotification('error', 'Cannot delete resource: No valid resource ID found');
      return;
    }

    setIsDeleting(true);
    
    try {
      console.log('🗑️ Attempting to delete resource:', resourceIdToDelete);
      const response = await MeetApiService.deleteResource(resourceIdToDelete);
      
      if (response.success) {
        showNotification('success', '✅ Resource deleted successfully!');
        setShowDeleteModal(false);
        if (onResourceDeleted) {
          onResourceDeleted(resourceIdToDelete);
        }
      } else {
        throw new Error(response.error || 'Failed to delete resource');
      }
    } catch (error) {
      console.error('Delete resource error:', error);
      showNotification('error', `❌ Failed to delete resource: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // 🆕 ADDED: Check if user is admin (you might need to adjust this based on your user structure)
  const isAdmin = user && (user.role === 'admin' || user.role === 'superadmin');

  return (
    <>
      {/* Custom Notification */}
      {notification.show && (
        <div 
          className={`alert alert-${notification.type === 'error' ? 'danger' : 'success'} alert-dismissible fade show position-fixed`}
          style={{
            top: '20px',
            right: '20px',
            zIndex: 9999,
            minWidth: '300px',
            animation: 'slideInRight 0.3s ease-out'
          }}
          role="alert"
        >
          <div className="d-flex align-items-center">
            <i className={`fas ${notification.type === 'error' ? 'fa-exclamation-triangle' : 'fa-check-circle'} me-2`}></i>
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      <div className="list-group-item list-group-item-action">
        <div className="d-flex justify-content-between align-items-start">
          <div className="flex-grow-1" style={{ cursor: 'pointer' }} onClick={handleResourceClick}>
            <div className="d-flex align-items-center mb-1">
              <i className={`${getResourceIcon()} me-2`}></i>
              <h6 className="mb-0 text-primary">{resource.title}</h6>
            </div>
            
            <p className="mb-1 text-muted small">
              {resource.description || resource.content?.substring(0, 100)}
              {resource.content && resource.content.length > 100 && '...'}
            </p>
            
            <div className="d-flex flex-wrap gap-3 mt-2">
              <small className="text-muted">
                <i className="fas fa-user me-1"></i>
                {resource.uploadedByName || resource.sharedByName || 'Unknown'}
              </small>
              <small className="text-muted">
                <i className="fas fa-clock me-1"></i>
                {/* 🆕 FIXED: Using proper date formatting */}
                {formatDate(resource.createdAt || resource.sharedAt)}
              </small>
              {resource.fileSize && (
                <small className="text-muted">
                  <i className="fas fa-hdd me-1"></i>
                  {(resource.fileSize / 1024 / 1024).toFixed(2)} MB
                </small>
              )}
            </div>
          </div>
          
          <div className="d-flex flex-column gap-1 ms-2">
            {showActions && (resource.resourceType === 'document' || resource.type === 'document' || resource.fileName) && (
              <button
                className="btn btn-outline-primary btn-sm"
                onClick={handleDownload}
                title="Download"
              >
                <i className="fas fa-download"></i>
              </button>
            )}
            
            {/* 🆕 ADDED: Delete button for admin users */}
            {isAdmin && (
              <button
                className="btn btn-outline-danger btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteModal(true);
                }}
                title="Delete Resource"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <span className="spinner-border spinner-border-sm" role="status"></span>
                ) : (
                  <i className="fas fa-trash"></i>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 🆕 ADDED: Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  Confirm Deletion
                </h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                ></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-warning">
                  <i className="fas fa-warning me-2"></i>
                  <strong>Warning:</strong> This action cannot be undone!
                </div>
                <p>Are you sure you want to delete the resource:</p>
                <div className="card bg-light">
                  <div className="card-body">
                    <strong>{resource.title}</strong>
                    <br />
                    <small className="text-muted">
                      Type: {resource.resourceType || resource.type} | 
                      Created: {formatDate(resource.createdAt || resource.sharedAt)}
                    </small>
                  </div>
                </div>
                <p className="mt-3 mb-0 text-danger">
                  <i className="fas fa-info-circle me-1"></i>
                  This will permanently remove the resource from the database.
                </p>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger" 
                  onClick={handleDeleteResource}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-trash me-2"></i>
                      Delete Permanently
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add CSS for animation */}
      <style jsx>{`
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
    </>
  );
};

export default ResourceItem;