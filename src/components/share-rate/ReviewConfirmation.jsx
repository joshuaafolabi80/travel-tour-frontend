// travel-tour-frontend/src/components/share-rate/ReviewConfirmation.jsx

import React from 'react';
import './ShareRateStyles.css';

const ReviewConfirmation = ({ navigateTo, reviewData }) => {
    const { store, rating, review, userName, date } = reviewData || {
        store: 'Google Play Store',
        rating: 5,
        review: 'Great app!',
        userName: 'User',
        date: new Date().toLocaleDateString('en-GB')
    };

    const similarApps = [
        { id: 1, name: 'Travel Academy Pro', icon: 'fas fa-plane', rating: 4.5, downloads: '100K+' },
        { id: 2, name: 'Tour Guide Master', icon: 'fas fa-map-marked-alt', rating: 4.2, downloads: '50K+' },
        { id: 3, name: 'Hotel Booking Expert', icon: 'fas fa-hotel', rating: 4.7, downloads: '200K+' },
        { id: 4, name: 'Tourism Training Hub', icon: 'fas fa-graduation-cap', rating: 4.0, downloads: '30K+' },
        { id: 5, name: 'Travel Business School', icon: 'fas fa-briefcase', rating: 4.8, downloads: '150K+' },
    ];

    const renderStars = (rating) => {
        return (
            <div className="review-stars">
                {[...Array(5)].map((_, i) => (
                    <i 
                        key={i} 
                        className={`fas fa-star ${i < Math.floor(rating) ? 'filled' : 'empty'}`}
                    ></i>
                ))}
                <span className="rating-number">{rating}</span>
            </div>
        );
    };

    return (
        <div className="review-confirmation-container">
            <div className="confirmation-header">
                <h2>Review Submitted</h2>
                <p className="confirmation-subtitle">Thank you for your feedback!</p>
            </div>

            <div className="review-card">
                <div className="review-header">
                    <div className="user-info">
                        <div className="user-avatar">
                            <i className="fas fa-user-circle"></i>
                        </div>
                        <div>
                            <h4>{userName}</h4>
                            <div className="review-meta">
                                <div className="user-rating">
                                    {[...Array(5)].map((_, i) => (
                                        <i 
                                            key={i} 
                                            className={`fas fa-star ${i < rating ? 'filled' : 'empty'}`}
                                        ></i>
                                    ))}
                                </div>
                                <span className="review-date">{date}</span>
                            </div>
                        </div>
                    </div>
                    <button 
                        className="edit-review-button"
                        onClick={() => {
                            const storeId = store.toLowerCase().includes('google') ? 'google-play' : 
                                          store.toLowerCase().includes('apple') ? 'apple-store' : 'web';
                            navigateTo('rate-app-store', { storeId });
                        }}
                    >
                        <i className="fas fa-edit"></i> Edit your review
                    </button>
                </div>

                <div className="review-content">
                    <p>{review || 'Great app experience!'}</p>
                </div>

                <div className="store-badge">
                    <i className="fas fa-store"></i>
                    <span>Submitted to {store}</span>
                </div>
            </div>

            <div className="other-reviews-section">
                <h3>Other Reviews</h3>
                <div className="reviews-list">
                    <div className="other-review">
                        <div className="reviewer">
                            <i className="fas fa-user-circle"></i>
                            <div>
                                <p className="reviewer-name">Sarah Johnson</p>
                                <div className="review-rating">
                                    {[...Array(5)].map((_, i) => (
                                        <i key={i} className={`fas fa-star ${i < 5 ? 'filled' : 'empty'}`}></i>
                                    ))}
                                    <span className="review-date">25/12/2025</span>
                                </div>
                            </div>
                        </div>
                        <p className="review-text">Amazing learning platform! The courses are very comprehensive.</p>
                    </div>

                    <div className="other-review">
                        <div className="reviewer">
                            <i className="fas fa-user-circle"></i>
                            <div>
                                <p className="reviewer-name">Mike Chen</p>
                                <div className="review-rating">
                                    {[...Array(5)].map((_, i) => (
                                        <i key={i} className={`fas fa-star ${i < 4 ? 'filled' : 'empty'}`}></i>
                                    ))}
                                    <span className="review-date">24/12/2025</span>
                                </div>
                            </div>
                        </div>
                        <p className="review-text">Good content, but could use more video tutorials.</p>
                    </div>
                </div>
            </div>

            <div className="similar-apps-section">
                <h3>Similar Apps</h3>
                <p className="section-subtitle">You might also like:</p>
                
                <div className="similar-apps-grid">
                    {similarApps.map((app) => (
                        <div key={app.id} className="similar-app-card">
                            <div className="app-icon">
                                <i className={app.icon}></i>
                            </div>
                            <div className="app-details">
                                <h4>{app.name}</h4>
                                <div className="app-rating">
                                    {renderStars(app.rating)}
                                </div>
                                <p className="app-downloads">{app.downloads} downloads</p>
                            </div>
                            <button className="view-app-button">
                                View
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="action-buttons">
                <button className="primary-button" onClick={() => navigateTo('rate-share')}>
                    <i className="fas fa-arrow-left"></i> Back to Rate & Share
                </button>
                <button className="secondary-button" onClick={() => navigateTo('home')}>
                    <i className="fas fa-home"></i> Go to Home
                </button>
            </div>
        </div>
    );
};

export default ReviewConfirmation;