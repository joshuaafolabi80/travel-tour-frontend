import React, { useState, useEffect } from 'react';
import api from '../services/api';

const MasterclassCourses = ({ navigateTo }) => {
  const [courses, setCourses] = useState([]);
  const [questionSets, setQuestionSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showAccessModal, setShowAccessModal] = useState(true);
  const [accessCode, setAccessCode] = useState('');
  const [userEmail, setUserEmail] = useState(''); 
  const [validating, setValidating] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [documentLoading, setDocumentLoading] = useState(false);
  const [documentContent, setDocumentContent] = useState(null);
  const [contentType, setContentType] = useState('text');
  const [hasAccess, setHasAccess] = useState(false);
  const [activeTab, setActiveTab] = useState('courses');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    // 1. Check for existing Masterclass session
    const savedAccess = localStorage.getItem('masterclassAccess');
    const savedEmail = localStorage.getItem('masterclassUserEmail');
    
    // 2. 🔥 NEW: Pre-fill email if user is logged into the main app
    const loggedInUser = JSON.parse(localStorage.getItem('user') || '{}');
    const emailToUse = savedEmail || loggedInUser.email || '';
    setUserEmail(emailToUse);

    if (savedAccess === 'granted' && savedEmail) {
      setHasAccess(true);
      setShowAccessModal(false);
      fetchCourses();
      fetchQuestionSets();
    } else {
      setShowAccessModal(true);
    }
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/courses', {
        params: {
          type: 'masterclass',
          page: currentPage,
          limit: itemsPerPage
        }
      });
      
      if (response.data.success) {
        setCourses(response.data.courses);
        setTotalItems(response.data.totalCount);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      setError('Failed to load courses. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestionSets = async () => {
    try {
      const response = await api.get('/masterclass-course-questions');
      if (response.data.success) {
        setQuestionSets(response.data.questionSets);
      }
    } catch (error) {
      console.error('Error fetching question sets:', error);
    }
  };

  const validateAccessCode = async () => {
    if (!accessCode.trim() || !userEmail.trim()) {
      setValidationError('Please enter both access code and email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail.trim())) {
      setValidationError('Please enter a valid email address');
      return;
    }

    setValidating(true);
    setValidationError('');

    try {
      // This route will now check both assignedEmail AND allowedEmails array
      const response = await api.post('/courses/validate-masterclass-access', {
        accessCode: accessCode.trim().toUpperCase(),
        userEmail: userEmail.trim().toLowerCase()
      });

      if (response.data.success) {
        setHasAccess(true);
        localStorage.setItem('masterclassAccess', 'granted');
        localStorage.setItem('masterclassUserEmail', userEmail.trim().toLowerCase());
        localStorage.setItem('masterclassUserName', response.data.userName || '');
        setShowAccessModal(false);
        showCustomAlert('Access granted! Welcome to Masterclass.', 'success');
        
        await fetchCourses();
        await fetchQuestionSets();
      }
    } catch (error) {
      setValidationError(error.response?.data?.message || 'Unauthorized email or invalid code.');
    } finally {
      setValidating(false);
    }
  };

  const viewCourse = async (courseId) => {
    if (!hasAccess) {
      setShowAccessModal(true);
      return;
    }

    try {
      const response = await api.get(`/courses/${courseId}`);
      if (response.data.success) {
        setSelectedCourse(response.data.course);
        setShowCourseModal(true);
        setDocumentContent(null);
        setContentType('text');
      }
    } catch (error) {
      if (error.response?.status === 403) {
        showCustomAlert('Access denied. Valid code required.', 'error');
      }
    }
  };

  const readDocumentInApp = async () => {
    if (!selectedCourse) return;
    try {
      setDocumentLoading(true);
      const response = await api.get(`/direct-courses/${selectedCourse._id}/view`);
      if (response.data.success) {
        setContentType(response.data.contentType || 'text');
        setDocumentContent(response.data.content);
      }
    } catch (error) {
      setDocumentContent('Error loading document: ' + error.message);
    } finally {
      setDocumentLoading(false);
    }
  };

  const closeModal = () => {
    setShowCourseModal(false);
    setSelectedCourse(null);
    setDocumentContent(null);
  };

  const logout = () => {
    setHasAccess(false);
    setShowAccessModal(true);
    localStorage.removeItem('masterclassAccess');
    localStorage.removeItem('masterclassUserEmail');
    localStorage.removeItem('masterclassUserName');
  };

  const showCustomAlert = (message, type = 'success') => {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} position-fixed`;
    alertDiv.style.cssText = `top: 100px; right: 20px; z-index: 9999; animation: slideInRight 0.3s ease-out;`;
    alertDiv.innerHTML = message;
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 3000);
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // If no access, show access modal
  if (!hasAccess) {
    return (
      <div className="masterclass-access bg-light min-vh-100 py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-6 col-lg-5">
              <div className="card shadow-lg border-warning">
                <div className="card-header bg-warning text-center py-4">
                  <i className="fas fa-crown fa-3x mb-3"></i>
                  <h1 className="h3 fw-bold">Masterclass Courses</h1>
                </div>
                <div className="card-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-bold">Email Address *</label>
                    <input
                      type="email"
                      className="form-control"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="Email assigned to code"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-bold">Access Code *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value)}
                      style={{ letterSpacing: '2px', fontFamily: 'monospace' }}
                      placeholder="Enter code"
                    />
                  </div>
                  {validationError && <div className="alert alert-danger small">{validationError}</div>}
                  <button className="btn btn-warning w-100 btn-lg" onClick={validateAccessCode} disabled={validating}>
                    {validating ? 'Validating...' : 'Unlock Content'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="masterclass-courses bg-light min-vh-100 py-4">
      <div className="container-fluid">
        {/* Header Section */}
        <div className="card bg-warning shadow-sm mb-4">
          <div className="card-body d-flex justify-content-between align-items-center">
            <div>
              <h1 className="h2 fw-bold text-dark mb-0"><i className="fas fa-crown me-2"></i>Masterclass Hub</h1>
              <p className="text-dark mb-0">Welcome, {localStorage.getItem('masterclassUserEmail')}</p>
            </div>
            <button className="btn btn-dark" onClick={logout}>Logout</button>
          </div>
        </div>

        {/* Tabs */}
        <ul className="nav nav-pills mb-4 justify-content-center">
          <li className="nav-item">
            <button className={`nav-link ${activeTab === 'courses' ? 'active bg-warning text-dark' : 'text-dark'}`} onClick={() => setActiveTab('courses')}>
              Documents ({courses.length})
            </button>
          </li>
          <li className="nav-item">
            <button className={`nav-link ${activeTab === 'questions' ? 'active bg-info text-white' : 'text-dark'}`} onClick={() => setActiveTab('questions')}>
              Questions ({questionSets.length})
            </button>
          </li>
        </ul>

        {/* Content Area */}
        {activeTab === 'courses' && (
          <div className="row">
            {courses.map(course => (
              <div key={course._id} className="col-md-4 mb-4">
                <div className="card h-100 shadow-sm border-warning">
                  <div className="card-body">
                    <h5>{course.title}</h5>
                    <p className="text-muted small">{course.description?.substring(0, 100)}...</p>
                    <button className="btn btn-warning btn-sm w-100" onClick={() => viewCourse(course._id)}>View Course</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal for viewing document content */}
        {showCourseModal && selectedCourse && (
          <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.7)'}}>
            <div className="modal-dialog modal-xl modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header bg-warning">
                  <h5 className="modal-title">{selectedCourse.title}</h5>
                  <button className="btn-close" onClick={closeModal}></button>
                </div>
                <div className="modal-body" style={{maxHeight: '70vh', overflowY: 'auto'}}>
                  {!documentContent ? (
                    <div className="text-center py-5">
                      <p>{selectedCourse.description}</p>
                      <button className="btn btn-warning" onClick={readDocumentInApp} disabled={documentLoading}>
                        {documentLoading ? 'Loading...' : 'Read Full Document'}
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 bg-white rounded shadow-inner">
                      {contentType === 'html' ? (
                        <div dangerouslySetInnerHTML={{ __html: documentContent }} />
                      ) : (
                        <pre style={{whiteSpace: 'pre-wrap'}}>{documentContent}</pre>
                      )}
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  {documentContent && <button className="btn btn-link" onClick={() => setDocumentContent(null)}>Back to Info</button>}
                  <button className="btn btn-secondary" onClick={closeModal}>Close</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MasterclassCourses;
