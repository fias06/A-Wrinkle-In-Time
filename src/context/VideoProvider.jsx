// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { StreamVideoClient, StreamVideo } from '@stream-io/video-react-sdk';
import { useAuth } from '@/lib/authContext';

// Ensure your VITE_STREAM_API_KEY is set in your .env file
const API_KEY = import.meta.env.VITE_STREAM_API_KEY;

export const VideoProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth(); //
  const [client, setClient] = useState(null);

  useEffect(() => {
    // 1. Only initialize if we have a valid authenticated user ID
    if (!isAuthenticated || !user?.id) {
      if (client) {
        client.disconnectUser();
        setClient(null);
      }
      return;
    }

    // 2. Fallback if API Key is missing to avoid crashing the whole app
    if (!API_KEY) {
      console.warn('Stream.io API key not configured. Video functionality will be disabled.');
      return;
    }

    try {
      // 3. Clean the ID and prepare the Stream user object
      const userId = String(user.id).trim();
      
      const streamUser = {
        id: userId,
        name: user.display_name || user.email || 'User',
        image: user.avatar_url || user.user_metadata?.avatar_url,
      };

      // 4. Create the development token using the exact same ID
      // Ensure "Disable Auth Checks" is ON in your Stream Dashboard
      const devToken = `devtoken-${userId}`;

      console.log("STREAM DEBUG - Initializing client for:", userId);

      const myClient = new StreamVideoClient({
        apiKey: API_KEY,
        user: streamUser,
        token: devToken,
      });

      setClient(myClient);

      return () => {
        myClient.disconnectUser();
        setClient(null);
      };
    } catch (err) {
      console.error('Stream.io client initialization failed:', err);
    }
  }, [user?.id, isAuthenticated]);

  // 5. THE FIX: Always render {children} wrapped in the Provider.
  // We pass client || {} to ensure hooks like useCalls in App.jsx 
  // are technically "inside" the context, even if the client is still null.
  return (
    <StreamVideo client={client || {}}>
      {children}
    </StreamVideo>
  );
};