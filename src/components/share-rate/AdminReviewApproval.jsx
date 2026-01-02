import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Badge, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { StarFill, Star, Calendar, Phone, CheckCircle, Trash, Reply, ArrowClockwise } from 'react-bootstrap-icons';
import appReviewsApi from '../../services/appReviewsApi';
import './ShareRateStyles.css';

const AdminReviewApproval = () => {
    const [pendingReviews, setPendingReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [responseTexts, setResponseTexts] = useState({});
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10, // Strict limit of 10
        total: 0,
        pages: 1
    });

    // Memoized fetch function so it can be called from multiple places
    const fetchPendingReviews = useCallback(async (showFullLoader = true) => {
        try {
            if (showFullLoader) setLoading(true);
            setRefreshing(true);
            setError('');
            
            const response = await appReviewsApi.get('/reviews/pending', {
                params: {
                    page: pagination.page,
                    limit: 10 // Ensure 10 per page
                }
            });
            
            if (response.data.success) {
                setPendingReviews(response.data.reviews);
                setPagination(response.data.pagination);
            }
        } catch (err) {
            console.error('Error fetching pending reviews:', err);
            setError(err.response?.data?.message || err.message || 'Failed to load pending reviews');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [pagination.page]);

    useEffect(() => {
        fetchPendingReviews();
    }, [fetchPendingReviews]);

    // Manual refresh handler
    const handleManualRefresh = () => {
        fetchPendingReviews(false); // Refresh without showing the giant middle spinner
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
                const newResponses = { ...responseTexts };
                delete newResponses[reviewId];
                setResponseTexts(newResponses);
                
                fetchPendingReviews(false); 
                setError('');
                alert('Review approved successfully!');
            }
        } catch (err) {
            console.error('Error approving review:', err);
            setError(err.message || 'Failed to approve review');
        }
    };

    const handleReject = async (reviewId) => {
        if (!window.confirm('Are you sure you want to reject this review?')) return;
        
        try {
            const response = await appReviewsApi.put(`/reviews/${reviewId}/status`, {
                status: 'rejected'
            });
            
            if (response.data.success) {
                fetchPendingReviews(false);
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
            year: 'numeric', month: 'short', day: 'numeric'
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
                        <div className="d-flex align-items-center gap-2">
                            <Button 
                                variant="outline-primary" 
                                size="sm" 
                                className="d-flex align-items-center gap-2"
                                onClick={handleManualRefresh}
                                disabled={refreshing}
                            >
                                <ArrowClockwise className={refreshing ? 'spin-animation' : ''} />
                                Refresh
                            </Button>
                            <Badge bg="warning" pill className="fs-6 px-3 py-2">
                                {pagination.total} Pending
                            </Badge>
                        </div>
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
                        <Card className="text-center py-5 shadow-sm">
                            <Card.Body>
                                <CheckCircle size={48} className="text-success mb-3" />
                                <h4>All caught up!</h4>
                                <p className="text-muted">No pending reviews at the moment. Click refresh to check for new ones.</p>
                                <Button variant="primary" onClick={handleManualRefresh}>
                                    Check for New Reviews
                                </Button>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            ) : (
                <>
                    {pendingReviews.map((review) => (
                        <Card key={review._id} className="mb-4 shadow-sm border-0">
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
                                                <p className="text-muted mb-0 small">{review.userEmail}</p>
                                            </div>
                                        </div>
                                    </Col>
                                    <Col md={4} className="text-md-end mt-2 mt-md-0">
                                        <div className="d-flex align-items-center justify-content-md-end">
                                            <div className="me-2">{renderStars(review.rating)}</div>
                                            <Badge bg="light" text="dark" className="fs-6 border">{review.rating}/5</Badge>
                                        </div>
                                    </Col>
                                </Row>

                                <Card.Text className="fs-5 mb-3 fst-italic">
                                    "{review.review || 'No written feedback provided.'}"
                                </Card.Text>

                                <Row className="mb-3">
                                    <Col>
                                        <div className="d-flex flex-wrap gap-3">
                                            <span className="text-muted small"><Calendar className="me-1" /> {formatDate(review.createdAt)}</span>
                                            <span className="text-muted small"><Phone className="me-1" /> Source: {review.appStore}</span>
                                        </div>
                                    </Col>
                                </Row>

                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold text-muted"><Reply className="me-2" />Admin Response (Optional)</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={2}
                                        placeholder="Write an official response..."
                                        value={responseTexts[review._id] || ''}
                                        onChange={(e) => handleResponseChange(review._id, e.target.value)}
                                    />
                                </Form.Group>

                                <div className="d-flex gap-2">
                                    <Button variant="success" onClick={() => handleApprove(review._id)} className="flex-grow-1">
                                        <CheckCircle className="me-2" /> Approve
                                    </Button>
                                    <Button variant="outline-danger" onClick={() => handleReject(review._id)} className="px-4">
                                        <Trash className="me-2" /> Reject
                                    </Button>
                                </div>
                            </Card.Body>
                        </Card>
                    ))}

                    {/* Pagination - Shows when there are more than 10 reviews */}
                    {pagination.pages > 1 && (
                        <div className="d-flex justify-content-center mt-4">
                            <nav>
                                <ul className="pagination shadow-sm">
                                    <li className={`page-item ${pagination.page === 1 ? 'disabled' : ''}`}>
                                        <button 
                                            className="page-link"
                                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
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
                                        >
                                            Next
                                        </button>
                                    </li>
                                </ul>
                            </nav>
                        </div>
                    )}
                </>
            )}
        </Container>
    );
};

export default AdminReviewApproval;