// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  StreamCall, 
  StreamTheme, 
  SpeakerLayout, 
  CallControls,
  useStreamVideoClient,
  CallingState,
  useCallStateHooks
} from '@stream-io/video-react-sdk';
import { useAuth } from '@/lib/authContext';
import { Loader2 } from 'lucide-react';

// --- SUB-COMPONENT: CALL UI ---
// Hooks are safe here because this component is rendered inside <StreamCall>
const CallUI = ({ onLeave }) => {
  const { useCallCallingState, useParticipantCount } = useCallStateHooks();
  const callingState = useCallCallingState();
  const participantCount = useParticipantCount();

  if (callingState !== CallingState.JOINED) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
        <Loader2 className="w-12 h-12 mb-4 animate-spin text-amber-500" />
        <p className="text-xl font-medium">Connecting to session...</p>
        <p className="text-slate-400 mt-2">Wait for your friend to join</p>
      </div>
    );
  }

  return (
    <StreamTheme>
      <div className="relative h-screen w-full bg-slate-950">
        <div className="absolute top-6 left-6 z-50 flex items-center gap-4">
           <div className="bg-slate-800/80 backdrop-blur px-4 py-2 rounded-full border border-slate-700">
             <span className="text-amber-500 font-bold">● LIVE</span>
             <span className="ml-3 text-white font-medium">{participantCount} Participants</span>
           </div>
        </div>

        <SpeakerLayout participantsBarPosition='bottom' />
        
        <div className="absolute bottom-10 left-0 w-full flex justify-center z-50">
          <CallControls onLeave={onLeave} />
        </div>
      </div>
    </StreamTheme>
  );
};

// --- MAIN COMPONENT ---
export default function VideoCall() {
  const { user } = useAuth(); //
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const client = useStreamVideoClient(); //
  
  const [call, setCall] = useState(null);
  const [error, setError] = useState(null);
  
  const partnerId = searchParams.get('userId');

  useEffect(() => {
    if (!client || !user?.id || !partnerId) return;

    // DETERMINISTIC ID: Same for both users
    const members = [user.id, partnerId].sort();
    const callId = `call_${members[0].split('-')[0]}_${members[1].split('-')[0]}`;
    
    console.log("STREAM DEBUG - Room ID:", callId);

    const myCall = client.call('default', callId);

    const initCall = async () => {
      try {
        await myCall.getOrCreate({
          data: {
            members: [
              { user_id: user.id, role: 'admin' },
              { user_id: partnerId, role: 'user' },
            ],
            ring: true, //
          },
        });
        await myCall.join();
        setCall(myCall);
      } catch (err) {
        console.error("Stream Call Error:", err);
        setError(err.message);
      }
    };

    initCall();

    return () => {
      myCall.leave();
    };
  }, [client, user, partnerId]);

  const handleLeave = () => {
    navigate('/FindFriends'); //
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 p-10">
        <div className="text-center text-red-600">
          <h2 className="text-2xl font-bold mb-2">Connection Failed</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 underline">Try Again</button>
        </div>
      </div>
    );
  }

  if (!call) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto text-amber-500 mb-4" />
          <h2 className="text-2xl font-bold text-slate-800">Initializing Video...</h2>
        </div>
      </div>
    );
  }

  return (
    <StreamCall call={call}>
      <CallUI onLeave={handleLeave} />
    </StreamCall>
  );
}