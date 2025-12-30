import React from 'react';
import './ShareRateStyles.css';

const ReviewConfirmation = ({ navigateTo, reviewData }) => {
    // Fallback data if user refreshes the page or navigation fails to pass state
    const displayData = reviewData || {
        store: 'Web Portal',
        rating: 5,
        review: 'Excellent service and great learning materials!',
        userName: 'Valued Student',
        date: new Date().toLocaleDateString('en-GB')
    };

    const recommendedApps = [
        { id: 1, name: 'Conclave Study Hub', icon: 'fas fa-book-reader', rating: 4.8, type: 'Education' },
        { id: 2, name: 'Travel Planner Pro', icon: 'fas fa-route', rating: 4.6, type: 'Utility' },
        { id: 3, name: 'Academy Networking', icon: 'fas fa-users', rating: 4.5, type: 'Social' },
    ];

    const renderStars = (rating) => (
        <div className="stars-gold">
            {[...Array(5)].map((_, i) => (
                <i key={i} className={`fas fa-star ${i < rating ? 'filled' : 'empty'}`}></i>
            ))}
        </div>
    );

    return (
        <div className="confirmation-page">
            <div className="success-banner">
                <div className="check-icon">
                    <i className="fas fa-check"></i>
                </div>
                <h1>Thank You!</h1>
                <p>Your review has been submitted and is currently being moderated.</p>
            </div>

            <div className="receipt-card">
                <div className="receipt-header">
                    <h3>Your Review Details</h3>
                    <button className="btn-edit" onClick={() => navigateTo('rate-share')}>
                        <i className="fas fa-pencil-alt"></i> Edit
                    </button>
                </div>
                
                <div className="receipt-body">
                    <div className="user-meta">
                        <i className="fas fa-user-circle"></i>
                        <div>
                            <strong>{displayData.userName}</strong>
                            <span>{displayData.date}</span>
                        </div>
                    </div>
                    
                    <div className="rating-row">
                        {renderStars(displayData.rating)}
                        <span className="store-label">Posted to: {displayData.store}</span>
                    </div>

                    <div className="review-quote">
                        <i className="fas fa-quote-left"></i>
                        <p>{displayData.review}</p>
                    </div>
                </div>
            </div>

            <div className="recommendations-section">
                <h4>Explore More from Conclave</h4>
                <div className="rec-grid">
                    {recommendedApps.map(app => (
                        <div key={app.id} className="rec-card">
                            <div className="app-icon-small">
                                <i className={app.icon}></i>
                            </div>
                            <div className="app-info">
                                <h5>{app.name}</h5>
                                <span>{app.type} • ★ {app.rating}</span>
                            </div>
                            <button className="btn-get">Get</button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="nav-footer">
                <button className="btn-home" onClick={() => navigateTo('home')}>
                    <i className="fas fa-home"></i> Return to Dashboard
                </button>
                <button className="btn-share-alt" onClick={() => navigateTo('rate-share')}>
                    <i className="fas fa-share-alt"></i> Share with Friends
                </button>
            </div>
        </div>
    );
};

export default ReviewConfirmation;