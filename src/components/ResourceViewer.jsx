import React, { useState, useEffect } from 'react';

const ResourceViewer = ({ resource, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const getFileUrl = () => {
    if (resource.fileUrl) {
      // If it's a relative URL, make it absolute
      if (resource.fileUrl.startsWith('/')) {
        return `${process.env.VITE_MEET_API_BASE_URL}${resource.fileUrl}`;
      }
      return resource.fileUrl;
    }
    return null;
  };

  const getViewerContent = () => {
    const fileUrl = getFileUrl();
    
    if (!fileUrl) {
      return (
        <div className="text-center py-5">
          <i className="fas fa-file fa-3x text-muted mb-3"></i>
          <h5>No file content available</h5>
          <p className="text-muted">This resource doesn't have a downloadable file.</p>
          {resource.content && (
            <div className="mt-4 p-3 bg-light rounded">
              <h6>Resource Content:</h6>
              <p className="mb-0">{resource.content}</p>
            </div>
          )}
        </div>
      );
    }

    const fileExtension = resource.fileName?.split('.').pop()?.toLowerCase() || '';
    const mimeType = resource.mimeType || '';

    // PDF Files - View inline
    if (fileExtension === 'pdf' || mimeType === 'application/pdf') {
      return (
        <div className="h-100">
          <iframe
            src={fileUrl}
            className="w-100 h-100 border-0"
            title={resource.title}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setError('Failed to load PDF');
            }}
          />
        </div>
      );
    }

    // Image Files - View inline
    if (fileExtension.match(/(jpg|jpeg|png|gif|webp|svg)$/) || mimeType.startsWith('image/')) {
      return (
        <div className="text-center">
          <img
            src={fileUrl}
            alt={resource.title}
            className="img-fluid"
            style={{ maxHeight: '70vh' }}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setError('Failed to load image');
            }}
          />
        </div>
      );
    }

    // Text Files - View inline
    if (fileExtension.match(/(txt|csv)$/) || mimeType.startsWith('text/')) {
      return (
        <div className="h-100">
          <iframe
            src={fileUrl}
            className="w-100 h-100 border-0"
            title={resource.title}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setError('Failed to load text file');
            }}
          />
        </div>
      );
    }

    // Office Documents - Online viewing only (no downloads)
    if (fileExtension.match(/(doc|docx|xls|xlsx|ppt|pptx)$/)) {
      return (
        <div className="text-center py-5">
          <i className="fas fa-file-word fa-3x text-primary mb-3"></i>
          <h5>{resource.title}</h5>
          <p className="text-muted mb-4">
            View this document online using Microsoft Office Online viewer.
          </p>
          <div className="d-flex gap-2 justify-content-center">
            <button
              className="btn btn-primary"
              onClick={() => window.open(`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`, '_blank')}
            >
              <i className="fas fa-external-link-alt me-2"></i>
              View Online
            </button>
          </div>
          <div className="mt-3 alert alert-info">
            <small>
              <i className="fas fa-info-circle me-2"></i>
              Document opens in a new tab for viewing. Download functionality is disabled.
            </small>
          </div>
        </div>
      );
    }

    // Default fallback - Online viewing if possible
    return (
      <div className="text-center py-5">
        <i className="fas fa-file fa-3x text-info mb-3"></i>
        <h5>{resource.title}</h5>
        <p className="text-muted mb-4">
          This file type can be viewed in your browser.
        </p>
        <button
          className="btn btn-primary"
          onClick={() => window.open(fileUrl, '_blank')}
        >
          <i className="fas fa-external-link-alt me-2"></i>
          View in Browser
        </button>
      </div>
    );
  };

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
      <div className="modal-dialog modal-xl modal-dialog-centered" style={{ maxWidth: '95%', height: '90vh' }}>
        <div className="modal-content h-100">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">
              <i className="fas fa-eye me-2"></i>
              {resource.title}
              <small className="ms-2 opacity-75">(View Only)</small>
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body position-relative" style={{ minHeight: '400px' }}>
            {isLoading && (
              <div className="position-absolute top-50 start-50 translate-middle">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="text-muted mt-2">Loading document...</p>
              </div>
            )}
            
            {error && (
              <div className="alert alert-danger text-center">
                <i className="fas fa-exclamation-triangle me-2"></i>
                {error}
                <div className="mt-2">
                  <button
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => window.location.reload()}
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}

            <div style={{ opacity: isLoading ? 0 : 1, transition: 'opacity 0.3s' }}>
              {getViewerContent()}
            </div>
          </div>
          <div className="modal-footer">
            <div className="d-flex justify-content-between w-100">
              <div>
                <small className="text-muted">
                  <strong>Type:</strong> {resource.resourceType || resource.type} | 
                  <strong> Size:</strong> {resource.fileSize ? `${(resource.fileSize / 1024 / 1024).toFixed(2)} MB` : 'N/A'} |
                  <strong> Uploaded by:</strong> {resource.uploadedByName}
                </small>
              </div>
              <div className="d-flex gap-2">
                <span className="badge bg-warning text-dark">
                  <i className="fas fa-eye me-1"></i>View Only
                </span>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceViewer;