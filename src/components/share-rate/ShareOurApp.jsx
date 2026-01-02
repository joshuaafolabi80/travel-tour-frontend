// travel-tour-frontend/src/components/share-rate/ShareOurApp.jsx

import React, { useState } from 'react';
import './ShareRateStyles.css';
import api from '../../services/api';

const ShareOurApp = () => {
    const appUrl = window.location.origin; // Your app URL
    const shareMessage = `Check out The Conclave Academy App! An amazing platform for travel, tour, hotel, and tourism learning. ${appUrl}`;
    const [shareMethod, setShareMethod] = useState('just-once');
    const [isSharing, setIsSharing] = useState(false);

    const trackShare = async (platform) => {
        try {
            // Get auth token
            const token = localStorage.getItem('authToken');
            if (!token) return;

            await api.post('/app-reviews/share/track', {
                platform,
                shareMethod
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        } catch (error) {
            console.error('Error tracking share:', error);
            // Silently fail - don't interrupt user experience
        }
    };

    const handleShare = async (platform) => {
        setIsSharing(true);
        let shareUrl = '';
        
        switch(platform) {
            case 'whatsapp':
                shareUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
                break;
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(appUrl)}`;
                break;
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}&url=${encodeURIComponent(appUrl)}`;
                break;
            case 'instagram':
                // Instagram doesn't have a direct share API
                alert('To share on Instagram, copy the link and paste it in your Instagram story or post!');
                await handleCopyLink();
                setIsSharing(false);
                return;
            case 'linkedin':
                shareUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(appUrl)}&title=${encodeURIComponent('The Conclave Academy App')}&summary=${encodeURIComponent(shareMessage)}`;
                break;
            case 'telegram':
                shareUrl = `https://t.me/share/url?url=${encodeURIComponent(appUrl)}&text=${encodeURIComponent(shareMessage)}`;
                break;
            case 'email':
                shareUrl = `mailto:?subject=Check out The Conclave Academy App&body=${encodeURIComponent(shareMessage)}`;
                break;
            case 'sms':
                shareUrl = `sms:?body=${encodeURIComponent(shareMessage)}`;
                break;
            case 'bluetooth':
                alert('Bluetooth sharing would work in a native app environment');
                await trackShare('bluetooth');
                setIsSharing(false);
                return;
            case 'chrome':
                if (navigator.share) {
                    navigator.share({
                        title: 'The Conclave Academy App',
                        text: shareMessage,
                        url: appUrl,
                    });
                    await trackShare('native-share');
                    setIsSharing(false);
                    return;
                }
                break;
            case 'files':
                alert('File sharing feature would be implemented in native app');
                await trackShare('files');
                setIsSharing(false);
                return;
            case 'gmail':
                shareUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=Check%20out%20The%20Conclave%20Academy%20App&body=${encodeURIComponent(shareMessage)}`;
                break;
            case 'save':
                // For bookmarking/saving locally
                try {
                    localStorage.setItem('appBookmark', JSON.stringify({
                        url: appUrl,
                        title: 'The Conclave Academy',
                        savedAt: new Date().toISOString()
                    }));
                    alert('App saved to your device bookmarks!');
                    await trackShare('save');
                } catch (err) {
                    alert('Failed to save bookmark: ' + err.message);
                }
                setIsSharing(false);
                return;
            default:
                if (navigator.share) {
                    navigator.share({
                        title: 'The Conclave Academy App',
                        text: shareMessage,
                        url: appUrl,
                    });
                    await trackShare('native-share');
                }
                setIsSharing(false);
                return;
        }
        
        // Track the share
        await trackShare(platform);
        
        if (shareUrl) {
            window.open(shareUrl, '_blank', 'noopener,noreferrer');
        }
        
        setIsSharing(false);
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(appUrl);
            await trackShare('copy');
            alert('✓ Link copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy: ', err);
            alert('Failed to copy link. Please try again.');
        }
    };

    const shareOptions = [
        { id: 'whatsapp', name: 'WhatsApp', icon: 'fab fa-whatsapp', color: '#25D366' },
        { id: 'facebook', name: 'Facebook', icon: 'fab fa-facebook', color: '#1877F2' },
        { id: 'messenger', name: 'Messages', icon: 'fas fa-comment', color: '#0084FF' },
        { id: 'twitter', name: 'Twitter', icon: 'fab fa-twitter', color: '#1DA1F2' },
        { id: 'instagram', name: 'Instagram', icon: 'fab fa-instagram', color: '#E4405F' },
        { id: 'linkedin', name: 'LinkedIn', icon: 'fab fa-linkedin', color: '#0A66C2' },
        { id: 'telegram', name: 'Telegram', icon: 'fab fa-telegram', color: '#0088CC' },
        { id: 'email', name: 'Email', icon: 'fas fa-envelope', color: '#EA4335' },
        { id: 'sms', name: 'SMS', icon: 'fas fa-sms', color: '#34B7F1' },
        { id: 'bluetooth', name: 'Bluetooth', icon: 'fab fa-bluetooth', color: '#0082FC' },
        { id: 'chrome', name: 'Chrome', icon: 'fab fa-chrome', color: '#4285F4' },
        { id: 'files', name: 'Files', icon: 'fas fa-folder', color: '#4285F4' },
        { id: 'gmail', name: 'Gmail', icon: 'fab fa-google', color: '#EA4335' },
        { id: 'quickshare', name: 'Quick Share', icon: 'fas fa-share', color: '#6200EE' },
        { id: 'save', name: 'Save', icon: 'fas fa-save', color: '#FF9800' },
        { id: 'copy', name: 'Copy Link', icon: 'fas fa-copy', color: '#9C27B0' },
    ];

    return (
        <div className="share-app-container">
            <div className="share-app-header">
                <h2>The Conclave Academy</h2>
                <h3 className="bali-vibes">Travels, Tourism, Hotel and Tour.</h3>
                <p className="tagline">Achieve your goals and be your dreams!</p>
                
                <div className="certified-badge">
                    <i className="fas fa-certificate"></i>
                    <span>Get Certified Today</span>
                </div>
            </div>

            <div className="share-section">
                <h4>Share with:</h4>
                <div className="share-grid">
                    {shareOptions.map((option) => (
                        <button
                            key={option.id}
                            className="share-option"
                            onClick={() => option.id === 'copy' ? handleCopyLink() : handleShare(option.id)}
                            style={{ '--icon-color': option.color }}
                            disabled={isSharing}
                        >
                            {isSharing ? (
                                <i className="fas fa-spinner fa-spin"></i>
                            ) : (
                                <i className={option.icon}></i>
                            )}
                            <span>{option.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="share-actions">
                <button 
                    className={`action-button once-button ${shareMethod === 'just-once' ? 'active' : ''}`}
                    onClick={() => setShareMethod('just-once')}
                    disabled={isSharing}
                >
                    <span>JUST ONCE</span>
                </button>
                <button 
                    className={`action-button always-button ${shareMethod === 'always' ? 'active' : ''}`}
                    onClick={() => setShareMethod('always')}
                    disabled={isSharing}
                >
                    <span>ALWAYS</span>
                </button>
            </div>

            <div className="app-info">
                <p>App URL: <code>{appUrl}</code></p>
                <button 
                    className="copy-button small"
                    onClick={handleCopyLink}
                    disabled={isSharing}
                >
                    {isSharing ? (
                        <i className="fas fa-spinner fa-spin"></i>
                    ) : (
                        <i className="fas fa-copy"></i>
                    )}
                    Copy URL
                </button>
            </div>

            {isSharing && (
                <div className="sharing-indicator">
                    <i className="fas fa-spinner fa-spin"></i>
                    <span>Sharing...</span>
                </div>
            )}
        </div>
    );
};

export default ShareOurApp;