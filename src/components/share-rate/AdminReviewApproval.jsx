// travel-tour-frontend/src/components/share-rate/AdminReviewApproval.jsx

import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './ShareRateStyles.css';

const AdminReviewApproval = () => {
    const [pendingReviews, setPendingReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [responseText, setResponseText] = useState('');

    useEffect(() => {
        fetchPendingReviews();
    }, []);

    const fetchPendingReviews = async () => {
        try {
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

    const handleApprove = async (reviewId, withResponse = false) => {
        try {
            const response = withResponse && responseText 
                ? await api.put(`/api/app-reviews/admin/reviews/${reviewId}/status`, {
                    status: 'approved',
                    adminResponse: responseText
                })
                : await api.put(`/api/app-reviews/admin/reviews/${reviewId}/status`, {
                    status: 'approved'
                });

            if (response.data.success) {
                setResponseText('');
                fetchPendingReviews();
                alert('Review approved!');
            }
        } catch (error) {
            console.error('Error approving review:', error);
            alert('Failed to approve review');
        }
    };

    const handleReject = async (reviewId) => {
        if (!window.confirm('Reject this review?')) return;
        
        try {
            await api.put(`/api/app-reviews/admin/reviews/${reviewId}/status`, {
                status: 'rejected'
            });
            fetchPendingReviews();
            alert('Review rejected');
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
            <h2>Review Moderation Dashboard</h2>
            <p className="subtitle">Approve or reject user reviews before they appear publicly</p>
            
            {loading ? (
                <div className="loading">Loading pending reviews...</div>
            ) : pendingReviews.length === 0 ? (
                <div className="no-pending">
                    <i className="fas fa-check-circle"></i>
                    <p>No pending reviews. All caught up!</p>
                </div>
            ) : (
                <div className="pending-reviews-list">
                    {pendingReviews.map((review) => (
                        <div key={review._id} className="pending-review-card">
                            <div className="pending-review-header">
                                <div className="reviewer-info">
                                    <div className="avatar">{review.userName?.charAt(0) || 'U'}</div>
                                    <div>
                                        <h4>{review.userName}</h4>
                                        <p className="email">{review.userEmail}</p>
                                    </div>
                                </div>
                                <div className="review-rating">
                                    {renderStars(review.rating)}
                                    <span className="rating-text">{review.rating}/5 stars</span>
                                </div>
                            </div>
                            
                            <div className="review-content">
                                <p>{review.review || 'No review text'}</p>
                            </div>
                            
                            <div className="review-meta">
                                <span><i className="fas fa-calendar"></i> {new Date(review.createdAt).toLocaleDateString()}</span>
                                <span><i className="fas fa-store"></i> {review.appStore || 'web'}</span>
                            </div>
                            
                            <div className="admin-actions">
                                <div className="response-section">
                                    <textarea
                                        placeholder="Optional: Add a response to the user..."
                                        value={responseText}
                                        onChange={(e) => setResponseText(e.target.value)}
                                        rows="3"
                                    />
                                </div>
                                
                                <div className="action-buttons">
                                    <button 
                                        className="btn-approve"
                                        onClick={() => handleApprove(review._id, responseText.trim() !== '')}
                                    >
                                        <i className="fas fa-check"></i> 
                                        {responseText.trim() ? 'Approve with Response' : 'Approve'}
                                    </button>
                                    
                                    <button 
                                        className="btn-reject"
                                        onClick={() => handleReject(review._id)}
                                    >
                                        <i className="fas fa-times"></i> Reject
                                    </button>
                                    
                                    <button 
                                        className="btn-approve-simple"
                                        onClick={() => handleApprove(review._id, false)}
                                    >
                                        <i className="fas fa-check-circle"></i> Approve (No Response)
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