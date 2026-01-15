// travel-tour-frontend/src/components/ImportantInfoAdmin.jsx
import React, { useState, useEffect } from 'react';
import { importantInfoService } from '../services/importantInfoApi';

const ImportantInfoAdmin = () => {
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        isUrgent: false
    });
    const [attachments, setAttachments] = useState([]);
    const [messages, setMessages] = useState([]);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10
    });
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('view'); // 'view', 'edit', 'resend'
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [unreadCountError, setUnreadCountError] = useState(false);

    useEffect(() => {
        fetchMessages();
    }, [pagination.currentPage]);

    const fetchMessages = async () => {
        try {
            setLoading(true);
            setUnreadCountError(false);
            console.log('📋 Fetching important info messages...');
            
            const response = await importantInfoService.getAllMessages(
                pagination.currentPage, 
                pagination.itemsPerPage
            );
            
            console.log('📋 Messages response:', response.data);
            
            if (response.data.success) {
                setMessages(response.data.data);
                setPagination(response.data.pagination);
            }
        } catch (err) {
            console.error('❌ Error fetching messages:', err);
            
            if (err.code === 'ERR_NETWORK') {
                setError('Cannot connect to Important Information server. Please check if the server is running.');
            } else if (err.response?.status === 401) {
                setError('Session expired. Please log in again.');
            } else {
                setError(err.response?.data?.message || 'Error fetching messages');
            }
        } finally {
            setLoading(false);
        }
    };

    // Function to handle view mode
    const handleViewMessage = (message) => {
        setSelectedMessage(message);
        setActiveTab('view');
    };

    // Function to handle edit mode
    const handleEditMessage = (message) => {
        setSelectedMessage(message);
        setFormData({
            title: message.title,
            message: message.content || message.message,
            isUrgent: message.isUrgent || false
        });
        setActiveTab('edit');
        // Scroll to form
        document.getElementById('message-form')?.scrollIntoView({ behavior: 'smooth' });
    };

    // Function to handle resend mode
    const handleResendMessage = (message) => {
        setSelectedMessage(message);
        setFormData({
            title: message.title,
            message: message.content || message.message,
            isUrgent: message.isUrgent || false
        });
        setActiveTab('resend');
        // Scroll to form
        document.getElementById('message-form')?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        
        // Validate file sizes (max 10MB each)
        const validFiles = files.filter(file => file.size <= 10 * 1024 * 1024);
        
        if (validFiles.length !== files.length) {
            setError('Some files exceed the 10MB limit and were removed.');
        }
        
        // Limit to 5 files
        const limitedFiles = validFiles.slice(0, 5);
        setAttachments(limitedFiles);
        
        if (files.length > 5) {
            setError('Maximum 5 files allowed. Only first 5 files were selected.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSending(true);
        setError('');
        setSuccess('');

        try {
            console.log('📤 Submitting important info...');
            
            const formDataToSend = new FormData();
            formDataToSend.append('title', formData.title);
            formDataToSend.append('message', formData.message);
            formDataToSend.append('isUrgent', formData.isUrgent);
            formDataToSend.append('recipients', JSON.stringify(['all'])); // Always send to all users
            
            attachments.forEach(file => {
                formDataToSend.append('attachments', file);
            });

            let response;
            if (activeTab === 'edit' && selectedMessage) {
                // Update existing message
                console.log('📝 Updating message...');
                response = await importantInfoService.updateImportantInfo(selectedMessage._id, formDataToSend);
                setSuccess('Message updated successfully');
            } else {
                // Create new message or resend
                console.log('📤 Sending form data...');
                response = await importantInfoService.createImportantInfo(formDataToSend);
                setSuccess(`Message ${activeTab === 'resend' ? 'resent' : 'sent'} successfully to all users`);
            }
            
            console.log('✅ Response:', response.data);
            
            if (response.data.success) {
                // Reset form and fetch updated messages
                if (activeTab !== 'edit') {
                    setFormData({
                        title: '',
                        message: '',
                        isUrgent: false
                    });
                    setAttachments([]);
                }
                setSelectedMessage(null);
                setActiveTab('view');
                fetchMessages(); // Refresh the list
                
                // Auto-clear success message after 5 seconds
                setTimeout(() => setSuccess(''), 5000);
            }
        } catch (err) {
            console.error('❌ Error sending message:', err);
            
            if (err.code === 'ERR_NETWORK') {
                setError('Cannot connect to server. Please check your internet connection and try again.');
            } else if (err.response?.status === 413) {
                setError('Files too large. Maximum total size is 50MB.');
            } else {
                setError(err.response?.data?.message || `Error ${activeTab === 'edit' ? 'updating' : 'sending'} message. Please try again.`);
            }
        } finally {
            setSending(false);
        }
    };

    const handleDelete = async (messageId) => {
        if (window.confirm('Are you sure you want to delete this message permanently? This action cannot be undone.')) {
            try {
                await importantInfoService.deletePermanently(messageId);
                setSuccess('Message deleted successfully');
                setSelectedMessage(null);
                fetchMessages();
                
                // Auto-clear success message after 3 seconds
                setTimeout(() => setSuccess(''), 3000);
            } catch (err) {
                console.error('Error deleting message:', err);
                setError('Error deleting message');
            }
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handlePageChange = (page) => {
        setPagination(prev => ({ ...prev, currentPage: page }));
    };

    const removeAttachment = (index) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const cancelEdit = () => {
        setSelectedMessage(null);
        setActiveTab('view');
        setFormData({
            title: '',
            message: '',
            isUrgent: false
        });
        setAttachments([]);
    };

    // Inline styles for mobile menu fix
    const mobileMenuStyles = `
        @media (max-width: 991.98px) {
            .navbar-collapse {
                z-index: 1050 !important;
                position: relative;
            }
            .navbar-collapse.show {
                background-color: white;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                border-radius: 4px;
            }
        }
    `;

    return (
        <>
            <style>{mobileMenuStyles}</style>
            
            <div className="container py-4">
                <div className="row">
                    <div className="col-lg-8">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h2>Important Information Archive</h2>
                            <div>
                                <span className="badge bg-secondary me-2">
                                    {pagination.totalItems} total messages
                                </span>
                                {unreadCountError && (
                                    <span className="badge bg-warning">
                                        <i className="fas fa-exclamation-triangle me-1"></i>
                                        Unread count unavailable
                                    </span>
                                )}
                            </div>
                        </div>
                        
                        {/* Alerts */}
                        {success && (
                            <div className="alert alert-success alert-dismissible fade show" role="alert">
                                <i className="fas fa-check-circle me-2"></i>
                                {success}
                                <button type="button" className="btn-close" onClick={() => setSuccess('')}></button>
                            </div>
                        )}
                        
                        {error && (
                            <div className="alert alert-danger alert-dismissible fade show" role="alert">
                                <i className="fas fa-exclamation-circle me-2"></i>
                                {error}
                                <button type="button" className="btn-close" onClick={() => setError('')}></button>
                            </div>
                        )}
                        
                        {/* Tab Navigation */}
                        <div className="mb-4">
                            <ul className="nav nav-tabs">
                                <li className="nav-item">
                                    <button
                                        className={`nav-link ${activeTab === 'view' ? 'active' : ''}`}
                                        onClick={() => {
                                            setActiveTab('view');
                                            setSelectedMessage(null);
                                        }}
                                    >
                                        <i className="fas fa-list me-1"></i>
                                        View Messages
                                    </button>
                                </li>
                                <li className="nav-item">
                                    <button
                                        className={`nav-link ${activeTab === 'edit' ? 'active' : ''}`}
                                        onClick={() => {
                                            if (selectedMessage) {
                                                handleEditMessage(selectedMessage);
                                            } else {
                                                setActiveTab('edit');
                                            }
                                        }}
                                        disabled={!selectedMessage}
                                    >
                                        <i className="fas fa-edit me-1"></i>
                                        Edit Message
                                    </button>
                                </li>
                                <li className="nav-item">
                                    <button
                                        className={`nav-link ${activeTab === 'resend' ? 'active' : ''}`}
                                        onClick={() => {
                                            if (selectedMessage) {
                                                handleResendMessage(selectedMessage);
                                            } else {
                                                setActiveTab('resend');
                                            }
                                        }}
                                        disabled={!selectedMessage}
                                    >
                                        <i className="fas fa-redo me-1"></i>
                                        Resend Message
                                    </button>
                                </li>
                            </ul>
                        </div>

                        {/* Message Viewer for View Mode */}
                        {activeTab === 'view' && selectedMessage && (
                            <div className="card mb-4">
                                <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                                    <h5 className="mb-0">
                                        <i className="fas fa-eye me-2"></i>
                                        Viewing Message
                                    </h5>
                                    <button
                                        className="btn btn-sm btn-light"
                                        onClick={() => setSelectedMessage(null)}
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                </div>
                                <div className="card-body">
                                    <h4>{selectedMessage.title}</h4>
                                    {selectedMessage.isUrgent && (
                                        <span className="badge bg-danger mb-3">URGENT</span>
                                    )}
                                    <div className="mb-3">
                                        <small className="text-muted">
                                            <i className="fas fa-user me-1"></i>
                                            Sent by: {selectedMessage.sender?.name || 'Admin'}
                                        </small>
                                        <br />
                                        <small className="text-muted">
                                            <i className="fas fa-clock me-1"></i>
                                            Date: {formatDate(selectedMessage.createdAt)}
                                        </small>
                                    </div>
                                    <div className="border rounded p-3 bg-light">
                                        <p style={{ whiteSpace: 'pre-wrap' }}>
                                            {selectedMessage.content || selectedMessage.message}
                                        </p>
                                    </div>
                                    
                                    {selectedMessage.attachments?.length > 0 && (
                                        <div className="mt-4">
                                            <h6><i className="fas fa-paperclip me-2"></i>Attachments</h6>
                                            <div className="list-group">
                                                {selectedMessage.attachments.map((attachment, index) => (
                                                    <a
                                                        key={index}
                                                        href={attachment.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                                                    >
                                                        <div>
                                                            <i className={`fas fa-file-${attachment.type?.includes('pdf') ? 'pdf' : attachment.type?.includes('image') ? 'image' : 'word'} me-2`}></i>
                                                            {attachment.filename || attachment.name}
                                                        </div>
                                                        <i className="fas fa-download"></i>
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="card-footer">
                                    <div className="d-flex justify-content-between">
                                        <div>
                                            <small className="text-muted">
                                                <i className="fas fa-users me-1"></i>
                                                Read by: {selectedMessage.readBy?.length || 0} users
                                            </small>
                                        </div>
                                        <div>
                                            <button
                                                className="btn btn-sm btn-outline-primary me-2"
                                                onClick={() => handleEditMessage(selectedMessage)}
                                            >
                                                <i className="fas fa-edit me-1"></i>
                                                Edit
                                            </button>
                                            <button
                                                className="btn btn-sm btn-outline-warning me-2"
                                                onClick={() => handleResendMessage(selectedMessage)}
                                            >
                                                <i className="fas fa-redo me-1"></i>
                                                Resend
                                            </button>
                                            <button
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => handleDelete(selectedMessage._id)}
                                            >
                                                <i className="fas fa-trash me-1"></i>
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {loading && !messages.length ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                                <p className="mt-2">Loading messages...</p>
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="alert alert-info">
                                <i className="fas fa-inbox me-2"></i>
                                No important information sent yet.
                            </div>
                        ) : (
                            <>
                                <div className="table-responsive">
                                    <table className="table table-hover">
                                        <thead>
                                            <tr>
                                                <th width="30%">Title</th>
                                                <th width="20%">Attachments</th>
                                                <th width="25%">Date</th>
                                                <th width="25%">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {messages.map((message) => (
                                                <tr 
                                                    key={message._id}
                                                    className={selectedMessage?._id === message._id ? 'table-primary' : ''}
                                                    onClick={() => handleViewMessage(message)}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <td>
                                                        <div>
                                                            <strong>{message.title}</strong>
                                                            {message.isUrgent && (
                                                                <span className="badge bg-danger ms-2">Urgent</span>
                                                            )}
                                                        </div>
                                                        <small className="text-muted">
                                                            Sent by: {message.sender?.name || 'Admin'}
                                                        </small>
                                                    </td>
                                                    <td>
                                                        {message.attachments?.length > 0 ? (
                                                            <div>
                                                                <span className="badge bg-info me-1">
                                                                    <i className="fas fa-paperclip me-1"></i>
                                                                    {message.attachments.length}
                                                                </span>
                                                                <small className="text-muted d-block">
                                                                    {message.attachments.length} file(s)
                                                                </small>
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted">None</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <div>{formatDate(message.createdAt)}</div>
                                                        <small className="text-muted">
                                                            {message.readBy?.length || 0} users read
                                                        </small>
                                                    </td>
                                                    <td>
                                                        <div className="btn-group btn-group-sm">
                                                            <button
                                                                className="btn btn-outline-primary"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleViewMessage(message);
                                                                }}
                                                                title="View"
                                                            >
                                                                <i className="fas fa-eye"></i>
                                                            </button>
                                                            <button
                                                                className="btn btn-outline-warning"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleEditMessage(message);
                                                                }}
                                                                title="Edit"
                                                            >
                                                                <i className="fas fa-edit"></i>
                                                            </button>
                                                            <button
                                                                className="btn btn-outline-success"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleResendMessage(message);
                                                                }}
                                                                title="Resend"
                                                            >
                                                                <i className="fas fa-redo"></i>
                                                            </button>
                                                            <button
                                                                className="btn btn-outline-danger"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDelete(message._id);
                                                                }}
                                                                title="Delete"
                                                            >
                                                                <i className="fas fa-trash"></i>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {pagination.totalPages > 1 && (
                                    <nav className="mt-4">
                                        <ul className="pagination justify-content-center">
                                            <li className={`page-item ${pagination.currentPage === 1 ? 'disabled' : ''}`}>
                                                <button
                                                    className="page-link"
                                                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                                                    disabled={pagination.currentPage === 1}
                                                >
                                                    <i className="fas fa-chevron-left me-1"></i> Previous
                                                </button>
                                            </li>
                                            
                                            {[...Array(pagination.totalPages)].map((_, index) => {
                                                const pageNum = index + 1;
                                                // Show only nearby pages for better UX
                                                if (
                                                    pageNum === 1 || 
                                                    pageNum === pagination.totalPages ||
                                                    (pageNum >= pagination.currentPage - 2 && pageNum <= pagination.currentPage + 2)
                                                ) {
                                                    return (
                                                        <li 
                                                            key={pageNum}
                                                            className={`page-item ${pagination.currentPage === pageNum ? 'active' : ''}`}
                                                        >
                                                            <button
                                                                className="page-link"
                                                                onClick={() => handlePageChange(pageNum)}
                                                            >
                                                                {pageNum}
                                                            </button>
                                                        </li>
                                                    );
                                                } else if (
                                                    pageNum === pagination.currentPage - 3 ||
                                                    pageNum === pagination.currentPage + 3
                                                ) {
                                                    return (
                                                        <li key={pageNum} className="page-item disabled">
                                                            <span className="page-link">...</span>
                                                        </li>
                                                    );
                                                }
                                                return null;
                                            })}
                                            
                                            <li className={`page-item ${pagination.currentPage === pagination.totalPages ? 'disabled' : ''}`}>
                                                <button
                                                    className="page-link"
                                                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                                                    disabled={pagination.currentPage === pagination.totalPages}
                                                >
                                                    Next <i className="fas fa-chevron-right ms-1"></i>
                                                </button>
                                            </li>
                                        </ul>
                                    </nav>
                                )}
                            </>
                        )}
                    </div>

                    <div className="col-lg-4">
                        <div className="card sticky-top" style={{ top: '20px' }} id="message-form">
                            <div className="card-header bg-primary text-white">
                                <h4 className="mb-0">
                                    <i className="fas fa-bullhorn me-2"></i>
                                    {activeTab === 'edit' ? 'Edit Message' : activeTab === 'resend' ? 'Resend Message' : 'Send Important Information'}
                                </h4>
                            </div>
                            <div className="card-body">
                                {activeTab === 'edit' && selectedMessage && (
                                    <div className="alert alert-info mb-3">
                                        <i className="fas fa-info-circle me-2"></i>
                                        You are editing message sent on {formatDate(selectedMessage.createdAt)}
                                    </div>
                                )}
                                
                                {activeTab === 'resend' && selectedMessage && (
                                    <div className="alert alert-warning mb-3">
                                        <i className="fas fa-exclamation-triangle me-2"></i>
                                        You are resending message originally sent on {formatDate(selectedMessage.createdAt)}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit}>
                                    <div className="mb-3">
                                        <label className="form-label">
                                            Title <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleInputChange}
                                            placeholder="Enter message title"
                                            required
                                            maxLength={200}
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">
                                            Message <span className="text-danger">*</span>
                                        </label>
                                        <textarea
                                            className="form-control"
                                            name="message"
                                            rows="6"
                                            value={formData.message}
                                            onChange={handleInputChange}
                                            placeholder="Enter your important message here..."
                                            required
                                        ></textarea>
                                        <small className="text-muted">
                                            This message will be sent to all users of the app.
                                        </small>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">Attachments (Optional)</label>
                                        <input
                                            type="file"
                                            className="form-control"
                                            multiple
                                            onChange={handleFileChange}
                                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                                        />
                                        <div className="form-text">
                                            <i className="fas fa-info-circle me-1"></i>
                                            Max 5 files, 10MB each. Allowed: PDF, DOC, DOCX, JPG, PNG, GIF
                                        </div>
                                        
                                        {attachments.length > 0 && (
                                            <div className="mt-2 p-2 bg-light rounded">
                                                <strong>Selected files ({attachments.length}):</strong>
                                                <ul className="list-unstyled mt-2">
                                                    {attachments.map((file, index) => (
                                                        <li key={index} className="d-flex justify-content-between align-items-center mb-1">
                                                            <div className="text-truncate" style={{ maxWidth: '200px' }}>
                                                                <i className={`fas fa-file-${file.type.includes('pdf') ? 'pdf' : file.type.includes('image') ? 'image' : 'word'} me-1`}></i>
                                                                <small>{file.name}</small>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-outline-danger"
                                                                onClick={() => removeAttachment(index)}
                                                            >
                                                                <i className="fas fa-times"></i>
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mb-3">
                                        <div className="form-check">
                                            <input
                                                type="checkbox"
                                                className="form-check-input"
                                                id="isUrgent"
                                                name="isUrgent"
                                                checked={formData.isUrgent}
                                                onChange={handleInputChange}
                                            />
                                            <label className="form-check-label" htmlFor="isUrgent">
                                                <i className="fas fa-exclamation-triangle me-1"></i>
                                                Mark as Urgent
                                            </label>
                                        </div>
                                        <small className="text-muted">
                                            Urgent messages will show with a red badge for users.
                                        </small>
                                    </div>

                                    <div className="alert alert-info">
                                        <i className="fas fa-info-circle me-2"></i>
                                        This message will be sent to <strong>all users</strong> of the application.
                                    </div>

                                    <div className="d-grid gap-2">
                                        <button
                                            type="submit"
                                            className="btn btn-primary py-2"
                                            disabled={sending || !formData.title || !formData.message}
                                        >
                                            {sending ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                    {activeTab === 'edit' ? 'Updating...' : activeTab === 'resend' ? 'Resending...' : 'Sending to all users...'}
                                                </>
                                            ) : (
                                                <>
                                                    <i className={`fas fa-${activeTab === 'edit' ? 'save' : 'paper-plane'} me-2`}></i>
                                                    {activeTab === 'edit' ? 'Update Message' : activeTab === 'resend' ? 'Resend to All Users' : 'Send to All Users'}
                                                </>
                                            )}
                                        </button>
                                        
                                        {(activeTab === 'edit' || activeTab === 'resend') && (
                                            <button
                                                type="button"
                                                className="btn btn-secondary py-2"
                                                onClick={cancelEdit}
                                            >
                                                <i className="fas fa-times me-2"></i>
                                                Cancel {activeTab === 'edit' ? 'Edit' : 'Resend'}
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>
                            <div className="card-footer text-muted">
                                <small>
                                    <i className="fas fa-history me-1"></i>
                                    Messages are archived for future reference
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ImportantInfoAdmin;