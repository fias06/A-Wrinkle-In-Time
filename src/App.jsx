// src/App.jsx
import React, { useContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';

// CONTEXT IMPORTS
import { AuthProvider, useAuth } from '@/lib/authContext';
import { ContextProvider as SocketProvider, SocketContext } from './context/SocketContext';

// PAGE IMPORTS
import Login from './pages/Login';
import FindFriends from './pages/FindFriends';
import VideoCall from './pages/VideoCall';

// --- THE INNER APP (Where routing & notifications happen) ---
const AuthenticatedApp = () => {
  const { user, isAuthenticated } = useAuth();
  const socketContext = useContext(SocketContext);
  const { toast } = useToast();
  const navigate = useNavigate();

  // 1. Get Socket Context Data
  const { call, callAccepted, answerCall, socket, setName, setMe } = socketContext || {};
  
  // 2. CONNECTION SETUP: Join the Socket Server when logged in
  useEffect(() => {
    if (user && socket && socket.connected) {
      console.log("🟢 Joining Socket Server as:", user.display_name);
      
      setName(user.display_name || user.email);
      setMe(user.id);
      
      // CRITICAL: Tell the server we are here!
      socket.emit("new-user-add", user.id);
    }
  }, [user, socket, socket?.connected]); // Re-run if connection resets

  // 3. INCOMING CALL NOTIFICATION
  useEffect(() => {
    // Only show if: Receiving Call + Not Accepted + We have a Caller Name
    if (call?.isReceivingCall && !callAccepted && call?.from) {
      
      console.log("🔔 Incoming Call from:", call.name);

      // FIX: Use a STATIC ID so the toast doesn't re-render infinite times
      const notificationId = `call-${call.from}`;
      
      toast({
        id: notificationId, // Prevents duplicates
        title: "Incoming Video Call 📞",
        description: `${call.name || "Someone"} is calling you!`,
        duration: Infinity, // Keep open until answered
        action: (
          <button 
            onClick={() => { 
              console.log("✅ Accepting Call...");
              
              // 1. Trigger the WebRTC Answer
              if (answerCall) answerCall(); 
              
              // 2. Navigate to Video Page WITH PARAMS
              // This ensures the video page knows who to connect to
              navigate(`/VideoCall?userId=${call.from}&userName=${encodeURIComponent(call.name)}`); 
            }}
            className="bg-green-600 text-white px-4 py-2 rounded-md font-bold hover:bg-green-700 shadow-lg"
          >
            Accept Call
          </button>
        ),
      });
    }
  }, [call, callAccepted, navigate, answerCall, toast]);

  // 4. Loading State
  if (isAuthenticated === undefined) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-amber-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // 5. Routing Logic
  return (
    <div className="app-container">
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes */}
        <Route 
          path="/" 
          element={isAuthenticated ? <Navigate to="/FindFriends" replace /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/FindFriends" 
          element={isAuthenticated ? <FindFriends /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/VideoCall" 
          element={isAuthenticated ? <VideoCall /> : <Navigate to="/login" replace />} 
        />
        
        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* DEBUG STATUS (Remove this later if you want) */}
      {user && (
         <div className="fixed bottom-2 left-2 text-[10px] text-slate-400 bg-white/80 p-1 rounded z-50 pointer-events-none">
            User: {user.display_name} | Socket: {socket?.connected ? "✅" : "❌"}
         </div>
      )}
    </div>
  );
};

// --- THE ROOT COMPONENT ---
function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <SocketProvider>
          <Router>
            <AuthenticatedApp />
            <Toaster />
          </Router>
        </SocketProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;