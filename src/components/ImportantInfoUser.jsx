// travel-tour-frontend/src/components/ImportantInfoUser.jsx
import React, { useState, useEffect, useRef } from 'react';
import { importantInfoService } from '../services/importantInfoApi';

const ImportantInfoUser = () => {
    const [messages, setMessages] = useState([]);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10
    });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [socketConnected, setSocketConnected] = useState(false);
    const socketRef = useRef(null);

    useEffect(() => {
        fetchMessages();
        fetchUnreadCount();
        setupSocketConnection();
        
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, [pagination.currentPage]);

    const setupSocketConnection = () => {
        // Socket setup code remains the same
        const token = localStorage.getItem('authToken');
        if (!token) return;
        
        try {
            const socketUrl = 'https://travel-tour-important-info-backend.onrender.com';
            
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
            
            // Your existing socket setup code here
            console.log('🔌 Setting up socket connection...');
            setSocketConnected(true);
        } catch (error) {
            console.error('Socket connection error:', error);
            setSocketConnected(false);
        }
    };

    const fetchMessages = async () => {
        try {
            setLoading(true);
            console.log('📋 Fetching user important info messages...');
            
            const response = await importantInfoService.getUserMessages(
                pagination.currentPage, 
                pagination.itemsPerPage
            );
            
            console.log('📋 User messages response:', response.data);
            
            if (response.data.success) {
                setMessages(response.data.data);
                setPagination(response.data.pagination);
            }
        } catch (err) {
            console.error('❌ Error fetching user messages:', err);
            
            if (err.code === 'ERR_NETWORK') {
                setError('Cannot connect to Important Information server. Please check if the server is running.');
            } else if (err.response?.status === 401) {
                setError('Session expired. Please log in again.');
            } else {
                setError(err.response?.data?.message || 'Error fetching messages');
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchUnreadCount = async () => {
        try {
            const response = await importantInfoService.getUnreadCount();
            if (response.data.success) {
                setUnreadCount(response.data.count);
            }
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchMessages();
        fetchUnreadCount();
    };

    const handleViewMessage = async (message) => {
        setSelectedMessage(message);
        
        // Mark as read if not already read
        if (!message.isRead) {
            try {
                await importantInfoService.markAsRead(message._id);
                // Update local state
                setMessages(prev => prev.map(msg => 
                    msg._id === message._id ? { ...msg, isRead: true } : msg
                ));
                fetchUnreadCount();
            } catch (error) {
                console.error('Error marking message as read:', error);
            }
        }
    };

    const handleDelete = async (messageId) => {
        if (window.confirm('Are you sure you want to delete this message? This action cannot be undone.')) {
            try {
                await importantInfoService.deleteMessage(messageId);
                setSelectedMessage(null);
                fetchMessages(); // Refresh the list
                fetchUnreadCount();
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

    const closeMessageViewer = () => {
        setSelectedMessage(null);
    };

    // Inline styles for improvements
    const customStyles = `
        /* ====== JUSTIFIED TEXT STYLES ====== */
        /* Professional justified text for all content - FIXED FOR MOBILE */
        .justified-text {
            text-align: justify;
            text-justify: inter-word;
            line-height: 1.6;
            word-spacing: 0.05em;
            hyphens: auto;
            -webkit-hyphens: auto;
            -moz-hyphens: auto;
            -ms-hyphens: auto;
        }
        
        /* Message content display with better spacing */
        .message-content-display {
            text-align: justify;
            text-justify: inter-word;
            line-height: 1.7;
            font-size: 1.05rem;
            color: #333;
            white-space: pre-wrap;
            word-wrap: break-word;
            hyphens: auto;
            -webkit-hyphens: auto;
            word-spacing: 0.1em;
        }
        
        /* Card text justification */
        .card-text-justified {
            text-align: justify;
            text-justify: inter-word;
            line-height: 1.6;
            word-spacing: 0.05em;
            hyphens: auto;
        }
        
        /* Alert text justification */
        .alert-text-justified {
            text-align: justify;
            text-justify: inter-word;
            line-height: 1.5;
            word-spacing: 0.02em;
        }
        
        /* Mobile adjustments for justified text - REMOVED left alignment */
        @media (max-width: 768px) {
            /* Keep justification on mobile */
            .justified-text {
                text-align: justify;
                text-justify: inter-word;
                line-height: 1.6;
                word-spacing: 0.03em; /* Slightly less spacing on mobile */
                hyphens: auto;
                -webkit-hyphens: auto;
            }
            
            .message-content-display {
                text-align: justify;
                font-size: 1rem;
                line-height: 1.6;
                word-spacing: 0.05em;
            }
            
            .card-text-justified {
                text-align: justify;
                text-justify: inter-word;
                line-height: 1.5;
                word-spacing: 0.03em;
            }
            
            .alert-text-justified {
                text-align: justify;
                line-height: 1.4;
            }
            
            /* Improve mobile readability with better font sizing */
            .message-viewer-content {
                font-size: 0.95rem;
                padding: 15px;
            }
        }
        
        /* Very small screens adjustments */
        @media (max-width: 480px) {
            .message-content-display {
                font-size: 0.95rem;
                line-height: 1.55;
            }
            
            .justified-text {
                line-height: 1.55;
            }
        }
        
        /* Better spacing for badges and buttons */
        .message-header-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 10px;
            flex-wrap: wrap;
        }
        
        .message-title-section {
            flex: 1;
            min-width: 200px;
        }
        
        .message-actions-section {
            display: flex;
            align-items: center;
            gap: 10px;
            flex-shrink: 0;
        }
        
        /* Space between New badge and delete button */
        .new-badge-spacing {
            margin-right: 8px;
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
            .message-header-row {
                flex-direction: column;
                align-items: stretch;
                gap: 8px;
            }
            
            .message-actions-section {
                justify-content: flex-start;
                margin-top: 5px;
            }
        }
        
        /* Message viewer styling */
        .message-viewer-content {
            max-height: 60vh;
            overflow-y: auto;
            padding-right: 10px;
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            text-align: justify; /* Ensure content is justified */
        }
        
        .message-viewer-content::-webkit-scrollbar {
            width: 6px;
        }
        
        .message-viewer-content::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 3px;
        }
        
        .message-viewer-content::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 3px;
        }
        
        .message-viewer-content::-webkit-scrollbar-thumb:hover {
            background: #555;
        }
        
        /* Card hover effects */
        .message-card {
            transition: all 0.2s ease;
            border-left: 4px solid transparent;
            border-radius: 8px;
            overflow: hidden;
        }
        
        .message-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 15px rgba(0,0,0,0.1);
            border-left-color: #0d6efd;
        }
        
        .message-card.unread {
            border-left-color: #dc3545;
            background-color: rgba(220, 53, 69, 0.03);
        }
        
        .message-card.selected {
            border-left-color: #0d6efd;
            background-color: rgba(13, 110, 253, 0.05);
        }
        
        /* Button improvements */
        .refresh-btn:active {
            transform: scale(0.95);
        }
        
        /* Form control improvements */
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
        
        /* Improved typography */
        h1, h2, h3, h4, h5, h6 {
            line-height: 1.3;
        }
        
        .card-title {
            line-height: 1.4;
        }
        
        /* Enhanced badge styling */
        .badge {
            font-weight: 500;
            letter-spacing: 0.02em;
        }
        
        /* Better pagination */
        .page-link {
            border-radius: 4px;
            margin: 0 2px;
            border: 1px solid #dee2e6;
            transition: all 0.2s ease;
        }
        
        .page-item.active .page-link {
            background: linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%);
            border-color: #0a58ca;
        }
        
        /* Attachment styling */
        .attachment-list-item {
            transition: all 0.2s ease;
            border-left: 3px solid transparent;
        }
        
        .attachment-list-item:hover {
            background-color: #f8f9fa;
            transform: translateX(5px);
            border-left-color: #0d6efd;
        }
        
        /* Improved spacing */
        .section-spacing {
            margin-bottom: 2rem;
        }
        
        /* Enhanced alert styling */
        .alert {
            border-radius: 8px;
            border: none;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        
        /* Read/Unread indicator */
        .unread-indicator {
            position: absolute;
            top: 15px;
            right: 15px;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: #dc3545;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0% {
                box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.7);
            }
            70% {
                box-shadow: 0 0 0 6px rgba(220, 53, 69, 0);
            }
            100% {
                box-shadow: 0 0 0 0 rgba(220, 53, 69, 0);
            }
        }
        
        /* Improved empty state */
        .empty-state {
            padding: 3rem 1rem;
            text-align: center;
        }
        
        .empty-state-icon {
            font-size: 3rem;
            opacity: 0.7;
            margin-bottom: 1rem;
        }
        
        /* Better table/text spacing */
        p, li, td {
            line-height: 1.6;
        }
        
        /* Professional color scheme */
        .text-primary {
            color: #0d6efd !important;
        }
        
        .bg-primary {
            background-color: #0d6efd !important;
        }
        
        /* Loading spinner improvements */
        .spinner-border {
            width: 3rem;
            height: 3rem;
        }
        
        /* Card body padding improvements */
        .card-body {
            padding: 1.5rem;
        }
        
        @media (max-width: 768px) {
            .card-body {
                padding: 1.25rem;
            }
        }
        
        /* Improved message preview truncation */
        .message-preview {
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-overflow: ellipsis;
            text-align: justify; /* Ensure preview is justified */
        }
        
        /* Ensure all paragraphs in message content are justified */
        .message-viewer-content p,
        .message-viewer-content div,
        .message-viewer-content span {
            text-align: justify;
        }
        
        /* Fix for Safari mobile justification */
        @supports (-webkit-touch-callout: none) {
            .justified-text {
                text-align: justify;
                -webkit-text-justify: inter-word;
                text-justify: inter-word;
            }
        }
        
        /* Improve word breaking for long words */
        .message-content-display,
        .justified-text,
        .card-text-justified {
            overflow-wrap: break-word;
            word-break: break-word;
        }
    `;

    return (
        <>
            <style>{customStyles}</style>
            
            <div className="container py-4">
                <div className="row">
                    <div className="col-12">
                        <div className="d-flex justify-content-between align-items-center mb-4 section-spacing">
                            <h2 className="fs-4 fs-md-3">
                                <i className="fas fa-info-circle me-2"></i>
                                Important Information
                            </h2>
                            <div className="d-flex align-items-center gap-3">
                                {unreadCount > 0 && (
                                    <span className="badge bg-danger">
                                        <i className="fas fa-bell me-1"></i>
                                        {unreadCount} New
                                    </span>
                                )}
                                
                                <button 
                                    className="btn btn-outline-primary refresh-btn"
                                    onClick={handleRefresh}
                                    disabled={refreshing}
                                    title="Refresh messages"
                                >
                                    {refreshing ? (
                                        <span className="spinner-border spinner-border-sm" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </span>
                                    ) : (
                                        <>
                                            <i className="fas fa-sync-alt me-1"></i>
                                            <span className="d-none d-md-inline">Refresh</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                        
                        {error && (
                            <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert">
                                <i className="fas fa-exclamation-circle me-2"></i>
                                <span className="alert-text-justified">{error}</span>
                                <button type="button" className="btn-close" onClick={() => setError('')}></button>
                            </div>
                        )}
                        
                        {socketConnected && (
                            <div className="alert alert-info mb-4">
                                <i className="fas fa-wifi me-2"></i>
                                <span className="alert-text-justified">
                                    Connected to live updates. New messages will appear automatically.
                                </span>
                            </div>
                        )}
                        
                        {loading && !messages.length ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                                <p className="mt-2">Loading important information...</p>
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="card">
                                <div className="card-body empty-state">
                                    <i className="fas fa-inbox empty-state-icon text-muted"></i>
                                    <h5 className="card-title">No important information available</h5>
                                    <p className="card-text text-muted mb-4 justified-text">
                                        Check back later for updates from the administration. Important announcements and notifications will appear here when available.
                                    </p>
                                    <button 
                                        className="btn btn-primary mt-2"
                                        onClick={handleRefresh}
                                        disabled={refreshing}
                                    >
                                        <i className="fas fa-sync-alt me-2"></i>
                                        Check for new messages
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Message Viewer */}
                                {selectedMessage && (
                                    <div className="card mb-4">
                                        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                                            <h5 className="mb-0">
                                                <i className="fas fa-eye me-2"></i>
                                                Viewing Message
                                            </h5>
                                            <button
                                                className="btn btn-sm btn-light"
                                                onClick={closeMessageViewer}
                                                aria-label="Close message viewer"
                                            >
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </div>
                                        <div className="card-body">
                                            <div className="message-header-row mb-3">
                                                <div className="message-title-section">
                                                    <h4 className="mb-1">{selectedMessage.title}</h4>
                                                    <div className="d-flex flex-wrap gap-2 mt-1">
                                                        {selectedMessage.isUrgent && (
                                                            <span className="badge bg-danger">URGENT</span>
                                                        )}
                                                        {!selectedMessage.isRead && (
                                                            <span className="badge bg-success">NEW</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="message-actions-section">
                                                    <button
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() => handleDelete(selectedMessage._id)}
                                                        aria-label="Delete message"
                                                    >
                                                        <i className="fas fa-trash me-1"></i>
                                                        <span className="d-none d-sm-inline">Delete</span>
                                                        <span className="d-inline d-sm-none">Del</span>
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            <div className="mb-3">
                                                <small className="text-muted d-block mb-1">
                                                    <i className="fas fa-user me-1"></i>
                                                    From: {selectedMessage.sender?.name || 'Admin'}
                                                </small>
                                                <small className="text-muted d-block">
                                                    <i className="fas fa-clock me-1"></i>
                                                    Sent: {formatDate(selectedMessage.createdAt)}
                                                </small>
                                            </div>
                                            
                                            <div className="message-viewer-content">
                                                <div className="message-content-display justified-text">
                                                    {selectedMessage.message}
                                                </div>
                                            </div>
                                            
                                            {selectedMessage.attachments?.length > 0 && (
                                                <div className="mt-4">
                                                    <h6 className="border-bottom pb-2 mb-3">
                                                        <i className="fas fa-paperclip me-2"></i>
                                                        Attachments ({selectedMessage.attachments.length})
                                                    </h6>
                                                    <div className="list-group">
                                                        {selectedMessage.attachments.map((attachment, index) => (
                                                            <a
                                                                key={index}
                                                                href={attachment.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="list-group-item list-group-item-action attachment-list-item d-flex justify-content-between align-items-center"
                                                            >
                                                                <div className="text-truncate">
                                                                    <i className={`fas fa-file-${attachment.type?.includes('pdf') ? 'pdf' : attachment.type?.includes('image') ? 'image' : 'word'} me-2`}></i>
                                                                    <span className="fw-medium">
                                                                        {attachment.filename || attachment.originalname}
                                                                    </span>
                                                                </div>
                                                                <div className="d-flex align-items-center">
                                                                    <small className="text-muted me-3 d-none d-sm-block">
                                                                        {(attachment.size / 1024).toFixed(1)} KB
                                                                    </small>
                                                                    <i className="fas fa-download text-primary"></i>
                                                                </div>
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="card-footer text-muted d-flex justify-content-between align-items-center">
                                            <small className="alert-text-justified">
                                                <i className="fas fa-info-circle me-1"></i>
                                                {selectedMessage.isRead ? 'Read' : 'Unread'} • 
                                                Deleted messages cannot be recovered
                                            </small>
                                            <button
                                                className="btn btn-sm btn-outline-secondary"
                                                onClick={closeMessageViewer}
                                            >
                                                <i className="fas fa-times me-1"></i>
                                                Close
                                            </button>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Messages List */}
                                <div className="row g-3">
                                    {messages.map((message) => (
                                        <div key={message._id} className="col-12">
                                            <div 
                                                className={`card message-card ${!message.isRead ? 'unread' : ''} ${selectedMessage?._id === message._id ? 'selected' : ''}`}
                                                onClick={() => handleViewMessage(message)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <div className="card-body position-relative">
                                                    {!message.isRead && (
                                                        <div className="unread-indicator"></div>
                                                    )}
                                                    
                                                    <div className="message-header-row">
                                                        <div className="message-title-section">
                                                            <h5 className="card-title mb-1">
                                                                {message.title}
                                                                {message.isUrgent && (
                                                                    <span className="badge bg-danger ms-2">URGENT</span>
                                                                )}
                                                            </h5>
                                                            <div className="d-flex flex-wrap gap-2 align-items-center mt-1">
                                                                <small className="text-muted">
                                                                    <i className="fas fa-user me-1"></i>
                                                                    {message.sender?.name || 'Admin'}
                                                                </small>
                                                                <small className="text-muted">
                                                                    <i className="fas fa-clock me-1"></i>
                                                                    {formatDate(message.createdAt)}
                                                                </small>
                                                                {!message.isRead && (
                                                                    <span className="badge bg-success new-badge-spacing">
                                                                        <i className="fas fa-envelope me-1"></i>
                                                                        NEW
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="message-actions-section">
                                                            <button
                                                                className="btn btn-sm btn-outline-danger"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDelete(message._id);
                                                                }}
                                                                title="Delete message"
                                                                aria-label="Delete message"
                                                            >
                                                                <i className="fas fa-trash"></i>
                                                                <span className="d-none d-sm-inline ms-1">Delete</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="mt-3">
                                                        <div className="card-text text-muted card-text-justified message-preview">
                                                            {message.message}
                                                        </div>
                                                        {message.message.length > 150 && (
                                                            <small className="text-primary mt-2 d-block">
                                                                <i className="fas fa-arrow-right me-1"></i>
                                                                Click to read full message...
                                                            </small>
                                                        )}
                                                    </div>
                                                    
                                                    {message.attachments?.length > 0 && (
                                                        <div className="mt-3 pt-3 border-top">
                                                            <small className="text-muted">
                                                                <i className="fas fa-paperclip me-1"></i>
                                                                {message.attachments.length} attachment{message.attachments.length !== 1 ? 's' : ''}
                                                            </small>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
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
                                                    aria-label="Previous page"
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
                                                                aria-label={`Page ${pageNum}`}
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
                                                    aria-label="Next page"
                                                >
                                                    <span className="d-none d-md-inline">Next</span>
                                                    <span className="d-inline d-md-none">›</span>
                                                    <i className="fas fa-chevron-right ms-1 d-none d-md-inline"></i>
                                                </button>
                                            </li>
                                        </ul>
                                        <div className="text-center mt-2">
                                            <small className="text-muted">
                                                Page {pagination.currentPage} of {pagination.totalPages} • 
                                                Showing {messages.length} of {pagination.totalItems} messages
                                            </small>
                                        </div>
                                    </nav>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default ImportantInfoUser;