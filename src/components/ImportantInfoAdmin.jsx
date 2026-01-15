// travel-tour-frontend/src/components/ImportantInfoAdmin.jsx

import React, { useState, useEffect } from 'react';
import { importantInfoService } from '../services/importantInfoApi';
import socketService from '../services/socketService';

const ImportantInfoAdmin = () => {
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        isUrgent: false,
        recipients: ['all']
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
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchMessages();
        setupSocket();
        
        return () => {
            socketService.removeListener('important-info-sent');
        };
    }, [pagination.currentPage]);

    const setupSocket = () => {
        socketService.connect();
        
        socketService.onNewImportantInfo((data) => {
            // Refresh messages when new info is sent
            fetchMessages();
        });
    };

    const fetchMessages = async () => {
        try {
            setLoading(true);
            const response = await importantInfoService.getAllMessages(
                pagination.currentPage, 
                pagination.itemsPerPage
            );
            
            if (response.data.success) {
                setMessages(response.data.data);
                setPagination(response.data.pagination);
            }
        } catch (err) {
            setError('Error fetching messages');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleRecipientChange = (e) => {
        const value = e.target.value;
        setFormData(prev => ({
            ...prev,
            recipients: [value] // For now, single selection
        }));
    };

    const handleFileChange = (e) => {
        setAttachments([...e.target.files]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('title', formData.title);
            formDataToSend.append('message', formData.message);
            formDataToSend.append('isUrgent', formData.isUrgent);
            formDataToSend.append('recipients', JSON.stringify(formData.recipients));
            
            attachments.forEach(file => {
                formDataToSend.append('attachments', file);
            });

            const response = await importantInfoService.createImportantInfo(formDataToSend);
            
            if (response.data.success) {
                setSuccess(`Message sent successfully to ${response.data.notificationCount} users`);
                setFormData({
                    title: '',
                    message: '',
                    isUrgent: false,
                    recipients: ['all']
                });
                setAttachments([]);
                fetchMessages(); // Refresh the list
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Error sending message');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (messageId) => {
        if (window.confirm('Are you sure you want to delete this message permanently?')) {
            try {
                await importantInfoService.deletePermanently(messageId);
                setSuccess('Message deleted successfully');
                fetchMessages();
            } catch (err) {
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

    return (
        <div className="container py-4">
            <div className="row">
                <div className="col-lg-8">
                    <h2 className="mb-4">Important Information Archive</h2>
                    
                    {loading && !messages.length ? (
                        <div className="text-center">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="table-responsive">
                                <table className="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>Title</th>
                                            <th>Sent To</th>
                                            <th>Attachments</th>
                                            <th>Date</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {messages.map((message) => (
                                            <tr key={message._id}>
                                                <td>
                                                    <strong>{message.title}</strong>
                                                    {message.isUrgent && (
                                                        <span className="badge bg-danger ms-2">Urgent</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <span className="badge bg-info">
                                                        {message.recipients.includes('all') 
                                                            ? 'All Users' 
                                                            : message.recipients.join(', ')}
                                                    </span>
                                                </td>
                                                <td>
                                                    {message.attachments?.length > 0 ? (
                                                        <span className="badge bg-secondary">
                                                            {message.attachments.length} file(s)
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted">None</span>
                                                    )}
                                                </td>
                                                <td>{formatDate(message.createdAt)}</td>
                                                <td>
                                                    <button
                                                        className="btn btn-sm btn-danger"
                                                        onClick={() => handleDelete(message._id)}
                                                    >
                                                        <i className="fas fa-trash"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {pagination.totalPages > 1 && (
                                <nav>
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

                <div className="col-lg-4">
                    <div className="card">
                        <div className="card-header bg-primary text-white">
                            <h4 className="mb-0">Send Important Information</h4>
                        </div>
                        <div className="card-body">
                            {success && (
                                <div className="alert alert-success alert-dismissible fade show" role="alert">
                                    {success}
                                    <button type="button" className="btn-close" onClick={() => setSuccess('')}></button>
                                </div>
                            )}
                            
                            {error && (
                                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                                    {error}
                                    <button type="button" className="btn-close" onClick={() => setError('')}></button>
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label className="form-label">Title *</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Message *</label>
                                    <textarea
                                        className="form-control"
                                        name="message"
                                        rows="5"
                                        value={formData.message}
                                        onChange={handleInputChange}
                                        required
                                    ></textarea>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Recipients</label>
                                    <select
                                        className="form-select"
                                        value={formData.recipients[0]}
                                        onChange={handleRecipientChange}
                                    >
                                        <option value="all">All Users</option>
                                        <option value="students">Students Only</option>
                                        <option value="admins">Admins Only</option>
                                    </select>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Attachments</label>
                                    <input
                                        type="file"
                                        className="form-control"
                                        multiple
                                        onChange={handleFileChange}
                                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                                    />
                                    <small className="text-muted">
                                        Max 5 files, 10MB each. Allowed: PDF, DOC, DOCX, JPG, PNG, GIF
                                    </small>
                                    
                                    {attachments.length > 0 && (
                                        <div className="mt-2">
                                            <strong>Selected files:</strong>
                                            <ul className="list-unstyled">
                                                {attachments.map((file, index) => (
                                                    <li key={index} className="text-truncate">
                                                        <small>{file.name}</small>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                <div className="mb-3 form-check">
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        id="isUrgent"
                                        name="isUrgent"
                                        checked={formData.isUrgent}
                                        onChange={handleInputChange}
                                    />
                                    <label className="form-check-label" htmlFor="isUrgent">
                                        Mark as Urgent
                                    </label>
                                </div>

                                <div className="mb-3">
                                    <p className="text-muted">
                                        <i className="fas fa-info-circle me-2"></i>
                                        Do you want to contact the Admin? 
                                        <a href="/contact-us" className="ms-1">Contact</a>
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary w-100"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Sending...
                                        </>
                                    ) : (
                                        'Send to All Users'
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImportantInfoAdmin;