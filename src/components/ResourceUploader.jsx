// travel-tour-frontend/src/components/ResourceUploader.jsx
import React, { useState } from 'react';
import MeetApiService from '../services/meet-api';

const ResourceUploader = ({ meetingId, user, onResourceShared }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadOptions, setShowUploadOptions] = useState(false);
  const [linkForm, setLinkForm] = useState({ title: '', url: '', description: '' });
  const [textForm, setTextForm] = useState({ title: '', content: '', description: '' });

  const pickFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    // 🚫 REMOVED: Video file types (.mp4,.mov,.avi)
    input.accept = '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.gif';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        // 🚫 ADDED: Video file validation
        const fileExtension = file.name.split('.').pop().toLowerCase();
        const videoExtensions = ['mp4', 'mov', 'avi', 'wmv', 'flv', 'webm', 'mkv'];
        
        if (videoExtensions.includes(fileExtension)) {
          alert('❌ Video files are not supported to save storage space. Please upload documents, PDFs, or images instead. However you can use the "Video Courses" menu tab dedicated strictly to handle and manage your videos.');
          return;
        }

        await uploadFile(file);
      }
    };
    
    input.click();
  };

  const uploadFile = async (file) => {
    if (!meetingId || !user) {
      alert('Meeting ID or user data missing');
      return;
    }

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('meetingId', meetingId);
      formData.append('sharedBy', user.id);
      formData.append('sharedByName', user.name || user.username || 'Admin');
      formData.append('title', file.name);
      formData.append('description', `Uploaded file: ${file.name}`);

      const response = await MeetApiService.uploadFile(formData);
      
      if (response.success) {
        onResourceShared(response.resource);
        setShowUploadOptions(false);
      } else {
        alert(response.error || 'Failed to upload file');
      }
    } catch (error) {
      console.error('File upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const shareLink = async () => {
    if (!linkForm.title || !linkForm.url) {
      alert('Please provide both title and URL');
      return;
    }

    if (!meetingId || !user) {
      alert('Meeting ID or user data missing');
      return;
    }

    setIsUploading(true);
    
    try {
      const resourceData = {
        meetingId,
        type: 'link',
        title: linkForm.title,
        content: linkForm.url,
        description: linkForm.description,
        sharedBy: user.id,
        sharedByName: user.name || user.username || 'Admin'
      };

      const response = await MeetApiService.shareResource(resourceData);
      
      if (response.success) {
        onResourceShared(response.resource);
        setLinkForm({ title: '', url: '', description: '' });
        setShowUploadOptions(false);
      } else {
        alert(response.error || 'Failed to share link');
      }
    } catch (error) {
      console.error('Link share error:', error);
      alert('Failed to share link. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const shareText = async () => {
    if (!textForm.title || !textForm.content) {
      alert('Please provide both title and content');
      return;
    }

    if (!meetingId || !user) {
      alert('Meeting ID or user data missing');
      return;
    }

    setIsUploading(true);
    
    try {
      const resourceData = {
        meetingId,
        type: 'text',
        title: textForm.title,
        content: textForm.content,
        description: textForm.description,
        sharedBy: user.id,
        sharedByName: user.name || user.username || 'Admin'
      };

      const response = await MeetApiService.shareResource(resourceData);
      
      if (response.success) {
        onResourceShared(response.resource);
        setTextForm({ title: '', content: '', description: '' });
        setShowUploadOptions(false);
      } else {
        alert(response.error || 'Failed to share text');
      }
    } catch (error) {
      console.error('Text share error:', error);
      alert('Failed to share text. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const quickShare = (type, content, title) => {
    if (!meetingId || !user) return;

    const resourceData = {
      meetingId,
      type: 'text',
      title: title,
      content: content,
      description: `Quick ${type} shared by admin`,
      sharedBy: user.id,
      sharedByName: user.name || user.username || 'Admin'
    };

    MeetApiService.shareResource(resourceData)
      .then(response => {
        if (response.success) {
          onResourceShared(response.resource);
        }
      })
      .catch(error => {
        console.error('Quick share error:', error);
      });
  };

  return (
    <div>
      {/* Main Upload Button */}
      {!showUploadOptions && (
        <div className="d-grid">
          <button
            className="btn btn-primary"
            onClick={() => setShowUploadOptions(true)}
            disabled={isUploading}
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
              </>
            )}
          </button>
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
                onClick={() => setShowUploadOptions(false)}
                disabled={isUploading}
              ></button>
            </div>

            {/* 🆕 ADDED: Storage Warning */}
            <div className="alert alert-warning mb-3">
              <div className="d-flex align-items-center">
                <i className="fas fa-database me-2 text-warning"></i>
                <div>
                  <strong>Storage Notice:</strong> All resources are permanently saved. 
                  <span className="text-danger ms-1">
                    Video files are disabled to conserve storage space, however you can use the "Video Courses" menu tab dedicated strictly to handle and manage your videos.
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
                  disabled={isUploading}
                >
                  📋 Agenda
                </button>
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => quickShare('slides', 'Presentation slides and materials', 'Presentation Slides')}
                  disabled={isUploading}
                >
                  📊 Slides
                </button>
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => quickShare('notes', 'Important notes and key takeaways', 'Session Notes')}
                  disabled={isUploading}
                >
                  📖 Notes
                </button>
              </div>
            </div>

            {/* File Upload */}
            <div className="mb-3">
              <label className="form-label small text-muted">Upload File:</label>
              <button
                className="btn btn-outline-primary w-100"
                onClick={pickFile}
                disabled={isUploading}
              >
                <i className="fas fa-upload me-2"></i>
                {/* 🚫 UPDATED: Removed "Videos" from button text */}
                Choose File (PDF, Images, Documents)
              </button>
              <div className="form-text">
                {/* 🚫 UPDATED: Removed videos from supported formats */}
                Max file size: 50MB. Supported: PDF, Images, Office Documents
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
                placeholder="Link Title"
                value={linkForm.title}
                onChange={(e) => setLinkForm({ ...linkForm, title: e.target.value })}
                disabled={isUploading}
              />
              <input
                type="url"
                className="form-control form-control-sm mb-2"
                placeholder="https://example.com"
                value={linkForm.url}
                onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })}
                disabled={isUploading}
              />
              <textarea
                className="form-control form-control-sm mb-2"
                placeholder="Description (optional)"
                rows="2"
                value={linkForm.description}
                onChange={(e) => setLinkForm({ ...linkForm, description: e.target.value })}
                disabled={isUploading}
              />
              <button
                className="btn btn-success btn-sm w-100"
                onClick={shareLink}
                disabled={isUploading || !linkForm.title || !linkForm.url}
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
                placeholder="Text Title"
                value={textForm.title}
                onChange={(e) => setTextForm({ ...textForm, title: e.target.value })}
                disabled={isUploading}
              />
              <textarea
                className="form-control form-control-sm mb-2"
                placeholder="Enter your text content here..."
                rows="3"
                value={textForm.content}
                onChange={(e) => setTextForm({ ...textForm, content: e.target.value })}
                disabled={isUploading}
              />
              <textarea
                className="form-control form-control-sm mb-2"
                placeholder="Description (optional)"
                rows="2"
                value={textForm.description}
                onChange={(e) => setTextForm({ ...textForm, description: e.target.value })}
                disabled={isUploading}
              />
              <button
                className="btn btn-info btn-sm w-100"
                onClick={shareText}
                disabled={isUploading || !textForm.title || !textForm.content}
              >
                <i className="fas fa-font me-1"></i>
                Share Text
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceUploader;