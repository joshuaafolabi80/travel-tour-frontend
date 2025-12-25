// travel-tour-frontend/src/context/GoogleAuthContext.jsx


// contexts/GoogleAuthContext.jsx
import React, { createContext, useState, useContext } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import api from '../services/api';

const GoogleAuthContext = createContext();

export const useGoogleAuth = () => useContext(GoogleAuthContext);

export const GoogleAuthProvider = ({ children }) => {
  const [googleUser, setGoogleUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      try {
        console.log('🔄 Sending Google token to backend...', tokenResponse);
        
        const response = await api.post('/auth/google', {
          token: tokenResponse.access_token
        });
        
        console.log('✅ Backend response:', response.data);
        
        if (response.data.success) {
          const { token, user } = response.data;
          localStorage.setItem('authToken', token);
          localStorage.setItem('userData', JSON.stringify(user));
          setGoogleUser(user);
          
          window.dispatchEvent(new CustomEvent('googleLoginSuccess', { 
            detail: { user, token } 
          }));
        } else {
          // Handle backend success: false
          console.error('❌ Backend returned success: false:', response.data);
          throw new Error(response.data.message || 'Authentication failed');
        }
      } catch (error) {
        console.error('❌ Google auth failed with details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          fullError: error
        });
        
        // Show user-friendly error
        alert(`Google Sign-In failed: ${error.response?.data?.message || error.message}`);
        
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    onError: (error) => {
      console.error('❌ Google Login Failed (frontend):', error);
      alert('Google Sign-In failed. Please try again.');
      setIsLoading(false);
    },
    flow: 'implicit'
  });

  const logout = () => {
    setGoogleUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
  };

  return (
    <GoogleAuthContext.Provider value={{ googleUser, login, logout, isLoading }}>
      {children}
    </GoogleAuthContext.Provider>
  );
};

export default GoogleAuthContext;