// travel-tour-frontend/src/components/ImportantInfoUser.jsx

import React, { useState, useEffect } from 'react';
import { importantInfoService } from '../services/importantInfoApi';
import socketService from '../services/socketService';

const ImportantInfoUser = () => {
    const [messages, setMessages] = useState([]);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10
    });
    const [loading, setLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [selectedMessage, setSelectedMessage] = useState(null);

    useEffect(() => {
        fetchMessages();
        fetchUnreadCount();
        setupSocket();
        
        return () => {
            socketService.removeListener('new-important-info');
            socketService.removeListener('notification-updated');
        };
    }, [pagination.currentPage]);

    const setupSocket = () => {
        socketService.connect();
        
        socketService.onNewImportantInfo((data) => {
            // Update unread count and refresh messages
            fetchUnreadCount();
            fetchMessages();
        });
        
        socketService.onNotificationUpdate((data) => {
            if (data.type === 'important-info' && data.countDecreased) {
                fetchUnreadCount();
            }
        });
    };

    const fetchMessages = async () => {
        try {
            setLoading(true);
            const response = await importantInfoService.getUserMessages(
                pagination.currentPage,
                pagination.itemsPerPage
            );
            
            if (response.data.success) {
                setMessages(response.data.data);
                setPagination(response.data.pagination);
            }
        } catch (err) {
            console.error('Error fetching messages:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchUnreadCount = async () => {
        try {
            const response = await importantInfoService.getUnreadCount();
            if (response.data.success) {
                setUnreadCount(response.data.count);
            }
        } catch (err) {
            console.error('Error fetching unread count:', err);
        }
    };

    const handleMarkAsRead = async (messageId) => {
        try {
            await importantInfoService.markAsRead(messageId);
            
            // Update local state
            setMessages(prev => prev.map(msg => 
                msg._id === messageId ? { ...msg, isRead: true } : msg
            ));
            
            // Update unread count
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Error marking as read:', err);
        }
    };

    const handleDelete = async (messageId) => {
        if (window.confirm('Are you sure you want to delete this message?')) {
            try {
                await importantInfoService.deleteMessage(messageId);
                fetchMessages(); // Refresh the list
                fetchUnreadCount(); // Update count
            } catch (err) {
                console.error('Error deleting message:', err);
            }
        }
    };

    const handleViewMessage = (message) => {
        setSelectedMessage(message);
        
        // Mark as read if not already read
        if (!message.isRead) {
            handleMarkAsRead(message._id);
        }
    };

    const handleCloseModal = () => {
        setSelectedMessage(null);
    };

    const handlePageChange = (page) => {
        setPagination(prev => ({ ...prev, currentPage: page }));
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

    const downloadFile = (file) => {
        window.open(file.url, '_blank');
    };

    return (
        <div className="container py-4">
            <div className="row">
                <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h2>Important Information</h2>
                        {unreadCount > 0 && (
                            <span className="badge bg-danger">
                                {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>

                    <div className="mb-4">
                        <p className="text-muted">
                            <i className="fas fa-info-circle me-2"></i>
                            Do you want to contact the Admin? 
                            <a href="/contact-us" className="ms-1 fw-bold">Contact</a>
                        </p>
                    </div>

                    {loading && !messages.length ? (
                        <div className="text-center">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="alert alert-info">
                            <i className="fas fa-inbox me-2"></i>
                            No important information available.
                        </div>
                    ) : (
                        <>
                            <div className="list-group">
                                {messages.map((message) => (
                                    <div 
                                        key={message._id} 
                                        className={`list-group-item list-group-item-action ${!message.isRead ? 'list-group-item-warning' : ''}`}
                                        onClick={() => handleViewMessage(message)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="d-flex w-100 justify-content-between align-items-start">
                                            <div>
                                                <h5 className="mb-1">
                                                    {message.title}
                                                    {message.isUrgent && (
                                                        <span className="badge bg-danger ms-2">Urgent</span>
                                                    )}
                                                    {!message.isRead && (
                                                        <span className="badge bg-primary ms-2">New</span>
                                                    )}
                                                </h5>
                                                <p className="mb-1 text-muted">
                                                    From: {message.sender?.name || 'Admin'}
                                                </p>
                                                <small className="text-muted">
                                                    {formatDate(message.createdAt)}
                                                </small>
                                            </div>
                                            <div>
                                                {message.attachments?.length > 0 && (
                                                    <span className="badge bg-secondary me-2">
                                                        <i className="fas fa-paperclip me-1"></i>
                                                        {message.attachments.length}
                                                    </span>
                                                )}
                                                <button
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(message._id);
                                                    }}
                                                >
                                                    <i className="fas fa-trash"></i>
                                                </button>
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
                                            >
                                                Previous
                                            </button>
                                        </li>
                                        
                                        {[...Array(pagination.totalPages)].map((_, index) => (
                                            <li 
                                                key={index + 1}
                                                className={`page-item ${pagination.currentPage === index + 1 ? 'active' : ''}`}
                                            >
                                                <button
                                                    className="page-link"
                                                    onClick={() => handlePageChange(index + 1)}
                                                >
                                                    {index + 1}
                                                </button>
                                            </li>
                                        ))}
                                        
                                        <li className={`page-item ${pagination.currentPage === pagination.totalPages ? 'disabled' : ''}`}>
                                            <button
                                                className="page-link"
                                                onClick={() => handlePageChange(pagination.currentPage + 1)}
                                            >
                                                Next
                                            </button>
                                        </li>
                                    </ul>
                                </nav>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Message Detail Modal */}
            {selectedMessage && (
                <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {selectedMessage.title}
                                    {selectedMessage.isUrgent && (
                                        <span className="badge bg-danger ms-2">Urgent</span>
                                    )}
                                </h5>
                                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <small className="text-muted">
                                        From: {selectedMessage.sender?.name || 'Admin'} | 
                                        Date: {formatDate(selectedMessage.createdAt)}
                                    </small>
                                </div>
                                
                                <div className="mb-4">
                                    <div dangerouslySetInnerHTML={{ 
                                        __html: selectedMessage.message.replace(/\n/g, '<br>') 
                                    }} />
                                </div>

                                {selectedMessage.attachments?.length > 0 && (
                                    <div className="mb-3">
                                        <h6>Attachments:</h6>
                                        <div className="list-group">
                                            {selectedMessage.attachments.map((file, index) => (
                                                <div key={index} className="list-group-item">
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <div>
                                                            <i className={`fas fa-file-${file.fileType === 'pdf' ? 'pdf' : file.fileType === 'image' ? 'image' : 'word'} me-2`}></i>
                                                            {file.originalname}
                                                            <small className="text-muted ms-2">
                                                                ({Math.round(file.size / 1024)} KB)
                                                            </small>
                                                        </div>
                                                        <button
                                                            className="btn btn-sm btn-outline-primary"
                                                            onClick={() => downloadFile(file)}
                                                        >
                                                            <i className="fas fa-download me-1"></i>
                                                            Download
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="alert alert-info mt-4">
                                    <i className="fas fa-info-circle me-2"></i>
                                    Do you want to contact the Admin? 
                                    <a href="/contact-us" className="ms-1 fw-bold">Contact</a>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={handleCloseModal}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImportantInfoUser;