import React, { createContext, useState, useContext, useEffect } from 'react';
import { appClient } from '@/api/base44Client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState({});

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    try {
      setIsLoadingAuth(true);
      
      // Check localStorage for user profile
      const profile = localStorage.getItem('userProfile');
      if (profile) {
        const userData = JSON.parse(profile);
        setUser(userData);
        setIsAuthenticated(true);
      }
      
      setIsLoadingAuth(false);
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsLoadingAuth(false);
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('userProfile');
    localStorage.removeItem('myFriends');
  };

  const navigateToLogin = () => {
    // For local auth, just redirect to onboarding
    window.location.href = '/Onboarding';
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      logout,
      navigateToLogin,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
