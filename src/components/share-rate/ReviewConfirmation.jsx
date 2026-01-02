// travel-tour-frontend/src/components/share-rate/ReviewConfirmation.jsx
import React from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Button, 
  Badge, 
  Alert,
  ProgressBar 
} from 'react-bootstrap';
import { 
  CheckCircleFill, 
  StarFill, 
  Star, 
  PersonCircle,
  Pencil,
  Quote,
  Share,
  HouseDoor,
  Book,
  GeoAlt,
  People
} from 'react-bootstrap-icons';
import './ShareRateStyles.css';

const ReviewConfirmation = ({ navigateTo, reviewData }) => {
    // Fallback data if user refreshes the page or navigation fails to pass state
    const displayData = reviewData || {
        store: 'Web Portal',
        rating: 5,
        review: 'Excellent service and great learning materials! The platform has transformed my learning experience with interactive courses and professional guidance.',
        userName: 'Valued Student',
        userEmail: 'student@example.com',
        date: new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }),
        time: new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        }),
        isUpdate: false
    };

    const recommendedApps = [
        { 
            id: 1, 
            name: 'Conclave Study Hub', 
            icon: 'fas fa-book-reader', 
            rating: 4.8, 
            type: 'Education',
            description: 'Interactive learning platform'
        },
        { 
            id: 2, 
            name: 'Travel Planner Pro', 
            icon: 'fas fa-route', 
            rating: 4.6, 
            type: 'Utility',
            description: 'Smart travel planning'
        },
        { 
            id: 3, 
            name: 'Academy Networking', 
            icon: 'fas fa-users', 
            rating: 4.5, 
            type: 'Social',
            description: 'Connect with professionals'
        },
    ];

    const renderStars = (rating, size = 'lg') => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <span key={i} className={`star ${i <= rating ? 'filled' : 'empty'}`}>
                    <i className={`fas fa-star ${i <= rating ? 'filled' : 'empty'}`}></i>
                </span>
            );
        }
        return <div className={`stars-inline ${size}`}>{stars}</div>;
    };

    const getStoreBadge = (store) => {
        const storeConfig = {
            'Web Portal': { variant: 'info', icon: 'fas fa-globe', color: '#667eea' },
            'Google Play Store': { variant: 'success', icon: 'fab fa-google-play', color: '#4285F4' },
            'Apple App Store': { variant: 'dark', icon: 'fab fa-app-store-ios', color: '#000000' },
            'default': { variant: 'secondary', icon: 'fas fa-mobile-alt', color: '#6c757d' }
        };
        
        const config = storeConfig[store] || storeConfig.default;
        return (
            <Badge 
                style={{ 
                    background: config.color,
                    color: store === 'Apple App Store' ? 'white' : 'white'
                }} 
                className="store-badge d-inline-flex align-items-center gap-2 px-3 py-2"
            >
                <i className={config.icon}></i>
                <span>{store}</span>
            </Badge>
        );
    };

    const getRatingLabel = (rating) => {
        const labels = {
            1: 'Poor',
            2: 'Fair',
            3: 'Good',
            4: 'Very Good',
            5: 'Excellent'
        };
        return labels[rating] || 'Good';
    };

    const formatTimeAgo = () => {
        // Simple implementation - in real app, calculate from actual timestamp
        return 'Just now';
    };

    return (
        <div className="review-confirmation-container">
            {/* Success Banner */}
            <div className="confirmation-header mb-5">
                <h2 className="display-4 fw-bold mb-3">Thank You!</h2>
                <p className="confirmation-subtitle lead mb-0">
                    {displayData.isUpdate 
                        ? 'Your review has been updated successfully!'
                        : 'Your review has been submitted and is currently being moderated.'
                    }
                </p>
            </div>

            {/* Main Review Card */}
            <div className="review-card mb-5">
                <div className="review-header">
                    <div className="user-info">
                        <div className="user-avatar">
                            <i className="fas fa-user-circle fa-3x text-primary"></i>
                        </div>
                        <div>
                            <h4 className="fw-bold mb-2">{displayData.userName}</h4>
                            <div className="review-meta">
                                <div className="user-rating">
                                    {renderStars(displayData.rating)}
                                </div>
                                <span className="review-date">
                                    <i className="far fa-clock me-1"></i>
                                    {formatTimeAgo()} • {displayData.date}
                                </span>
                            </div>
                        </div>
                    </div>
                    <Button 
                        variant="outline-primary"
                        onClick={() => navigateTo('rate-share')}
                        className="edit-review-button d-flex align-items-center gap-2"
                    >
                        <i className="fas fa-pencil-alt"></i>
                        Edit Review
                    </Button>
                </div>

                <div className="review-content mb-4">
                    <p className="lead fst-italic mb-0">"{displayData.review}"</p>
                </div>

                <div className="store-badge-wrapper mb-4">
                    <p className="text-muted mb-2">Posted to:</p>
                    {getStoreBadge(displayData.store)}
                </div>

                {/* Status Progress */}
                <div className="status-progress mb-4">
                    <p className="text-muted mb-2">Review Status:</p>
                    <div className="d-flex align-items-center gap-3">
                        <div className="flex-grow-1">
                            <ProgressBar 
                                now={33} 
                                variant="success" 
                                animated 
                                className="review-progress-bar"
                            />
                        </div>
                        <Badge bg="success" className="px-3 py-2">
                            <i className="fas fa-check-circle me-2"></i>
                            Submitted
                        </Badge>
                    </div>
                    <div className="text-center mt-2">
                        <small className="text-muted">
                            <i className="fas fa-hourglass-half me-1"></i>
                            Awaiting moderator approval
                        </small>
                    </div>
                </div>

                {/* Review ID */}
                <div className="text-center border-top pt-4">
                    <small className="text-muted">
                        Review ID: <code>{Math.random().toString(36).substr(2, 9).toUpperCase()}</code>
                    </small>
                </div>
            </div>

            {/* Recommended Apps Section */}
            <div className="similar-apps-section mb-5">
                <h3 className="fw-bold mb-3">Explore More from Conclave</h3>
                <p className="section-subtitle text-muted mb-4">
                    Discover our other innovative platforms designed for your success
                </p>
                
                <div className="similar-apps-grid">
                    {recommendedApps.map((app) => (
                        <div key={app.id} className="similar-app-card">
                            <div className="app-icon">
                                <i className={`${app.icon} fa-lg text-white`}></i>
                            </div>
                            <div className="app-details">
                                <h4 className="fw-bold mb-2">{app.name}</h4>
                                <div className="app-rating mb-2">
                                    <div className="review-stars">
                                        {renderStars(Math.floor(app.rating), 'sm')}
                                    </div>
                                    <span className="rating-number">{app.rating}/5</span>
                                </div>
                                <p className="app-downloads mb-0">{app.description}</p>
                            </div>
                            <Button 
                                variant="outline-primary" 
                                size="sm"
                                className="view-app-button"
                            >
                                <i className="fas fa-download me-2"></i>
                                Get App
                            </Button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="action-buttons mb-5">
                <Button 
                    variant="primary"
                    size="lg"
                    onClick={() => navigateTo('home')}
                    className="primary-button d-flex align-items-center gap-2"
                >
                    <i className="fas fa-home"></i>
                    Return to Dashboard
                </Button>
                
                <Button 
                    variant="outline-primary"
                    size="lg"
                    onClick={() => navigateTo('rate-share')}
                    className="secondary-button d-flex align-items-center gap-2"
                >
                    <i className="fas fa-share-alt"></i>
                    Share with Friends
                </Button>
                
                <Button 
                    variant="outline-success"
                    size="lg"
                    onClick={() => navigateTo('app-reviews')}
                    className="d-flex align-items-center gap-2"
                >
                    <i className="fas fa-star"></i>
                    View All Reviews
                </Button>
            </div>

            {/* What Happens Next Section */}
            <Row className="mt-5">
                <Col>
                    <div className="text-center">
                        <h5 className="fw-bold mb-4">What happens next?</h5>
                        <Row className="g-3">
                            <Col md={4}>
                                <div className="border rounded p-4 h-100 hover-shadow">
                                    <div className="bg-info bg-opacity-10 rounded-circle p-3 d-inline-flex mb-3">
                                        <i className="fas fa-user-check text-info fa-2x"></i>
                                    </div>
                                    <h6 className="fw-bold mb-2">Moderation</h6>
                                    <p className="text-muted small mb-0">
                                        Our team will review your submission within 24-48 hours
                                    </p>
                                </div>
                            </Col>
                            <Col md={4}>
                                <div className="border rounded p-4 h-100 hover-shadow">
                                    <div className="bg-warning bg-opacity-10 rounded-circle p-3 d-inline-flex mb-3">
                                        <i className="fas fa-check-double text-warning fa-2x"></i>
                                    </div>
                                    <h6 className="fw-bold mb-2">Approval</h6>
                                    <p className="text-muted small mb-0">
                                        Once approved, your review will be visible to all users
                                    </p>
                                </div>
                            </Col>
                            <Col md={4}>
                                <div className="border rounded p-4 h-100 hover-shadow">
                                    <div className="bg-success bg-opacity-10 rounded-circle p-3 d-inline-flex mb-3">
                                        <i className="fas fa-bell text-success fa-2x"></i>
                                    </div>
                                    <h6 className="fw-bold mb-2">Notification</h6>
                                    <p className="text-muted small mb-0">
                                        You'll receive an email when your review goes live
                                    </p>
                                </div>
                            </Col>
                        </Row>
                    </div>
                </Col>
            </Row>

            {/* Footer Note */}
            <div className="text-center mt-5">
                <div className="bg-light rounded p-4">
                    <div className="d-flex align-items-center justify-content-center gap-3 mb-3">
                        <div className="bg-white rounded-circle p-3 shadow-sm">
                            <i className="fas fa-shield-alt text-primary fa-2x"></i>
                        </div>
                        <div className="text-start">
                            <h5 className="fw-bold mb-1">Your Feedback Matters</h5>
                            <p className="text-muted mb-0">
                                Help us improve by sharing your experience with others
                            </p>
                        </div>
                    </div>
                    <Button 
                        variant="link"
                        className="text-decoration-none"
                        onClick={() => navigateTo('app-reviews')}
                    >
                        <i className="fas fa-arrow-right me-2"></i>
                        See what others are saying
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ReviewConfirmation;