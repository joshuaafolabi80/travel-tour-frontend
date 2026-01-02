// travel-tour-frontend/src/components/share-rate/AppReviewsList.jsx
import React, { useState, useEffect } from 'react';
import { 
    Container, Row, Col, Card, Badge, Button, Form, 
    ProgressBar, Alert, Spinner, Dropdown 
} from 'react-bootstrap';
import { 
    StarFill, Star, Calendar, HandThumbsUp, 
    Filter, SortDown, PersonCircle 
} from 'react-bootstrap-icons';
import appReviewsApi from '../../services/appReviewsApi';
import './ShareRateStyles.css';

const AppReviewsList = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    });
    const [filter, setFilter] = useState('all');
    const [sortBy, setSortBy] = useState('recent');
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        pages: 1
    });

    useEffect(() => {
        fetchReviews();
    }, [filter, sortBy, pagination.page]);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const response = await appReviewsApi.get('/reviews/public', {
                params: {
                    rating: filter !== 'all' ? filter : '',
                    sortBy: sortBy === 'recent' ? 'createdAt' : sortBy === 'helpful' ? 'helpfulVotes' : 'rating',
                    sortOrder: 'desc',
                    page: pagination.page,
                    limit: pagination.limit
                }
            });

            if (response.data.success) {
                setReviews(response.data.reviews);
                setStats(response.data.stats || response.data.statistics);
                setPagination(response.data.pagination || {
                    page: 1,
                    limit: 10,
                    total: response.data.stats?.totalReviews || 0,
                    pages: 1
                });
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleHelpfulVote = async (reviewId) => {
        try {
            const response = await appReviewsApi.post(`/reviews/${reviewId}/helpful`);
            if (response.data.success) {
                setReviews(prev => prev.map(r => 
                    r._id === reviewId ? { ...r, helpfulVotes: response.data.helpfulVotes } : r
                ));
            }
        } catch (error) {
            console.error('Error voting:', error);
            alert('Please login to vote');
        }
    };

    const renderStars = (rating) => (
        <div className="d-flex">
            {[...Array(5)].map((_, index) => (
                <span key={index} className="me-1">
                    {index < rating ? (
                        <StarFill className="text-warning" size={20} />
                    ) : (
                        <Star className="text-secondary" size={20} />
                    )}
                </span>
            ))}
        </div>
    );

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const calculatePercentage = (count) => {
        return stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
    };

    if (loading && reviews.length === 0) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">Loading reviews...</p>
            </Container>
        );
    }

    return (
        <Container fluid className="py-4">
            {/* Statistics Card */}
            <Card className="mb-4 shadow">
                <Card.Body>
                    <Row className="align-items-center">
                        <Col md={4} className="text-center mb-3 mb-md-0">
                            <h1 className="display-1 fw-bold text-primary">
                                {parseFloat(stats.averageRating).toFixed(1)}
                            </h1>
                            {renderStars(Math.round(stats.averageRating))}
                            <p className="text-muted mt-2">
                                {stats.totalReviews} Verified Reviews
                            </p>
                        </Col>
                        
                        <Col md={8}>
                            <h5 className="mb-3">Rating Distribution</h5>
                            {[5, 4, 3, 2, 1].map((num) => {
                                const count = stats.ratingDistribution[num] || 0;
                                const percent = calculatePercentage(count);
                                return (
                                    <div key={num} className="mb-2">
                                        <div className="d-flex justify-content-between mb-1">
                                            <span>
                                                {num} Star
                                                <span className="ms-2">
                                                    {renderStars(num)}
                                                </span>
                                            </span>
                                            <span className="text-muted">{count}</span>
                                        </div>
                                        <ProgressBar 
                                            now={percent} 
                                            variant={num >= 4 ? "success" : num >= 3 ? "warning" : "danger"}
                                            style={{ height: '8px' }}
                                        />
                                    </div>
                                );
                            })}
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Filters and Sorting */}
            <Card className="mb-4">
                <Card.Body>
                    <Row className="align-items-center">
                        <Col md={6}>
                            <div className="d-flex flex-wrap gap-2">
                                <Button
                                    variant={filter === 'all' ? 'primary' : 'outline-primary'}
                                    size="sm"
                                    onClick={() => setFilter('all')}
                                >
                                    All
                                </Button>
                                <Button
                                    variant={filter === '5' ? 'primary' : 'outline-primary'}
                                    size="sm"
                                    onClick={() => setFilter('5')}
                                >
                                    5 Stars
                                </Button>
                                <Button
                                    variant={filter === '4' ? 'primary' : 'outline-primary'}
                                    size="sm"
                                    onClick={() => setFilter('4')}
                                >
                                    4 Stars
                                </Button>
                                <Button
                                    variant={filter === '3' ? 'primary' : 'outline-primary'}
                                    size="sm"
                                    onClick={() => setFilter('3')}
                                >
                                    3 Stars
                                </Button>
                            </div>
                        </Col>
                        
                        <Col md={6} className="mt-2 mt-md-0">
                            <div className="d-flex justify-content-md-end">
                                <Dropdown>
                                    <Dropdown.Toggle variant="outline-secondary" size="sm">
                                        <SortDown className="me-2" />
                                        Sort by: {sortBy === 'recent' ? 'Newest' : 
                                                 sortBy === 'highest' ? 'Highest Rated' : 
                                                 'Most Helpful'}
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu>
                                        <Dropdown.Item onClick={() => setSortBy('recent')}>
                                            Newest First
                                        </Dropdown.Item>
                                        <Dropdown.Item onClick={() => setSortBy('highest')}>
                                            Highest Rated
                                        </Dropdown.Item>
                                        <Dropdown.Item onClick={() => setSortBy('helpful')}>
                                            Most Helpful
                                        </Dropdown.Item>
                                    </Dropdown.Menu>
                                </Dropdown>
                            </div>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Reviews List */}
            {reviews.length === 0 ? (
                <Alert variant="info" className="text-center">
                    <h4>No reviews yet</h4>
                    <p>Be the first to share your experience!</p>
                </Alert>
            ) : (
                <>
                    {reviews.map((review) => (
                        <Card key={review._id} className="mb-3 shadow-sm">
                            <Card.Body>
                                <Row className="mb-3">
                                    <Col>
                                        <div className="d-flex align-items-center">
                                            <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" 
                                                 style={{ width: '40px', height: '40px' }}>
                                                <PersonCircle size={20} />
                                            </div>
                                            <div>
                                                <h6 className="mb-0 fw-bold">{review.userName}</h6>
                                                <div className="d-flex align-items-center">
                                                    {renderStars(review.rating)}
                                                    <span className="text-muted ms-2">
                                                        • {formatDate(review.createdAt)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </Col>
                                </Row>

                                <Card.Text className="mb-3">
                                    {review.review}
                                </Card.Text>

                                <div className="d-flex justify-content-between align-items-center">
                                    <Button
                                        variant="outline-primary"
                                        size="sm"
                                        onClick={() => handleHelpfulVote(review._id)}
                                    >
                                        <HandThumbsUp className="me-2" />
                                        Helpful ({review.helpfulVotes || 0})
                                    </Button>
                                    
                                    {review.appStore !== 'web' && (
                                        <Badge bg="light" text="dark">
                                            via {review.appStore}
                                        </Badge>
                                    )}
                                </div>

                                {review.adminResponse && (
                                    <Card className="mt-3 border-start border-primary border-3">
                                        <Card.Body className="py-2">
                                            <small className="text-muted d-block mb-1">
                                                Response from Conclave Academy
                                            </small>
                                            <p className="mb-0">{review.adminResponse.text}</p>
                                            <small className="text-muted">
                                                {formatDate(review.adminResponse.respondedAt)}
                                            </small>
                                        </Card.Body>
                                    </Card>
                                )}
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
                                            
                                            {[...Array(Math.min(5, pagination.pages))].map((_, idx) => {
                                                const pageNum = pagination.page <= 3 
                                                    ? idx + 1 
                                                    : pagination.page >= pagination.pages - 2
                                                    ? pagination.pages - 4 + idx
                                                    : pagination.page - 2 + idx;
                                                
                                                if (pageNum > 0 && pageNum <= pagination.pages) {
                                                    return (
                                                        <li key={idx} className={`page-item ${pagination.page === pageNum ? 'active' : ''}`}>
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
                </>
            )}
        </Container>
    );
};

export default AppReviewsList;