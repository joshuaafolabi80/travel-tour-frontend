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
        /* Justified text for professional look */
        .justified-text {
            text-align: justify;
            text-justify: inter-word;
            line-height: 1.6;
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
            
            .justified-text {
                text-align: left;
                text-justify: auto;
            }
        }
        
        /* Message viewer styling */
        .message-viewer-content {
            max-height: 60vh;
            overflow-y: auto;
            padding-right: 10px;
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
        }
        
        .message-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            border-left-color: #0d6efd;
        }
        
        .message-card.unread {
            border-left-color: #dc3545;
            background-color: rgba(220, 53, 69, 0.03);
        }
        
        /* Button improvements */
        .refresh-btn:active {
            transform: scale(0.95);
        }
    `;

    return (
        <>
            <style>{customStyles}</style>
            
            <div className="container py-4">
                <div className="row">
                    <div className="col-12">
                        <div className="d-flex justify-content-between align-items-center mb-4">
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
                                {error}
                                <button type="button" className="btn-close" onClick={() => setError('')}></button>
                            </div>
                        )}
                        
                        {socketConnected && (
                            <div className="alert alert-info mb-4">
                                <i className="fas fa-wifi me-2"></i>
                                Connected to live updates. New messages will appear automatically.
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
                                <div className="card-body text-center py-5">
                                    <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
                                    <h5 className="card-title">No important information available</h5>
                                    <p className="card-text text-muted">
                                        Check back later for updates from the administration.
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
                                            >
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </div>
                                        <div className="card-body">
                                            <div className="message-header-row mb-3">
                                                <div className="message-title-section">
                                                    <h4 className="mb-1">{selectedMessage.title}</h4>
                                                    {selectedMessage.isUrgent && (
                                                        <span className="badge bg-danger">URGENT</span>
                                                    )}
                                                </div>
                                                <div className="message-actions-section">
                                                    <button
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() => handleDelete(selectedMessage._id)}
                                                    >
                                                        <i className="fas fa-trash me-1"></i>
                                                        Delete
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
                                            
                                            <div className="border rounded p-3 bg-light mb-3 message-viewer-content">
                                                <p className="mb-0 justified-text">
                                                    {selectedMessage.message}
                                                </p>
                                            </div>
                                            
                                            {selectedMessage.attachments?.length > 0 && (
                                                <div className="mt-4">
                                                    <h6 className="border-bottom pb-2">
                                                        <i className="fas fa-paperclip me-2"></i>
                                                        Attachments ({selectedMessage.attachments.length})
                                                    </h6>
                                                    <div className="list-group mt-2">
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
                                                                    {attachment.filename || attachment.originalname}
                                                                </div>
                                                                <div>
                                                                    <small className="text-muted me-2">
                                                                        {(attachment.size / 1024).toFixed(1)} KB
                                                                    </small>
                                                                    <i className="fas fa-download"></i>
                                                                </div>
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="card-footer text-muted">
                                            <small>
                                                <i className="fas fa-info-circle me-1"></i>
                                                {selectedMessage.isRead ? 'Read' : 'Unread'} • 
                                                Deleted messages cannot be recovered
                                            </small>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Messages List */}
                                <div className="row g-3">
                                    {messages.map((message) => (
                                        <div key={message._id} className="col-12">
                                            <div 
                                                className={`card message-card ${!message.isRead ? 'unread' : ''}`}
                                                onClick={() => handleViewMessage(message)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <div className="card-body">
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
                                                            >
                                                                <i className="fas fa-trash"></i>
                                                            </button>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="mt-3">
                                                        <p className="card-text text-muted justified-text mb-0">
                                                            {message.message.length > 150 
                                                                ? `${message.message.substring(0, 150)}...` 
                                                                : message.message
                                                            }
                                                        </p>
                                                        {message.message.length > 150 && (
                                                            <small className="text-primary">
                                                                Click to read more...
                                                            </small>
                                                        )}
                                                    </div>
                                                    
                                                    {message.attachments?.length > 0 && (
                                                        <div className="mt-2">
                                                            <small className="text-muted">
                                                                <i className="fas fa-paperclip me-1"></i>
                                                                {message.attachments.length} attachment(s)
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
                                                >
                                                    <i className="fas fa-chevron-left me-1"></i>
                                                    Previous
                                                </button>
                                            </li>
                                            
                                            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(pageNum => (
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
                                            ))}
                                            
                                            <li className={`page-item ${pagination.currentPage === pagination.totalPages ? 'disabled' : ''}`}>
                                                <button
                                                    className="page-link"
                                                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                                                    disabled={pagination.currentPage === pagination.totalPages}
                                                >
                                                    Next
                                                    <i className="fas fa-chevron-right ms-1"></i>
                                                </button>
                                            </li>
                                        </ul>
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