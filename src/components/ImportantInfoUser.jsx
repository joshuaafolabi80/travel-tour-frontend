// travel-tour-frontend/src/components/ImportantInfoUser.jsx - COMPLETE UPDATED VERSION WITH DEBUG
import React, { useState, useEffect } from 'react';
import { importantInfoService, importantInfoApi } from '../services/importantInfoApi';
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
    const [error, setError] = useState('');

    useEffect(() => {
        console.log('📱 ImportantInfoUser mounted - fetching messages...');
        fetchMessages();
        fetchUnreadCount();
        setupSocket();
        
        return () => {
            socketService.removeListener('new-important-info');
            socketService.removeListener('notification-updated');
        };
    }, [pagination.currentPage]);

    const setupSocket = () => {
        console.log('🔌 Setting up socket connection...');
        socketService.connect();
        
        socketService.onNewImportantInfo((data) => {
            console.log('🔔 New important info received via socket:', data);
            // Update unread count and refresh messages
            fetchUnreadCount();
            fetchMessages();
        });
        
        socketService.onNotificationUpdate((data) => {
            console.log('🔄 Notification update:', data);
            if (data.type === 'important-info' && data.countDecreased) {
                fetchUnreadCount();
            }
        });
    };

    const fetchMessages = async () => {
        try {
            console.log('📥 Fetching user messages...');
            setLoading(true);
            setError('');
            
            const response = await importantInfoService.getUserMessages(
                pagination.currentPage,
                pagination.itemsPerPage
            );
            
            console.log('✅ User messages response:', response.data);
            
            if (response.data.success) {
                setMessages(response.data.data);
                setPagination(response.data.pagination);
                
                if (response.data.data.length === 0) {
                    console.log('ℹ️ No messages found for user');
                } else {
                    console.log(`📨 Found ${response.data.data.length} messages`);
                }
            } else {
                console.warn('⚠️ API returned success: false', response.data);
                setError('Failed to load messages. Please try again.');
            }
        } catch (err) {
            console.error('❌ Error fetching messages:', err);
            setError('Unable to fetch important information. Please check your connection.');
            
            // Log detailed error info
            if (err.response) {
                console.error('Response error:', err.response.status, err.response.data);
            } else if (err.request) {
                console.error('Request error:', err.request);
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchUnreadCount = async () => {
        try {
            console.log('📊 Fetching unread count...');
            const response = await importantInfoService.getUnreadCount();
            console.log('✅ Unread count response:', response.data);
            
            if (response.data.success) {
                setUnreadCount(response.data.count);
            }
        } catch (err) {
            console.error('❌ Error fetching unread count:', err);
            // Don't show error for unread count - it's not critical
        }
    };

    const handleMarkAsRead = async (messageId) => {
        try {
            console.log('👁️ Marking message as read:', messageId);
            await importantInfoService.markAsRead(messageId);
            
            // Update local state
            setMessages(prev => prev.map(msg => 
                msg._id === messageId ? { ...msg, isRead: true } : msg
            ));
            
            // Update unread count
            setUnreadCount(prev => Math.max(0, prev - 1));
            
            console.log('✅ Message marked as read successfully');
        } catch (err) {
            console.error('❌ Error marking as read:', err);
            alert('Failed to mark message as read. Please try again.');
        }
    };

    const handleDelete = async (messageId) => {
        if (window.confirm('Are you sure you want to delete this message?')) {
            try {
                console.log('🗑️ Deleting message:', messageId);
                await importantInfoService.deleteMessage(messageId);
                
                // Show success message
                alert('Message deleted successfully');
                
                // Refresh the list
                fetchMessages();
                fetchUnreadCount();
                
                console.log('✅ Message deleted successfully');
            } catch (err) {
                console.error('❌ Error deleting message:', err);
                alert('Failed to delete message. Please try again.');
            }
        }
    };

    const handleViewMessage = (message) => {
        console.log('👀 Viewing message:', message._id);
        setSelectedMessage(message);
        
        // Mark as read if not already read
        if (!message.isRead) {
            handleMarkAsRead(message._id);
        }
    };

    const handleCloseModal = () => {
        console.log('❌ Closing message modal');
        setSelectedMessage(null);
    };

    const handlePageChange = (page) => {
        console.log('📄 Changing page to:', page);
        setPagination(prev => ({ ...prev, currentPage: page }));
    };

    const formatDate = (dateString) => {
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (err) {
            console.error('Date formatting error:', err);
            return dateString || 'Unknown date';
        }
    };

    const downloadFile = (file) => {
        console.log('⬇️ Downloading file:', file.originalname);
        window.open(file.url, '_blank');
    };

    // Debug function to check user data
    const checkUserData = () => {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        console.log('👤 Current user data:', {
            id: userData.id,
            _id: userData._id,
            email: userData.email,
            role: userData.role,
            name: userData.name
        });
        return userData;
    };

    // Debug function to test user access
    const debugUserAccess = async () => {
        try {
            console.log('🔍 Testing user access to important info...');
            
            // Test 1: Check user info
            const userInfoResponse = await importantInfoApi.get('/important-info/debug/user-info');
            console.log('✅ User Info:', userInfoResponse.data);
            
            // Test 2: Test user access
            const accessResponse = await importantInfoApi.get('/important-info/debug/test-user-access');
            console.log('✅ User Access Test:', accessResponse.data);
            
            // Show results in alert
            const result = accessResponse.data;
            alert(`Debug Results:\n\nUser ID: ${result.debug?.userId || 'Undefined'}\nUser Role: ${result.debug?.userRole}\nTotal Messages: ${result.debug?.totalMessagesInDatabase}\nVisible to User: ${result.debug?.messagesVisibleToUser}\n\n${result.message}`);
            
            // Also log to console for detailed view
            console.log('🔍 Detailed debug results:', result);
            
        } catch (error) {
            console.error('❌ Debug failed:', error);
            alert(`Debug failed: ${error.message}\n\nCheck console for details.`);
        }
    };

    // Debug function to check all messages (admin only)
    const debugAllMessages = async () => {
        try {
            console.log('🔍 Checking all messages in database...');
            
            // First check if user is admin
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            
            if (userData.role !== 'admin') {
                alert('Only admins can access all messages debug.');
                return;
            }
            
            const response = await importantInfoApi.get('/important-info/debug/all-messages');
            console.log('✅ All messages debug:', response.data);
            
            if (response.data.success) {
                const messages = response.data.messages || [];
                let messageList = `Total Messages: ${response.data.totalCount}\n\n`;
                
                messages.forEach((msg, index) => {
                    messageList += `${index + 1}. ${msg.title}\n`;
                    messageList += `   Recipients: ${JSON.stringify(msg.recipients)}\n`;
                    messageList += `   Created: ${new Date(msg.createdAt).toLocaleDateString()}\n`;
                    messageList += `   Read by: ${msg.readCount} users\n\n`;
                });
                
                alert(`All Messages in Database:\n\n${messageList}`);
            }
            
        } catch (error) {
            console.error('❌ Debug all messages failed:', error);
            alert(`Debug failed: ${error.message}`);
        }
    };

    return (
        <div className="container py-4">
            <div className="row">
                <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h2>Important Information</h2>
                        <div className="d-flex align-items-center gap-2">
                            {unreadCount > 0 && (
                                <span className="badge bg-danger">
                                    {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
                                </span>
                            )}
                            <button 
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => {
                                    checkUserData();
                                    fetchMessages();
                                }}
                                title="Refresh & Check User Data"
                            >
                                <i className="fas fa-sync-alt"></i>
                            </button>
                            <button 
                                className="btn btn-sm btn-outline-warning"
                                onClick={debugUserAccess}
                                title="Debug Access Issues"
                            >
                                <i className="fas fa-bug"></i>
                            </button>
                            <button 
                                className="btn btn-sm btn-outline-info"
                                onClick={debugAllMessages}
                                title="Debug All Messages (Admin Only)"
                            >
                                <i className="fas fa-database"></i>
                            </button>
                        </div>
                    </div>

                    {/* Debug info - remove in production */}
                    <div className="alert alert-info mb-3">
                        <i className="fas fa-info-circle me-2"></i>
                        Do you want to contact the Admin? 
                        <a href="/contact-us" className="ms-1 fw-bold">Contact</a>
                        <div className="mt-2 small">
                            <button 
                                className="btn btn-sm btn-outline-dark"
                                onClick={() => {
                                    const userData = checkUserData();
                                    alert(`Current User:\nID: ${userData.id || userData._id}\nEmail: ${userData.email}\nRole: ${userData.role}`);
                                }}
                            >
                                <i className="fas fa-user me-1"></i>
                                Show My User Info
                            </button>
                        </div>
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="alert alert-danger alert-dismissible fade show mb-3" role="alert">
                            <i className="fas fa-exclamation-triangle me-2"></i>
                            {error}
                            <button 
                                type="button" 
                                className="btn-close" 
                                onClick={() => setError('')}
                            ></button>
                        </div>
                    )}

                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="mt-2">Loading important information...</p>
                            <small className="text-muted">This may take a moment if it's your first time accessing.</small>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center py-5">
                            <div className="alert alert-info">
                                <i className="fas fa-inbox me-2"></i>
                                No important information available at the moment.
                            </div>
                            <p className="text-muted mt-3">
                                Check back later or contact admin if you believe this is an error.
                            </p>
                            <div className="mt-3">
                                <button 
                                    className="btn btn-primary me-2"
                                    onClick={fetchMessages}
                                >
                                    <i className="fas fa-sync-alt me-2"></i>
                                    Refresh
                                </button>
                                <button 
                                    className="btn btn-outline-secondary"
                                    onClick={debugUserAccess}
                                >
                                    <i className="fas fa-bug me-2"></i>
                                    Debug Access
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="alert alert-success mb-3">
                                <i className="fas fa-check-circle me-2"></i>
                                Found {messages.length} important message{messages.length !== 1 ? 's' : ''}
                            </div>
                            
                            <div className="list-group">
                                {messages.map((message) => (
                                    <div 
                                        key={message._id} 
                                        className={`list-group-item list-group-item-action mb-2 ${!message.isRead ? 'list-group-item-warning' : ''}`}
                                        onClick={() => handleViewMessage(message)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="d-flex w-100 justify-content-between align-items-start">
                                            <div className="flex-grow-1">
                                                <h5 className="mb-1 d-flex align-items-center">
                                                    {message.title}
                                                    {message.isUrgent && (
                                                        <span className="badge bg-danger ms-2">Urgent</span>
                                                    )}
                                                    {!message.isRead && (
                                                        <span className="badge bg-primary ms-2">New</span>
                                                    )}
                                                </h5>
                                                <div className="mb-1">
                                                    <small className="text-muted">
                                                        <i className="fas fa-user me-1"></i>
                                                        From: {message.sender?.name || 'Admin'}
                                                    </small>
                                                </div>
                                                <div>
                                                    <small className="text-muted">
                                                        <i className="fas fa-clock me-1"></i>
                                                        {formatDate(message.createdAt)}
                                                    </small>
                                                </div>
                                            </div>
                                            <div className="d-flex flex-column align-items-end">
                                                {message.attachments?.length > 0 && (
                                                    <span className="badge bg-secondary mb-2">
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
                                                    title="Delete message"
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
                                                disabled={pagination.currentPage === 1}
                                            >
                                                <i className="fas fa-chevron-left me-1"></i>
                                                Previous
                                            </button>
                                        </li>
                                        
                                        {[...Array(pagination.totalPages)].map((_, index) => {
                                            const pageNum = index + 1;
                                            // Show limited pages for better UX
                                            if (
                                                pageNum === 1 || 
                                                pageNum === pagination.totalPages ||
                                                (pageNum >= pagination.currentPage - 1 && pageNum <= pagination.currentPage + 1)
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
                                                pageNum === pagination.currentPage - 2 ||
                                                pageNum === pagination.currentPage + 2
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

            {/* Message Detail Modal */}
            {selectedMessage && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header bg-primary text-white">
                                <h5 className="modal-title">
                                    <i className="fas fa-info-circle me-2"></i>
                                    {selectedMessage.title}
                                    {selectedMessage.isUrgent && (
                                        <span className="badge bg-danger ms-2">Urgent</span>
                                    )}
                                </h5>
                                <button 
                                    type="button" 
                                    className="btn-close btn-close-white" 
                                    onClick={handleCloseModal}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-4">
                                    <div className="d-flex flex-wrap gap-3 mb-2">
                                        <small className="text-muted">
                                            <i className="fas fa-user me-1"></i>
                                            <strong>From:</strong> {selectedMessage.sender?.name || 'Admin'}
                                        </small>
                                        <small className="text-muted">
                                            <i className="fas fa-clock me-1"></i>
                                            <strong>Date:</strong> {formatDate(selectedMessage.createdAt)}
                                        </small>
                                        {selectedMessage.isRead && (
                                            <small className="text-success">
                                                <i className="fas fa-check-circle me-1"></i>
                                                Read
                                            </small>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="card mb-4">
                                    <div className="card-body">
                                        <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                                            {selectedMessage.message}
                                        </p>
                                    </div>
                                </div>

                                {selectedMessage.attachments?.length > 0 && (
                                    <div className="mb-4">
                                        <h6 className="mb-3">
                                            <i className="fas fa-paperclip me-2"></i>
                                            Attachments ({selectedMessage.attachments.length})
                                        </h6>
                                        <div className="list-group">
                                            {selectedMessage.attachments.map((file, index) => (
                                                <div key={index} className="list-group-item">
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <div className="d-flex align-items-center">
                                                            <i className={`fas fa-file-${file.fileType === 'pdf' ? 'pdf' : file.fileType === 'image' ? 'image' : 'word'} me-3 text-primary`} style={{ fontSize: '1.5rem' }}></i>
                                                            <div>
                                                                <div className="fw-medium">{file.originalname}</div>
                                                                <small className="text-muted">
                                                                    {Math.round(file.size / 1024)} KB • {file.fileType?.toUpperCase()}
                                                                </small>
                                                            </div>
                                                        </div>
                                                        <button
                                                            className="btn btn-primary btn-sm"
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
                                    Need to contact the Admin? 
                                    <a href="/contact-us" className="ms-1 fw-bold">Click here to contact us</a>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={handleCloseModal}
                                >
                                    <i className="fas fa-times me-1"></i>
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