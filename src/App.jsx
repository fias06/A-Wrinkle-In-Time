// @ts-nocheck
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';

// STREAM SDK HOOKS
import { useCalls } from '@stream-io/video-react-sdk';

// LIB & CONFIG IMPORTS
import NavigationTracker from '@/lib/NavigationTracker';
import { pagesConfig } from './pages.config';
import PageNotFound from './lib/PageNotFound';

// CONTEXT IMPORTS
import { AuthProvider, useAuth } from '@/lib/authContext';
import { VideoProvider } from '@/context/VideoProvider';

// UI COMPONENTS
import LargeButton from '@/components/ui/LargeButton';
import { Phone, X } from 'lucide-react';

const { Pages, Layout } = pagesConfig;

/**
 * FIXED COMPONENT: IncomingCallAlert
 * This pops up when someone calls you. 
 * The try/catch is now correctly at the top level to prevent initialization crashes.
 */
const IncomingCallAlert = () => {
  const navigate = useNavigate();
  
  // 🟢 SAFETY GUARD: Attempt to access Stream calls
  let calls = [];
  try {
    // This hook MUST be inside <StreamVideo> context
    calls = useCalls(); 
  } catch (e) {
    // If the Stream client isn't ready yet, return null to skip this render cycle
    return null;
  }

  // Find a call that is currently "ringing" for this user
  const incomingCall = calls.find((c) => c.state.callingState === 'ringing');

  // If no one is calling, don't show the UI
  if (!incomingCall) return null;

  const handleAccept = async () => {
    try {
      await incomingCall.join();
      // Navigate to the video page with the caller's ID
      navigate(`/VideoCall?userId=${incomingCall.state.createdBy.id}&userName=Friend`);
    } catch (err) {
      console.error("Failed to accept call:", err);
    }
  };

  const handleDecline = async () => {
    try {
      await incomingCall.leave({ reject: true });
    } catch (err) {
      console.error("Failed to decline call:", err);
    }
  };

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm px-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl border-4 border-amber-400 p-8 flex flex-col items-center animate-in fade-in zoom-in duration-300">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-4 ring-4 ring-amber-50">
          <Phone className="text-amber-600 w-10 h-10 animate-pulse" />
        </div>
        <h3 className="text-2xl font-black text-slate-800 mb-2">Incoming Call!</h3>
        <p className="text-slate-500 mb-8 text-center font-medium">Your friend wants to start a video session with you.</p>
        
        <div className="flex gap-4 w-full">
          <LargeButton onClick={handleAccept} variant="success" className="flex-1 shadow-lg shadow-emerald-200">
            Accept
          </LargeButton>
          <button 
            onClick={handleDecline} 
            className="p-5 bg-red-50 text-red-500 rounded-[1.5rem] hover:bg-red-100 transition-colors border-2 border-red-100"
          >
            <X size={28} />
          </button>
        </div>
      </div>
    </div>
  );
};

const LayoutWrapper = ({ children, currentPageName }) => {
  return Layout ? (
    <Layout currentPageName={currentPageName}>{children}</Layout>
  ) : (
    <>{children}</>
  );
};

const AuthenticatedApp = () => {
  const { isAuthenticated, loading } = useAuth(); // Access auth state

  // 1. LOADING STATE: 
  // This prevents the blank page while Supabase checks the session.
  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-amber-600 rounded-full animate-spin"></div>
          <p className="text-slate-600 font-medium animate-pulse">Connecting to services...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 🟢 THE FIX: Ringer only renders if authenticated to ensure it's inside VideoProvider */}
      {isAuthenticated && <IncomingCallAlert />} 
      
      <Routes>
        <Route path="/" element={<LayoutWrapper currentPageName="Home"><Pages.Home /></LayoutWrapper>} />
        <Route path="/Home" element={<LayoutWrapper currentPageName="Home"><Pages.Home /></LayoutWrapper>} />
        <Route path="/login" element={<LayoutWrapper currentPageName="Login"><Pages.Login /></LayoutWrapper>} />

        <Route path="/Onboarding" element={isAuthenticated ? <LayoutWrapper currentPageName="Onboarding"><Pages.Onboarding /></LayoutWrapper> : <Navigate to="/login" replace />} />
        <Route path="/FindFriends" element={isAuthenticated ? <LayoutWrapper currentPageName="FindFriends"><Pages.FindFriends /></LayoutWrapper> : <Navigate to="/login" replace />} />
        <Route path="/Game" element={isAuthenticated ? <LayoutWrapper currentPageName="Game"><Pages.Game /></LayoutWrapper> : <Navigate to="/login" replace />} />
        <Route path="/VideoCall" element={isAuthenticated ? <LayoutWrapper currentPageName="VideoCall"><Pages.VideoCall /></LayoutWrapper> : <Navigate to="/login" replace />} />
        <Route path="/Profile" element={isAuthenticated ? <LayoutWrapper currentPageName="Profile"><Pages.Profile /></LayoutWrapper> : <Navigate to="/login" replace />} />

        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </>
  );
};

// --- THE ROOT COMPONENT ---
function App() {
  try {
    return (
      <AuthProvider>
        <VideoProvider>
          <QueryClientProvider client={queryClientInstance}>
            <Router>
              <NavigationTracker />
              <AuthenticatedApp />
              <Toaster />
            </Router>
          </QueryClientProvider>
        </VideoProvider>
      </AuthProvider>
    );
  } catch (error) {
    console.error('App render error:', error);
    return (
      <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
        <h1 style={{ color: 'red' }}>App Error</h1>
        <p>{error.message}</p>
        <button onClick={() => window.location.reload()}>Reload</button>
      </div>
    );
  }
}

export default App;