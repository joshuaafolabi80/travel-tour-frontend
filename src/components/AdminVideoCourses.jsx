import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminVideoCourses = () => {
  // --- States ---
  const [activeTab, setActiveTab] = useState('upload');
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });
  
  // Stats
  const [videoCounts, setVideoCounts] = useState({
    totalVideos: 0,
    generalVideos: 0,
    masterclassVideos: 0
  });

  // Upload Form State
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    category: '',
    videoType: 'general',
    accessCode: '',
    accessCodeEmail: '',
    allowedEmails: '',
    isActive: true
  });
  const [selectedFile, setSelectedFile] = useState(null);

  // Filter/Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [videoTypeFilter, setVideoTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal States
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    category: '',
    isActive: true
  });

  // --- Effects ---
  useEffect(() => {
    fetchVideos();
  }, []);

  useEffect(() => {
    if (alert.show) {
      const timer = setTimeout(() => setAlert({ ...alert, show: false }), 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  // --- Functions ---
  const fetchVideos = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/videos/admin/all');
      const videoData = response.data.videos || [];
      setVideos(videoData);
      
      setVideoCounts({
        totalVideos: videoData.length,
        generalVideos: videoData.filter(v => v.videoType === 'general').length,
        masterclassVideos: videoData.filter(v => v.videoType === 'masterclass').length
      });
    } catch (error) {
      showAlert('Failed to fetch videos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (message, type) => {
    setAlert({ show: true, message, type });
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    if (!selectedFile) return showAlert('Please select a video file', 'error');
    if (uploadForm.videoType === 'masterclass' && (!uploadForm.accessCode || !uploadForm.accessCodeEmail)) {
      return showAlert('Access code and primary email are required for Masterclass videos', 'error');
    }
    setShowUploadModal(true);
  };

  const handleUpload = async () => {
    setUploading(true);
    const formData = new FormData();
    formData.append('video', selectedFile);
    formData.append('title', uploadForm.title);
    formData.append('description', uploadForm.description);
    formData.append('category', uploadForm.category);
    formData.append('videoType', uploadForm.videoType);
    formData.append('isActive', uploadForm.isActive);

    if (uploadForm.videoType === 'masterclass') {
      formData.append('accessCode', uploadForm.accessCode);
      formData.append('accessCodeEmail', uploadForm.accessCodeEmail);
      formData.append('allowedEmails', uploadForm.allowedEmails);
    }

    try {
      await axios.post('/api/videos/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showAlert('Video uploaded successfully!', 'success');
      setShowUploadModal(false);
      resetUploadForm();
      fetchVideos();
    } catch (error) {
      showAlert(error.response?.data?.message || 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const resetUploadForm = () => {
    setUploadForm({
      title: '',
      description: '',
      category: '',
      videoType: 'general',
      accessCode: '',
      accessCodeEmail: '',
      allowedEmails: '',
      isActive: true
    });
    setSelectedFile(null);
    document.getElementById('videoFile').value = '';
  };

  const openEditModal = (video) => {
    setSelectedVideo(video);
    setEditForm({
      title: video.title,
      description: video.description || '',
      category: video.category || '',
      isActive: video.isActive
    });
    setShowEditModal(true);
  };

  const handleEdit = async () => {
    try {
      await axios.put(`/api/videos/${selectedVideo._id}`, editForm);
      showAlert('Video updated successfully', 'success');
      setShowEditModal(false);
      fetchVideos();
    } catch (error) {
      showAlert('Update failed', 'error');
    }
  };

  const openDeleteModal = (video) => {
    setSelectedVideo(video);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/videos/${selectedVideo._id}`);
      showAlert('Video deleted successfully', 'success');
      setShowDeleteModal(false);
      fetchVideos();
    } catch (error) {
      showAlert('Deletion failed', 'error');
    }
  };

  // --- Filtering & Pagination Logic ---
  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         video.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = videoTypeFilter === '' || video.videoType === videoTypeFilter;
    return matchesSearch && matchesType;
  });

  const totalPages = Math.ceil(filteredVideos.length / itemsPerPage);
  const currentVideos = filteredVideos.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleItemsPerPageChange = (val) => {
    setItemsPerPage(val);
    setCurrentPage(1);
  };

  const renderPagination = () => {
    let pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <li key={i} className={`page-item ${currentPage === i ? 'active' : ''}`}>
          <button className="page-link" onClick={() => setCurrentPage(i)}>{i}</button>
        </li>
      );
    }
    return (
      <nav><ul className="pagination justify-content-center">{pages}</ul></nav>
    );
  };

  return (
    <div className="container-fluid py-4">
      {/* Custom Alert Toast */}
      {alert.show && (
        <div className={`custom-alert custom-alert-${alert.type}`}>
          <div className="alert-content">
            <span>{alert.type === 'success' ? <i className="fas fa-check-circle me-2"></i> : <i className="fas fa-exclamation-circle me-2"></i>}
            {alert.message}</span>
            <button className="alert-close" onClick={() => setAlert({ ...alert, show: false })}>&times;</button>
          </div>
        </div>
      )}

      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white py-3">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0 text-success fw-bold">
                  <i className="fas fa-video me-2"></i>Video Management System
                </h5>
                <div className="badge bg-success px-3 py-2">Administrator Access</div>
              </div>
            </div>
            
            <div className="card-body p-0">
              <ul className="nav nav-tabs nav-fill">
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'upload' ? 'active' : ''}`}
                    onClick={() => setActiveTab('upload')}
                  >
                    <i className="fas fa-upload me-2"></i>Upload New Video
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'view-videos' ? 'active' : ''}`}
                    onClick={() => setActiveTab('view-videos')}
                  >
                    <i className="fas fa-list me-2"></i>View & Manage Videos
                  </button>
                </li>
              </ul>

              <div className="p-4">
                {/* Upload Tab */}
                {activeTab === 'upload' && (
                  <div className="upload-section">
                    <div className="row">
                      <div className="col-lg-8">
                        <form onSubmit={handleUploadSubmit}>
                          <div className="row mb-3">
                            <div className="col-md-12">
                              <label className="form-label fw-bold">Video Title</label>
                              <input 
                                type="text" 
                                className="form-control" 
                                required
                                value={uploadForm.title}
                                onChange={(e) => setUploadForm({...uploadForm, title: e.target.value})}
                                placeholder="Enter a descriptive title"
                              />
                            </div>
                          </div>

                          <div className="mb-3">
                            <label className="form-label fw-bold">Description</label>
                            <textarea 
                              className="form-control" 
                              rows="3"
                              value={uploadForm.description}
                              onChange={(e) => setUploadForm({...uploadForm, description: e.target.value})}
                              placeholder="What is this video about?"
                            ></textarea>
                          </div>

                          <div className="row mb-3">
                            <div className="col-md-6">
                              <label className="form-label fw-bold">Category</label>
                              <input 
                                type="text" 
                                className="form-control" 
                                value={uploadForm.category}
                                onChange={(e) => setUploadForm({...uploadForm, category: e.target.value})}
                                placeholder="e.g. Mathematics, Science"
                              />
                            </div>
                            <div className="col-md-6">
                              <label className="form-label fw-bold">Video Type</label>
                              <select 
                                className="form-select"
                                value={uploadForm.videoType}
                                onChange={(e) => setUploadForm({...uploadForm, videoType: e.target.value})}
                              >
                                <option value="general">General (Free for All)</option>
                                <option value="masterclass">Masterclass (Access Code Required)</option>
                              </select>
                            </div>
                          </div>

                          {uploadForm.videoType === 'masterclass' && (
                            <div className="card bg-light border-warning mb-3">
                              <div className="card-body">
                                <h6 className="text-warning mb-3"><i className="fas fa-lock me-2"></i>Masterclass Access Configuration</h6>
                                <div className="row">
                                  <div className="col-md-6 mb-3">
                                    <label className="form-label fw-bold small">Access Code</label>
                                    <input 
                                      type="text" 
                                      className="form-control form-control-sm"
                                      value={uploadForm.accessCode}
                                      onChange={(e) => setUploadForm({...uploadForm, accessCode: e.target.value})}
                                      placeholder="Unique code"
                                    />
                                  </div>
                                  <div className="col-md-6 mb-3">
                                    <label className="form-label fw-bold small">Primary User Email</label>
                                    <input 
                                      type="email" 
                                      className="form-control form-control-sm"
                                      value={uploadForm.accessCodeEmail}
                                      onChange={(e) => setUploadForm({...uploadForm, accessCodeEmail: e.target.value})}
                                      placeholder="Main user email"
                                    />
                                  </div>
                                  <div className="col-12">
                                    <label className="form-label fw-bold small">Allowed Emails (Team Access)</label>
                                    <textarea 
                                      className="form-control form-control-sm"
                                      rows="2"
                                      value={uploadForm.allowedEmails}
                                      onChange={(e) => setUploadForm({...uploadForm, allowedEmails: e.target.value})}
                                      placeholder="Enter emails separated by commas or new lines for team access"
                                    ></textarea>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="mb-4">
                            <label className="form-label fw-bold">Select Video File</label>
                            <input 
                              type="file" 
                              id="videoFile"
                              className="form-control" 
                              accept="video/*"
                              onChange={handleFileChange}
                            />
                            <div className="form-text">Supported formats: MP4, WebM, Ogg (Max recommended: 500MB)</div>
                          </div>

                          <button 
                            type="submit" 
                            className="btn btn-success px-5 py-2 fw-bold"
                            disabled={uploading}
                          >
                            <i className="fas fa-cloud-upload-alt me-2"></i>
                            Proceed to Upload
                          </button>
                        </form>
                      </div>

                      <div className="col-lg-4 mt-4 mt-lg-0">
                        <div className="alert alert-warning">
                          <h6><i className="fas fa-exclamation-triangle me-2"></i>Masterclass Videos Information</h6>
                          <ul className="mb-0">
                            <li>Require access codes for user access</li>
                            <li>Each code can be used by one user only</li>
                            <li>Generate additional codes as needed</li>
                            <li>Premium content for authorized users</li>
                            <li>Same access codes as masterclass courses</li>
                            <li>Large videos may take several minutes to upload</li>
                          </ul>
                        </div>
                        <div className="card border-warning">
                          <div className="card-header bg-warning text-dark">
                            <i className="fas fa-chart-bar me-2"></i>
                            Video Statistics
                          </div>
                          <div className="card-body">
                            <p className="mb-1">
                              <strong>General Videos:</strong> {videoCounts.generalVideos}
                            </p>
                            <p className="mb-1">
                              <strong>Masterclass Videos:</strong> {videoCounts.masterclassVideos}
                            </p>
                            <p className="mb-0">
                              <strong>Total Videos:</strong> {videoCounts.totalVideos}
                            </p>
                          </div>
                        </div>
                        <div className="card bg-warning mt-3">
                          <div className="card-body">
                            <h6>Team Access Information:</h6>
                            <ul className="small mb-0">
                              <li>Use "Allowed Emails" to share access with team members</li>
                              <li>All emails can use the same access code</li>
                              <li>Primary email is still required for assignment</li>
                              <li>Perfect for companies and study groups</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* View/Edit/Delete Videos Tab */}
                {activeTab === 'view-videos' && (
                  <div className="view-videos-section">
                    <div className="row mb-4">
                      <div className="col-md-6">
                        <div className="input-group">
                          <span className="input-group-text">
                            <i className="fas fa-search"></i>
                          </span>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Search videos by title or category..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-3">
                        <select
                          className="form-select"
                          value={videoTypeFilter}
                          onChange={(e) => setVideoTypeFilter(e.target.value)}
                        >
                          <option value="">All Video Types</option>
                          <option value="general">General Videos</option>
                          <option value="masterclass">Masterclass Videos</option>
                        </select>
                      </div>
                      <div className="col-md-3">
                        <select
                          className="form-select"
                          value={itemsPerPage}
                          onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value))}
                        >
                          <option value="10">10 per page</option>
                          <option value="20">20 per page</option>
                          <option value="50">50 per page</option>
                        </select>
                      </div>
                    </div>

                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead className="table-light">
                          <tr>
                            <th>Title</th>
                            <th>Type</th>
                            <th>Category</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentVideos.length === 0 ? (
                            <tr>
                              <td colSpan="5" className="text-center py-4 text-muted">No videos found</td>
                            </tr>
                          ) : (
                            currentVideos.map((video) => (
                              <tr key={video._id}>
                                <td>
                                  <strong>{video.title}</strong>
                                  <br /><small className="text-muted">{video.description?.substring(0, 40)}...</small>
                                </td>
                                <td>
                                  <span className={`badge ${video.videoType === 'general' ? 'bg-success' : 'bg-warning'}`}>
                                    {video.videoType}
                                  </span>
                                </td>
                                <td>{video.category || 'N/A'}</td>
                                <td>
                                  <span className={`badge ${video.isActive ? 'bg-success' : 'bg-secondary'}`}>
                                    {video.isActive ? 'Active' : 'Inactive'}
                                  </span>
                                </td>
                                <td>
                                  <div className="btn-group btn-group-sm">
                                    <button className="btn btn-outline-primary" onClick={() => openEditModal(video)}><i className="fas fa-edit"></i></button>
                                    <button className="btn btn-outline-danger" onClick={() => openDeleteModal(video)}><i className="fas fa-trash"></i></button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                    {totalPages > 1 && renderPagination()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* Upload Confirmation Modal */}
      {showUploadModal && (
        <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header" style={{backgroundColor: uploadForm.videoType === 'general' ? '#28a745' : '#ffc107', color: 'white'}}>
                <h5 className="modal-title">Confirm {uploadForm.videoType} Upload</h5>
                <button type="button" className="btn-close" onClick={() => setShowUploadModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-info">
                  <p><strong>Title:</strong> {uploadForm.title}</p>
                  <p><strong>File:</strong> {selectedFile?.name}</p>
                  {uploadForm.videoType === 'masterclass' && (
                    <>
                      <p><strong>Access Code:</strong> {uploadForm.accessCode}</p>
                      <p><strong>Primary Email:</strong> {uploadForm.accessCodeEmail}</p>
                      {uploadForm.allowedEmails.trim() && (
                        <p><strong>Team Access:</strong> Emails added.</p>
                      )}
                    </>
                  )}
                </div>
                <div className="alert alert-warning">
                  <i className="fas fa-clock me-2"></i> Large videos may take several minutes.
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowUploadModal(false)} disabled={uploading}>Cancel</button>
                <button type="button" className={`btn ${uploadForm.videoType === 'general' ? 'btn-success' : 'btn-warning'}`} onClick={handleUpload} disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Start Upload'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">Edit Video</h5>
                <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Title</label>
                  <input type="text" className="form-control" value={editForm.title} onChange={(e) => setEditForm({...editForm, title: e.target.value})} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Category</label>
                  <input type="text" className="form-control" value={editForm.category} onChange={(e) => setEditForm({...editForm, category: e.target.value})} />
                </div>
                <div className="form-check form-switch">
                  <input className="form-check-input" type="checkbox" checked={editForm.isActive} onChange={(e) => setEditForm({...editForm, isActive: e.target.checked})} />
                  <label className="form-check-label">Active Status</label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="button" className="btn btn-primary" onClick={handleEdit}>Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">Delete Video</h5>
                <button type="button" className="btn-close" onClick={() => setShowDeleteModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete <strong>{selectedVideo.title}</strong>?</p>
                <p className="text-danger small">This action cannot be undone.</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                <button type="button" className="btn btn-danger" onClick={handleDelete}>Confirm Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS */}
      <style jsx>{`
        .custom-alert { position: fixed; top: 100px; right: 20px; z-index: 9999; min-width: 300px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); animation: slideInRight 0.3s ease-out; }
        .custom-alert-success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .custom-alert-error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .alert-content { padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; }
        .alert-close { background: none; border: none; color: inherit; cursor: pointer; font-size: 20px; }
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .nav-tabs .nav-link { color: #6c757d; font-weight: 500; border: none; padding: 1rem; }
        .nav-tabs .nav-link.active { color: #28a745; border-bottom: 3px solid #28a745; background: transparent; }
      `}</style>
    </div>
  );
};

export default AdminVideoCourses;