// travel-tour-frontend/src/components/share-rate/RateAppStore.jsx

import React, { useState, useEffect } from 'react';
import './ShareRateStyles.css';
import api from '../../services/api';

const RateAppStore = ({ navigateTo, storeId = 'web' }) => {
    const [rating, setRating] = useState(0);
    const [review, setReview] = useState('');
    const [hoverRating, setHoverRating] = useState(0);
    const [userName, setUserName] = useState('');
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // Get user data from localStorage
        const storedUser = JSON.parse(localStorage.getItem('userData') || '{}');
        setUserData(storedUser);
        setUserName(storedUser.name || storedUser.email?.split('@')[0] || 'User');
    }, []);

    const storeInfo = {
        'google-play': { name: 'Google Play Store', icon: 'fab fa-google-play', color: '#4285F4' },
        'apple-store': { name: 'Apple App Store', icon: 'fab fa-app-store-ios', color: '#000000' },
        'web': { name: 'Web App', icon: 'fas fa-globe', color: '#667eea' }
    };

    const store = storeInfo[storeId] || storeInfo['web'];

    const handleRating = (stars) => {
        setRating(stars);
    };

    const handleSubmitReview = async () => {
        if (rating === 0) {
            alert('Please select a rating before submitting');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('Please login to submit a review');
            }

            const response = await api.post('/app-reviews/reviews/submit', {
                rating,
                review,
                appStore: storeId
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data.success) {
                // Navigate to review confirmation
                navigateTo('review-confirmation', {
                    store: store.name,
                    rating,
                    review,
                    userName,
                    date: new Date().toLocaleDateString('en-GB'),
                    isUpdate: response.data.isUpdate
                });
            }
        } catch (err) {
            console.error('Error submitting review:', err);
            setError(err.response?.data?.message || 'Failed to submit review. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const ratingLabels = [
        'Terrible',
        'Poor',
        'Average',
        'Good',
        'Excellent'
    ];

    return (
        <div className="rate-store-container">
            <div className="store-header">
                <div className="store-brand">
                    <i className={store.icon} style={{ color: store.color }}></i>
                    <h2>{store.name}</h2>
                </div>
                <button className="back-button" onClick={() => navigateTo('rate-share')}>
                    <i className="fas fa-arrow-left"></i> Back
                </button>
            </div>

            {error && (
                <div className="alert alert-danger">
                    {error}
                </div>
            )}

            <div className="app-details-card">
                <div className="app-basic-info">
                    <h3>The Conclave Academy - Travel Learning</h3>
                    <p className="app-developer">The Conclave Academy</p>
                    
                    <div className="app-actions">
                        <button className="app-action-button uninstall">
                            <i className="fas fa-trash-alt"></i> Uninstall
                        </button>
                        <button className="app-action-button open">
                            <i className="fas fa-external-link-alt"></i> Open
                        </button>
                    </div>
                </div>

                <div className="device-compatibility-section">
                    <h4>Available on more devices</h4>
                    <div className="compatible-devices">
                        <div className="compatible-device">
                            <i className="fas fa-mobile-alt"></i>
                            <div>
                                <p className="device-model">Samsung SM-A037F</p>
                                <p className="device-category">Phone</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="rating-section">
                <h2>Rate this app</h2>
                <p className="rating-subtitle">Tell others what you think</p>

                <div className="star-rating-container">
                    <div className="stars-display">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                className={`star-button ${star <= (hoverRating || rating) ? 'active' : ''}`}
                                onClick={() => handleRating(star)}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                disabled={loading}
                            >
                                <i className="fas fa-star"></i>
                            </button>
                        ))}
                    </div>
                    <p className="rating-label">
                        {rating > 0 ? ratingLabels[rating - 1] : 'Select a rating'}
                    </p>
                </div>

                <div className="review-section">
                    <h4>Write a review</h4>
                    <textarea
                        className="review-textarea"
                        placeholder="Share your experience with this app..."
                        value={review}
                        onChange={(e) => setReview(e.target.value)}
                        rows={4}
                        disabled={loading}
                    />
                </div>

                <button 
                    className="submit-review-button" 
                    onClick={handleSubmitReview}
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <i className="fas fa-spinner fa-spin"></i>
                            Submitting...
                        </>
                    ) : (
                        'Submit Review'
                    )}
                </button>
            </div>

            <div className="app-support-section">
                <h4>App Support</h4>
                <div className="support-tabs">
                    <span className="support-tab active">About this app</span>
                </div>
                
                <div className="support-features-grid">
                    <div className="support-feature active">
                        <i className="fas fa-gamepad"></i>
                        <span>Games</span>
                    </div>
                    <div className="support-feature active">
                        <i className="fas fa-apps"></i>
                        <span>Apps</span>
                    </div>
                    <div className="support-feature active">
                        <i className="fas fa-search"></i>
                        <span>Search</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RateAppStore;