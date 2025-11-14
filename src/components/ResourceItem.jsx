// travel-tour-frontend/src/components/ResourceItem.jsx
import React, { useState } from 'react';

const ResourceItem = ({ resource, user, onAccess, onDownload, showActions = false }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const getResourceIcon = (type) => {
    switch (type) {
      case 'pdf':
        return 'fas fa-file-pdf text-danger';
      case 'image':
        return 'fas fa-file-image text-success';
      case 'video':
        return 'fas fa-file-video text-primary';
      case 'document':
        return 'fas fa-file-word text-info';
      case 'presentation':
        return 'fas fa-file-powerpoint text-warning';
      case 'spreadsheet':
        return 'fas fa-file-excel text-success';
      case 'link':
        return 'fas fa-link text-primary';
      case 'text':
        return 'fas fa-file-alt text-secondary';
      default:
        return 'fas fa-file text-muted';
    }
  };

  const getFileSize = (bytes) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleView = async () => {
    if (onAccess) {
      setIsProcessing(true);
      await onAccess(resource.resourceId, 'view');
      setIsProcessing(false);
    }

    if (resource.type === 'link') {
      window.open(resource.content, '_blank', 'noopener,noreferrer');
    } else {
      // For files, open in new tab or download based on type
      window.open(resource.content, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDownload = async () => {
    if (onAccess) {
      setIsProcessing(true);
      await onAccess(resource.resourceId, 'download');
      setIsProcessing(false);
    }

    if (onDownload) {
      onDownload(resource);
    } else {
      // Fallback download
      const link = document.createElement('a');
      link.href = resource.content;
      link.download = resource.fileName || resource.title;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="list-group-item">
      <div className="d-flex align-items-start">
        {/* Resource Icon */}
        <div className="flex-shrink-0 me-3">
          <i className={`${getResourceIcon(resource.type)} fa-2x`}></i>
        </div>
        
        {/* Resource Content */}
        <div className="flex-grow-1">
          <div className="d-flex justify-content-between align-items-start mb-1">
            <h6 className="mb-0 text-break">{resource.title}</h6>
            <small className="text-muted">{formatDate(resource.sharedAt)}</small>
          </div>
          
          {resource.description && (
            <p className="small text-muted mb-1">{resource.description}</p>
          )}
          
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <small className="text-muted">
              <i className="fas fa-user me-1"></i>
              {resource.sharedByName}
            </small>
            
            {resource.fileSize && (
              <small className="text-muted">
                <i className="fas fa-weight-hanging me-1"></i>
                {getFileSize(resource.fileSize)}
              </small>
            )}
            
            {resource.accessCount > 0 && (
              <small className="text-muted">
                <i className="fas fa-eye me-1"></i>
                {resource.accessCount} views
              </small>
            )}
          </div>

          {/* Actions */}
          {showActions && (
            <div className="mt-2">
              <div className="btn-group btn-group-sm" role="group">
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={handleView}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <span className="spinner-border spinner-border-sm" role="status"></span>
                  ) : (
                    <>
                      <i className="fas fa-external-link-alt me-1"></i>
                      {resource.type === 'link' ? 'Open Link' : 'View'}
                    </>
                  )}
                </button>
                
                {(resource.type !== 'link' && resource.type !== 'text') && (
                  <button
                    type="button"
                    className="btn btn-outline-success"
                    onClick={handleDownload}
                    disabled={isProcessing}
                  >
                    <i className="fas fa-download me-1"></i>
                    Download
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Link Preview */}
          {resource.type === 'link' && !showActions && (
            <div className="mt-1">
              <a 
                href={resource.content} 
                target="_blank" 
                rel="noopener noreferrer"
                className="small text-break"
                onClick={() => onAccess && onAccess(resource.resourceId, 'view')}
              >
                {resource.content}
              </a>
            </div>
          )}

          {/* Text Preview */}
          {resource.type === 'text' && !showActions && (
            <div className="mt-1">
              <p className="small text-muted mb-0">
                {resource.content.length > 100 
                  ? `${resource.content.substring(0, 100)}...` 
                  : resource.content
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResourceItem;