import React, { useState, useEffect } from 'react';
import {
    Container, Card, Table, Badge, Alert, Spinner,
    Button, Modal, Row, Col, Form, InputGroup
} from 'react-bootstrap';
import {
    FaUsers, FaEnvelope, FaCheck, FaReply, FaEye,
    FaBell, FaSearch, FaFilter, FaSync, FaCalendarAlt,
    FaCommentDots, FaUser, FaPhone, FaMapMarkerAlt,
    FaPaperclip, FaCrown, FaTrash
} from 'react-icons/fa';
import blogApi, { socket } from '../../services/blogApi'; // IMPORT SOCKET
import '../../App.css';

const AdminSubmissionsDashboard = ({ navigateTo }) => {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [showReplyModal, setShowReplyModal] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [refreshing, setRefreshing] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [submissionToDelete, setSubmissionToDelete] = useState(null);

    // Initialize socket and fetch data
    useEffect(() => {
        fetchSubmissions();

        // Join admin room (socket already imported)
        socket.emit('admin-connected');

        // Listen for new submissions
        socket.on('new-submission', (data) => {
            console.log('🔔 New submission received:', data.submission?._id);
            setSubmissions(prev => [data.submission, ...prev]);
            setUnreadCount(prev => prev + 1);
        });

        // Fetch unread count
        fetchUnreadCount();

        return () => {
            // Don't disconnect socket globally, just remove listeners
            socket.off('new-submission');
        };
    }, []);

    // Fetch submissions from API
    const fetchSubmissions = async () => {
        try {
            setRefreshing(true);
            const response = await blogApi.get('/submissions/admin');
            
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

    // Fetch unread count
    const fetchUnreadCount = async () => {
        try {
            const response = await blogApi.get('/submissions/admin/unread-count');
            if (response.data.success) {
                setUnreadCount(response.data.count || 0);
            }
        } catch (err) {
            console.error('Count error:', err);
        }
    };

    // Mark submission as read by admin
    const markAsRead = async (submissionId) => {
        try {
            await blogApi.put(`/submissions/${submissionId}/read-admin`);
            setSubmissions(prev => prev.map(sub =>
                sub._id === submissionId
                    ? { ...sub, isReadByAdmin: true, status: sub.status === 'new' ? 'viewed' : sub.status }
                    : sub
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Mark read error:', err);
        }
    };

    // Send reply to submission
    const sendReply = async () => {
        if (!replyText.trim()) {
            alert('Please enter a reply message');
            return;
        }

        try {
            const adminId = 'admin'; // In real app, get from auth
            const response = await blogApi.post(`/submissions/${selectedSubmission._id}/reply`, {
                adminReply: replyText,
                adminId
            });

            if (response.data.success) {
                // Update local state
                setSubmissions(prev => prev.map(sub =>
                    sub._id === selectedSubmission._id
                        ? {
                            ...sub,
                            adminReply: response.data.submission.adminReply,
                            status: 'replied'
                        }
                        : sub
                ));

                // Reset form
                setReplyText('');
                setShowReplyModal(false);
                setSelectedSubmission(null);

                alert('Reply sent successfully!');
            }
        } catch (err) {
            console.error('Reply error:', err);
            alert('Failed to send reply');
        }
    };

    // Delete submission - USING CORRECT ENDPOINT
    const deleteSubmission = async () => {
        if (!submissionToDelete) return;

        try {
            // Use the DELETE endpoint that we added to server.js
            await blogApi.delete(`/submissions/${submissionToDelete._id}`);
            
            // Remove from local state
            setSubmissions(prev => prev.filter(sub => sub._id !== submissionToDelete._id));
            
            // Reset
            setSubmissionToDelete(null);
            setShowDeleteModal(false);
            
            alert('Submission deleted successfully!');
        } catch (err) {
            console.error('Delete error:', err);
            alert('Failed to delete submission');
        }
    };

    // Get status badge with appropriate color
    const getStatusBadge = (status, isRead) => {
        const variants = {
            'new': { bg: 'danger', text: 'NEW' },
            'viewed': { bg: 'info', text: 'VIEWED' },
            'replied': { bg: 'success', text: 'REPLIED' },
            'closed': { bg: 'secondary', text: 'CLOSED' }
        };
        const statusInfo = variants[status] || { bg: 'light', text: status };
        return (
            <div className="d-flex align-items-center gap-1">
                <Badge bg={statusInfo.bg} className="px-3 py-2">
                    {statusInfo.text}
                </Badge>
                {status === 'new' && !isRead && (
                    <Badge bg="warning" pill>UNREAD</Badge>
                )}
            </div>
        );
    };

    // Format date nicely
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Filter submissions based on search and status
    const filteredSubmissions = submissions.filter(sub => {
        const matchesSearch = searchTerm === '' ||
            sub.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sub.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sub.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sub.interests?.some(interest => 
                interest.toLowerCase().includes(searchTerm.toLowerCase())
            );

        const matchesStatus = statusFilter === 'all' || 
            (statusFilter === 'unread' ? !sub.isReadByAdmin && sub.status === 'new' : 
             statusFilter === 'replied' ? sub.status === 'replied' :
             sub.status === statusFilter);

        return matchesSearch && matchesStatus;
    });

    // Handle view submission
    const handleViewSubmission = (submission) => {
        setSelectedSubmission(submission);
        if (!submission.isReadByAdmin && submission.status === 'new') {
            markAsRead(submission._id);
        }
    };

    // Handle reply
    const handleReply = (submission) => {
        setSelectedSubmission(submission);
        setShowReplyModal(true);
        if (!submission.isReadByAdmin) {
            markAsRead(submission._id);
        }
    };

    // Handle delete confirmation
    const confirmDelete = (submission) => {
        setSubmissionToDelete(submission);
        setShowDeleteModal(true);
    };

    // Handle refresh
    const handleRefresh = () => {
        fetchSubmissions();
        fetchUnreadCount();
    };

    // Calculate stats
    const stats = {
        total: submissions.length,
        new: submissions.filter(s => s.status === 'new').length,
        replied: submissions.filter(s => s.status === 'replied').length,
        unread: submissions.filter(s => !s.isReadByAdmin && s.status === 'new').length
    };

    if (loading && !refreshing) {
        return (
            <Container className="py-5">
                <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" size="lg" />
                    <p className="mt-3 text-muted">Loading submissions dashboard...</p>
                </div>
            </Container>
        );
    }

    return (
        <Container fluid className="py-4 admin-submissions-dashboard">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="mb-1 fw-bold text-dark">
                        <FaUsers className="me-2 text-primary" />
                        Submissions Management
                    </h2>
                    <p className="text-muted mb-0">
                        Manage "Write for Us" applications and responses
                    </p>
                </div>
                <div className="d-flex gap-2">
                    <Button
                        variant="outline-secondary"
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="d-flex align-items-center"
                    >
                        <FaSync className={refreshing ? 'spin' : ''} />
                    </Button>
                    {unreadCount > 0 && (
                        <Badge bg="danger" pill className="fs-6 px-3 py-2">
                            <FaBell className="me-2" /> {unreadCount} New
                        </Badge>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <Row className="mb-4 g-3">
                <Col lg={3} md={6}>
                    <Card className="shadow-sm border-0 h-100">
                        <Card.Body className="d-flex align-items-center">
                            <div className="bg-primary text-white rounded-circle me-3 p-3">
                                <FaEnvelope size={24} />
                            </div>
                            <div>
                                <Card.Text className="text-muted small mb-1">Total Submissions</Card.Text>
                                <Card.Title className="mb-0">{stats.total}</Card.Title>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={3} md={6}>
                    <Card className="shadow-sm border-0 h-100">
                        <Card.Body className="d-flex align-items-center">
                            <div className="bg-danger text-white rounded-circle me-3 p-3">
                                <FaBell size={24} />
                            </div>
                            <div>
                                <Card.Text className="text-muted small mb-1">New/Unread</Card.Text>
                                <Card.Title className="mb-0 text-danger">{stats.unread}</Card.Title>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={3} md={6}>
                    <Card className="shadow-sm border-0 h-100">
                        <Card.Body className="d-flex align-items-center">
                            <div className="bg-success text-white rounded-circle me-3 p-3">
                                <FaCheck size={24} />
                            </div>
                            <div>
                                <Card.Text className="text-muted small mb-1">Replied</Card.Text>
                                <Card.Title className="mb-0 text-success">{stats.replied}</Card.Title>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col lg={3} md={6}>
                    <Card className="shadow-sm border-0 h-100">
                        <Card.Body className="d-flex align-items-center">
                            <div className="bg-info text-white rounded-circle me-3 p-3">
                                <FaUsers size={24} />
                            </div>
                            <div>
                                <Card.Text className="text-muted small mb-1">Unique Users</Card.Text>
                                <Card.Title className="mb-0 text-info">
                                    {[...new Set(submissions.map(s => s.email))].length}
                                </Card.Title>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Search and Filter */}
            <Card className="mb-4 shadow-sm border-0">
                <Card.Body>
                    <Row className="g-3">
                        <Col md={6}>
                            <InputGroup>
                                <InputGroup.Text>
                                    <FaSearch />
                                </InputGroup.Text>
                                <Form.Control
                                    type="text"
                                    placeholder="Search by name, email, or interests..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </InputGroup>
                        </Col>
                        <Col md={3}>
                            <Form.Select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">All Status</option>
                                <option value="unread">Unread Only</option>
                                <option value="new">New Only</option>
                                <option value="viewed">Viewed</option>
                                <option value="replied">Replied</option>
                                <option value="closed">Closed</option>
                            </Form.Select>
                        </Col>
                        <Col md={3}>
                            <div className="d-flex gap-2">
                                <Button
                                    variant="outline-secondary"
                                    onClick={() => {
                                        setSearchTerm('');
                                        setStatusFilter('all');
                                    }}
                                >
                                    Clear Filters
                                </Button>
                            </div>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Error Alert */}
            {error && (
                <Alert variant="danger" dismissible onClose={() => setError('')} className="mb-4">
                    <strong>Error:</strong> {error}
                </Alert>
            )}

            {/* Submissions Table */}
            <Card className="shadow-sm border-0">
                <Card.Body className="p-0">
                    {filteredSubmissions.length === 0 ? (
                        <div className="text-center py-5">
                            <div className="empty-state-icon mb-3">
                                <FaEnvelope size={48} className="text-muted" />
                            </div>
                            <h4 className="text-muted mb-2">No submissions found</h4>
                            <p className="text-muted mb-4">
                                {searchTerm || statusFilter !== 'all'
                                    ? 'No submissions match your filters.'
                                    : 'No submissions have been made yet.'}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="table-responsive">
                                <Table hover className="mb-0">
                                    <thead className="bg-light">
                                        <tr>
                                            <th style={{ width: '20%' }}>Applicant</th>
                                            <th style={{ width: '15%' }}>Date</th>
                                            <th style={{ width: '20%' }}>Interests</th>
                                            <th style={{ width: '15%' }}>Status</th>
                                            <th style={{ width: '30%' }} className="text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredSubmissions.map((sub) => (
                                            <tr
                                                key={sub._id}
                                                className={`align-middle ${!sub.isReadByAdmin && sub.status === 'new' ? 'table-warning' : ''}`}
                                            >
                                                <td>
                                                    <div>
                                                        <strong className="d-block">
                                                            <FaUser className="me-2 text-muted" size={14} />
                                                            {sub.firstName} {sub.lastName}
                                                        </strong>
                                                        <small className="text-muted d-block">
                                                            {sub.email}
                                                        </small>
                                                        {sub.phone && (
                                                            <small className="text-muted">
                                                                <FaPhone className="me-1" size={12} />
                                                                {sub.phone}
                                                            </small>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="d-flex flex-column">
                                                        <small className="text-muted">
                                                            <FaCalendarAlt className="me-1" size={12} />
                                                            {formatDate(sub.createdAt)}
                                                        </small>
                                                        <small className="text-muted">
                                                            {sub.isReadByAdmin ? 'Read' : 'Unread'}
                                                        </small>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="d-flex flex-wrap gap-1">
                                                        {sub.interests.slice(0, 2).map((interest, idx) => (
                                                            <Badge key={idx} bg="light" text="dark" className="px-2 py-1">
                                                                {interest}
                                                            </Badge>
                                                        ))}
                                                        {sub.interests.length > 2 && (
                                                            <Badge bg="light" text="dark" className="px-2 py-1">
                                                                +{sub.interests.length - 2}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>{getStatusBadge(sub.status, sub.isReadByAdmin)}</td>
                                                <td className="text-center">
                                                    <div className="btn-group" role="group">
                                                        <Button
                                                            variant="outline-info"
                                                            size="sm"
                                                            title="View Details"
                                                            onClick={() => handleViewSubmission(sub)}
                                                            className="border-end-0"
                                                        >
                                                            <FaEye />
                                                        </Button>
                                                        <Button
                                                            variant="outline-success"
                                                            size="sm"
                                                            title="Reply"
                                                            onClick={() => handleReply(sub)}
                                                            className="border-start-0 border-end-0"
                                                            disabled={sub.status === 'replied'}
                                                        >
                                                            <FaReply />
                                                        </Button>
                                                        <Button
                                                            variant="outline-danger"
                                                            size="sm"
                                                            title="Delete"
                                                            onClick={() => confirmDelete(sub)}
                                                            className="border-start-0"
                                                        >
                                                            <FaTrash />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                            
                            {/* Summary */}
                            <div className="d-flex justify-content-between align-items-center p-3 border-top">
                                <div className="text-muted small">
                                    Showing {filteredSubmissions.length} of {submissions.length} submissions
                                </div>
                                <div className="small">
                                    <Badge bg="light" text="dark" className="me-2">
                                        New: {stats.new}
                                    </Badge>
                                    <Badge bg="light" text="dark" className="me-2">
                                        Replied: {stats.replied}
                                    </Badge>
                                    <Badge bg="light" text="dark">
                                        Unread: {stats.unread}
                                    </Badge>
                                </div>
                            </div>
                        </>
                    )}
                </Card.Body>
            </Card>

            {/* View Submission Modal */}
            <Modal
                show={!!selectedSubmission && !showReplyModal}
                onHide={() => setSelectedSubmission(null)}
                size="lg"
                centered
            >
                {selectedSubmission && (
                    <>
                        <Modal.Header closeButton className="border-0 pb-0">
                            <Modal.Title>
                                <FaEnvelope className="me-2" />
                                Submission Details
                            </Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            {/* Applicant Info */}
                            <div className="mb-4">
                                <h6 className="mb-3 text-primary">
                                    <FaUser className="me-2" />
                                    Applicant Information
                                </h6>
                                <Row>
                                    <Col md={6}>
                                        <p><strong>Name:</strong> {selectedSubmission.firstName} {selectedSubmission.lastName}</p>
                                        <p><strong>Email:</strong> <a href={`mailto:${selectedSubmission.email}`}>{selectedSubmission.email}</a></p>
                                        <p><strong>Phone:</strong> {selectedSubmission.phone || 'Not provided'}</p>
                                    </Col>
                                    <Col md={6}>
                                        <p><strong>Submitted:</strong> {formatDate(selectedSubmission.createdAt)}</p>
                                        <p><strong>Status:</strong> {getStatusBadge(selectedSubmission.status, selectedSubmission.isReadByAdmin)}</p>
                                        <p><strong>Heard via:</strong> {selectedSubmission.hearAboutUs || 'Not specified'}</p>
                                    </Col>
                                </Row>
                                {selectedSubmission.address && (
                                    <p>
                                        <FaMapMarkerAlt className="me-2" />
                                        <strong>Address:</strong> {selectedSubmission.address}
                                    </p>
                                )}
                            </div>

                            {/* Interests */}
                            <div className="mb-4">
                                <h6 className="mb-2">Interests</h6>
                                <div className="d-flex flex-wrap gap-1">
                                    {selectedSubmission.interests.map((interest, idx) => (
                                        <Badge key={idx} bg="primary" className="px-3 py-2">
                                            {interest}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            {/* Experience */}
                            <div className="mb-4">
                                <h6 className="mb-2">Experience</h6>
                                <div className="p-3 bg-light rounded">
                                    {selectedSubmission.experience || 'No experience provided'}
                                </div>
                            </div>

                            {/* Message */}
                            {selectedSubmission.message && (
                                <div className="mb-4">
                                    <h6 className="mb-2">Additional Message</h6>
                                    <div className="p-3 bg-light rounded">
                                        {selectedSubmission.message}
                                    </div>
                                </div>
                            )}

                            {/* Admin Reply (if exists) */}
                            {selectedSubmission.adminReply && (
                                <div className="mt-4 p-4 border border-success rounded bg-success bg-opacity-10">
                                    <h6 className="text-success mb-3">
                                        <FaReply className="me-2" />
                                        Your Reply
                                    </h6>
                                    <div className="p-3 bg-white rounded">
                                        <p className="mb-0">{selectedSubmission.adminReply.message}</p>
                                    </div>
                                    <small className="text-muted d-block mt-2">
                                        Sent on: {formatDate(selectedSubmission.adminReply.repliedAt)}
                                    </small>
                                </div>
                            )}
                        </Modal.Body>
                        <Modal.Footer className="border-0">
                            <Button
                                variant="secondary"
                                onClick={() => setSelectedSubmission(null)}
                            >
                                Close
                            </Button>
                            {selectedSubmission.status !== 'replied' && (
                                <Button
                                    variant="primary"
                                    onClick={() => {
                                        setShowReplyModal(true);
                                    }}
                                >
                                    <FaReply className="me-2" />
                                    Reply to Applicant
                                </Button>
                            )}
                        </Modal.Footer>
                    </>
                )}
            </Modal>

            {/* Reply Modal */}
            <Modal
                show={showReplyModal}
                onHide={() => {
                    setShowReplyModal(false);
                    setReplyText('');
                }}
                size="lg"
                centered
            >
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title>
                        <FaReply className="me-2 text-success" />
                        Reply to Applicant
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedSubmission && (
                        <>
                            <div className="mb-4">
                                <p>
                                    <strong>To:</strong> {selectedSubmission.firstName} {selectedSubmission.lastName}
                                    <br />
                                    <strong>Email:</strong> {selectedSubmission.email}
                                </p>
                                <p className="text-muted small">
                                    Your reply will be sent to the applicant and saved in their dashboard.
                                </p>
                            </div>

                            <Form.Group className="mb-4">
                                <Form.Label>
                                    <strong>Your Reply Message</strong>
                                </Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={6}
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Type your reply to the applicant here..."
                                    className="mb-3"
                                />
                                <Form.Text className="text-muted">
                                    Be professional and encouraging. The applicant will see this in their dashboard.
                                </Form.Text>
                            </Form.Group>

                            <div className="alert alert-info">
                                <FaBell className="me-2" />
                                The applicant will receive a real-time notification of your reply.
                            </div>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer className="border-0">
                    <Button
                        variant="secondary"
                        onClick={() => {
                            setShowReplyModal(false);
                            setReplyText('');
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="success"
                        onClick={sendReply}
                        disabled={!replyText.trim()}
                    >
                        <FaPaperclip className="me-2" />
                        Send Reply
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                show={showDeleteModal}
                onHide={() => setShowDeleteModal(false)}
                centered
            >
                <Modal.Header closeButton className="border-0 pb-0">
                    <Modal.Title className="text-danger">
                        <FaTrash className="me-2" />
                        Confirm Delete
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p className="mb-1">
                        Are you sure you want to delete this submission?
                    </p>
                    <p className="fw-bold mb-0">
                        "{submissionToDelete?.firstName} {submissionToDelete?.lastName}"
                    </p>
                    <p className="text-muted small mt-2">
                        This action cannot be undone. All associated data will be permanently removed.
                    </p>
                </Modal.Body>
                <Modal.Footer className="border-0">
                    <Button
                        variant="secondary"
                        onClick={() => setShowDeleteModal(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="danger"
                        onClick={deleteSubmission}
                    >
                        Delete Permanently
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Footer */}
            <div className="mt-4 pt-3 border-top">
                <Row>
                    <Col md={6}>
                        <p className="text-muted small mb-0">
                            <FaSync className="me-1" />
                            Real-time updates enabled via WebSocket
                        </p>
                    </Col>
                    <Col md={6} className="text-md-end">
                        <p className="text-muted small mb-0">
                            Total submissions in system: {submissions.length}
                        </p>
                    </Col>
                </Row>
            </div>
        </Container>
    );
};

export default AdminSubmissionsDashboard;