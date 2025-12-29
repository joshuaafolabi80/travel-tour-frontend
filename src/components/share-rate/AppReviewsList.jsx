// travel-tour-frontend/src/components/share-rate/AppReviewsList.jsx


import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './ShareRateStyles.css';

const AppReviewsList = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [averageRating, setAverageRating] = useState(0);
    const [ratingDistribution, setRatingDistribution] = useState({1: 0, 2: 0, 3: 0, 4: 0, 5: 0});
    const [filter, setFilter] = useState('all'); // 'all', '5-stars', '4-stars', etc.
    const [sortBy, setSortBy] = useState('recent'); // 'recent', 'helpful', 'highest'

    useEffect(() => {
        fetchReviews();
    }, [filter, sortBy]);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/app-reviews/reviews', {
                params: {
                    status: 'approved', // Only show approved reviews
                    rating: filter !== 'all' ? filter.split('-')[0] : '',
                    sortBy: sortBy === 'recent' ? 'createdAt' : 
                           sortBy === 'helpful' ? 'helpfulVotes' : 'rating',
                    sortOrder: 'desc'
                }
            });

            if (response.data.success) {
                setReviews(response.data.reviews);
                setAverageRating(response.data.stats.averageRating);
                setRatingDistribution(response.data.stats.ratingDistribution);
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleHelpfulVote = async (reviewId) => {
        try {
            await api.post(`/api/app-reviews/reviews/${reviewId}/helpful`);
            fetchReviews(); // Refresh reviews
        } catch (error) {
            console.error('Error voting:', error);
        }
    };

    const renderStars = (rating) => {
        return (
            <div className="stars-inline">
                {[1, 2, 3, 4, 5].map((star) => (
                    <i 
                        key={star}
                        className={`fas fa-star ${star <= rating ? 'filled' : 'empty'}`}
                    ></i>
                ))}
            </div>
        );
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="reviews-list-container">
            <div className="reviews-header">
                <h2>What Users Say About The Conclave Academy</h2>
                <div className="overall-rating">
                    <div className="average-rating-box">
                        <span className="average-number">{averageRating}</span>
                        <div className="average-stars">
                            {renderStars(Math.round(averageRating))}
                        </div>
                        <p className="total-reviews">
                            Based on {reviews.length} reviews
                        </p>
                    </div>
                    
                    <div className="rating-bars">
                        {[5, 4, 3, 2, 1].map((rating) => {
                            const total = Object.values(ratingDistribution).reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? (ratingDistribution[rating] / total) * 100 : 0;
                            
                            return (
                                <div key={rating} className="rating-bar-item">
                                    <span className="rating-label">{rating} star</span>
                                    <div className="rating-bar">
                                        <div 
                                            className="bar-fill" 
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                    <span className="rating-count">{ratingDistribution[rating]}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="reviews-controls">
                <div className="filter-buttons">
                    <button 
                        className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        All Reviews
                    </button>
                    <button 
                        className={`filter-btn ${filter === '5-stars' ? 'active' : ''}`}
                        onClick={() => setFilter('5-stars')}
                    >
                        5 Stars
                    </button>
                    <button 
                        className={`filter-btn ${filter === '4-stars' ? 'active' : ''}`}
                        onClick={() => setFilter('4-stars')}
                    >
                        4 Stars
                    </button>
                </div>
                
                <select 
                    className="sort-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                >
                    <option value="recent">Most Recent</option>
                    <option value="highest">Highest Rated</option>
                    <option value="helpful">Most Helpful</option>
                </select>
            </div>

            {loading ? (
                <div className="loading-reviews">
                    <i className="fas fa-spinner fa-spin"></i>
                    <p>Loading reviews...</p>
                </div>
            ) : reviews.length === 0 ? (
                <div className="no-reviews">
                    <i className="fas fa-comment-alt"></i>
                    <p>No reviews yet. Be the first to share your experience!</p>
                </div>
            ) : (
                <div className="reviews-grid">
                    {reviews.map((review) => (
                        <div key={review._id} className="review-card-public">
                            <div className="reviewer-info-public">
                                <div className="reviewer-avatar">
                                    {review.userName?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <div>
                                    <h4 className="reviewer-name">{review.userName}</h4>
                                    <div className="review-meta-public">
                                        {renderStars(review.rating)}
                                        <span className="review-date">
                                            {formatDate(review.createdAt)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="review-content-public">
                                <p>{review.review || 'No review text provided'}</p>
                            </div>
                            
                            {review.appStore && review.appStore !== 'web' && (
                                <div className="review-source">
                                    <i className="fas fa-store"></i>
                                    <span>Via {review.appStore.replace('-', ' ')}</span>
                                </div>
                            )}
                            
                            <div className="review-actions-public">
                                <button 
                                    className="helpful-btn"
                                    onClick={() => handleHelpfulVote(review._id)}
                                >
                                    <i className="fas fa-thumbs-up"></i>
                                    Helpful ({review.helpfulVotes || 0})
                                </button>
                                
                                {review.adminResponse && (
                                    <div className="admin-response">
                                        <div className="admin-response-header">
                                            <i className="fas fa-shield-alt"></i>
                                            <strong>Response from The Conclave Academy</strong>
                                        </div>
                                        <p>{review.adminResponse.text}</p>
                                        <small>
                                            {review.adminResponse.respondedBy} • {formatDate(review.adminResponse.respondedAt)}
                                        </small>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            <div className="write-review-cta">
                <p>Share your experience with The Conclave Academy!</p>
                <button 
                    className="write-review-btn"
                    onClick={() => window.location.hash = 'rate-share'}
                >
                    <i className="fas fa-star"></i> Write a Review
                </button>
            </div>
        </div>
    );
};

export default AppReviewsList;