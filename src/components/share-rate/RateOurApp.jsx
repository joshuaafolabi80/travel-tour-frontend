// travel-tour-frontend/src/components/share-rate/RateOurApp.jsx

import React, { useState } from 'react';
import './ShareRateStyles.css';

const RateOurApp = ({ navigateTo }) => {
    const [selectedStore, setSelectedStore] = useState(null);

    const appStores = [
        { 
            id: 'google-play', 
            name: 'Google Play Store', 
            icon: 'fab fa-google-play', 
            color: '#4285F4',
            available: true
        },
        { 
            id: 'apple-store', 
            name: 'Apple App Store', 
            icon: 'fab fa-app-store-ios', 
            color: '#000000',
            available: true
        },
        { 
            id: 'huawei', 
            name: 'Huawei AppGallery', 
            icon: 'fas fa-store', 
            color: '#FF0000',
            available: false
        },
        { 
            id: 'samsung', 
            name: 'Samsung Galaxy Store', 
            icon: 'fas fa-mobile-alt', 
            color: '#1428A0',
            available: false
        },
    ];

    const handleStoreSelect = (store) => {
        if (store.available) {
            setSelectedStore(store);
            // Navigate to rating page
            navigateTo('rate-app-store', { storeId: store.id });
        } else {
            alert(`Coming soon to ${store.name}`);
        }
    };

    return (
        <div className="rate-app-container">
            <div className="rate-app-header">
                <h2>Rate Our App</h2>
                <p className="rate-subtitle">Tell us what you think by rating on your preferred app store</p>
            </div>

            <div className="app-info-card">
                <div className="app-header-info">
                    <h3>The Conclave Academy</h3>
                    <p className="app-subtitle">Travel Learning Platform</p>
                    <div className="app-badges">
                        <span className="badge">Available on multiple devices</span>
                    </div>
                </div>

                <div className="device-compatibility">
                    <h4>Available on more devices</h4>
                    <div className="device-list">
                        <div className="device-item">
                            <i className="fas fa-mobile-alt"></i>
                            <div>
                                <p className="device-name">Samsung SM-A037F</p>
                                <p className="device-type">Phone</p>
                            </div>
                        </div>
                        <div className="device-item">
                            <i className="fas fa-tablet-alt"></i>
                            <div>
                                <p className="device-name">Various Tablets</p>
                                <p className="device-type">Tablet</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="stores-section">
                <h4>Rate on:</h4>
                <div className="stores-grid">
                    {appStores.map((store) => (
                        <button
                            key={store.id}
                            className={`store-option ${!store.available ? 'disabled' : ''}`}
                            onClick={() => handleStoreSelect(store)}
                            style={{ '--store-color': store.color }}
                        >
                            <div className="store-icon">
                                <i className={store.icon}></i>
                            </div>
                            <div className="store-info">
                                <span className="store-name">{store.name}</span>
                                {!store.available && (
                                    <span className="coming-soon">Coming Soon</span>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <div className="rate-actions">
                <p className="rate-instruction">
                    Select an app store to rate our app. Your feedback helps us improve!
                </p>
            </div>

            <div className="app-support-info">
                <h4>App Support</h4>
                <div className="support-features">
                    <div className="feature">
                        <i className="fas fa-gamepad"></i>
                        <span>Games</span>
                    </div>
                    <div className="feature">
                        <i className="fas fa-apps"></i>
                        <span>Apps</span>
                    </div>
                    <div className="feature">
                        <i className="fas fa-search"></i>
                        <span>Search</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RateOurApp;