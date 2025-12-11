import React, { useState, useEffect } from 'react';
import {
    Container, Card, Table, Badge, Alert, Spinner,
    Button, Modal, Row, Col, Form, Pagination
} from 'react-bootstrap';
import {
    FaEnvelope, FaClock, FaCheck, FaReply, FaEye,
    FaBell, FaArrowLeft, FaPaperPlane, FaUser,
    FaCalendarAlt, FaCommentDots, FaSync
} from 'react-icons/fa';
import blogApi, { socket } from '../../services/blogApi';
import '../../App.css';

const UserSubmissionsDashboard = ({ navigateTo, userEmail = '', userName = '' }) => {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    
    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5);

    // Initialize socket and fetch data
    useEffect(() => {
        if (!userEmail) {
            setError('User email is required');
            setLoading(false);
            return;
        }

        fetchSubmissions();

        // Join user's room using email (socket already imported)
        socket.emit('user-connected', userEmail);

        // Listen for admin replies
        socket.on('admin-reply', (data) => {
            console.log('🔔 New admin reply received:', data.submissionId);
            setSubmissions(prev => prev.map(sub =>
                sub._id === data.submissionId
                    ? {
                        ...sub,
                        adminReply: data.submission?.adminReply || { message: data.message, repliedAt: new Date() },
                        status: 'replied',
                        isReadByUser: false
                    }
                    : sub
            ));
            setUnreadCount(prev => prev + 1);
        });

        return () => {
            socket.off('admin-reply');
        };
    }, [userEmail]);

    // Fetch submissions from API
    const fetchSubmissions = async () => {
        try {
            setRefreshing(true);
            const response = await blogApi.get(`/submissions/user/${encodeURIComponent(userEmail)}`);
            
            if (response.data.success) {
                setSubmissions(response.data.submissions || []);
                setUnreadCount(response.data.unreadCount || 0);
            } else {
                setError('Failed to load submissions');
            }
        } catch (err) {
            console.error('Fetch error:', err);
            setError('Could not connect to server');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Mark submission as read by user
    const markAsRead = async (submissionId) => {
        try {
            await blogApi.put(`/submissions/${submissionId}/read-user`);
            setSubmissions(prev => prev.map(sub =>
                sub._id === submissionId
                    ? { ...sub, isReadByUser: true, notificationCount: { ...sub.notificationCount, user: 0 } }
                    : sub
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Mark read error:', err);
        }
    };

    // Get status badge with appropriate color
    const getStatusBadge = (status) => {
        const variants = {
            'new': { bg: 'primary', text: 'NEW' },
            'viewed': { bg: 'info', text: 'VIEWED' },
            'replied': { bg: 'success', text: 'REPLIED' },
            'closed': { bg: 'secondary', text: 'CLOSED' }
        };
        const statusInfo = variants[status] || { bg: 'light', text: status };
        return <Badge bg={statusInfo.bg} className="px-3 py-2">{statusInfo.text}</Badge>;
    };

    // Format date nicely
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = submissions.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(submissions.length / itemsPerPage);

    // Handle page change
    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Handle view submission details
    const handleViewDetails = (submission) => {
        setSelectedSubmission(submission);
        setShowDetailsModal(true);
        
        // Mark as read if it's a reply
        if (!submission.isReadByUser && submission.status === 'replied') {
            markAsRead(submission._id);
        }
    };

    // Handle refresh
    const handleRefresh = () => {
        fetchSubmissions();
        setCurrentPage(1);
    };

    if (loading && !refreshing) {
        return (
            <Container className="py-5">
                <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" size="lg" />
                    <p className="mt-3 text-muted">Loading your submissions...</p>
                </div>
            </Container>
        );
    }

    return (
        <Container className="py-4 user-submissions-dashboard">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <Button
                        variant="outline-secondary"
                        onClick={() => navigateTo('blog-list-page')}
                        className="mb-3 d-flex align-items-center"
                    >
                        <FaArrowLeft className="me-2" /> Back to Blog
                    </Button>
                    <h2 className="mb-1 fw-bold text-dark">
                        <FaEnvelope className="me-2 text-primary" />
                        My Submissions Dashboard
                    </h2>
                    <p className="text-muted mb-0">
                        Track your "Write for Us" applications and responses
                    </p>
                </div>
                <div className="d-flex align-items-center gap-3">
                    {unreadCount > 0 && (
                        <Badge bg="danger" pill className="fs-6 px-3 py-2 shadow-sm">
                            <FaBell className="me-2" /> {unreadCount} New Reply{unreadCount !== 1 ? 's' : ''}
                        </Badge>
                    )}
                    <Button
                        variant="outline-primary"
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="d-flex align-items-center"
                    >
                        <FaSync className={refreshing ? 'spin' : ''} />
                    </Button>
                    <Button
                        variant="primary"
                        onClick={() => navigateTo('write-for-us')}
                        className="d-flex align-items-center"
                    >
                        <FaPaperPlane className="me-2" /> New Submission
                    </Button>
                </div>
            </div>

            {/* Error Alert */}
            {error && (
                <Alert variant="danger" dismissible onClose={() => setError('')} className="mb-4">
                    <strong>Error:</strong> {error}
                </Alert>
            )}

            {/* Stats Summary */}
            <Row className="mb-4 g-3">
                <Col md={4}>
                    <Card className="shadow-sm border-0 h-100 bg-primary bg-opacity-10">
                        <Card.Body className="d-flex align-items-center">
                            <div className="bg-primary text-white rounded-circle me-3 p-3">
                                <FaEnvelope size={20} />
                            </div>
                            <div>
                                <Card.Text className="text-muted small mb-1">Total Submissions</Card.Text>
                                <Card.Title className="mb-0">{submissions.length}</Card.Title>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="shadow-sm border-0 h-100 bg-success bg-opacity-10">
                        <Card.Body className="d-flex align-items-center">
                            <div className="bg-success text-white rounded-circle me-3 p-3">
                                <FaCheck size={20} />
                            </div>
                            <div>
                                <Card.Text className="text-muted small mb-1">Replied</Card.Text>
                                <Card.Title className="mb-0 text-success">
                                    {submissions.filter(s => s.status === 'replied').length}
                                </Card.Title>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="shadow-sm border-0 h-100 bg-info bg-opacity-10">
                        <Card.Body className="d-flex align-items-center">
                            <div className="bg-info text-white rounded-circle me-3 p-3">
                                <FaBell size={20} />
                            </div>
                            <div>
                                <Card.Text className="text-muted small mb-1">Unread Replies</Card.Text>
                                <Card.Title className="mb-0 text-info">{unreadCount}</Card.Title>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Submissions Table */}
            <Card className="shadow-sm border-0 mb-4">
                <Card.Body className="p-0">
                    {submissions.length === 0 ? (
                        <div className="text-center py-5">
                            <div className="empty-state-icon mb-3">
                                <FaEnvelope size={48} className="text-muted" />
                            </div>
                            <h4 className="text-muted mb-2">No submissions yet</h4>
                            <p className="text-muted mb-4">
                                You haven't made any "Write for Us" submissions yet.
                            </p>
                            <Button
                                variant="primary"
                                onClick={() => navigateTo('write-for-us')}
                            >
                                <FaPaperPlane className="me-2" /> Create First Submission
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="table-responsive">
                                <Table hover className="mb-0">
                                    <thead className="bg-light">
                                        <tr>
                                            <th style={{ width: '15%' }}>Date</th>
                                            <th style={{ width: '25%' }}>Submission</th>
                                            <th style={{ width: '20%' }}>Interests</th>
                                            <th style={{ width: '15%' }}>Status</th>
                                            <th style={{ width: '25%' }}>Admin Response</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentItems.map((sub) => (
                                            <tr
                                                key={sub._id}
                                                className={`align-middle ${!sub.isReadByUser && sub.status === 'replied' ? 'table-warning' : ''}`}
                                                onClick={() => handleViewDetails(sub)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <td>
                                                    <div className="d-flex flex-column">
                                                        <small className="text-muted">
                                                            <FaCalendarAlt className="me-1" size={12} />
                                                            {formatDate(sub.createdAt)}
                                                        </small>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div>
                                                        <strong className="d-block">{sub.firstName} {sub.lastName}</strong>
                                                        <small className="text-muted">{sub.email}</small>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="d-flex flex-wrap gap-1">
                                                        {sub.interests.slice(0, 3).map((interest, idx) => (
                                                            <Badge key={idx} bg="light" text="dark" className="px-2 py-1">
                                                                {interest}
                                                            </Badge>
                                                        ))}
                                                        {sub.interests.length > 3 && (
                                                            <Badge bg="light" text="dark" className="px-2 py-1">
                                                                +{sub.interests.length - 3} more
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    {getStatusBadge(sub.status)}
                                                    {!sub.isReadByUser && sub.status === 'replied' && (
                                                        <Badge bg="danger" pill className="ms-2">
                                                            NEW
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td>
                                                    {sub.adminReply ? (
                                                        <div className="d-flex align-items-center">
                                                            <FaCommentDots className="text-success me-2" />
                                                            <div>
                                                                <small className="d-block">Replied: {formatDate(sub.adminReply.repliedAt)}</small>
                                                                <small className="text-muted text-truncate d-block" style={{ maxWidth: '200px' }}>
                                                                    {sub.adminReply.message.substring(0, 50)}...
                                                                </small>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted">
                                                            <FaClock className="me-2" />
                                                            Waiting for response
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                            
                            {/* Summary */}
                            <div className="d-flex justify-content-between align-items-center p-3 border-top">
                                <div className="text-muted small">
                                    Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, submissions.length)} of {submissions.length} submissions
                                </div>
                                <div className="small">
                                    <Badge bg="light" text="dark" className="me-2">
                                        New: {submissions.filter(s => s.status === 'new').length}
                                    </Badge>
                                    <Badge bg="light" text="dark">
                                        Replied: {submissions.filter(s => s.status === 'replied').length}
                                    </Badge>
                                </div>
                            </div>
                        </>
                    )}
                </Card.Body>
            </Card>

            {/* Pagination */}
            {submissions.length > itemsPerPage && (
                <div className="d-flex justify-content-center">
                    <Pagination>
                        <Pagination.First 
                            onClick={() => handlePageChange(1)}
                            disabled={currentPage === 1}
                        />
                        <Pagination.Prev 
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                        />
                        
                        {/* Show page numbers */}
                        {[...Array(totalPages)].map((_, index) => {
                            const pageNumber = index + 1;
                            // Show first page, last page, current page, and pages around current page
                            if (
                                pageNumber === 1 ||
                                pageNumber === totalPages ||
                                (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                            ) {
                                return (
                                    <Pagination.Item
                                        key={pageNumber}
                                        active={pageNumber === currentPage}
                                        onClick={() => handlePageChange(pageNumber)}
                                    >
                                        {pageNumber}
                                    </Pagination.Item>
                                );
                            }
                            // Show ellipsis for skipped pages
                            if (
                                pageNumber === currentPage - 2 ||
                                pageNumber === currentPage + 2
                            ) {
                                return <Pagination.Ellipsis key={pageNumber} />;
                            }
                            return null;
                        })}
                        
                        <Pagination.Next 
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        />
                        <Pagination.Last 
                            onClick={() => handlePageChange(totalPages)}
                            disabled={currentPage === totalPages}
                        />
                    </Pagination>
                </div>
            )}

            {/* Page Info */}
            {submissions.length > 0 && (
                <div className="text-center text-muted small mt-2">
                    Page {currentPage} of {totalPages} • {itemsPerPage} submissions per page
                </div>
            )}

            {/* Submission Details Modal */}
            <Modal
                show={showDetailsModal}
                onHide={() => setShowDetailsModal(false)}
                size="lg"
                centered
            >
                {selectedSubmission && (
                    <>
                        <Modal.Header closeButton className="border-0 pb-0">
                            <Modal.Title>
                                <FaEnvelope className="me-2 text-primary" />
                                Submission Details
                            </Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            {/* Submission Info */}
                            <div className="mb-4 p-3 bg-light rounded">
                                <h6 className="mb-3">
                                    <FaUser className="me-2" />
                                    Your Submission
                                </h6>
                                <Row>
                                    <Col md={6}>
                                        <p><strong>Name:</strong> {selectedSubmission.firstName} {selectedSubmission.lastName}</p>
                                        <p><strong>Email:</strong> {selectedSubmission.email}</p>
                                        <p><strong>Phone:</strong> {selectedSubmission.phone || 'Not provided'}</p>
                                    </Col>
                                    <Col md={6}>
                                        <p><strong>Submitted:</strong> {formatDate(selectedSubmission.createdAt)}</p>
                                        <p><strong>Status:</strong> {getStatusBadge(selectedSubmission.status)}</p>
                                        <p><strong>Heard via:</strong> {selectedSubmission.hearAboutUs || 'Not specified'}</p>
                                    </Col>
                                </Row>
                                
                                <div className="mt-3">
                                    <strong>Interests:</strong>
                                    <div className="d-flex flex-wrap gap-1 mt-1">
                                        {selectedSubmission.interests.map((interest, idx) => (
                                            <Badge key={idx} bg="info" className="px-2 py-1">
                                                {interest}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="mt-3">
                                    <strong>Experience:</strong>
                                    <div className="p-2 bg-white rounded mt-1">
                                        {selectedSubmission.experience || 'No experience provided'}
                                    </div>
                                </div>
                                
                                {selectedSubmission.message && (
                                    <div className="mt-3">
                                        <strong>Additional Message:</strong>
                                        <div className="p-2 bg-white rounded mt-1">
                                            {selectedSubmission.message}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Admin Reply Section */}
                            {selectedSubmission.adminReply ? (
                                <div className="p-4 border border-success rounded bg-success bg-opacity-10">
                                    <h6 className="text-success mb-3">
                                        <FaReply className="me-2" />
                                        Admin's Response
                                    </h6>
                                    <div className="p-3 bg-white rounded">
                                        <p className="mb-0">{selectedSubmission.adminReply.message}</p>
                                    </div>
                                    <small className="text-muted d-block mt-2">
                                        <FaCalendarAlt className="me-1" />
                                        Replied on: {formatDate(selectedSubmission.adminReply.repliedAt)}
                                    </small>
                                </div>
                            ) : (
                                <Alert variant="info" className="text-center">
                                    <FaClock className="me-2" />
                                    Waiting for admin response. We'll notify you when we reply.
                                </Alert>
                            )}
                        </Modal.Body>
                        <Modal.Footer className="border-0">
                            <Button
                                variant="secondary"
                                onClick={() => setShowDetailsModal(false)}
                            >
                                Close
                            </Button>
                            {selectedSubmission.status === 'replied' && !selectedSubmission.isReadByUser && (
                                <Button
                                    variant="primary"
                                    onClick={() => {
                                        markAsRead(selectedSubmission._id);
                                        setShowDetailsModal(false);
                                    }}
                                >
                                    Mark as Read
                                </Button>
                            )}
                        </Modal.Footer>
                    </>
                )}
            </Modal>

            {/* Footer Info */}
            <div className="mt-4 pt-3 border-top text-center">
                <p className="text-muted small mb-0">
                    <FaBell className="me-1" />
                    You'll receive real-time notifications when admin responds to your submissions.
                </p>
            </div>
        </Container>
    );
};

export default UserSubmissionsDashboard;