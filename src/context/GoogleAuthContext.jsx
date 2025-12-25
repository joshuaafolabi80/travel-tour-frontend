// travel-tour-frontend/src/context/GoogleAuthContext.jsx - FIXED VERSION
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
        console.log('🔄 Google login successful, fetching user info...', tokenResponse);
        
        // ✅ FIXED: Get user info from Google API using access_token
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { 
            Authorization: `Bearer ${tokenResponse.access_token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!userInfoResponse.ok) {
          throw new Error(`Google API error: ${userInfoResponse.status}`);
        }
        
        const userInfo = await userInfoResponse.json();
        console.log('✅ Google user info retrieved:', userInfo);
        
        // ✅ FIXED: Send the correct data to your backend
        // We send the access_token AND user info
        const backendResponse = await api.post('/auth/google', {
          access_token: tokenResponse.access_token, // Send access_token
          googleId: userInfo.sub, // This is the ID token (sub)
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
          given_name: userInfo.given_name,
          family_name: userInfo.family_name,
          email_verified: userInfo.email_verified
        });
        
        console.log('✅ Backend response:', backendResponse.data);
        
        if (backendResponse.data.success) {
          const { token, user } = backendResponse.data;
          localStorage.setItem('authToken', token);
          localStorage.setItem('userData', JSON.stringify(user));
          setGoogleUser(user);
          
          // Trigger the success event
          window.dispatchEvent(new CustomEvent('googleLoginSuccess', { 
            detail: { user, token } 
          }));
          
          // Optional: Auto-refresh to trigger app state update
          setTimeout(() => {
            window.location.reload();
          }, 1000);
          
        } else {
          // Handle backend success: false
          console.error('❌ Backend returned success: false:', backendResponse.data);
          throw new Error(backendResponse.data.message || 'Authentication failed');
        }
      } catch (error) {
        console.error('❌ Google auth failed with details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          fullError: error
        });
        
        // Show user-friendly error
        alert(`Google Sign-In failed: ${error.response?.data?.message || error.message || 'Please try again.'}`);
        
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
    flow: 'implicit',
    scope: 'openid email profile' // ✅ Request proper scopes
  });

  const logout = () => {
    setGoogleUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    // Clear any Google session
    if (window.google && window.google.accounts && window.google.accounts.id) {
      window.google.accounts.id.disableAutoSelect();
    }
  };

  return (
    <GoogleAuthContext.Provider value={{ googleUser, login, logout, isLoading }}>
      {children}
    </GoogleAuthContext.Provider>
  );
};

export default GoogleAuthContext;