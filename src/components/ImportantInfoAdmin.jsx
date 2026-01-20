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
    const [showMobileForm, setShowMobileForm] = useState(false);

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
        setShowMobileForm(true);
        // Scroll to form on mobile
        if (window.innerWidth < 992) {
            setTimeout(() => {
                document.getElementById('message-form-section')?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
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
        setShowMobileForm(true);
        // Scroll to form on mobile
        if (window.innerWidth < 992) {
            setTimeout(() => {
                document.getElementById('message-form-section')?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
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
            formDataToSend.append('recipients', 'all'); // Always send to all users
            
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
                setShowMobileForm(false);
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
        setShowMobileForm(false);
    };

    // Toggle mobile form visibility
    const toggleMobileForm = () => {
        setShowMobileForm(!showMobileForm);
        if (!showMobileForm) {
            // Reset form when opening
            if (activeTab === 'view') {
                setFormData({
                    title: '',
                    message: '',
                    isUrgent: false
                });
                setAttachments([]);
            }
        }
    };

    // Inline styles for responsive design with justified text
    const responsiveStyles = `
        /* Mobile hamburger menu fix */
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
            
            /* Mobile form styles */
            .mobile-form-fixed {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                z-index: 1040;
                background: white;
                box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
                border-top-left-radius: 12px;
                border-top-right-radius: 12px;
                max-height: 85vh;
                overflow-y: auto;
                transform: translateY(100%);
                transition: transform 0.3s ease-in-out;
            }
            
            .mobile-form-fixed.show {
                transform: translateY(0);
            }
            
            .mobile-form-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.5);
                z-index: 1039;
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.3s ease-in-out;
            }
            
            .mobile-form-overlay.show {
                opacity: 1;
                visibility: visible;
            }
            
            /* Desktop-only elements */
            .desktop-form {
                display: none;
            }
            
            .mobile-form-toggle {
                display: block !important;
            }
        }
        
        /* Desktop styles */
        @media (min-width: 992px) {
            .mobile-form-fixed,
            .mobile-form-overlay,
            .mobile-form-toggle {
                display: none !important;
            }
            
            .desktop-form {
                display: block;
            }
        }
        
        /* Responsive button and tab fixes */
        @media (max-width: 767.98px) {
            /* Tab navigation spacing */
            .nav-tabs {
                margin-bottom: 1.5rem !important;
            }
            
            .nav-tabs .nav-link {
                padding: 0.5rem 0.75rem;
                font-size: 0.875rem;
                margin-bottom: 0.5rem;
            }
            
            /* Message viewer card spacing */
            .message-viewer-actions {
                margin-top: 1rem !important;
                padding-top: 1rem !important;
                border-top: 1px solid rgba(0,0,0,0.125);
            }
            
            .message-viewer-actions .btn-group {
                width: 100%;
                display: flex;
                justify-content: space-between;
            }
            
            .message-viewer-actions .btn {
                flex: 1;
                margin: 0 0.125rem;
                padding: 0.375rem 0.5rem;
                font-size: 0.8125rem;
            }
            
            .message-viewer-actions .btn i {
                margin-right: 0.25rem;
            }
            
            /* Table actions on small screens */
            .table-actions-sm .btn-group {
                flex-wrap: wrap;
                gap: 0.25rem;
            }
            
            .table-actions-sm .btn {
                padding: 0.25rem 0.5rem;
                font-size: 0.75rem;
                min-width: 40px;
            }
            
            .table-actions-sm .btn i {
                margin-right: 0;
            }
            
            /* Card footer actions */
            .card-footer .d-flex {
                flex-direction: column;
                gap: 1rem;
            }
            
            .card-footer .btn-group-sm {
                width: 100%;
                justify-content: space-between;
            }
            
            .card-footer .btn-group-sm .btn {
                flex: 1;
                margin: 0 0.125rem;
                font-size: 0.8125rem;
            }
        }
        
        @media (max-width: 575.98px) {
            /* Extra small screens */
            .nav-tabs .nav-link {
                padding: 0.4rem 0.6rem;
                font-size: 0.8rem;
            }
            
            .nav-tabs .nav-link i {
                margin-right: 0.25rem;
            }
            
            /* Message viewer buttons */
            .message-viewer-actions .btn {
                font-size: 0.75rem;
                padding: 0.3rem 0.4rem;
            }
            
            .message-viewer-actions .btn i {
                font-size: 0.7rem;
            }
            
            /* Table adjustments */
            .table-responsive {
                margin-bottom: 1rem;
                border: 1px solid #dee2e6;
                border-radius: 0.375rem;
            }
            
            .table th, .table td {
                padding: 0.5rem;
            }
            
            .table th {
                font-size: 0.8rem;
            }
            
            .table td {
                font-size: 0.875rem;
            }
            
            /* Header adjustments */
            .container h2 {
                font-size: 1.5rem;
            }
            
            .badge {
                font-size: 0.7rem;
                padding: 0.35em 0.65em;
            }
            
            /* Mobile form toggle button */
            .mobile-form-toggle {
                padding: 0.75rem;
                font-size: 0.9rem;
            }
        }
        
        /* Medium screens (tablet) */
        @media (min-width: 576px) and (max-width: 767.98px) {
            .message-viewer-actions .btn {
                font-size: 0.85rem;
                padding: 0.4rem 0.6rem;
            }
            
            .nav-tabs .nav-link {
                font-size: 0.9rem;
            }
        }
        
        /* Button group spacing */
        .btn-group-spaced {
            gap: 0.5rem;
        }
        
        .btn-group-spaced .btn {
            border-radius: 0.375rem !important;
        }
        
        /* Tab spacing */
        .nav-tabs-spaced .nav-item {
            margin-right: 0.5rem;
            margin-bottom: 0.5rem;
        }
        
        /* Card footer actions with better spacing */
        .card-footer-actions {
            padding-top: 1rem;
            margin-top: 1rem;
        }
        
        /* ====== JUSTIFIED TEXT STYLES ====== */
        /* Professional justified text */
        .justified-text {
            text-align: justify;
            text-justify: inter-word;
            line-height: 1.6;
            word-spacing: 0.05em;
        }
        
        /* Textarea styling */
        textarea.form-control {
            text-align: justify;
            line-height: 1.5;
            font-size: 1rem;
            padding: 12px;
            border-radius: 6px;
            transition: all 0.3s ease;
        }
        
        textarea.form-control:focus {
            border-color: #86b7fe;
            box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
            transform: translateY(-1px);
        }
        
        /* Message content display */
        .message-content-display {
            text-align: justify;
            text-justify: inter-word;
            line-height: 1.7;
            font-size: 1.05rem;
            color: #333;
            white-space: pre-wrap;
            word-wrap: break-word;
            hyphens: auto;
        }
        
        /* Mobile adjustments for justified text */
        @media (max-width: 768px) {
            .justified-text {
                text-align: left;
                text-justify: auto;
                line-height: 1.5;
            }
            
            .message-content-display {
                text-align: left;
                font-size: 1rem;
                line-height: 1.6;
            }
            
            textarea.form-control {
                text-align: left;
                font-size: 0.95rem;
            }
        }
        
        /* Improved form elements */
        .form-control:focus {
            border-color: #86b7fe;
            box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
        }
        
        .form-check-input:checked {
            background-color: #0d6efd;
            border-color: #0d6efd;
        }
        
        .form-check-input:focus {
            border-color: #86b7fe;
            box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
        }
        
        /* Attachment styling */
        .attachment-list-item {
            padding: 10px 15px;
            border-radius: 6px;
            margin-bottom: 5px;
            transition: all 0.2s ease;
            border: 1px solid #dee2e6;
        }
        
        .attachment-list-item:hover {
            background-color: #f8f9fa;
            transform: translateX(5px);
            border-color: #86b7fe;
        }
        
        /* Better spacing for form sections */
        .form-section {
            margin-bottom: 1.5rem;
            padding-bottom: 1.5rem;
            border-bottom: 1px solid #e9ecef;
        }
        
        .form-section:last-child {
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
        }
        
        /* Enhanced card styling */
        .message-card {
            transition: all 0.2s ease;
            border-left: 4px solid transparent;
            border-radius: 8px;
        }
        
        .message-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 15px rgba(0,0,0,0.1);
        }
        
        .message-card.selected {
            border-left-color: #0d6efd;
            background-color: rgba(13, 110, 253, 0.05);
        }
        
        /* Improved table styling */
        .table-hover tbody tr:hover {
            background-color: rgba(13, 110, 253, 0.05);
        }
        
        .table th {
            font-weight: 600;
            color: #495057;
            border-bottom-width: 2px;
        }
        
        /* Better button styling */
        .btn {
            border-radius: 6px;
            font-weight: 500;
            transition: all 0.2s ease;
        }
        
        .btn:active {
            transform: scale(0.98);
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%);
            border: none;
        }
        
        .btn-primary:hover {
            background: linear-gradient(135deg, #0a58ca 0%, #084298 100%);
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(13, 110, 253, 0.3);
        }
        
        /* Alert improvements */
        .alert {
            border-radius: 8px;
            border: none;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        
        /* Pagination styling */
        .page-link {
            border-radius: 4px;
            margin: 0 2px;
            border: 1px solid #dee2e6;
        }
        
        .page-item.active .page-link {
            background: linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%);
            border-color: #0a58ca;
        }
    `;

    // Render the message form
    const renderMessageForm = () => (
        <div className="card" id="message-form">
            <div className="card-header bg-primary text-white">
                <div className="d-flex justify-content-between align-items-center">
                    <h4 className="mb-0">
                        <i className="fas fa-bullhorn me-2"></i>
                        {activeTab === 'edit' ? 'Edit Message' : activeTab === 'resend' ? 'Resend Message' : 'Send Important Information'}
                    </h4>
                    {window.innerWidth < 992 && (
                        <button 
                            type="button" 
                            className="btn btn-sm btn-light"
                            onClick={() => setShowMobileForm(false)}
                        >
                            <i className="fas fa-times"></i>
                        </button>
                    )}
                </div>
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
                    <div className="form-section">
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

                    <div className="form-section">
                        <label className="form-label">
                            Message <span className="text-danger">*</span>
                        </label>
                        <textarea
                            className="form-control justified-text"
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

                    <div className="form-section">
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
                                        <li key={index} className="attachment-list-item d-flex justify-content-between align-items-center mb-1">
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

                    <div className="form-section">
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
    );

    return (
        <>
            <style>{responsiveStyles}</style>
            
            {/* Mobile form overlay */}
            <div 
                className={`mobile-form-overlay ${showMobileForm ? 'show' : ''}`}
                onClick={() => setShowMobileForm(false)}
            ></div>
            
            {/* Mobile form fixed at bottom */}
            <div 
                className={`mobile-form-fixed ${showMobileForm ? 'show' : ''}`}
                id="message-form-section"
            >
                {renderMessageForm()}
            </div>
            
            <div className="container py-4">
                <div className="row">
                    <div className="col-lg-8">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h2 className="fs-4 fs-md-3">Important Information Archive</h2>
                            <div className="d-flex flex-wrap gap-2">
                                <span className="badge bg-secondary">
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
                        
                        {/* Mobile form toggle button */}
                        <button 
                            className="btn btn-primary w-100 mb-4 d-lg-none mobile-form-toggle"
                            onClick={toggleMobileForm}
                        >
                            <i className="fas fa-bullhorn me-2"></i>
                            {showMobileForm ? 'Hide Form' : 'Send Important Information'}
                        </button>
                        
                        {/* Alerts */}
                        {success && (
                            <div className="alert alert-success alert-dismissible fade show mb-4" role="alert">
                                <i className="fas fa-check-circle me-2"></i>
                                {success}
                                <button type="button" className="btn-close" onClick={() => setSuccess('')}></button>
                            </div>
                        )}
                        
                        {error && (
                            <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert">
                                <i className="fas fa-exclamation-circle me-2"></i>
                                {error}
                                <button type="button" className="btn-close" onClick={() => setError('')}></button>
                            </div>
                        )}
                        
                        {/* Tab Navigation */}
                        <div className="mb-4">
                            <ul className="nav nav-tabs nav-tabs-spaced">
                                <li className="nav-item">
                                    <button
                                        className={`nav-link ${activeTab === 'view' ? 'active' : ''}`}
                                        onClick={() => {
                                            setActiveTab('view');
                                            setSelectedMessage(null);
                                        }}
                                    >
                                        <i className="fas fa-list me-1 me-sm-2"></i>
                                        <span className="d-none d-sm-inline">View Messages</span>
                                        <span className="d-inline d-sm-none">View</span>
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
                                        <i className="fas fa-edit me-1 me-sm-2"></i>
                                        <span className="d-none d-sm-inline">Edit Message</span>
                                        <span className="d-inline d-sm-none">Edit</span>
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
                                        <i className="fas fa-redo me-1 me-sm-2"></i>
                                        <span className="d-none d-sm-inline">Resend Message</span>
                                        <span className="d-inline d-sm-none">Resend</span>
                                    </button>
                                </li>
                            </ul>
                        </div>

                        {/* Message Viewer for View Mode */}
                        {activeTab === 'view' && selectedMessage && (
                            <div className="card mb-4">
                                <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                                    <h5 className="mb-0 fs-5 fs-md-4">
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
                                    <h4 className="fs-5 fs-md-4">{selectedMessage.title}</h4>
                                    {selectedMessage.isUrgent && (
                                        <span className="badge bg-danger mb-3">URGENT</span>
                                    )}
                                    <div className="mb-3">
                                        <small className="text-muted d-block mb-1">
                                            <i className="fas fa-user me-1"></i>
                                            Sent by: {selectedMessage.sender?.name || 'Admin'}
                                        </small>
                                        <small className="text-muted d-block mb-2">
                                            <i className="fas fa-clock me-1"></i>
                                            Date: {formatDate(selectedMessage.createdAt)}
                                        </small>
                                        <small className="text-muted d-block">
                                            <i className="fas fa-users me-1"></i>
                                            Read by: {selectedMessage.readBy?.length || 0} users
                                        </small>
                                    </div>
                                    <div className="border rounded p-3 bg-light mb-3">
                                        <p className="mb-0 message-content-display justified-text">
                                            {selectedMessage.content || selectedMessage.message}
                                        </p>
                                    </div>
                                    
                                    {selectedMessage.attachments?.length > 0 && (
                                        <div className="mt-4">
                                            <h6 className="fs-6">
                                                <i className="fas fa-paperclip me-2"></i>
                                                Attachments
                                            </h6>
                                            <div className="list-group">
                                                {selectedMessage.attachments.map((attachment, index) => (
                                                    <a
                                                        key={index}
                                                        href={attachment.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                                                    >
                                                        <div className="text-truncate">
                                                            <i className={`fas fa-file-${attachment.type?.includes('pdf') ? 'pdf' : attachment.type?.includes('image') ? 'image' : 'word'} me-2`}></i>
                                                            <small>{attachment.filename || attachment.name}</small>
                                                        </div>
                                                        <i className="fas fa-download"></i>
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="card-footer card-footer-actions">
                                    <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2">
                                        <div className="message-viewer-actions w-100">
                                            <div className="btn-group btn-group-sm w-100">
                                                <button
                                                    className="btn btn-outline-primary"
                                                    onClick={() => handleEditMessage(selectedMessage)}
                                                >
                                                    <i className="fas fa-edit me-1"></i>
                                                    Edit
                                                </button>
                                                <button
                                                    className="btn btn-outline-warning"
                                                    onClick={() => handleResendMessage(selectedMessage)}
                                                >
                                                    <i className="fas fa-redo me-1"></i>
                                                    Resend
                                                </button>
                                                <button
                                                    className="btn btn-outline-danger"
                                                    onClick={() => handleDelete(selectedMessage._id)}
                                                >
                                                    <i className="fas fa-trash me-1"></i>
                                                    Delete
                                                </button>
                                            </div>
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
                                                    className={`message-card ${selectedMessage?._id === message._id ? 'selected' : ''}`}
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
                                                        <div className="btn-group btn-group-sm table-actions-sm">
                                                            <button
                                                                className="btn btn-outline-primary"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleViewMessage(message);
                                                                }}
                                                                title="View"
                                                            >
                                                                <i className="fas fa-eye"></i>
                                                                <span className="d-none d-md-inline ms-1">View</span>
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
                                                                <span className="d-none d-md-inline ms-1">Edit</span>
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
                                                                <span className="d-none d-md-inline ms-1">Resend</span>
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
                                                                <span className="d-none d-md-inline ms-1">Delete</span>
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
                                                    <i className="fas fa-chevron-left me-1 d-none d-md-inline"></i>
                                                    <span className="d-inline d-md-none">‹</span>
                                                    <span className="d-none d-md-inline">Previous</span>
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
                                                    <span className="d-none d-md-inline">Next</span>
                                                    <span className="d-inline d-md-none">›</span>
                                                    <i className="fas fa-chevron-right ms-1 d-none d-md-inline"></i>
                                                </button>
                                            </li>
                                        </ul>
                                    </nav>
                                )}
                            </>
                        )}
                    </div>

                    {/* Desktop form sidebar */}
                    <div className="col-lg-4 desktop-form">
                        <div className="sticky-top" style={{ top: '20px' }}>
                            {renderMessageForm()}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ImportantInfoAdmin;