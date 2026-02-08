import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  // 1. Initialize user from LocalStorage
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('userProfile');
    return saved ? JSON.parse(saved) : null;
  });

  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  
  // 2. FAKE LOGIN (Just saves to browser)
  // We don't need a real backend login because we already created the user in Supabase in Login.jsx
  const login = (userData) => {
    localStorage.setItem('userProfile', JSON.stringify(userData));
    setUser(userData);
  };

  // 3. LOGOUT
  const logout = () => {
    localStorage.removeItem('userProfile');
    setUser(null);
    window.location.href = '/login';
  };

  // 4. Force "Auth Required" error if no user is found
  // This tells App.jsx to redirect to /login
  const authError = user ? null : { type: 'auth_required' };

  const value = {
    user,
    isAuthenticated: !!user, // Derived from user existence
    isLoadingAuth,
    isLoadingPublicSettings: false, // Always false so the app loads
    authError, 
    login,
    logout,
    navigateToLogin: () => window.location.href = '/login'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};