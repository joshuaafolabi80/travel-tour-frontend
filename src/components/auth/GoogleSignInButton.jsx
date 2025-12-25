// travel-tour-frontend/src/components/auth/GoogleSignInButton.jsx

import React from 'react';
import { useGoogleAuth } from '../../context/GoogleAuthContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import './GoogleSignInButton.css';

const GoogleSignInButton = ({ 
  buttonText = "Sign up with Google",
  onSuccess,
  onError 
}) => {
  const { login, isLoading } = useGoogleAuth();

  const handleClick = async () => {
    try {
      await login();
      if (onSuccess) onSuccess();
    } catch (error) {
      if (onError) onError(error);
    }
  };

  return (
    <button
      className="google-signin-btn"
      onClick={handleClick}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
          Connecting...
        </>
      ) : (
        <>
          <img 
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
            alt="Google" 
            className="google-icon"
          />
          {buttonText}
        </>
      )}
    </button>
  );
};

export default GoogleSignInButton;