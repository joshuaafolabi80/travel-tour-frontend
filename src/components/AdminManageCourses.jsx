import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminManageCourses = () => {
  // --- State Management ---
  const [courses, setCourses] = useState([]); // Initialized as array
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [alert, setAlert] = useState(null);

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
  }, []);

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  // --- API Calls ---
  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/admin/courses');
      
      // SAFETY FIX: Check if data is nested or direct
      if (res.data && Array.isArray(res.data.courses)) {
        setCourses(res.data.courses);
      } else if (Array.isArray(res.data)) {
        setCourses(res.data);
      } else {
        setCourses([]); // Fallback
      }
      
      setLoading(false);
    } catch (err) {
      console.error("Fetch error:", err);
      showAlert('danger', 'Failed to fetch courses');
      setCourses([]); 
      setLoading(false);
    }
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
      const res = await axios.get(`/api/admin/courses/${course._id}/access-codes`);
      // SAFETY FIX: Ensure accessCodes is always an array
      setAccessCodes(Array.isArray(res.data) ? res.data : []);
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

      const res = await axios.post(`/api/admin/courses/${selectedCourse._id}/generate-code`, payload);
      setGeneratedAccessCode(res.data.code);
      
      const updatedCodes = await axios.get(`/api/admin/courses/${selectedCourse._id}/access-codes`);
      setAccessCodes(Array.isArray(updatedCodes.data) ? updatedCodes.data : []);
      showAlert('success', 'Access code generated and whitelist updated!');
    } catch (err) {
      showAlert('danger', err.response?.data?.message || 'Error generating code');
    }
  };

  const deleteAccessCode = async (codeId) => {
    if (!window.confirm('Delete this access code? This will revoke access for all associated emails.')) return;
    try {
      await axios.delete(`/api/admin/access-codes/${codeId}`);
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
      await axios.post(`/api/admin/courses/${selectedCourse._id}/questions`, {
        ...questionForm,
        type
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

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2><i className="fas fa-university me-2 text-primary"></i>Admin Course Manager</h2>
      </div>

      <div className="card shadow-sm border-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Course Details</th>
                <th>Access Control</th>
                <th>Question Banks</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (<tr><td colSpan="3" className="text-center py-5">Loading courses...</td></tr>) : 
                (Array.isArray(courses) && courses.length > 0) ? (
                courses.map(course => (
                <tr key={course._id}>
                  <td>
                    <div className="fw-bold">{course.title}</div>
                    <code className="text-muted">{course.courseCode}</code>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-primary" onClick={() => handleOpenAccessModal(course)}>
                      <i className="fas fa-users-cog me-1"></i> Manage Whitelist
                    </button>
                  </td>
                  <td>
                    <div className="btn-group btn-group-sm">
                      <button className="btn btn-outline-info" onClick={() => { setSelectedCourse(course); setShowGeneralQuestionsModal(true); }}>+ General</button>
                      <button className="btn btn-outline-warning" onClick={() => { setSelectedCourse(course); setShowMasterclassQuestionsModal(true); }}>+ Masterclass</button>
                    </div>
                  </td>
                </tr>
              ))) : (
                <tr><td colSpan="3" className="text-center py-4">No courses found.</td></tr>
              )}
            </tbody>
          </table>
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
                              <td>{code.currentUsageCount}/{code.maxUsageCount}</td>
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
        .alert-content { padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; }
        .alert-close { background: none; border: none; font-size: 1.2rem; cursor: pointer; color: inherit; }
        .questions-container { max-height: 70vh; overflow-y: auto; padding-right: 10px; }
      `}</style>
    </div>
  );
};

export default AdminManageCourses;