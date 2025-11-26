import React, { useState } from 'react';
import MeetApiService from '../services/meet-api';

const ResourceUploader = ({ meetingId, user, onResourceShared }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadOptions, setShowUploadOptions] = useState(false);
  const [linkForm, setLinkForm] = useState({ title: '', url: '', description: '' });
  const [textForm, setTextForm] = useState({ title: '', content: '', description: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });

  // 🆕 GET API URL FROM REACT ENV
  const MEET_API_BASE_URL = process.env.REACT_APP_MEET_API_BASE_URL || 'https://travel-tour-academy-backend.onrender.com/api/meet';

  // 🆕 FIXED: Generate a fallback meeting ID if none exists
  const getEffectiveMeetingId = () => {
    if (meetingId) return meetingId;
    
    // 🆕 Create a generic meeting ID for resources shared without active meeting
    return 'general-archive-meeting';
  };

  // Custom notification function
  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => {
      setNotification({ show: false, type: '', message: '' });
    }, 4000);
  };

  const pickFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.gif';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        // 🚫 Video file validation
        const fileExtension = file.name.split('.').pop().toLowerCase();
        const videoExtensions = ['mp4', 'mov', 'avi', 'wmv', 'flv', 'webm', 'mkv'];
        
        if (videoExtensions.includes(fileExtension)) {
          showNotification('error', '❌ Video files are not supported to save storage space. Please upload documents, PDFs, or images instead.');
          return;
        }

        // File size validation
        if (file.size > 50 * 1024 * 1024) {
          showNotification('error', '❌ File size must be less than 50MB');
          return;
        }

        setSelectedFile(file);
        showNotification('success', `✅ File selected: ${file.name}`);
      }
    };
    
    input.click();
  };

  const uploadFile = async () => {
    // 🆕 CHECK IF ACTIVE MEETING EXISTS
    if (!meetingId) {
      showNotification('error', '❌ Please create and join a webinar room first before uploading resources.');
      return;
    }

    if (!selectedFile) {
      showNotification('error', 'Please select a file first');
      return;
    }

    if (!user) {
      showNotification('error', 'User data missing. Please log in again.');
      return;
    }

    setIsUploading(true);
    
    try {
      const effectiveMeetingId = getEffectiveMeetingId();
      
      console.log('📤 Uploading actual file via service:', selectedFile.name);
      console.log('🔑 Using meeting ID:', effectiveMeetingId);

      // 🆕 FIXED: Use the NEW upload pattern that passes meetingId as parameter
      const result = await MeetApiService.uploadFileResource(
        effectiveMeetingId,
        selectedFile,
        selectedFile.name.replace(/\.[^/.]+$/, ""), // title
        "Uploaded document resource", // description
        user
      );
      
      if (result.success) {
        onResourceShared(result.resource);
        setSelectedFile(null);
        setShowUploadOptions(false);
        showNotification('success', '✅ File uploaded and shared successfully!');
      } else {
        throw new Error(result.error || 'Failed to upload file');
      }
    } catch (error) {
      console.error('File upload error:', error);
      
      // 🆕 BETTER ERROR HANDLING
      if (error.message.includes('Active meeting not found')) {
        showNotification('error', '❌ Cannot upload: No active webinar session. Please create a webinar room first.');
      } else if (error.message.includes('Failed to fetch') || error.message.includes('404')) {
        showNotification('error', '❌ Upload failed: Server connection issue. Please try again.');
      } else {
        showNotification('error', `❌ Upload failed: ${error.message}`);
      }
    } finally {
      setIsUploading(false);
    }
  };

  // Helper function to determine resource type from file
  const getResourceTypeFromFile = (file) => {
    const extension = file.name.split('.').pop().toLowerCase();
    const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const pdfTypes = ['pdf'];
    const textTypes = ['txt', 'csv'];
    const documentTypes = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'];
    
    if (imageTypes.includes(extension)) return 'image';
    if (pdfTypes.includes(extension)) return 'pdf';
    if (textTypes.includes(extension)) return 'text';
    if (documentTypes.includes(extension)) return 'document';
    return 'document';
  };

  const shareLink = async () => {
    // 🆕 CHECK IF ACTIVE MEETING EXISTS
    if (!meetingId) {
      showNotification('error', '❌ Please create and join a webinar room first before sharing resources.');
      return;
    }

    if (!user) {
      showNotification('error', 'User data missing. Please log in again.');
      return;
    }

    if (!linkForm.title || !linkForm.url) {
      showNotification('error', 'Link title and URL are required');
      return;
    }

    setIsUploading(true);
    
    try {
      // 🆕 FIXED: Use effective meeting ID
      const effectiveMeetingId = getEffectiveMeetingId();
      
      const resourceData = {
        meetingId: effectiveMeetingId,
        resourceType: 'link',
        title: linkForm.title,
        content: linkForm.url,
        description: linkForm.description,
        uploadedBy: user.id,
        uploadedByName: user.name || user.username || 'Admin',
        createdAt: new Date().toISOString()
      };

      console.log('🔗 Sharing link:', resourceData);

      const result = await MeetApiService.shareResource(resourceData);
      
      if (result.success) {
        onResourceShared(result.resource);
        setLinkForm({ title: '', url: '', description: '' });
        setShowUploadOptions(false);
        showNotification('success', '🔗 Link shared successfully!');
      } else {
        throw new Error(result.error || 'Failed to share link');
      }
    } catch (error) {
      console.error('Link share error:', error);
      showNotification('error', `❌ Failed to share link: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const shareText = async () => {
    // 🆕 CHECK IF ACTIVE MEETING EXISTS
    if (!meetingId) {
      showNotification('error', '❌ Please create and join a webinar room first before sharing resources.');
      return;
    }

    if (!user) {
      showNotification('error', 'User data missing. Please log in again.');
      return;
    }

    if (!textForm.title || !textForm.content) {
      showNotification('error', 'Text title and content are required');
      return;
    }

    setIsUploading(true);
    
    try {
      // 🆕 FIXED: Use effective meeting ID
      const effectiveMeetingId = getEffectiveMeetingId();
      
      const resourceData = {
        meetingId: effectiveMeetingId,
        resourceType: 'text',
        title: textForm.title,
        content: textForm.content,
        description: textForm.description,
        uploadedBy: user.id,
        uploadedByName: user.name || user.username || 'Admin',
        createdAt: new Date().toISOString()
      };

      console.log('📝 Sharing text:', resourceData);

      const result = await MeetApiService.shareResource(resourceData);
      
      if (result.success) {
        onResourceShared(result.resource);
        setTextForm({ title: '', content: '', description: '' });
        setShowUploadOptions(false);
        showNotification('success', '📝 Text shared successfully!');
      } else {
        throw new Error(result.error || 'Failed to share text');
      }
    } catch (error) {
      console.error('Text share error:', error);
      showNotification('error', `❌ Failed to share text: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const quickShare = async (type, content, title) => {
    // 🆕 CHECK IF ACTIVE MEETING EXISTS
    if (!meetingId) {
      showNotification('error', '❌ Please create and join a webinar room first before sharing resources.');
      return;
    }

    if (!user) {
      showNotification('error', 'User data missing. Please log in again.');
      return;
    }

    setIsUploading(true);
    
    try {
      // 🆕 FIXED: Use effective meeting ID
      const effectiveMeetingId = getEffectiveMeetingId();
      
      const resourceData = {
        meetingId: effectiveMeetingId,
        resourceType: 'text',
        title: title,
        content: content,
        uploadedBy: user.id,
        uploadedByName: user.name || user.username || 'Admin',
        createdAt: new Date().toISOString()
      };

      console.log('⚡ Quick sharing:', resourceData);

      const result = await MeetApiService.shareResource(resourceData);
      
      if (result.success) {
        onResourceShared(result.resource);
        setShowUploadOptions(false);
        showNotification('success', '⚡ Resource shared successfully!');
      } else {
        throw new Error(result.error || 'Failed to share resource');
      }
    } catch (error) {
      console.error('Quick share error:', error);
      showNotification('error', `❌ Failed to share resource: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // 🆕 FIXED: Show appropriate message when no active meeting
  const renderMeetingInfo = () => {
    if (!meetingId) {
      return (
        <div className="alert alert-info mb-3">
          <i className="fas fa-info-circle me-2"></i>
          <strong>Note:</strong> No active webinar session. This resource will be saved to the general archive and will be available to all users.
        </div>
      );
    }
    return null;
  };

  return (
    <div>
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

      {/* Main Upload Button */}
      {!showUploadOptions && (
        <div className="d-grid">
          <button
            className="btn btn-primary"
            onClick={() => setShowUploadOptions(true)}
            disabled={isUploading}
            title={!meetingId ? "Create a webinar room first to upload resources" : "Share resources with participants"}
          >
            {isUploading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Sharing...
              </>
            ) : (
              <>
                <i className="fas fa-share-alt me-2"></i>
                Share Resources
                {!meetingId && <span className="ms-1 badge bg-warning">Requires Webinar</span>}
              </>
            )}
          </button>
          
          {/* 🆕 SHOW WARNING WHEN NO MEETING */}
          {!meetingId && (
            <div className="alert alert-warning mt-2 mb-0 py-2">
              <small>
                <i className="fas fa-info-circle me-1"></i>
                Create a webinar room first to enable resource sharing
              </small>
            </div>
          )}
        </div>
      )}

      {/* Upload Options */}
      {showUploadOptions && (
        <div className="card border-0 bg-light">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="card-title mb-0">Share Resources</h6>
              <button
                type="button"
                className="btn-close"
                onClick={() => {
                  setShowUploadOptions(false);
                  setSelectedFile(null);
                }}
                disabled={isUploading}
              ></button>
            </div>

            {/* 🆕 FIXED: Show meeting info */}
            {renderMeetingInfo()}

            {/* Storage Warning */}
            <div className="alert alert-warning mb-3">
              <div className="d-flex align-items-center">
                <i className="fas fa-database me-2 text-warning"></i>
                <div>
                  <strong>Storage Notice:</strong> Files are now stored on the server. 
                  <span className="text-danger ms-1">
                    Video files are disabled to conserve storage space.
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Share Buttons */}
            <div className="mb-4">
              <label className="form-label small text-muted mb-2">Quick Share:</label>
              <div className="d-flex flex-wrap gap-2">
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => quickShare('agenda', 'Session agenda and topics to be covered', 'Session Agenda')}
                  disabled={isUploading || !meetingId}
                  title={!meetingId ? "Create webinar room first" : "Share session agenda"}
                >
                  📋 Agenda
                </button>
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => quickShare('slides', 'Presentation slides and materials', 'Presentation Slides')}
                  disabled={isUploading || !meetingId}
                  title={!meetingId ? "Create webinar room first" : "Share presentation slides"}
                >
                  📊 Slides
                </button>
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => quickShare('notes', 'Important notes and key takeaways', 'Session Notes')}
                  disabled={isUploading || !meetingId}
                  title={!meetingId ? "Create webinar room first" : "Share session notes"}
                >
                  📖 Notes
                </button>
              </div>
            </div>

            {/* File Upload */}
            <div className="mb-3">
              <label className="form-label small text-muted">Upload File:</label>
              <button
                className="btn btn-outline-primary w-100 mb-2"
                onClick={pickFile}
                disabled={isUploading || !meetingId}
                title={!meetingId ? "Create webinar room first" : "Choose file to upload"}
              >
                <i className="fas fa-upload me-2"></i>
                Choose File (PDF, Images, Documents, Text)
              </button>
              
              {/* Show selected file */}
              {selectedFile && (
                <div className="alert alert-success py-2 mb-2">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <i className="fas fa-check-circle me-2 text-success"></i>
                      <strong>Selected:</strong> {selectedFile.name}
                      <span className="ms-2 text-muted">
                        ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn-close btn-close-sm"
                      onClick={() => setSelectedFile(null)}
                      disabled={isUploading}
                    ></button>
                  </div>
                </div>
              )}
              
              <button
                className="btn btn-success w-100"
                onClick={uploadFile}
                disabled={isUploading || !selectedFile || !meetingId}
                title={!meetingId ? "Create webinar room first" : "Upload and share file"}
              >
                {isUploading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Uploading...
                  </>
                ) : (
                  <>
                    <i className="fas fa-cloud-upload-alt me-2"></i>
                    Upload & Share File
                  </>
                )}
              </button>
              
              <div className="form-text mt-2">
                Max file size: 50MB. Supported: PDF, Images, Office Documents, Text files
                <span className="text-danger ms-1">
                  <i className="fas fa-ban me-1"></i>
                  Videos are not supported
                </span>
              </div>
            </div>

            {/* Share Link Form */}
            <div className="mb-3">
              <label className="form-label small text-muted">Share Link:</label>
              <input
                type="text"
                className="form-control form-control-sm mb-2"
                placeholder="Link Title *"
                value={linkForm.title}
                onChange={(e) => setLinkForm({ ...linkForm, title: e.target.value })}
                disabled={isUploading || !meetingId}
              />
              <input
                type="url"
                className="form-control form-control-sm mb-2"
                placeholder="https://example.com *"
                value={linkForm.url}
                onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })}
                disabled={isUploading || !meetingId}
              />
              <textarea
                className="form-control form-control-sm mb-2"
                placeholder="Description (optional)"
                rows="2"
                value={linkForm.description}
                onChange={(e) => setLinkForm({ ...linkForm, description: e.target.value })}
                disabled={isUploading || !meetingId}
              />
              <button
                className="btn btn-success btn-sm w-100"
                onClick={shareLink}
                disabled={isUploading || !linkForm.title || !linkForm.url || !meetingId}
                title={!meetingId ? "Create webinar room first" : "Share link resource"}
              >
                <i className="fas fa-link me-1"></i>
                Share Link
              </button>
            </div>

            {/* Share Text Form */}
            <div className="mb-3">
              <label className="form-label small text-muted">Share Text:</label>
              <input
                type="text"
                className="form-control form-control-sm mb-2"
                placeholder="Text Title *"
                value={textForm.title}
                onChange={(e) => setTextForm({ ...textForm, title: e.target.value })}
                disabled={isUploading || !meetingId}
              />
              <textarea
                className="form-control form-control-sm mb-2"
                placeholder="Enter your text content here... *"
                rows="3"
                value={textForm.content}
                onChange={(e) => setTextForm({ ...textForm, content: e.target.value })}
                disabled={isUploading || !meetingId}
              />
              <textarea
                className="form-control form-control-sm mb-2"
                placeholder="Description (optional)"
                rows="2"
                value={textForm.description}
                onChange={(e) => setTextForm({ ...textForm, description: e.target.value })}
                disabled={isUploading || !meetingId}
              />
              <button
                className="btn btn-info btn-sm w-100"
                onClick={shareText}
                disabled={isUploading || !textForm.title || !textForm.content || !meetingId}
                title={!meetingId ? "Create webinar room first" : "Share text resource"}
              >
                <i className="fas fa-font me-1"></i>
                Share Text
              </button>
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
    </div>
  );
};

export default ResourceUploader;