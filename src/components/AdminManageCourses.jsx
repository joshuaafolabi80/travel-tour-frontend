import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminManageCourses = () => {
  // --- State Management ---
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [alert, setAlert] = useState(null);
  
  // NEW: Added search/filter states from old version
  const [searchTerm, setSearchTerm] = useState('');
  const [courseTypeFilter, setCourseTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [error, setError] = useState('');

  // Modals visibility
  const [showAccessCodeModal, setShowAccessCodeModal] = useState(false);
  const [showGeneralQuestionsModal, setShowGeneralQuestionsModal] = useState(false);
  const [showMasterclassQuestionsModal, setShowMasterclassQuestionsModal] = useState(false);

  // Form States
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [accessCodes, setAccessCodes] = useState([]);
  const [generatedAccessCode, setGeneratedAccessCode] = useState('');
  const [uploadingQuestions, setUploadingQuestions] = useState(false);

  // --- Whitelist & Access Code Form State ---
  const [accessCodeForm, setAccessCodeForm] = useState({
    userEmail: '',
    userName: '',
    allowedEmails: '', 
    maxUsageCount: 1,
    lifetimeAccess: false
  });

  const [questionForm, setQuestionForm] = useState({
    title: '',
    description: '',
    questions: Array(20).fill({
      questionText: '',
      options: ['', '', '', ''],
      correctOptionIndex: 0,
      explanation: ''
    })
  });

  // --- Effects ---
  useEffect(() => {
    fetchCourses();
  }, [currentPage, itemsPerPage, courseTypeFilter]); // Added dependencies from old version

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  // --- FIXED API Calls ---
  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Use the OLD version's endpoint structure with query parameters
      const res = await axios.get('/admin/courses', { // CHANGED: from /api/admin/courses to /admin/courses
        params: {
          page: currentPage,
          limit: itemsPerPage,
          courseType: courseTypeFilter || '',
          search: searchTerm
        }
      });
      
      console.log('Courses API Response:', res.data); // Debug log
      
      // Use the OLD version's data structure handling
      if (res.data.success) {
        setCourses(res.data.courses || []);
        // Set total items from stats or totalCount
        setTotalItems(res.data.stats?.total || res.data.totalCount || 0);
      } else {
        setError('Failed to load courses data');
        setCourses([]);
      }
      
      setLoading(false);
    } catch (err) {
      console.error("Fetch error:", err);
      setError('Failed to load courses. Please try again later.');
      setCourses([]);
      setLoading(false);
    }
  };

  // NEW: Filter courses function from old version
  const filterCourses = () => {
    let filtered = courses;
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(course =>
        course.title?.toLowerCase().includes(term) ||
        course.description?.toLowerCase().includes(term) ||
        course.fileName?.toLowerCase().includes(term)
      );
    }
    
    if (courseTypeFilter) {
      filtered = filtered.filter(course => course.courseType === courseTypeFilter);
    }
    
    return filtered;
  };

  // NEW: Pagination functions from old version
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <li key={i} className={`page-item ${currentPage === i ? 'active' : ''}`}>
          <button className="page-link" onClick={() => handlePageChange(i)}>
            {i}
          </button>
        </li>
      );
    }

    return (
      <nav aria-label="Courses pagination">
        <ul className="pagination justify-content-center">
          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
            <button
              className="page-link"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>
          </li>
          
          {startPage > 1 && (
            <>
              <li className="page-item">
                <button className="page-link" onClick={() => handlePageChange(1)}>1</button>
              </li>
              {startPage > 2 && <li className="page-item disabled"><span className="page-link">...</span></li>}
            </>
          )}
          
          {pages}
          
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <li className="page-item disabled"><span className="page-link">...</span></li>}
              <li className="page-item">
                <button className="page-link" onClick={() => handlePageChange(totalPages)}>{totalPages}</button>
              </li>
            </>
          )}
          
          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
            <button
              className="page-link"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </li>
        </ul>
      </nav>
    );
  };

  const showAlert = (type, message) => {
    setAlert({ type, message });
  };

  const handleOpenAccessModal = async (course) => {
    setSelectedCourse(course);
    setGeneratedAccessCode('');
    setAccessCodeForm({
      userEmail: '',
      userName: '',
      allowedEmails: '',
      maxUsageCount: 1,
      lifetimeAccess: false
    });
    setShowAccessCodeModal(true);
    try {
      // Use OLD version's endpoint
      const res = await axios.get(`/admin/courses/${course._id}/access-codes`);
      // Ensure accessCodes is always an array
      setAccessCodes(Array.isArray(res.data.accessCodes) ? res.data.accessCodes : []);
    } catch (err) {
      showAlert('danger', 'Could not load access codes');
      setAccessCodes([]);
    }
  };

  const generateAccessCodeForUser = async () => {
    try {
      const emailList = accessCodeForm.allowedEmails 
        ? accessCodeForm.allowedEmails.split(',').map(e => e.trim()).filter(e => e !== "")
        : [];

      const payload = {
        ...accessCodeForm,
        allowedEmails: emailList 
      };

      // Use OLD version's endpoint
      const res = await axios.post(`/admin/courses/${selectedCourse._id}/generate-access-code-for-user`, payload);
      setGeneratedAccessCode(res.data.accessCode);
      
      // Refresh access codes
      const updatedCodes = await axios.get(`/admin/courses/${selectedCourse._id}/access-codes`);
      setAccessCodes(Array.isArray(updatedCodes.data.accessCodes) ? updatedCodes.data.accessCodes : []);
      showAlert('success', 'Access code generated and whitelist updated!');
    } catch (err) {
      showAlert('danger', err.response?.data?.message || 'Error generating code');
    }
  };

  const deleteAccessCode = async (codeId) => {
    if (!window.confirm('Delete this access code? This will revoke access for all associated emails.')) return;
    try {
      // Use OLD version's endpoint
      await axios.delete(`/admin/access-codes/${codeId}`);
      setAccessCodes(accessCodes.filter(c => c._id !== codeId));
      showAlert('success', 'Code deleted');
    } catch (err) {
      showAlert('danger', 'Failed to delete code');
    }
  };

  const uploadQuestions = async () => {
    setUploadingQuestions(true);
    try {
      const type = showMasterclassQuestionsModal ? 'masterclass' : 'general';
      // Use OLD version's endpoint structure
      const endpoint = type === 'general' 
        ? '/admin/upload-general-questions'
        : '/admin/upload-masterclass-questions';
      
      await axios.post(endpoint, {
        ...questionForm,
        courseType: type
      });
      showAlert('success', 'Questions uploaded successfully!');
      setShowGeneralQuestionsModal(false);
      setShowMasterclassQuestionsModal(false);
      resetQuestionForm();
    } catch (err) {
      showAlert('danger', 'Error uploading questions');
    } finally {
      setUploadingQuestions(false);
    }
  };

  const resetQuestionForm = () => {
    setQuestionForm({
      title: '',
      description: '',
      questions: Array(20).fill({
        questionText: '',
        options: ['', '', '', ''],
        correctOptionIndex: 0,
        explanation: ''
      })
    });
  };

  const renderQuestionInput = (index) => {
    const q = questionForm.questions[index];
    const updateQuestion = (field, value) => {
      const newQuestions = [...questionForm.questions];
      newQuestions[index] = { ...newQuestions[index], [field]: value };
      setQuestionForm({ ...questionForm, questions: newQuestions });
    };

    const updateOption = (optIndex, value) => {
      const newQuestions = [...questionForm.questions];
      const newOptions = [...newQuestions[index].options];
      newOptions[optIndex] = value;
      newQuestions[index].options = newOptions;
      setQuestionForm({ ...questionForm, questions: newQuestions });
    };

    return (
      <div key={index} className="card mb-4 question-card shadow-sm border-start border-4 border-info">
        <div className="card-header bg-light">
          <span className="fw-bold">Question {index + 1}</span>
        </div>
        <div className="card-body">
          <textarea 
            className="form-control mb-3" 
            placeholder="Enter question text..." 
            value={q.questionText}
            onChange={(e) => updateQuestion('questionText', e.target.value)}
          />
          <div className="row">
            {q.options.map((opt, i) => (
              <div className="col-md-6 mb-2" key={i}>
                <div className="input-group">
                  <span className="input-group-text">{String.fromCharCode(65 + i)}</span>
                  <input type="text" className="form-control" value={opt} onChange={(e) => updateOption(i, e.target.value)} placeholder={`Option ${String.fromCharCode(65 + i)}`} />
                  <div className="input-group-text">
                    <input type="radio" name={`correct-${index}`} checked={q.correctOptionIndex === i} onChange={() => updateQuestion('correctOptionIndex', i)} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <input type="text" className="form-control form-control-sm mt-2" placeholder="Explanation (Optional)" value={q.explanation} onChange={(e) => updateQuestion('explanation', e.target.value)} />
        </div>
      </div>
    );
  };

  // Get filtered courses for display
  const filteredCourses = filterCourses();

  return (
    <div className="container-fluid py-4">
      {alert && (
        <div className={`custom-alert custom-alert-${alert.type}`}>
          <div className="alert-content">
            <span>{alert.message}</span>
            <button className="alert-close" onClick={() => setAlert(null)}>&times;</button>
          </div>
        </div>
      )}

      {/* Header Section from OLD version */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card text-white shadow-lg" style={{backgroundColor: '#17a2b8'}}>
            <div className="card-body py-4">
              <div className="row align-items-center">
                <div className="col-md-8">
                  <h1 className="display-5 fw-bold mb-2">
                    <i className="fas fa-book me-3"></i>
                    Manage Courses - Admin Dashboard
                  </h1>
                  <p className="lead mb-0 opacity-75">Upload and manage general and masterclass courses</p>
                </div>
                <div className="col-md-4 text-md-end">
                  <div className="bg-white rounded p-3 d-inline-block" style={{color: '#17a2b8'}}>
                    <h4 className="mb-0 fw-bold">{totalItems}</h4>
                    <small>Total Courses</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation from OLD version */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm border-0">
            <div className="card-body p-0">
              <ul className="nav nav-tabs nav-justified" id="coursesTab" role="tablist">
                <li className="nav-item" role="presentation">
                  <button
                    className={`nav-link ${activeTab === 'view-courses' ? 'active' : ''}`}
                    onClick={() => setActiveTab('view-courses')}
                  >
                    <i className="fas fa-list me-2"></i>View/Edit/Delete Courses
                  </button>
                </li>
                {/* Add other tabs as needed from old version */}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Error state from OLD version */}
      {error && (
        <div className="row justify-content-center mb-4">
          <div className="col-12 col-md-8 col-lg-6">
            <div className="alert alert-danger d-flex align-items-center" role="alert">
              <i className="fas fa-exclamation-triangle fa-2x me-3"></i>
              <div>
                <h4 className="alert-heading">Oops! Something went wrong</h4>
                <p className="mb-0">{error}</p>
                <button className="btn btn-outline-danger mt-2" onClick={fetchCourses}>
                  <i className="fas fa-redo me-2"></i>Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card shadow-lg border-0">
        <div className="card-body">
          {/* View Courses Tab Content */}
          {activeTab === 'view-courses' && (
            <div className="view-courses-section">
              {/* Search and Filter Controls from OLD version */}
              <div className="row mb-4">
                <div className="col-md-6">
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="fas fa-search"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search courses by title, description, or filename..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && fetchCourses()}
                    />
                  </div>
                </div>
                <div className="col-md-3">
                  <select
                    className="form-select"
                    value={courseTypeFilter}
                    onChange={(e) => {
                      setCourseTypeFilter(e.target.value);
                      setCurrentPage(1); // Reset to first page when filter changes
                    }}
                  >
                    <option value="">All Course Types</option>
                    <option value="general">General Courses</option>
                    <option value="masterclass">Masterclass Courses</option>
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
                    <option value="100">100 per page</option>
                  </select>
                </div>
              </div>

              {/* Courses Table */}
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary mb-3" style={{width: '3rem', height: '3rem', color: '#17a2b8'}}>
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <h4 className="text-primary" style={{color: '#17a2b8'}}>Loading Courses Data...</h4>
                  <p className="text-muted">Fetching courses information</p>
                </div>
              ) : (
                <>
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead className="table-light">
                        <tr>
                          <th>Title</th>
                          <th>Type</th>
                          <th>File Name</th>
                          <th>Uploaded</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCourses.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="text-center py-4">
                              <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
                              <h5 className="text-muted">No courses found</h5>
                              <p className="text-muted">Try adjusting your search or filters</p>
                            </td>
                          </tr>
                        ) : (
                          filteredCourses.map((course) => (
                            <tr key={course._id}>
                              <td>
                                <strong>{course.title}</strong>
                                <br />
                                <small className="text-muted">{course.description?.substring(0, 50)}...</small>
                              </td>
                              <td>
                                <span className={`badge ${
                                  course.courseType === 'general' ? 'bg-info' : 'bg-warning'
                                }`}>
                                  {course.courseType}
                                </span>
                              </td>
                              <td>
                                <small>
                                  <i className="fas fa-file me-1"></i>
                                  {course.fileName}
                                </small>
                                <br />
                                <small className="text-muted">({course.fileSize ? (course.fileSize / 1024).toFixed(1) : 0} KB)</small>
                              </td>
                              <td>
                                <small>
                                  {course.uploadedAt 
                                    ? new Date(course.uploadedAt).toLocaleDateString()
                                    : course.createdAt 
                                      ? new Date(course.createdAt).toLocaleDateString()
                                      : 'Date not available'
                                  }
                                </small>
                              </td>
                              <td>
                                <span className={`badge ${course.isActive ? 'bg-success' : 'bg-secondary'}`}>
                                  {course.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td>
                                <div className="btn-group btn-group-sm">
                                  {course.courseType === 'masterclass' && (
                                    <button
                                      className="btn btn-outline-warning"
                                      onClick={() => handleOpenAccessModal(course)}
                                      title="Manage Access Codes"
                                    >
                                      <i className="fas fa-key"></i>
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="row mt-4">
                      <div className="col-12">
                        {renderPagination()}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Access Code & Whitelist Modal */}
      {showAccessCodeModal && (
        <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.6)'}}>
          <div className="modal-dialog modal-xl modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title">Whitelist & Access Codes: {selectedCourse?.title}</h5>
                <button className="btn-close btn-close-white" onClick={() => setShowAccessCodeModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-5 border-end">
                    <h6>Generate Access for Whitelist</h6>
                    <div className="mb-3">
                      <label className="form-label small fw-bold">Primary User Email</label>
                      <input type="email" className="form-control" value={accessCodeForm.userEmail} onChange={(e) => setAccessCodeForm({...accessCodeForm, userEmail: e.target.value})} placeholder="e.g. admin@school.com" />
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-bold">Additional Whitelisted Emails (Comma separated)</label>
                      <textarea 
                        className="form-control" 
                        rows="4" 
                        value={accessCodeForm.allowedEmails} 
                        onChange={(e) => setAccessCodeForm({...accessCodeForm, allowedEmails: e.target.value})} 
                        placeholder="student1@gmail.com, student2@gmail.com..."
                      />
                      <small className="text-muted">Only these emails will be allowed to use the generated code.</small>
                    </div>
                    <div className="row">
                        <div className="col-6">
                            <label className="form-label small fw-bold">Usage Limit</label>
                            <select className="form-select" value={accessCodeForm.maxUsageCount} onChange={(e) => setAccessCodeForm({...accessCodeForm, maxUsageCount: parseInt(e.target.value)})}>
                                <option value="1">1 Use</option>
                                <option value="10">10 Uses</option>
                                <option value="100">100 Uses</option>
                                <option value="9999">Unlimited</option>
                            </select>
                        </div>
                        <div className="col-6 pt-4">
                            <div className="form-check">
                                <input className="form-check-input" type="checkbox" checked={accessCodeForm.lifetimeAccess} onChange={(e) => setAccessCodeForm({...accessCodeForm, lifetimeAccess: e.target.checked})} id="lifetime" />
                                <label className="form-check-label" htmlFor="lifetime">Lifetime</label>
                            </div>
                        </div>
                    </div>
                    <button className="btn btn-success w-100 mt-3" onClick={generateAccessCodeForUser} disabled={!accessCodeForm.userEmail}>
                      Generate & Whitelist
                    </button>
                    {generatedAccessCode && (
                        <div className="alert alert-success mt-3 text-center">
                            <small className="d-block">Copy this code:</small>
                            <strong className="fs-4">{generatedAccessCode}</strong>
                        </div>
                    )}
                  </div>

                  <div className="col-md-7">
                    <h6>Active Whitelists</h6>
                    <div className="table-responsive">
                      <table className="table table-sm align-middle">
                        <thead>
                          <tr className="small text-muted">
                            <th>Code</th>
                            <th>Whitelisted Emails</th>
                            <th>Usage</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.isArray(accessCodes) && accessCodes.map(code => (
                            <tr key={code._id}>
                              <td><code>{code.code}</code></td>
                              <td>
                                <div className="small text-truncate" style={{maxWidth: '200px'}}>
                                  {code.assignedEmail}
                                  {code.allowedEmails?.length > 0 && `, ${code.allowedEmails.join(', ')}`}
                                </div>
                              </td>
                              <td>{code.currentUsageCount || 0}/{code.maxUsageCount || 1}</td>
                              <td>
                                <button className="btn btn-sm btn-outline-danger" onClick={() => deleteAccessCode(code._id)}><i className="fas fa-trash"></i></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* General Questions Modal */}
      {showGeneralQuestionsModal && (
        <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.6)'}}>
          <div className="modal-dialog modal-xl modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header bg-info text-white">
                <h5 className="modal-title">Bulk Upload General: {selectedCourse?.courseCode}</h5>
                <button className="btn-close btn-close-white" onClick={() => setShowGeneralQuestionsModal(false)}></button>
              </div>
              <div className="modal-body bg-light">
                <input type="text" className="form-control mb-3" placeholder="Question Set Title" value={questionForm.title} onChange={e => setQuestionForm({...questionForm, title: e.target.value})} />
                <div className="questions-container">
                  {questionForm.questions.map((_, index) => renderQuestionInput(index))}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-info text-white" onClick={uploadQuestions} disabled={uploadingQuestions}>
                  {uploadingQuestions ? 'Uploading...' : 'Upload 20 Questions'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Masterclass Questions Modal */}
      {showMasterclassQuestionsModal && (
        <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.6)'}}>
          <div className="modal-dialog modal-xl modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header bg-warning text-dark">
                <h5 className="modal-title">Bulk Upload Masterclass: {selectedCourse?.courseCode}</h5>
                <button className="btn-close" onClick={() => setShowMasterclassQuestionsModal(false)}></button>
              </div>
              <div className="modal-body bg-light">
                <input type="text" className="form-control mb-3" placeholder="Masterclass Set Title" value={questionForm.title} onChange={e => setQuestionForm({...questionForm, title: e.target.value})} />
                <div className="questions-container">
                  {questionForm.questions.map((_, index) => renderQuestionInput(index))}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-warning" onClick={uploadQuestions} disabled={uploadingQuestions}>
                  {uploadingQuestions ? 'Uploading...' : 'Upload 20 Questions'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-alert { position: fixed; top: 20px; right: 20px; z-index: 10000; min-width: 300px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .custom-alert-success { background: #d1e7dd; color: #0f5132; border: 1px solid #badbcc; }
        .custom-alert-danger { background: #f8d7da; color: #842029; border: 1px solid #f5c2c7; }
        .alert-content { padding: 12px 16px; display: flex; align-items-center; justify-content: space-between; }
        .alert-close { background: none; border: none; font-size: 1.2rem; cursor: pointer; color: inherit; }
        .questions-container { max-height: 70vh; overflow-y: auto; padding-right: 10px; }
        
        .nav-tabs .nav-link {
          color: #6c757d;
          font-weight: 500;
          border: none;
          padding: 1rem 1.5rem;
        }
        
        .nav-tabs .nav-link.active {
          color: #17a2b8;
          border-bottom: 3px solid #17a2b8;
          background: transparent;
        }
        
        .table-hover tbody tr:hover {
          background-color: rgba(23, 162, 184, 0.05);
        }
      `}</style>
    </div>
  );
};

export default AdminManageCourses;