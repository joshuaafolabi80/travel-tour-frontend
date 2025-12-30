import React, { useState, useEffect } from 'react';
import api from '../../services/api';
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

    useEffect(() => {
        fetchReviews();
    }, [filter, sortBy]);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/app-reviews/reviews', {
                params: {
                    rating: filter !== 'all' ? filter : '',
                    sortBy: sortBy === 'recent' ? 'createdAt' : sortBy === 'helpful' ? 'helpfulVotes' : 'rating',
                    sortOrder: 'desc'
                }
            });

            if (response.data.success) {
                setReviews(response.data.reviews);
                if (response.data.stats) {
                    setStats(response.data.stats);
                }
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleHelpfulVote = async (reviewId) => {
        try {
            const response = await api.post(`/api/app-reviews/reviews/${reviewId}/helpful`);
            if (response.data.success) {
                // Optimistic UI update
                setReviews(prev => prev.map(r => 
                    r._id === reviewId ? { ...r, helpfulVotes: response.data.helpfulVotes } : r
                ));
            }
        } catch (error) {
            console.error('Error voting:', error);
        }
    };

    const renderStars = (rating) => (
        <div className="stars-wrapper">
            {[1, 2, 3, 4, 5].map((star) => (
                <i 
                    key={star}
                    className={`fas fa-star ${star <= rating ? 'filled' : 'empty'}`}
                ></i>
            ))}
        </div>
    );

    return (
        <div className="public-reviews-container">
            <div className="reviews-summary-card">
                <div className="summary-left">
                    <h3>Overall Rating</h3>
                    <div className="big-rating">{stats.averageRating}</div>
                    {renderStars(Math.round(stats.averageRating))}
                    <p>{stats.totalReviews} Verified Reviews</p>
                </div>
                
                <div className="summary-right">
                    {[5, 4, 3, 2, 1].map((num) => {
                        const count = stats.ratingDistribution[num] || 0;
                        const percent = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                        return (
                            <div key={num} className="dist-row">
                                <span>{num} Star</span>
                                <div className="progress-bar">
                                    <div className="progress-fill" style={{ width: `${percent}%` }}></div>
                                </div>
                                <span>{count}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="reviews-toolbar">
                <div className="filter-group">
                    <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All</button>
                    <button className={filter === '5' ? 'active' : ''} onClick={() => setFilter('5')}>5 Star</button>
                    <button className={filter === '4' ? 'active' : ''} onClick={() => setFilter('4')}>4 Star</button>
                </div>
                
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="recent">Newest First</option>
                    <option value="highest">Highest Rated</option>
                    <option value="helpful">Most Helpful</option>
                </select>
            </div>

            {loading ? (
                <div className="loading-grid">Loading reviews...</div>
            ) : (
                <div className="reviews-grid">
                    {reviews.map((review) => (
                        <div key={review._id} className="review-item">
                            <div className="review-user-header">
                                <div className="user-initials">
                                    {review.userName?.charAt(0).toUpperCase()}
                                </div>
                                <div className="user-details">
                                    <strong>{review.userName}</strong>
                                    <div className="meta">
                                        {renderStars(review.rating)}
                                        <span>• {new Date(review.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <p className="review-text">{review.review}</p>
                            
                            <div className="review-footer">
                                <button className="btn-helpful" onClick={() => handleHelpfulVote(review._id)}>
                                    <i className="far fa-thumbs-up"></i> Helpful ({review.helpfulVotes || 0})
                                </button>
                                {review.appStore !== 'web' && <span className="source-tag">via {review.appStore}</span>}
                            </div>

                            {review.adminResponse && (
                                <div className="official-response">
                                    <div className="resp-header">
                                        <i className="fas fa-reply"></i>
                                        <strong>Response from Conclave Academy</strong>
                                    </div>
                                    <p>{review.adminResponse.text}</p>
                                    <small>{new Date(review.adminResponse.respondedAt).toLocaleDateString()}</small>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AppReviewsList;