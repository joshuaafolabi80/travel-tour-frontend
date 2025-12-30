import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './ShareRateStyles.css';

const AdminReviewApproval = () => {
    const [pendingReviews, setPendingReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [responseTexts, setResponseTexts] = useState({}); // Track responses per review ID

    useEffect(() => {
        fetchPendingReviews();
    }, []);

    const fetchPendingReviews = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/app-reviews/admin/reviews/pending');
            if (response.data.success) {
                setPendingReviews(response.data.reviews);
            }
        } catch (error) {
            console.error('Error fetching pending reviews:', error);
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

            const response = await api.put(`/api/app-reviews/admin/reviews/${reviewId}/status`, payload);

            if (response.data.success) {
                // Clear the specific response text for this ID
                const newResponses = { ...responseTexts };
                delete newResponses[reviewId];
                setResponseTexts(newResponses);
                
                fetchPendingReviews();
                alert('Review approved successfully!');
            }
        } catch (error) {
            console.error('Error approving review:', error);
            alert('Failed to approve review');
        }
    };

    const handleReject = async (reviewId) => {
        if (!window.confirm('Are you sure you want to reject this review? It will not be shown to the public.')) return;
        
        try {
            const response = await api.put(`/api/app-reviews/admin/reviews/${reviewId}/status`, {
                status: 'rejected'
            });
            if (response.data.success) {
                fetchPendingReviews();
                alert('Review rejected');
            }
        } catch (error) {
            console.error('Error rejecting review:', error);
            alert('Failed to reject review');
        }
    };

    const renderStars = (rating) => {
        return [1, 2, 3, 4, 5].map((star) => (
            <i 
                key={star}
                className={`fas fa-star ${star <= rating ? 'filled' : 'empty'}`}
            ></i>
        ));
    };

    return (
        <div className="admin-approval-container">
            <div className="admin-header">
                <h2>Review Moderation Dashboard</h2>
                <span className="badge-pending">{pendingReviews.length} Pending</span>
            </div>
            <p className="subtitle">Filter through user feedback and provide official responses.</p>
            
            {loading ? (
                <div className="loading-state">
                    <i className="fas fa-spinner fa-spin"></i>
                    <p>Loading pending reviews...</p>
                </div>
            ) : pendingReviews.length === 0 ? (
                <div className="no-pending">
                    <i className="fas fa-check-circle"></i>
                    <p>All reviews have been moderated!</p>
                </div>
            ) : (
                <div className="pending-reviews-list">
                    {pendingReviews.map((review) => (
                        <div key={review._id} className="pending-review-card">
                            <div className="pending-review-header">
                                <div className="reviewer-info">
                                    <div className="avatar">
                                        {review.userName?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <div>
                                        <h4>{review.userName || 'Anonymous User'}</h4>
                                        <p className="email">{review.userEmail}</p>
                                    </div>
                                </div>
                                <div className="review-rating-block">
                                    <div className="stars">
                                        {renderStars(review.rating)}
                                    </div>
                                    <span className="rating-num">{review.rating}/5</span>
                                </div>
                            </div>
                            
                            <div className="review-content">
                                <blockquote>"{review.review || 'No written feedback provided.'}"</blockquote>
                            </div>
                            
                            <div className="review-meta">
                                <span><i className="fas fa-calendar-alt"></i> {new Date(review.createdAt).toLocaleDateString()}</span>
                                <span><i className="fas fa-mobile-alt"></i> Source: {review.appStore}</span>
                            </div>
                            
                            <div className="admin-actions">
                                <div className="response-textarea-wrapper">
                                    <textarea
                                        placeholder="Write an official response (optional)..."
                                        value={responseTexts[review._id] || ''}
                                        onChange={(e) => handleResponseChange(review._id, e.target.value)}
                                        rows="3"
                                    />
                                </div>
                                
                                <div className="action-buttons">
                                    <button 
                                        className="btn-approve"
                                        onClick={() => handleApprove(review._id)}
                                    >
                                        <i className="fas fa-check"></i> Approve
                                    </button>
                                    
                                    <button 
                                        className="btn-reject"
                                        onClick={() => handleReject(review._id)}
                                    >
                                        <i className="fas fa-trash-alt"></i> Reject
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminReviewApproval;