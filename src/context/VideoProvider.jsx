// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { StreamVideoClient, StreamVideo } from '@stream-io/video-react-sdk';
import { useAuth } from '@/lib/authContext';

const API_KEY = import.meta.env.VITE_STREAM_API_KEY;

export const VideoProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth(); //
  const [client, setClient] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    const initializeStream = async () => {
      try {
        // 🟢 FORCE IDENTICAL STRINGS
        const cleanUserId = String(user.id).toLowerCase().trim(); 
        const token = `devtoken-${cleanUserId}`;

        console.log("STREAM AUTH ATTEMPT:", { id: cleanUserId, token: token });

        const myClient = new StreamVideoClient({ apiKey: API_KEY });
        
        // Explicitly await the connection to ensure the 'client.user' is set
        await myClient.connectUser(
          {
            id: cleanUserId,
            name: user.display_name || user.email || 'User',
            image: user.avatar_url,
          },
          token
        );

        console.log("STREAM AUTH SUCCESS: Connected as", cleanUserId);
        setClient(myClient);
      } catch (err) {
        console.error('STREAM AUTH FAILURE:', err.message); 
      }
    };

    initializeStream();

    return () => {
      if (client) {
        client.disconnectUser();
        setClient(null);
      }
    };
  }, [user?.id, isAuthenticated]);

  return (
    <StreamVideo client={client || {}}>
      {children}
    </StreamVideo>
  );
};