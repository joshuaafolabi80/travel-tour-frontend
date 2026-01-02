// travel-tour-frontend/src/components/share-rate/AdminReviewApproval.jsx
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { StarFill, Star, Calendar, Phone, CheckCircle, Trash, Reply } from 'react-bootstrap-icons';
import appReviewsApi from '../../services/appReviewsApi';
import './ShareRateStyles.css';

const AdminReviewApproval = () => {
    const [pendingReviews, setPendingReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [responseTexts, setResponseTexts] = useState({});
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        pages: 1
    });

    useEffect(() => {
        fetchPendingReviews();
    }, [pagination.page]);

    const fetchPendingReviews = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await appReviewsApi.get('/reviews/pending', {
                params: {
                    page: pagination.page,
                    limit: pagination.limit
                }
            });
            
            if (response.data.success) {
                setPendingReviews(response.data.reviews);
                setPagination(response.data.pagination);
            }
        } catch (err) {
            console.error('Error fetching pending reviews:', err);
            setError(err.message || 'Failed to load pending reviews');
        } finally {
            setLoading(false);
        }
    };

    const handleResponseChange = (id, text) => {
        setResponseTexts(prev => ({ ...prev, [id]: text }));
    };

    const handleApprove = async (reviewId) => {
        try {
            const adminResponse = responseTexts[reviewId];
            const payload = { status: 'approved' };
            
            if (adminResponse && adminResponse.trim()) {
                payload.adminResponse = adminResponse.trim();
            }

            const response = await appReviewsApi.put(`/reviews/${reviewId}/status`, payload);

            if (response.data.success) {
                // Clear response text
                const newResponses = { ...responseTexts };
                delete newResponses[reviewId];
                setResponseTexts(newResponses);
                
                // Refresh list
                fetchPendingReviews();
                
                // Show success message
                setError('');
                alert('Review approved successfully!');
            }
        } catch (err) {
            console.error('Error approving review:', err);
            setError(err.message || 'Failed to approve review');
        }
    };

    const handleReject = async (reviewId) => {
        if (!window.confirm('Are you sure you want to reject this review? It will not be shown to the public.')) return;
        
        try {
            const response = await appReviewsApi.put(`/reviews/${reviewId}/status`, {
                status: 'rejected'
            });
            
            if (response.data.success) {
                fetchPendingReviews();
                alert('Review rejected');
            }
        } catch (err) {
            console.error('Error rejecting review:', err);
            setError(err.message || 'Failed to reject review');
        }
    };

    const renderStars = (rating) => {
        return [...Array(5)].map((_, index) => (
            <span key={index} className="me-1">
                {index < rating ? (
                    <StarFill className="text-warning" />
                ) : (
                    <Star className="text-secondary" />
                )}
            </span>
        ));
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading && pendingReviews.length === 0) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">Loading pending reviews...</p>
            </Container>
        );
    }

    return (
        <Container fluid className="py-4">
            <Row className="mb-4">
                <Col>
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h2 className="mb-0">Review Moderation Dashboard</h2>
                            <p className="text-muted mb-0">Filter through user feedback and provide official responses</p>
                        </div>
                        <Badge bg="warning" pill className="fs-6 px-3 py-2">
                            {pendingReviews.length} Pending
                        </Badge>
                    </div>
                </Col>
            </Row>

            {error && (
                <Row className="mb-3">
                    <Col>
                        <Alert variant="danger" onClose={() => setError('')} dismissible>
                            {error}
                        </Alert>
                    </Col>
                </Row>
            )}

            {pendingReviews.length === 0 ? (
                <Row>
                    <Col>
                        <Card className="text-center py-5">
                            <Card.Body>
                                <CheckCircle size={48} className="text-success mb-3" />
                                <h4>All reviews have been moderated!</h4>
                                <p className="text-muted">No pending reviews at the moment.</p>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            ) : (
                <>
                    {pendingReviews.map((review) => (
                        <Card key={review._id} className="mb-4 shadow-sm">
                            <Card.Body>
                                <Row className="align-items-center mb-3">
                                    <Col md={8}>
                                        <div className="d-flex align-items-center">
                                            <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" 
                                                 style={{ width: '50px', height: '50px' }}>
                                                <span className="fs-5 fw-bold">
                                                    {review.userName?.charAt(0).toUpperCase() || 'U'}
                                                </span>
                                            </div>
                                            <div>
                                                <h5 className="mb-1">{review.userName || 'Anonymous User'}</h5>
                                                <p className="text-muted mb-0 small">
                                                    {review.userEmail}
                                                </p>
                                            </div>
                                        </div>
                                    </Col>
                                    <Col md={4} className="text-md-end mt-2 mt-md-0">
                                        <div className="d-flex align-items-center justify-content-md-end">
                                            <div className="me-2">
                                                {renderStars(review.rating)}
                                            </div>
                                            <Badge bg="light" text="dark" className="fs-6">
                                                {review.rating}/5
                                            </Badge>
                                        </div>
                                    </Col>
                                </Row>

                                <Card.Text className="fs-5 mb-3 fst-italic">
                                    "{review.review || 'No written feedback provided.'}"
                                </Card.Text>

                                <Row className="mb-3">
                                    <Col>
                                        <div className="d-flex flex-wrap gap-3">
                                            <span className="text-muted">
                                                <Calendar className="me-1" />
                                                {formatDate(review.createdAt)}
                                            </span>
                                            <span className="text-muted">
                                                <Phone className="me-1" />
                                                Source: {review.appStore}
                                            </span>
                                        </div>
                                    </Col>
                                </Row>

                                <Form.Group className="mb-3">
                                    <Form.Label>
                                        <Reply className="me-2" />
                                        Admin Response (Optional)
                                    </Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        placeholder="Write an official response..."
                                        value={responseTexts[review._id] || ''}
                                        onChange={(e) => handleResponseChange(review._id, e.target.value)}
                                    />
                                </Form.Group>

                                <div className="d-flex gap-2">
                                    <Button
                                        variant="success"
                                        onClick={() => handleApprove(review._id)}
                                        className="flex-grow-1"
                                    >
                                        <CheckCircle className="me-2" />
                                        Approve
                                    </Button>
                                    <Button
                                        variant="danger"
                                        onClick={() => handleReject(review._id)}
                                        className="flex-grow-1"
                                    >
                                        <Trash className="me-2" />
                                        Reject
                                    </Button>
                                </div>
                            </Card.Body>
                        </Card>
                    ))}

                    {/* Pagination */}
                    {pagination.pages > 1 && (
                        <Row className="mt-4">
                            <Col>
                                <div className="d-flex justify-content-center">
                                    <nav>
                                        <ul className="pagination">
                                            <li className={`page-item ${pagination.page === 1 ? 'disabled' : ''}`}>
                                                <button 
                                                    className="page-link"
                                                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                                    disabled={pagination.page === 1}
                                                >
                                                    Previous
                                                </button>
                                            </li>
                                            
                                            {[...Array(pagination.pages)].map((_, idx) => (
                                                <li key={idx} className={`page-item ${pagination.page === idx + 1 ? 'active' : ''}`}>
                                                    <button 
                                                        className="page-link"
                                                        onClick={() => setPagination(prev => ({ ...prev, page: idx + 1 }))}
                                                    >
                                                        {idx + 1}
                                                    </button>
                                                </li>
                                            ))}
                                            
                                            <li className={`page-item ${pagination.page === pagination.pages ? 'disabled' : ''}`}>
                                                <button 
                                                    className="page-link"
                                                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                                    disabled={pagination.page === pagination.pages}
                                                >
                                                    Next
                                                </button>
                                            </li>
                                        </ul>
                                    </nav>
                                </div>
                            </Col>
                        </Row>
                    )}
                </>
            )}
        </Container>
    );
};

export default AdminReviewApproval;