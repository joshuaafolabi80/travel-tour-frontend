import React, { useState, useEffect, useCallback } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Badge, 
  Button, 
  Form, 
  Alert, 
  Spinner, 
  Toast, 
  ToastContainer 
} from 'react-bootstrap';
import { 
  StarFill, 
  Star, 
  Calendar, 
  Phone, 
  CheckCircle, 
  Trash, 
  Reply, 
  ArrowClockwise,
  ExclamationCircle
} from 'react-bootstrap-icons';
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
        limit: 10,
        total: 0,
        pages: 1
    });

    // Toast notification state
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastVariant, setToastVariant] = useState('success'); // 'success', 'danger', 'warning'
    const [toastIcon, setToastIcon] = useState(<CheckCircle />);

    // Show toast notification
    const showNotification = (message, variant = 'success') => {
        setToastMessage(message);
        setToastVariant(variant);
        
        // Set icon based on variant
        switch(variant) {
            case 'danger':
                setToastIcon(<ExclamationCircle />);
                break;
            case 'warning':
                setToastIcon(<ExclamationCircle />);
                break;
            default:
                setToastIcon(<CheckCircle />);
        }
        
        setShowToast(true);
    };

    // Memoized fetch function
    const fetchPendingReviews = useCallback(async (showFullLoader = true) => {
        try {
            if (showFullLoader) setLoading(true);
            setRefreshing(true);
            setError('');
            
            const response = await appReviewsApi.get('/reviews/pending', {
                params: {
                    page: pagination.page,
                    limit: 10
                }
            });
            
            if (response.data.success) {
                setPendingReviews(response.data.reviews);
                setPagination(response.data.pagination);
                
                // Show notification if new reviews were found during refresh
                if (!showFullLoader && response.data.reviews.length > 0) {
                    showNotification(
                        `${response.data.reviews.length} new review(s) loaded`, 
                        'success'
                    );
                }
            }
        } catch (err) {
            console.error('Error fetching pending reviews:', err);
            const errorMsg = err.response?.data?.message || err.message || 'Failed to load pending reviews';
            setError(errorMsg);
            
            // Show toast for network errors
            if (!err.response) {
                showNotification('Network error. Please check your connection.', 'danger');
            }
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
        fetchPendingReviews(false);
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
                
                // Fetch updated list
                await fetchPendingReviews(false);
                
                // Clear any previous errors
                setError('');
                
                // Show success notification
                showNotification(
                    adminResponse 
                        ? 'Review approved with response!'
                        : 'Review approved successfully!',
                    'success'
                );
            }
        } catch (err) {
            console.error('Error approving review:', err);
            const errorMsg = err.response?.data?.message || err.message || 'Failed to approve review';
            setError(errorMsg);
            
            // Show error notification
            showNotification('Failed to approve review. Please try again.', 'danger');
        }
    };

    const handleReject = async (reviewId) => {
        // Confirm rejection
        const confirmed = window.confirm(
            'Are you sure you want to reject this review?\n\n' +
            'The user will be notified and this review will not be visible to the public.'
        );
        
        if (!confirmed) return;
        
        try {
            const response = await appReviewsApi.put(`/reviews/${reviewId}/status`, {
                status: 'rejected'
            });
            
            if (response.data.success) {
                await fetchPendingReviews(false);
                
                // Show notification
                showNotification('Review rejected successfully', 'warning');
            }
        } catch (err) {
            console.error('Error rejecting review:', err);
            const errorMsg = err.response?.data?.message || err.message || 'Failed to reject review';
            setError(errorMsg);
            
            // Show error notification
            showNotification('Failed to reject review. Please try again.', 'danger');
        }
    };

    const handleBulkApprove = async () => {
        if (pendingReviews.length === 0) {
            showNotification('No reviews to approve', 'warning');
            return;
        }

        const confirmed = window.confirm(
            `Approve all ${pendingReviews.length} pending reviews?\n\n` +
            'This action cannot be undone.'
        );
        
        if (!confirmed) return;

        try {
            // In a real implementation, you'd have a bulk approve endpoint
            // For now, we'll approve them one by one
            const approvedCount = await processReviewsBulk('approved');
            
            showNotification(
                `${approvedCount} review(s) approved successfully!`,
                'success'
            );
            
            // Refresh the list
            await fetchPendingReviews(false);
            
        } catch (err) {
            console.error('Bulk approve error:', err);
            showNotification('Bulk approval failed', 'danger');
        }
    };

    // Helper function for bulk operations
    const processReviewsBulk = async (status) => {
        let successCount = 0;
        
        for (const review of pendingReviews) {
            try {
                await appReviewsApi.put(`/reviews/${review._id}/status`, {
                    status: status
                });
                successCount++;
                
                // Small delay to avoid rate limiting
                if (successCount % 3 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            } catch (error) {
                console.error(`Failed to process review ${review._id}:`, error);
            }
        }
        
        return successCount;
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
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Loading state
    if (loading && pendingReviews.length === 0) {
        return (
            <Container fluid className="py-4">
                <ToastContainer position="top-center" className="p-3" style={{ zIndex: 9999 }}>
                    {/* Toast container but no toast shown during initial load */}
                </ToastContainer>
                <Row className="mb-4">
                    <Col>
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h2 className="mb-0">Review Moderation Dashboard</h2>
                                <p className="text-muted mb-0">Filter through user feedback and provide official responses</p>
                            </div>
                        </div>
                    </Col>
                </Row>
                <Row>
                    <Col className="text-center py-5">
                        <Spinner animation="border" variant="primary" size="lg" />
                        <p className="mt-3">Loading pending reviews...</p>
                    </Col>
                </Row>
            </Container>
        );
    }

    return (
        <Container fluid className="py-4">
            {/* Toast Notifications */}
            <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999 }}>
                <Toast 
                    onClose={() => setShowToast(false)} 
                    show={showToast} 
                    delay={4000}
                    autohide
                    bg={toastVariant}
                    className={`text-white shadow-lg border-0 ${toastVariant === 'warning' ? 'bg-warning' : ''}`}
                >
                    <Toast.Body className="d-flex align-items-center">
                        <div className="me-3">
                            {toastIcon}
                        </div>
                        <div className="flex-grow-1">
                            <strong>{toastMessage}</strong>
                        </div>
                        <Button 
                            variant={`${toastVariant === 'warning' ? 'outline-light' : 'outline-light'}`}
                            size="sm"
                            onClick={() => setShowToast(false)}
                            className="ms-3"
                        >
                            <span aria-hidden="true">×</span>
                        </Button>
                    </Toast.Body>
                </Toast>
            </ToastContainer>

            {/* Header */}
            <Row className="mb-4">
                <Col>
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                        <div>
                            <h2 className="mb-0">Review Moderation Dashboard</h2>
                            <p className="text-muted mb-0">Filter through user feedback and provide official responses</p>
                        </div>
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                            {pendingReviews.length > 0 && (
                                <Button 
                                    variant="outline-success" 
                                    size="sm" 
                                    className="d-flex align-items-center gap-2"
                                    onClick={handleBulkApprove}
                                    disabled={refreshing}
                                >
                                    <CheckCircle />
                                    Bulk Approve ({pendingReviews.length})
                                </Button>
                            )}
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

            {/* Error Alert */}
            {error && (
                <Row className="mb-3">
                    <Col>
                        <Alert 
                            variant="danger" 
                            onClose={() => setError('')} 
                            dismissible
                            className="shadow-sm"
                        >
                            <Alert.Heading className="h5">
                                <ExclamationCircle className="me-2" />
                                Error
                            </Alert.Heading>
                            <p className="mb-0">{error}</p>
                        </Alert>
                    </Col>
                </Row>
            )}

            {/* Empty State */}
            {pendingReviews.length === 0 && !loading ? (
                <Row>
                    <Col>
                        <Card className="text-center py-5 shadow-sm border-0">
                            <Card.Body>
                                <CheckCircle size={64} className="text-success mb-4" />
                                <h4 className="mb-3">All caught up!</h4>
                                <p className="text-muted mb-4">
                                    No pending reviews at the moment. All user submissions have been moderated.
                                </p>
                                <div className="d-flex justify-content-center gap-3">
                                    <Button 
                                        variant="primary" 
                                        onClick={handleManualRefresh}
                                        className="px-4"
                                    >
                                        <ArrowClockwise className="me-2" />
                                        Check for New Reviews
                                    </Button>
                                    <Button 
                                        variant="outline-secondary"
                                        onClick={() => window.open('/api/reviews/public', '_blank')}
                                    >
                                        View Public Reviews
                                    </Button>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            ) : (
                <>
                    {/* Reviews List */}
                    {pendingReviews.map((review) => (
                        <Card key={review._id} className="mb-4 shadow-sm border-0 hover-lift">
                            <Card.Body>
                                <Row className="align-items-center mb-3">
                                    <Col md={8}>
                                        <div className="d-flex align-items-center">
                                            <div 
                                                className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3 flex-shrink-0"
                                                style={{ width: '50px', height: '50px' }}
                                            >
                                                <span className="fs-5 fw-bold">
                                                    {review.userName?.charAt(0).toUpperCase() || 'U'}
                                                </span>
                                            </div>
                                            <div>
                                                <h5 className="mb-1">{review.userName || 'Anonymous User'}</h5>
                                                <p className="text-muted mb-0 small text-truncate" style={{ maxWidth: '300px' }}>
                                                    {review.userEmail}
                                                </p>
                                            </div>
                                        </div>
                                    </Col>
                                    <Col md={4} className="text-md-end mt-2 mt-md-0">
                                        <div className="d-flex align-items-center justify-content-md-end">
                                            <div className="me-2">{renderStars(review.rating)}</div>
                                            <Badge 
                                                bg="light" 
                                                text="dark" 
                                                className="fs-6 border px-3"
                                            >
                                                {review.rating}/5
                                            </Badge>
                                        </div>
                                    </Col>
                                </Row>

                                {/* Review Content */}
                                <Card.Text className="fs-5 mb-3 fst-italic border-start ps-3 border-primary">
                                    "{review.review || 'No written feedback provided.'}"
                                </Card.Text>

                                {/* Metadata */}
                                <Row className="mb-3">
                                    <Col>
                                        <div className="d-flex flex-wrap gap-3">
                                            <span className="text-muted small d-flex align-items-center">
                                                <Calendar className="me-1" size={14} />
                                                {formatDate(review.createdAt)}
                                            </span>
                                            <span className="text-muted small d-flex align-items-center">
                                                <Phone className="me-1" size={14} />
                                                Source: {review.appStore}
                                            </span>
                                            {review.deviceInfo?.deviceType && (
                                                <span className="text-muted small">
                                                    📱 {review.deviceInfo.deviceType}
                                                </span>
                                            )}
                                        </div>
                                    </Col>
                                </Row>

                                {/* Admin Response Textarea */}
                                <Form.Group className="mb-3">
                                    <Form.Label className="small fw-bold text-muted d-flex align-items-center">
                                        <Reply className="me-2" size={14} />
                                        Admin Response (Optional)
                                        {responseTexts[review._id] && responseTexts[review._id].length > 0 && (
                                            <Badge bg="info" className="ms-2">
                                                {responseTexts[review._id].length} chars
                                            </Badge>
                                        )}
                                    </Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={2}
                                        placeholder="Write an official response to the user..."
                                        value={responseTexts[review._id] || ''}
                                        onChange={(e) => handleResponseChange(review._id, e.target.value)}
                                        className="border-primary"
                                    />
                                    <Form.Text className="text-muted">
                                        This response will be visible to the user and other visitors.
                                    </Form.Text>
                                </Form.Group>

                                {/* Action Buttons */}
                                <div className="d-flex gap-2">
                                    <Button 
                                        variant="success" 
                                        onClick={() => handleApprove(review._id)} 
                                        className="flex-grow-1 d-flex align-items-center justify-content-center gap-2"
                                        disabled={refreshing}
                                    >
                                        <CheckCircle />
                                        Approve
                                        {responseTexts[review._id] && (
                                            <Badge bg="light" text="dark" className="ms-1">
                                                with response
                                            </Badge>
                                        )}
                                    </Button>
                                    <Button 
                                        variant="outline-danger" 
                                        onClick={() => handleReject(review._id)} 
                                        className="px-4 d-flex align-items-center gap-2"
                                        disabled={refreshing}
                                    >
                                        <Trash />
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
                                        <ul className="pagination shadow-sm">
                                            <li className={`page-item ${pagination.page === 1 ? 'disabled' : ''}`}>
                                                <button 
                                                    className="page-link"
                                                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                                    disabled={pagination.page === 1}
                                                >
                                                    Previous
                                                </button>
                                            </li>
                                            
                                            {/* Page numbers */}
                                            {[...Array(Math.min(5, pagination.pages))].map((_, idx) => {
                                                let pageNum;
                                                if (pagination.pages <= 5) {
                                                    pageNum = idx + 1;
                                                } else if (pagination.page <= 3) {
                                                    pageNum = idx + 1;
                                                } else if (pagination.page >= pagination.pages - 2) {
                                                    pageNum = pagination.pages - 4 + idx;
                                                } else {
                                                    pageNum = pagination.page - 2 + idx;
                                                }

                                                if (pageNum > 0 && pageNum <= pagination.pages) {
                                                    return (
                                                        <li 
                                                            key={idx} 
                                                            className={`page-item ${pagination.page === pageNum ? 'active' : ''}`}
                                                        >
                                                            <button 
                                                                className="page-link"
                                                                onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                                                            >
                                                                {pageNum}
                                                            </button>
                                                        </li>
                                                    );
                                                }
                                                return null;
                                            })}
                                            
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

                    {/* Stats Footer */}
                    <Row className="mt-4">
                        <Col>
                            <Card className="border-0 bg-light">
                                <Card.Body className="py-3">
                                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                                        <div>
                                            <small className="text-muted">
                                                Showing {pendingReviews.length} of {pagination.total} pending reviews
                                            </small>
                                        </div>
                                        <div className="d-flex gap-3">
                                            <Button 
                                                variant="link" 
                                                size="sm" 
                                                className="text-decoration-none"
                                                onClick={handleManualRefresh}
                                            >
                                                <ArrowClockwise className={`me-1 ${refreshing ? 'spin-animation' : ''}`} />
                                                {refreshing ? 'Refreshing...' : 'Refresh List'}
                                            </Button>
                                            <Button 
                                                variant="link" 
                                                size="sm" 
                                                className="text-decoration-none"
                                                onClick={() => showNotification('Help documentation will open in a new tab', 'info')}
                                            >
                                                <i className="fas fa-question-circle me-1"></i>
                                                Help
                                            </Button>
                                        </div>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </>
            )}
        </Container>
    );
};

export default AdminReviewApproval;