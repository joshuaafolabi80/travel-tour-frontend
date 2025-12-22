import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Configure axios with the correct base URL
const api = axios.create({
  baseURL: 'https://travel-tour-academy-backend.onrender.com/api', // CHANGE THIS to your actual backend URL
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request interceptor for auth tokens
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const AdminManageCourses = () => {
  // --- State Management ---
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('view-courses');
  const [alert, setAlert] = useState(null);
  
  // Search/filter states
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

  // Upload modal states from old version
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Form States
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [accessCodes, setAccessCodes] = useState([]);
  const [generatedAccessCode, setGeneratedAccessCode] = useState('');
  const [uploadingQuestions, setUploadingQuestions] = useState(false);

  // Upload form state from old version
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    courseType: 'general',
    accessCode: '',
    accessCodeEmail: '',
    allowedEmails: '',
    maxUsageCount: 1
  });

  // Whitelist & Access Code Form State
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
    if (activeTab === 'view-courses') {
      fetchCourses();
    }
  }, [currentPage, itemsPerPage, courseTypeFilter, activeTab]);

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  // --- FIXED API Calls with correct base URL ---
  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching courses...');
      
      // Try without base URL first (for Netlify proxy)
      const res = await api.get('/admin/courses', {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          courseType: courseTypeFilter || '',
          search: searchTerm
        }
      });
      
      console.log('Courses API Response:', res.data);
      
      // Handle response
      if (res.data) {
        if (Array.isArray(res.data)) {
          setCourses(res.data);
          setTotalItems(res.data.length);
        } else if (Array.isArray(res.data.courses)) {
          setCourses(res.data.courses);
          setTotalItems(res.data.total || res.data.courses.length);
        } else if (res.data.success && Array.isArray(res.data.courses)) {
          setCourses(res.data.courses);
          setTotalItems(res.data.total || res.data.courses.length);
        } else {
          setCourses([]);
          setTotalItems(0);
        }
      } else {
        setCourses([]);
        setTotalItems(0);
      }
      
      setLoading(false);
    } catch (err) {
      console.error("Fetch error details:", err);
      
      // Try alternative endpoint
      if (err.response?.status === 404) {
        try {
          console.log('Trying alternative endpoint...');
          const altRes = await api.get('/api/admin/courses');
          if (altRes.data) {
            setCourses(Array.isArray(altRes.data) ? altRes.data : []);
          }
        } catch (altErr) {
          setError('Backend connection failed. Please check your server.');
        }
      } else {
        setError(err.response?.data?.message || 'Failed to load courses. Please check your connection.');
      }
      
      setCourses([]);
      setLoading(false);
    }
  };

  // Helper function from old version
  const showCustomAlert = (message, type = 'success') => {
    setAlert({ message, type });
  };

  // Filter courses function from old version
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

  // File select handler from old version
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['.doc', '.docx', '.txt'];
      const fileExt = '.' + file.name.split('.').pop().toLowerCase();
      
      if (!allowedTypes.includes(fileExt)) {
        showCustomAlert('Please select a .doc, .docx, or .txt file', 'error');
        e.target.value = '';
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        showCustomAlert('File size must be less than 10MB', 'error');
        e.target.value = '';
        return;
      }
      
      setSelectedFile(file);
    }
  };

  // Upload handler from old version - FIXED URL
  const handleUpload = async () => {
    if (!uploadForm.title.trim() || !uploadForm.description.trim() || !selectedFile) {
      showCustomAlert('Please fill all fields and select a file', 'error');
      return;
    }

    // Masterclass validation
    if (uploadForm.courseType === 'masterclass') {
      if (!uploadForm.accessCode.trim()) {
        showCustomAlert('Please provide an access code for masterclass courses', 'error');
        return;
      }
      
      // If email is provided, validate it
      if (uploadForm.accessCodeEmail.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(uploadForm.accessCodeEmail.trim())) {
          showCustomAlert('Please provide a valid email address for the access code', 'error');
          return;
        }
      }
    }

    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('title', uploadForm.title);
      formData.append('description', uploadForm.description);
      formData.append('courseType', uploadForm.courseType);
      formData.append('accessCode', uploadForm.accessCode);
      
      // Append email if provided
      if (uploadForm.accessCodeEmail.trim()) {
        formData.append('accessCodeEmail', uploadForm.accessCodeEmail.trim());
      }
      
      // Append allowed emails if provided
      if (uploadForm.allowedEmails.trim()) {
        formData.append('allowedEmails', uploadForm.allowedEmails.trim());
      }
      
      // Append max usage count
      formData.append('maxUsageCount', uploadForm.maxUsageCount || 1);
      
      formData.append('courseFile', selectedFile);

      console.log('Uploading course...', {
        title: uploadForm.title,
        type: uploadForm.courseType,
        accessCode: uploadForm.accessCode
      });

      // Try different endpoints
      let response;
      try {
        response = await api.post('/admin/upload-document-course', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      } catch (err) {
        if (err.response?.status === 404) {
          // Try with /api prefix
          response = await api.post('/api/admin/upload-document-course', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
        } else {
          throw err;
        }
      }

      if (response.data && response.data.success) {
        showCustomAlert(`Course uploaded successfully!`, 'success');
        setShowUploadModal(false);
        resetUploadForm();
        // Refresh courses if on view tab
        if (activeTab === 'view-courses') {
          fetchCourses();
        }
      } else {
        showCustomAlert(response.data?.message || 'Failed to upload course. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error uploading course:', error);
      if (error.response?.status === 404) {
        showCustomAlert('Backend server not found. Please check if your server is running.', 'error');
      } else if (error.response?.data?.message) {
        showCustomAlert(error.response.data.message, 'error');
      } else {
        showCustomAlert('Failed to upload course. Please check your connection.', 'error');
      }
    }
    
    setUploading(false);
  };

  // Reset upload form from old version
  const resetUploadForm = () => {
    setUploadForm({
      title: '',
      description: '',
      courseType: 'general',
      accessCode: '',
      accessCodeEmail: '',
      allowedEmails: '',
      maxUsageCount: 1
    });
    setSelectedFile(null);
  };

  // Pagination functions from old version
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
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
      const res = await api.get(`/admin/courses/${course._id}/access-codes`);
      setAccessCodes(Array.isArray(res.data.accessCodes) ? res.data.accessCodes : []);
    } catch (err) {
      showCustomAlert('Could not load access codes', 'error');
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

      const res = await api.post(`/admin/courses/${selectedCourse._id}/generate-access-code-for-user`, payload);
      setGeneratedAccessCode(res.data.accessCode);
      
      const updatedCodes = await api.get(`/admin/courses/${selectedCourse._id}/access-codes`);
      setAccessCodes(Array.isArray(updatedCodes.data.accessCodes) ? updatedCodes.data.accessCodes : []);
      showCustomAlert('Access code generated and whitelist updated!', 'success');
    } catch (err) {
      showCustomAlert(err.response?.data?.message || 'Error generating code', 'error');
    }
  };

  const deleteAccessCode = async (codeId) => {
    if (!window.confirm('Delete this access code? This will revoke access for all associated emails.')) return;
    try {
      await api.delete(`/admin/access-codes/${codeId}`);
      setAccessCodes(accessCodes.filter(c => c._id !== codeId));
      showCustomAlert('Code deleted', 'success');
    } catch (err) {
      showCustomAlert('Failed to delete code', 'error');
    }
  };

  const uploadQuestions = async () => {
    setUploadingQuestions(true);
    try {
      const type = showMasterclassQuestionsModal ? 'masterclass' : 'general';
      const endpoint = type === 'general' 
        ? '/admin/upload-general-questions'
        : '/admin/upload-masterclass-questions';
      
      await api.post(endpoint, {
        ...questionForm,
        courseType: type
      });
      showCustomAlert('Questions uploaded successfully!', 'success');
      setShowGeneralQuestionsModal(false);
      setShowMasterclassQuestionsModal(false);
      resetQuestionForm();
    } catch (err) {
      showCustomAlert('Error uploading questions', 'error');
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
    <div className="admin-manage-courses" style={{ background: '#f9fafb', minHeight: '100vh' }}>
      {alert && (
        <div className={`custom-alert custom-alert-${alert.type}`}>
          <div className="alert-content">
            <i className={`fas ${
              alert.type === 'success' ? 'fa-check-circle' :
              alert.type === 'error' ? 'fa-exclamation-circle' :
              'fa-info-circle'
            } me-2`}></i>
            {alert.message}
            <button
              className="alert-close"
              onClick={() => setAlert(null)}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      )}

      <div className="container-fluid py-4">
        {/* Header Section */}
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

        {/* Tab Navigation */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="card shadow-sm border-0">
              <div className="card-body p-0">
                <ul className="nav nav-tabs nav-justified" id="coursesTab" role="tablist">
                  <li className="nav-item" role="presentation">
                    <button
                      className={`nav-link ${activeTab === 'upload-general' ? 'active' : ''}`}
                      onClick={() => setActiveTab('upload-general')}
                    >
                      <i className="fas fa-upload me-2"></i>Upload General Courses
                    </button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button
                      className={`nav-link ${activeTab === 'upload-masterclass' ? 'active' : ''}`}
                      onClick={() => setActiveTab('upload-masterclass')}
                    >
                      <i className="fas fa-crown me-2"></i>Upload Masterclass Courses
                    </button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button
                      className={`nav-link ${activeTab === 'general-questions' ? 'active' : ''}`}
                      onClick={() => setActiveTab('general-questions')}
                    >
                      <i className="fas fa-question-circle me-2"></i>General Course Questions
                    </button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button
                      className={`nav-link ${activeTab === 'masterclass-questions' ? 'active' : ''}`}
                      onClick={() => setActiveTab('masterclass-questions')}
                    >
                      <i className="fas fa-graduation-cap me-2"></i>Masterclass Course Questions
                    </button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button
                      className={`nav-link ${activeTab === 'view-courses' ? 'active' : ''}`}
                      onClick={() => setActiveTab('view-courses')}
                    >
                      <i className="fas fa-list me-2"></i>View/Edit/Delete Courses
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* IMPORTANT: Add this backend connection info */}
        {error && error.includes('Backend') && (
          <div className="row mb-4">
            <div className="col-12">
              <div className="alert alert-warning">
                <h5><i className="fas fa-server me-2"></i>Backend Connection Required</h5>
                <p className="mb-2">Your frontend is deployed on Netlify but cannot connect to your backend server.</p>
                <div className="mb-2">
                  <strong>Quick Fix Options:</strong>
                  <ol className="mb-0">
                    <li>Make sure your backend server is running</li>
                    <li>Update the <code>baseURL</code> in the code to point to your backend (line 7)</li>
                    <li>Or create a <code>_redirects</code> file in your Netlify public folder</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div className="row">
          <div className="col-12">
            <div className="card shadow-lg border-0">
              <div className="card-body">
                {/* Upload General Courses Tab */}
                {activeTab === 'upload-general' && (
                  <div className="upload-section">
                    <h4 className="mb-4" style={{color: '#0c5460'}}>
                      <i className="fas fa-book me-2"></i>
                      Upload General Course
                    </h4>
                    <div className="row">
                      <div className="col-md-8">
                        <div className="mb-3">
                          <label className="form-label fw-bold">Course Title</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Enter course title..."
                            value={uploadForm.title}
                            onChange={(e) => setUploadForm({...uploadForm, title: e.target.value})}
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label fw-bold">Description</label>
                          <textarea
                            className="form-control"
                            rows="4"
                            placeholder="Enter course description..."
                            value={uploadForm.description}
                            onChange={(e) => setUploadForm({...uploadForm, description: e.target.value})}
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label fw-bold">Course File</label>
                          <input
                            type="file"
                            className="form-control"
                            accept=".doc,.docx,.txt"
                            onChange={handleFileSelect}
                          />
                          <small className="text-muted">Supported formats: .doc, .docx, .txt (Max 10MB)</small>
                        </div>
                        <button
                          className="btn btn-info btn-lg"
                          onClick={() => {
                            setUploadForm({...uploadForm, courseType: 'general'});
                            setShowUploadModal(true);
                          }}
                          disabled={!uploadForm.title || !uploadForm.description || !selectedFile}
                        >
                          <i className="fas fa-upload me-2"></i>Upload General Course
                        </button>
                      </div>
                      <div className="col-md-4">
                        <div className="alert alert-info">
                          <h6><i className="fas fa-info-circle me-2"></i>General Courses Information</h6>
                          <ul className="mb-0">
                            <li>General courses are accessible to all users</li>
                            <li>No access codes required</li>
                            <li>Users will see notification badges</li>
                            <li>Upload .doc, .docx, or .txt files</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Upload Masterclass Courses Tab */}
                {activeTab === 'upload-masterclass' && (
                  <div className="upload-section">
                    <h4 className="mb-4" style={{color: '#0c5460'}}>
                      <i className="fas fa-crown me-2"></i>
                      Upload Masterclass Course
                    </h4>
                    <div className="row">
                      <div className="col-md-8">
                        <div className="mb-3">
                          <label className="form-label fw-bold">Course Title</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Enter course title..."
                            value={uploadForm.title}
                            onChange={(e) => setUploadForm({...uploadForm, title: e.target.value})}
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label fw-bold">Description</label>
                          <textarea
                            className="form-control"
                            rows="4"
                            placeholder="Enter course description..."
                            value={uploadForm.description}
                            onChange={(e) => setUploadForm({...uploadForm, description: e.target.value})}
                          />
                        </div>
                        {/* Access Code input */}
                        <div className="mb-3">
                          <label className="form-label fw-bold">Access Code *</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Enter access code (any letters/numbers, e.g., 123456 or ABC123)..."
                            value={uploadForm.accessCode}
                            onChange={(e) => setUploadForm({...uploadForm, accessCode: e.target.value})}
                          />
                          <small className="text-muted">Enter any combination of letters and numbers (3-20 characters)</small>
                        </div>
                        
                        {/* Email field - REQUIRED */}
                        <div className="mb-3">
                          <label className="form-label fw-bold">Assign to Email *</label>
                          <input
                            type="email"
                            className="form-control"
                            placeholder="user@example.com"
                            value={uploadForm.accessCodeEmail}
                            onChange={(e) => setUploadForm({...uploadForm, accessCodeEmail: e.target.value})}
                            required
                          />
                          <small className="text-muted">
                            Required: This access code will be assigned to this specific email address.
                          </small>
                        </div>
                        
                        {/* Allowed emails textarea for multiple users */}
                        <div className="mb-3">
                          <label className="form-label fw-bold">Allowed Emails (Optional - for team access)</label>
                          <textarea
                            className="form-control"
                            rows="3"
                            placeholder="Enter additional emails (one per line or comma-separated):&#10;team.member1@company.com&#10;team.member2@company.com&#10;team.member3@company.com"
                            value={uploadForm.allowedEmails}
                            onChange={(e) => setUploadForm({...uploadForm, allowedEmails: e.target.value})}
                          />
                          <small className="text-muted">
                            Optional: Add multiple email addresses to allow team access with the same code.
                          </small>
                        </div>
                        
                        {/* Max usage count */}
                        <div className="mb-3">
                          <label className="form-label fw-bold">Max Usage Count</label>
                          <select
                            className="form-select"
                            value={uploadForm.maxUsageCount}
                            onChange={(e) => setUploadForm({...uploadForm, maxUsageCount: parseInt(e.target.value)})}
                          >
                            <option value="1">Single use only</option>
                            <option value="5">5 uses</option>
                            <option value="10">10 uses</option>
                            <option value="9999">Unlimited uses</option>
                          </select>
                          <small className="text-muted">How many times can this access code be used?</small>
                        </div>
                        
                        <div className="mb-3">
                          <label className="form-label fw-bold">Course File</label>
                          <input
                            type="file"
                            className="form-control"
                            accept=".doc,.docx,.txt"
                            onChange={handleFileSelect}
                          />
                          <small className="text-muted">Supported formats: .doc, .docx, .txt (Max 10MB)</small>
                        </div>
                        {/* Upload button validation */}
                        <button
                          className="btn btn-warning btn-lg"
                          onClick={() => {
                            setUploadForm({...uploadForm, courseType: 'masterclass'});
                            setShowUploadModal(true);
                          }}
                          disabled={!uploadForm.title || !uploadForm.description || !uploadForm.accessCode || !uploadForm.accessCodeEmail || !selectedFile}
                        >
                          <i className="fas fa-crown me-2"></i>Upload Masterclass Course
                        </button>
                      </div>
                      <div className="col-md-4">
                        <div className="alert alert-warning">
                          <h6><i className="fas fa-exclamation-triangle me-2"></i>Masterclass Courses Information</h6>
                          <ul className="mb-0">
                            <li>Require access codes for user access</li>
                            <li>Each code can be assigned to specific emails or be generic</li>
                            <li>Generic codes can be claimed by any user with their email</li>
                            <li>Assigned codes require specific email addresses</li>
                            <li>Premium content for authorized users</li>
                          </ul>
                        </div>
                        {/* Access Code Information card */}
                        <div className="card bg-warning">
                          <div className="card-body">
                            <h6>Access Code Information:</h6>
                            <ul className="small mb-0">
                              <li><strong>Assigned Code Only:</strong> Each code is tied to a specific email address</li>
                              <li><strong>Team Access:</strong> Add multiple emails in the "Allowed Emails" field</li>
                              <li><strong>Email Required:</strong> Must provide a valid email for assignment</li>
                              <li><strong>Code Format:</strong> Any combination of letters/numbers (3-20 characters)</li>
                              <li><strong>Team Sharing:</strong> Use allowed emails to share access with team members</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* General Course Questions Tab */}
                {activeTab === 'general-questions' && (
                  <div className="questions-section">
                    <h4 className="mb-4" style={{color: '#0c5460'}}>
                      <i className="fas fa-question-circle me-2"></i>
                      Upload General Course Questions
                    </h4>
                    <div className="row">
                      <div className="col-md-8">
                        <div className="alert alert-info">
                          <h6><i className="fas fa-info-circle me-2"></i>General Course Questions Information</h6>
                          <ul className="mb-0">
                            <li>Create 20 questions for general courses</li>
                            <li>Each question has 4 options (A, B, C, D)</li>
                            <li>Mark the correct option for each question</li>
                            <li>Provide explanations for correct answers</li>
                            <li>Questions will be available to all users</li>
                          </ul>
                        </div>
                        <button
                          className="btn btn-info btn-lg"
                          onClick={() => setShowGeneralQuestionsModal(true)}
                        >
                          <i className="fas fa-plus-circle me-2"></i>Create General Course Questions
                        </button>
                      </div>
                      <div className="col-md-4">
                        <div className="card bg-light">
                          <div className="card-body">
                            <h6>Quick Tips</h6>
                            <ul className="small">
                              <li>Ensure question titles relate to specific courses</li>
                              <li>Make descriptions clear and informative</li>
                              <li>Rotate correct options randomly</li>
                              <li>Provide meaningful explanations</li>
                              <li>Test questions before publishing</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Masterclass Course Questions Tab */}
                {activeTab === 'masterclass-questions' && (
                  <div className="questions-section">
                    <h4 className="mb-4" style={{color: '#0c5460'}}>
                      <i className="fas fa-graduation-cap me-2"></i>
                      Upload Masterclass Course Questions
                    </h4>
                    <div className="row">
                      <div className="col-md-8">
                        <div className="alert alert-warning">
                          <h6><i className="fas fa-exclamation-triangle me-2"></i>Masterclass Course Questions Information</h6>
                          <ul className="mb-0">
                            <li>Create 20 questions for masterclass courses</li>
                            <li>Each question has 4 options (A, B, C, D)</li>
                            <li>Mark the correct option for each question</li>
                            <li>Provide detailed explanations for correct answers</li>
                            <li>Questions will require access codes</li>
                          </ul>
                        </div>
                        <button
                          className="btn btn-warning btn-lg"
                          onClick={() => setShowMasterclassQuestionsModal(true)}
                        >
                          <i className="fas fa-plus-circle me-2"></i>Create Masterclass Course Questions
                        </button>
                      </div>
                      <div className="col-md-4">
                        <div className="card bg-light">
                          <div className="card-body">
                            <h6>Advanced Tips</h6>
                            <ul className="small">
                              <li>Create challenging questions for premium users</li>
                              <li>Focus on practical application of knowledge</li>
                              <li>Include real-world scenarios</li>
                              <li>Provide comprehensive explanations</li>
                              <li>Ensure questions match course difficulty</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* View/Edit/Delete Courses Tab */}
                {activeTab === 'view-courses' && (
                  <div className="view-courses-section">
                    {/* Search and Filter Controls */}
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
                            setCurrentPage(1);
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

                    {/* Error state */}
                    {error && !error.includes('Backend') && (
                      <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
                        <i className="fas fa-exclamation-triangle fa-2x me-3"></i>
                        <div>
                          <h4 className="alert-heading">Oops! Something went wrong</h4>
                          <p className="mb-0">{error}</p>
                          <button className="btn btn-outline-danger mt-2" onClick={fetchCourses}>
                            <i className="fas fa-redo me-2"></i>Try Again
                          </button>
                        </div>
                      </div>
                    )}

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
          </div>
        </div>
      </div>

      {/* Upload Confirmation Modal */}
      {showUploadModal && (
        <div className="modal fade show" style={{display: 'block', backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header" style={{backgroundColor: uploadForm.courseType === 'general' ? '#17a2b8' : '#ffc107', color: 'white'}}>
                <h5 className="modal-title">
                  <i className={`fas ${uploadForm.courseType === 'general' ? 'fa-book' : 'fa-crown'} me-2`}></i>
                  Confirm {uploadForm.courseType === 'general' ? 'General' : 'Masterclass'} Course Upload
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowUploadModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-info">
                  <h6>Course Details:</h6>
                  <p><strong>Title:</strong> {uploadForm.title}</p>
                  <p><strong>Type:</strong> {uploadForm.courseType}</p>
                  <p><strong>File:</strong> {selectedFile?.name}</p>
                  {uploadForm.courseType === 'masterclass' && (
                    <>
                      <p><strong>Access Code:</strong> {uploadForm.accessCode}</p>
                      <p><strong>Max Usage:</strong> {uploadForm.maxUsageCount === 9999 ? 'Unlimited' : uploadForm.maxUsageCount} time(s)</p>
                      {uploadForm.accessCodeEmail ? (
                        <p><strong>Primary Email:</strong> {uploadForm.accessCodeEmail} (Assigned Code)</p>
                      ) : (
                        <p><strong>Assignment:</strong> Generic Code (can be claimed by any user)</p>
                      )}
                      {uploadForm.allowedEmails.trim() && (
                        <p><strong>Additional Allowed Emails:</strong> {uploadForm.allowedEmails.split(/[\n,]/).filter(e => e.trim()).length} email(s) added for team access</p>
                      )}
                    </>
                  )}
                </div>
                <p className="text-muted">
                  {uploadForm.courseType === 'general' 
                    ? 'This course will be immediately available to all users.' 
                    : `This access code (${uploadForm.accessCode}) will be assigned to ${uploadForm.accessCodeEmail} ${uploadForm.allowedEmails.trim() ? 'and additional team members' : ''}.`}
                </p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowUploadModal(false)}
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={`btn ${uploadForm.courseType === 'general' ? 'btn-info' : 'btn-warning'}`}
                  onClick={handleUpload}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-upload me-2"></i>
                      Confirm Upload
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                <h5 className="modal-title">Bulk Upload General Questions</h5>
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
                <h5 className="modal-title">Bulk Upload Masterclass Questions</h5>
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
        .custom-alert {
          position: fixed;
          top: 100px;
          right: 20px;
          z-index: 9999;
          min-width: 300px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          animation: slideInRight 0.3s ease-out;
        }
        
        .custom-alert-success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }
        
        .custom-alert-error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }
        
        .alert-content {
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .alert-close {
          background: none;
          border: none;
          color: inherit;
          cursor: pointer;
          padding: 4px;
          margin-left: 12px;
        }
        
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
        
        .btn-group-sm > .btn {
          padding: 0.25rem 0.5rem;
        }

        .question-card {
          border-left: 4px solid #17a2b8;
        }

        .questions-container {
          max-height: 60vh;
          overflow-y: auto;
          padding-right: 10px;
        }

        .questions-container::-webkit-scrollbar {
          width: 6px;
        }

        .questions-container::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }

        .questions-container::-webkit-scrollbar-thumb {
          background: #17a2b8;
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
};

export default AdminManageCourses;