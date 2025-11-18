import React, { useState, useEffect } from 'react';
import MeetApiService from '../services/meet-api';

const ResourceViewer = ({ resource, onClose }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [documentContent, setDocumentContent] = useState(null);
  const [contentType, setContentType] = useState('text');
  const [documentLoading, setDocumentLoading] = useState(false);

  // 🆕 GET API URL FROM REACT ENV
  const MEET_API_BASE_URL = process.env.REACT_APP_MEET_API_BASE_URL || 'https://travel-tour-academy-backend.onrender.com/api/meet';

  const loadResourceContent = async () => {
    if (!resource) return;
    
    try {
      setDocumentLoading(true);
      setDocumentContent(null);
      setError(null);
      console.log('📖 Loading resource content for:', resource.id);
      
      // 🆕 USE THE FIXED ENDPOINT (NOW WORKS LIKE GENERAL COURSES)
      const response = await fetch(`${MEET_API_BASE_URL}/resources/${resource.id}/view`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('📄 Resource content response:', result);
      
      if (result.success) {
        setContentType(result.contentType || 'text');
        setDocumentContent(result.content);
        console.log('✅ Resource content loaded successfully');
      } else {
        setError('Error: ' + (result.error || 'Failed to load resource'));
        console.error('❌ Resource loading failed:', result.error);
      }
      
    } catch (error) {
      console.error('❌ Error loading resource content:', error);
      setError('Error loading resource: ' + (error.message));
    } finally {
      setDocumentLoading(false);
      setIsLoading(false);
    }
  };

  const getViewerContent = () => {
    if (error) {
      return (
        <div className="alert alert-danger text-center">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
          <div className="mt-2">
            <button
              className="btn btn-outline-danger btn-sm"
              onClick={loadResourceContent}
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    if (!documentContent) {
      return (
        <div className="text-center py-5">
          <i className="fas fa-file fa-3x text-muted mb-3"></i>
          <h5>No content available</h5>
          <p className="text-muted">This resource doesn't have viewable content.</p>
          {resource.content && (
            <div className="mt-4 p-3 bg-light rounded">
              <h6>Resource Information:</h6>
              <p className="mb-0">{resource.content}</p>
            </div>
          )}
        </div>
      );
    }

    // PDF Files - View inline
    if (contentType === 'pdf') {
      return (
        <div className="h-100">
          <iframe
            src={`${MEET_API_BASE_URL}${documentContent.startsWith('/') ? documentContent : '/' + documentContent}`}
            className="w-100 h-100 border-0"
            title={resource.title}
            onLoad={() => setIsLoading(false)}
          />
        </div>
      );
    }

    // Image Files - View inline
    if (contentType === 'image') {
      return (
        <div className="text-center">
          <img
            src={`${MEET_API_BASE_URL}${documentContent.startsWith('/') ? documentContent : '/' + documentContent}`}
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

    // 🆕 HTML CONTENT - Display with enhanced justified formatting
    if (contentType === 'html') {
      return (
        <div className="p-4 h-100">
          <div className="bg-light rounded p-3 mb-3 d-flex justify-content-between align-items-center">
            <small className="text-muted">
              <i className="fas fa-info-circle me-1"></i>
              Document with professional formatting
            </small>
            <small className="text-muted">
              <i className="fas fa-file-text me-1"></i>
              {documentContent.length} characters
            </small>
          </div>
          <div 
            className="document-content-display h-100"
            style={{
              background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
              padding: '2.5rem',
              border: '1px solid #dee2e6',
              borderRadius: '0.75rem',
              overflowY: 'auto',
              wordWrap: 'break-word',
              lineHeight: '1.7',
              textAlign: 'justify',
              fontSize: '16px',
              fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
              wordSpacing: '0.1em',
              letterSpacing: '0.01em'
            }}
          >
            <div dangerouslySetInnerHTML={{ __html: documentContent }} />
          </div>
        </div>
      );
    }

    // Text content - Display with enhanced justified formatting
    if (contentType === 'text') {
      return (
        <div className="p-4 h-100">
          <div className="bg-light rounded p-3 mb-3 d-flex justify-content-between align-items-center">
            <small className="text-muted">
              <i className="fas fa-info-circle me-1"></i>
              Text document
            </small>
            <small className="text-muted">
              <i className="fas fa-file-text me-1"></i>
              {documentContent.length} characters
            </small>
          </div>
          <div 
            className="document-content-display h-100"
            style={{
              background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
              padding: '2.5rem',
              border: '1px solid #dee2e6',
              borderRadius: '0.75rem',
              overflowY: 'auto',
              wordWrap: 'break-word',
              lineHeight: '1.7',
              textAlign: 'justify',
              fontSize: '16px',
              fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
              wordSpacing: '0.1em',
              letterSpacing: '0.01em',
              whiteSpace: 'pre-wrap'
            }}
          >
            {documentContent}
          </div>
        </div>
      );
    }

    // Links - Show link information
    if (contentType === 'link') {
      return (
        <div className="text-center py-5">
          <i className="fas fa-link fa-3x text-primary mb-3"></i>
          <h5>{resource.title}</h5>
          <p className="text-muted mb-4">
            This is a web link resource.
          </p>
          <div className="d-flex gap-2 justify-content-center">
            <button
              className="btn btn-primary"
              onClick={() => window.open(documentContent, '_blank', 'noopener,noreferrer')}
            >
              <i className="fas fa-external-link-alt me-2"></i>
              Open Link
            </button>
          </div>
          <div className="mt-3">
            <small className="text-muted">
              URL: {documentContent}
            </small>
          </div>
        </div>
      );
    }

    // Default fallback - Show content in text format
    return (
      <div className="p-4 h-100">
        <h5 className="mb-3">{resource.title}</h5>
        <div 
          className="bg-light p-4 rounded h-100" 
          style={{ 
            whiteSpace: 'pre-wrap', 
            lineHeight: '1.6',
            overflowY: 'auto',
            textAlign: 'justify',
            fontSize: '16px',
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
          }}
        >
          {documentContent}
        </div>
      </div>
    );
  };

  useEffect(() => {
    loadResourceContent();
  }, [resource]);

  useEffect(() => {
    // Auto-hide loading after 5 seconds if still loading
    const timer = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [isLoading]);

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
      <div className="modal-dialog modal-xl modal-dialog-centered" style={{ maxWidth: '95%', height: '90vh' }}>
        <div className="modal-content h-100">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">
              <i className="fas fa-eye me-2"></i>
              {resource.title}
              {contentType === 'html' && (
                <span className="badge bg-success ms-2">
                  <i className="fas fa-image me-1"></i>
                  With Images
                </span>
              )}
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
                <p className="text-muted mt-2">Loading resource...</p>
              </div>
            )}
            
            {documentLoading && (
              <div className="text-center py-5">
                <div className="spinner-border text-primary mb-3" style={{width: '3rem', height: '3rem'}}>
                  <span className="visually-hidden">Loading...</span>
                </div>
                <h4 className="text-primary">Loading Document</h4>
                <p className="text-muted">Please wait while we load the document content...</p>
              </div>
            )}

            <div style={{ 
              opacity: (isLoading || documentLoading) ? 0 : 1, 
              transition: 'opacity 0.3s',
              height: '100%'
            }}>
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
  );
};

export default ResourceViewer;