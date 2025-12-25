// travel-tour-frontend/src/LoginRegister.jsx - UPDATED WITH ANIMATED MESSAGES

import React, { useState, useEffect } from 'react';
import PasswordResetForm from './PasswordResetForm';
import GoogleSignInButton from './components/auth/GoogleSignInButton';
import 'bootstrap/dist/css/bootstrap.min.css';
import './LoginRegister.css';

const LoginRegister = ({ onLogin, onRegister }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isMessageVisible, setIsMessageVisible] = useState(false);

  // Auto-hide message after 4 seconds
  useEffect(() => {
    if (message.text && message.type === 'success') {
      setIsMessageVisible(true);
      
      const hideTimer = setTimeout(() => {
        setIsMessageVisible(false);
        // Clear message after fade out animation completes
        setTimeout(() => {
          setMessage({ text: '', type: '' });
        }, 500);
      }, 4000); // Show for 4 seconds
      
      return () => clearTimeout(hideTimer);
    } else if (message.text) {
      // For non-success messages, show immediately
      setIsMessageVisible(true);
    } else {
      // No message, hide it
      setIsMessageVisible(false);
    }
  }, [message]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });
    setIsMessageVisible(false);
    
    if (isLogin) {
      if (!formData.email || !formData.password) {
        setMessage({ text: 'Please enter email and password.', type: 'danger' });
        return;
      }
      onLogin(formData.email, formData.password);
    } else {
      if (formData.password !== formData.confirmPassword) {
        setMessage({ text: "Passwords don't match!", type: 'danger' });
        return;
      }
      if (formData.password.length < 6) {
        setMessage({ text: 'Password must be at least 6 characters long.', type: 'danger' });
        return;
      }
      if (!formData.email || !formData.password || !formData.username) {
        setMessage({ text: 'Please fill all required fields.', type: 'danger' });
        return;
      }
      onRegister({
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });
    }
  };

  const togglePasswordReset = () => {
    setIsPasswordReset(true);
  };

  const handleResetSuccess = async (email, password) => {
    // Use the existing login function with the new credentials
    await onLogin(email, password);
  };

  return (
    <div className="container-fluid bg-light d-flex align-items-center justify-content-center min-vh-100 p-3">
      <div className="row g-0 rounded-4 shadow-lg overflow-hidden" style={{ maxWidth: '1000px' }}>
        {/* Left side: Image and text section */}
        <div className="col-lg-6 d-none d-lg-block p-4 position-relative" style={{
          backgroundImage: `url(./images/travelling_and_tour_1.jpg)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}>
          <h2 className="display-5 fw-bold text-white text-shadow p-4">Your Journey to New Horizons Awaits</h2>
          <div className="position-absolute bottom-0 start-0 w-100 p-4" style={{
            background: 'rgba(0,0,0,0.4)',
          }}>
            <p className="lead fw-bold text-white text-shadow mb-0">Take flight with us and explore the world of travel and tourism.</p>
          </div>
        </div>

        {/* Right side: Form section */}
        <div className="col-lg-6 bg-white d-flex align-items-center">
          {isPasswordReset ? (
            <PasswordResetForm onBack={() => setIsPasswordReset(false)} onResetSuccess={handleResetSuccess} />
          ) : (
            <div className="p-4 p-md-5 w-100">
              <div className="text-center mb-4">
                <h2 className="fw-bold">{isLogin ? 'Login' : 'Create Account'}</h2>
                <p className="text-muted">
                  {isLogin
                    ? 'Login to your account'
                    : 'Join us to start your journey'
                  }
                </p>
              </div>
              
              {/* Animated message alert */}
              {message.text && (
                <div 
                  className={`alert alert-${message.type} message-alert ${isMessageVisible ? 'visible' : 'hidden'}`}
                  role="alert"
                  style={{
                    transition: 'all 0.5s ease-in-out',
                    transform: isMessageVisible ? 'translateY(0)' : 'translateY(-20px)',
                    opacity: isMessageVisible ? 1 : 0,
                    maxHeight: isMessageVisible ? '100px' : '0',
                    overflow: 'hidden',
                    marginBottom: isMessageVisible ? '1rem' : '0'
                  }}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <span>{message.text}</span>
                    {message.type === 'success' && (
                      <button 
                        type="button" 
                        className="btn-close" 
                        onClick={() => {
                          setIsMessageVisible(false);
                          setTimeout(() => setMessage({ text: '', type: '' }), 500);
                        }}
                        aria-label="Close"
                      ></button>
                    )}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {!isLogin && (
                  <div className="mb-3">
                    <label htmlFor="username" className="form-label">Name and Surname</label>
                    <input
                      type="text"
                      className="form-control"
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      required={!isLogin}
                      placeholder="Enter your Name and Surname"
                    />
                  </div>
                )}

                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter your email"
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="password" className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    placeholder={isLogin ? "Enter your password" : "Enter password (min 6 characters)"}
                    minLength={!isLogin ? 6 : undefined}
                  />
                </div>

                {!isLogin && (
                  <div className="mb-3">
                    <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                    <input
                      type="password"
                      className="form-control"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required={!isLogin}
                      placeholder="Confirm your password"
                      minLength={6}
                    />
                  </div>
                )}

                <button type="submit" className="btn btn-primary w-100 py-2 fw-bold mt-2">
                  {isLogin ? 'SIGN IN' : 'CREATE ACCOUNT'}
                </button>
              </form>
              
              {isLogin && (
                <div className="text-end mt-2">
                  <a 
                    href="#" 
                    onClick={(e) => { 
                      e.preventDefault(); 
                      togglePasswordReset(); 
                    }} 
                    className="text-primary text-decoration-none fw-bold"
                  >
                    Forgot Password?
                  </a>
                </div>
              )}
              
              <div className="my-4 text-center">
                <span className="text-muted">Or continue with</span>
              </div>

              <GoogleSignInButton 
                buttonText={isLogin ? "Sign in with Google" : "Sign up with Google"}
                onSuccess={() => {
                  setMessage({ text: "Google sign-in successful! Redirecting...", type: 'success' });
                }}
                onError={(error) => {
                  setMessage({ text: "Google sign-in failed. Please try again.", type: 'danger' });
                }}
              />

              <div className="text-center mt-3">
                <p className="text-muted">
                  {isLogin
                    ? "Don't have an account yet? "
                    : "Already have an account? "
                  }
                  <a 
                    href="#" 
                    onClick={(e) => { 
                      e.preventDefault(); 
                      setIsLogin(!isLogin); 
                      setMessage({ text: '', type: '' });
                      setIsMessageVisible(false);
                    }} 
                    className="text-primary text-decoration-none fw-bold"
                  >
                    {isLogin ? 'Join The Conclave Now!' : 'Sign In'}
                  </a>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginRegister;