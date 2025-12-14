import React, { useState, useEffect } from 'react';
import { Alert, Toast, ToastContainer } from 'react-bootstrap';
import socketService from '../../utils/socketService';

const RealTimeAlert = () => {
  const [notifications, setNotifications] = useState([]);
  const [showFlyIn, setShowFlyIn] = useState(false);
  const [flyInMessage, setFlyInMessage] = useState('');

  useEffect(() => {
    // Listen for new experiences
    const handleNewExperience = (data) => {
      const newNotification = {
        id: Date.now(),
        type: 'new-experience',
        title: '✨ New Experience Shared',
        message: data.message || 'A new experience has been added',
        timestamp: new Date(),
        experience: data.experience
      };
      
      setNotifications(prev => [newNotification, ...prev.slice(0, 4)]);
      showFlyInAlert('A new tourism experience has been shared!');
    };

    // Listen for likes
    const handleLikeUpdate = (data) => {
      const newNotification = {
        id: Date.now(),
        type: 'like-update',
        title: '👍 Experience Liked',
        message: 'Someone liked an experience',
        timestamp: new Date()
      };
      
      setNotifications(prev => [newNotification, ...prev.slice(0, 4)]);
    };

    const socket = socketService.connect();
    socketService.onNewExperience(handleNewExperience);
    socketService.onLikeUpdated(handleLikeUpdate);

    return () => {
      socketService.removeListener('new-experience', handleNewExperience);
      socketService.removeListener('experience-like-updated', handleLikeUpdate);
    };
  }, []);

  const showFlyInAlert = (message) => {
    setFlyInMessage(message);
    setShowFlyIn(true);
    
    setTimeout(() => {
      setShowFlyIn(false);
    }, 5000);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  return (
    <>
      {/* Fly-in Alert */}
      {showFlyIn && (
        <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 9999, animation: 'slideInRight 0.5s ease-out' }}>
          <Alert variant="success" onClose={() => setShowFlyIn(false)} dismissible className="shadow-lg">
            <div className="d-flex align-items-center">
              <i className="fas fa-bell me-3 fs-4"></i>
              <div>
                <strong>Live Update!</strong>
                <p className="mb-0">{flyInMessage}</p>
              </div>
            </div>
          </Alert>
        </div>
      )}

      {/* Notification Toasts */}
      <ToastContainer position="bottom-end" className="p-3" style={{ zIndex: 9998 }}>
        {notifications.map(notification => (
          <Toast 
            key={notification.id}
            onClose={() => removeNotification(notification.id)}
            delay={5000}
            autohide
            className="mb-2"
          >
            <Toast.Header>
              <strong className="me-auto">
                <i className={`fas ${notification.type === 'new-experience' ? 'fa-star' : 'fa-thumbs-up'} me-2`}></i>
                {notification.title}
              </strong>
              <small>{notification.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
            </Toast.Header>
            <Toast.Body>
              {notification.message}
              {notification.experience && (
                <div className="mt-2">
                  <small className="text-muted">
                    "{notification.experience.title?.substring(0, 50)}..."
                  </small>
                </div>
              )}
            </Toast.Body>
          </Toast>
        ))}
      </ToastContainer>

      {/* Add CSS animation */}
      <style>
        {`
          @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          
          .hover-lift {
            transition: transform 0.2s, box-shadow 0.2s;
          }
          .hover-lift:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.1);
          }
        `}
      </style>
    </>
  );
};

export default RealTimeAlert;