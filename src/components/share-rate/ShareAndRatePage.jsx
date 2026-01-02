// travel-tour-frontend/src/components/share-rate/ShareAndRatePage.jsx


import React, { useState } from 'react';
import './ShareRateStyles.css';
import ShareOurApp from './ShareOurApp';
import RateOurApp from './RateOurApp';

const ShareAndRatePage = ({ navigateTo }) => {
    const [activeTab, setActiveTab] = useState('share');

    return (
        <div className="share-rate-container">
            <div className="share-rate-header">
                <h1>The Conclave Academy</h1>
                <p className="subtitle">Help us grow by sharing with friends or rating your experience</p>
            </div>

            <div className="tabs-container">
                <div className="tabs-header">
                    <button
                        className={`tab-button ${activeTab === 'share' ? 'active' : ''}`}
                        onClick={() => setActiveTab('share')}
                    >
                        <i className="fas fa-share-alt"></i>
                        Share Our App
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'rate' ? 'active' : ''}`}
                        onClick={() => setActiveTab('rate')}
                    >
                        <i className="fas fa-star"></i>
                        Rate Our App
                    </button>
                </div>

                <div className="tab-content">
                    {activeTab === 'share' ? (
                        <div className="fade-in">
                            <ShareOurApp />
                        </div>
                    ) : (
                        <div className="fade-in">
                            <RateOurApp navigateTo={navigateTo} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShareAndRatePage;