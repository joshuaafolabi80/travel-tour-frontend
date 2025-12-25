// travel-tour-frontend/src/context/GoogleAuthContext.jsx


import React, { createContext, useState, useContext } from 'react';
import { googleLogout, useGoogleLogin } from '@react-oauth/google';
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
        const response = await api.post('/auth/google', {
          token: tokenResponse.access_token
        });
        
        if (response.data.success) {
          const { token, user } = response.data;
          localStorage.setItem('authToken', token);
          localStorage.setItem('userData', JSON.stringify(user));
          setGoogleUser(user);
          
          // Trigger parent callback or navigation
          window.dispatchEvent(new CustomEvent('googleLoginSuccess', { 
            detail: { user, token } 
          }));
        }
      } catch (error) {
        console.error('Google auth failed:', error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    onError: (error) => {
      console.error('Google Login Failed:', error);
      setIsLoading(false);
    },
    flow: 'implicit'
  });

  const logout = () => {
    googleLogout();
    setGoogleUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
  };

  return (
    <GoogleAuthContext.Provider value={{ 
      googleUser, 
      login, 
      logout, 
      isLoading 
    }}>
      {children}
    </GoogleAuthContext.Provider>
  );
};