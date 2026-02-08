// @ts-nocheck
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check active session immediately when app loads
    const checkUser = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Auth Check Error:", error);
          // Don't crash if Supabase is not configured
          setUser(null);
        } else {
          setUser(session?.user || null);
        }
      } catch (error) {
        console.error("Auth Check Exception:", error);
        // If Supabase fails, just set user to null and continue
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkUser();

    // 2. Listen for login/logout events (Real-time updates)
    let subscription = null;
    try {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        console.log("Auth Event:", _event, session?.user?.email);
        setUser(session?.user || null);
        setLoading(false);
      });
      subscription = data.subscription;
    } catch (error) {
      console.error("Error setting up auth listener:", error);
      setLoading(false);
    }

    return () => {
      if (subscription) {
        try {
          subscription.unsubscribe();
        } catch (error) {
          console.error("Error unsubscribing from auth:", error);
        }
      }
    };
  }, []);

  // 3. Login Helper (Google)
  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { 
          redirectTo: window.location.origin // Comes back to your site after Google
        }, 
      });
      if (error) throw error;
    } catch (error) {
      console.error("Google Login Error:", error.message);
      alert(error.message);
    }
  };

  // 4. Logout Helper
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (error) {
      console.error("Logout Error:", error.message);
    }
  };

  const value = {
    user,
    isAuthenticated: !!user, // True if user exists
    loading,                 // Let app know if we are still checking
    signInWithGoogle,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};