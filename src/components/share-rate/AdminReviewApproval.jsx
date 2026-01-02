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
  ToastContainer,
  Tooltip,
  OverlayTrigger,
  Modal
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
  ExclamationCircle,
  Eye,
  QuestionCircle,
  XCircle
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

    // NEW: State for public reviews modal
    const [showPublicReviewsModal, setShowPublicReviewsModal] = useState(false);
    const [publicReviews, setPublicReviews] = useState([]);
    const [loadingPublic, setLoadingPublic] = useState(false);

    // Toast notification state
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastVariant, setToastVariant] = useState('success');
    const [toastIcon, setToastIcon] = useState(<CheckCircle />);

    // Show toast notification
    const showNotification = (message, variant = 'success') => {
        setToastMessage(message);
        setToastVariant(variant);
        
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

    // NEW: Function to fetch public reviews
    const fetchPublicReviews = async () => {
        try {
            setLoadingPublic(true);
            const response = await appReviewsApi.get('/reviews/public');
            if (response.data.success) {
                setPublicReviews(response.data.reviews);
                setShowPublicReviewsModal(true);
            }
        } catch (error) {
            console.error('Error fetching public reviews:', error);
            showNotification('Failed to load public reviews', 'danger');
        } finally {
            setLoadingPublic(false);
        }
    };

    // UPDATED: Navigate to public reviews page
    const handleViewPublicReviews = () => {
        fetchPublicReviews();
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
                const newResponses = { ...responseTexts };
                delete newResponses[reviewId];
                setResponseTexts(newResponses);
                
                await fetchPendingReviews(false);
                
                setError('');
                
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
            
            showNotification('Failed to approve review. Please try again.', 'danger');
        }
    };

    const handleReject = async (reviewId) => {
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
                
                showNotification('Review rejected successfully', 'warning');
            }
        } catch (err) {
            console.error('Error rejecting review:', err);
            const errorMsg = err.response?.data?.message || err.message || 'Failed to reject review';
            setError(errorMsg);
            
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
            const approvedCount = await processReviewsBulk('approved');
            
            showNotification(
                `${approvedCount} review(s) approved successfully!`,
                'success'
            );
            
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
                
                if (successCount % 3 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            } catch (error) {
                console.error(`Failed to process review ${review._id}:`, error);
            }
        }
        
        return successCount;
    };

    // Get public reviews stats for display
    const [publicStats, setPublicStats] = useState({
        totalReviews: 0,
        averageRating: 0
    });

    const fetchPublicStats = useCallback(async () => {
        try {
            const response = await appReviewsApi.get('/stats');
            if (response.data.success) {
                setPublicStats({
                    totalReviews: response.data.statistics?.totalReviews || 0,
                    averageRating: response.data.statistics?.averageRating || 0
                });
            }
        } catch (err) {
            console.error('Error fetching public stats:', err);
        }
    }, []);

    useEffect(() => {
        fetchPublicStats();
    }, [fetchPublicStats]);

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
                <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999 }} />
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
            {/* NEW: Public Reviews Modal */}
            <Modal 
                show={showPublicReviewsModal} 
                onHide={() => setShowPublicReviewsModal(false)}
                size="xl"
                centered
                scrollable
            >
                <Modal.Header closeButton className="bg-light">
                    <Modal.Title className="d-flex align-items-center gap-2">
                        <Eye />
                        Public Reviews ({publicReviews.length})
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-0">
                    {loadingPublic ? (
                        <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-2">Loading public reviews...</p>
                        </div>
                    ) : publicReviews.length === 0 ? (
                        <div className="text-center py-5">
                            <ExclamationCircle size={48} className="text-warning mb-3" />
                            <h5>No Public Reviews Yet</h5>
                            <p className="text-muted">Approved reviews will appear here.</p>
                        </div>
                    ) : (
                        <div className="p-3">
                            {publicReviews.map((review) => (
                                <Card key={review._id} className="mb-3 shadow-sm border-0">
                                    <Card.Body>
                                        <Row className="align-items-center mb-2">
                                            <Col md={8}>
                                                <div className="d-flex align-items-center">
                                                    <div 
                                                        className="bg-info text-white rounded-circle d-flex align-items-center justify-content-center me-3 flex-shrink-0"
                                                        style={{ width: '40px', height: '40px' }}
                                                    >
                                                        <span className="fs-6 fw-bold">
                                                            {review.userName?.charAt(0).toUpperCase() || 'U'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <h6 className="mb-0">{review.userName || 'Anonymous User'}</h6>
                                                        <p className="text-muted mb-0 small">
                                                            {review.userEmail}
                                                        </p>
                                                    </div>
                                                </div>
                                            </Col>
                                            <Col md={4} className="text-md-end">
                                                <div className="d-flex align-items-center justify-content-md-end">
                                                    <div className="me-2">{renderStars(review.rating)}</div>
                                                    <Badge bg="light" text="dark" className="border">
                                                        {review.rating}/5
                                                    </Badge>
                                                </div>
                                            </Col>
                                        </Row>
                                        
                                        <Card.Text className="mb-2 fst-italic">
                                            "{review.review || 'No written feedback provided.'}"
                                        </Card.Text>
                                        
                                        {review.adminResponse && (
                                            <Alert variant="info" className="p-2 mb-2">
                                                <div className="d-flex">
                                                    <Reply className="me-2 mt-1" size={14} />
                                                    <div>
                                                        <strong>Admin Response:</strong>
                                                        <p className="mb-0">{review.adminResponse}</p>
                                                    </div>
                                                </div>
                                            </Alert>
                                        )}
                                        
                                        <div className="d-flex flex-wrap gap-3 small text-muted">
                                            <span className="d-flex align-items-center">
                                                <Calendar className="me-1" size={12} />
                                                {formatDate(review.createdAt)}
                                            </span>
                                            <span className="d-flex align-items-center">
                                                <Phone className="me-1" size={12} />
                                                {review.appStore}
                                            </span>
                                            <Badge bg={review.status === 'approved' ? 'success' : 'warning'}>
                                                {review.status}
                                            </Badge>
                                        </div>
                                    </Card.Body>
                                </Card>
                            ))}
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer className="bg-light">
                    <div className="d-flex justify-content-between w-100">
                        <div className="d-flex align-items-center">
                            <Badge bg="success" className="me-2">
                                {publicStats.totalReviews} Total
                            </Badge>
                            <Badge bg="warning" className="me-2">
                                Avg: {publicStats.averageRating.toFixed(1)}/5
                            </Badge>
                        </div>
                        <Button 
                            variant="secondary" 
                            onClick={() => setShowPublicReviewsModal(false)}
                        >
                            Close
                        </Button>
                    </div>
                </Modal.Footer>
            </Modal>

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
                            {/* Public Reviews Stats */}
                            <OverlayTrigger
                                placement="bottom"
                                overlay={
                                    <Tooltip>
                                        View all approved reviews by users
                                    </Tooltip>
                                }
                            >
                                <Button 
                                    variant="outline-info" 
                                    size="sm" 
                                    className="d-flex align-items-center gap-2"
                                    onClick={handleViewPublicReviews}
                                    disabled={loadingPublic}
                                >
                                    {loadingPublic ? (
                                        <Spinner animation="border" size="sm" />
                                    ) : (
                                        <Eye />
                                    )}
                                    Public Reviews 
                                    <Badge bg="info" className="ms-1">
                                        {publicStats.totalReviews}
                                    </Badge>
                                </Button>
                            </OverlayTrigger>
                            
                            {pendingReviews.length > 0 && (
                                <OverlayTrigger
                                    placement="bottom"
                                    overlay={
                                        <Tooltip>
                                            Approve all pending reviews at once
                                        </Tooltip>
                                    }
                                >
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
                                </OverlayTrigger>
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
                                <div className="d-flex justify-content-center gap-3 flex-wrap">
                                    <Button 
                                        variant="primary" 
                                        onClick={handleManualRefresh}
                                        className="px-4 d-flex align-items-center gap-2"
                                    >
                                        <ArrowClockwise className="me-2" />
                                        Check for New Reviews
                                    </Button>
                                    <Button 
                                        variant="outline-info"
                                        onClick={handleViewPublicReviews}
                                        className="d-flex align-items-center gap-2"
                                        disabled={loadingPublic}
                                    >
                                        {loadingPublic ? (
                                            <Spinner animation="border" size="sm" className="me-2" />
                                        ) : (
                                            <Eye className="me-2" />
                                        )}
                                        View Public Reviews
                                        <Badge bg="info" className="ms-2">
                                            {publicStats.totalReviews} reviews
                                        </Badge>
                                    </Button>
                                </div>
                                
                                {/* Stats Display */}
                                {publicStats.totalReviews > 0 && (
                                    <div className="mt-4 pt-4 border-top">
                                        <h5 className="text-muted mb-3">Public Reviews Overview</h5>
                                        <Row className="justify-content-center">
                                            <Col xs={6} md={3}>
                                                <Card className="border-0 bg-light shadow-sm">
                                                    <Card.Body className="text-center">
                                                        <div className="display-6 fw-bold text-primary">
                                                            {publicStats.totalReviews}
                                                        </div>
                                                        <p className="text-muted mb-0">Total Reviews</p>
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                            <Col xs={6} md={3}>
                                                <Card className="border-0 bg-light shadow-sm">
                                                    <Card.Body className="text-center">
                                                        <div className="display-6 fw-bold text-warning">
                                                            {publicStats.averageRating.toFixed(1)}
                                                        </div>
                                                        <p className="text-muted mb-0">Avg Rating</p>
                                                    </Card.Body>
                                                </Card>
                                            </Col>
                                        </Row>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            ) : (
                <>
                    {/* Reviews List */}
                    {pendingReviews.map((review) => (
                        <Card key={review._id} className="mb-4 shadow-sm border-0 hover-lift fade-in-review">
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

                                {/* Action Buttons - Responsive Layout */}
                                <div className="d-flex flex-column flex-sm-row gap-2">
                                    {/* Approve Button Group */}
                                    <div className="flex-grow-1 d-flex flex-column flex-sm-row gap-2">
                                        <Button 
                                            variant="success" 
                                            onClick={() => handleApprove(review._id)} 
                                            className="d-flex align-items-center justify-content-center gap-2 flex-grow-1"
                                            disabled={refreshing}
                                            size="lg"
                                        >
                                            <CheckCircle />
                                            Approve
                                            {responseTexts[review._id] && responseTexts[review._id].trim() && (
                                                <Badge 
                                                    bg="light" 
                                                    text="dark" 
                                                    className="ms-1 d-none d-sm-inline-block"
                                                >
                                                    with response
                                                </Badge>
                                            )}
                                        </Button>
                                        
                                        {/* Badge shown below on mobile when there's a response */}
                                        {responseTexts[review._id] && responseTexts[review._id].trim() && (
                                            <div className="d-block d-sm-none w-100 text-center mt-2">
                                                <Badge bg="info" className="px-3 py-2">
                                                    <i className="fas fa-comment me-1"></i>
                                                    Will include response
                                                </Badge>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Reject Button */}
                                    <Button 
                                        variant="outline-danger" 
                                        onClick={() => handleReject(review._id)} 
                                        className="d-flex align-items-center justify-content-center gap-2 px-4"
                                        disabled={refreshing}
                                        size="lg"
                                    >
                                        <Trash />
                                        Reject
                                    </Button>
                                </div>
                                
                                {/* Quick Actions */}
                                <div className="mt-3 pt-3 border-top">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <small className="text-muted">
                                            <i className="fas fa-history me-1"></i>
                                            Submitted {formatDate(review.createdAt)}
                                        </small>
                                        <div className="d-flex gap-2">
                                            <OverlayTrigger
                                                placement="top"
                                                overlay={
                                                    <Tooltip>
                                                        Approve without response
                                                    </Tooltip>
                                                }
                                            >
                                                <Button 
                                                    variant="outline-success" 
                                                    size="sm"
                                                    onClick={() => {
                                                        setResponseTexts(prev => {
                                                            const newResponses = {...prev};
                                                            delete newResponses[review._id];
                                                            return newResponses;
                                                        });
                                                        setTimeout(() => handleApprove(review._id), 100);
                                                    }}
                                                >
                                                    <i className="fas fa-check me-1"></i>
                                                    Quick Approve
                                                </Button>
                                            </OverlayTrigger>
                                        </div>
                                    </div>
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
                            <Card className="border-0 bg-light shadow-sm">
                                <Card.Body className="py-3">
                                    <Row className="align-items-center">
                                        <Col md={6} className="mb-3 mb-md-0">
                                            <div className="d-flex align-items-center">
                                                <div className="bg-white rounded-circle p-3 me-3 shadow-sm">
                                                    <i className="fas fa-chart-bar text-primary fs-4"></i>
                                                </div>
                                                <div>
                                                    <h6 className="mb-1 fw-bold">Review Statistics</h6>
                                                    <p className="text-muted mb-0 small">
                                                        Showing {pendingReviews.length} of {pagination.total} pending reviews
                                                    </p>
                                                </div>
                                            </div>
                                        </Col>
                                        
                                        <Col md={6}>
                                            <div className="d-flex justify-content-md-end flex-wrap gap-3">
                                                <Button 
                                                    variant="link" 
                                                    size="sm" 
                                                    className="text-decoration-none d-flex align-items-center gap-2"
                                                    onClick={handleManualRefresh}
                                                >
                                                    <ArrowClockwise className={`${refreshing ? 'spin-animation' : ''}`} />
                                                    {refreshing ? 'Refreshing...' : 'Refresh List'}
                                                </Button>
                                                
                                                <Button 
                                                    variant="link" 
                                                    size="sm" 
                                                    className="text-decoration-none d-flex align-items-center gap-2"
                                                    onClick={handleViewPublicReviews}
                                                    disabled={loadingPublic}
                                                >
                                                    {loadingPublic ? (
                                                        <Spinner animation="border" size="sm" />
                                                    ) : (
                                                        <Eye />
                                                    )}
                                                    View Public Reviews
                                                </Button>
                                                
                                                <OverlayTrigger
                                                    placement="top"
                                                    overlay={
                                                        <Tooltip>
                                                            View moderation guidelines and help
                                                        </Tooltip>
                                                    }
                                                >
                                                    <Button 
                                                        variant="link" 
                                                        size="sm" 
                                                        className="text-decoration-none d-flex align-items-center gap-2"
                                                        onClick={() => showNotification('Help documentation will open in a new tab', 'info')}
                                                    >
                                                        <QuestionCircle />
                                                        Help
                                                    </Button>
                                                </OverlayTrigger>
                                            </div>
                                        </Col>
                                    </Row>
                                    
                                    {/* Public Stats */}
                                    <Row className="mt-3 pt-3 border-top">
                                        <Col>
                                            <div className="d-flex justify-content-center gap-4 flex-wrap">
                                                <div className="text-center">
                                                    <div className="fw-bold fs-5 text-primary">{pagination.total}</div>
                                                    <small className="text-muted">Pending Reviews</small>
                                                </div>
                                                <div className="text-center">
                                                    <div className="fw-bold fs-5 text-success">{publicStats.totalReviews}</div>
                                                    <small className="text-muted">Public Reviews</small>
                                                </div>
                                                <div className="text-center">
                                                    <div className="fw-bold fs-5 text-warning">{publicStats.averageRating.toFixed(1)}</div>
                                                    <small className="text-muted">Avg Public Rating</small>
                                                </div>
                                            </div>
                                        </Col>
                                    </Row>
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