// @ts-nocheck
import React, { useEffect, useRef, useContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Gamepad2 } from 'lucide-react';
import { SocketContext } from '@/context/SocketContext'; 

const VideoCall = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const otherUserName = searchParams.get('userName') || "Friend";

  // Get everything from our Context
  const { 
    name, 
    callAccepted, 
    myVideo, 
    userVideo, 
    callEnded, 
    stream, 
    callUser, 
    leaveCall,
    me 
  } = useContext(SocketContext);

  // --- THE FIX: FORCE VIDEO TO SHOW ---
  useEffect(() => {
    // 1. Force My Video
    if (myVideo.current && stream) {
        console.log("Attaching MY stream to video element");
        myVideo.current.srcObject = stream;
    }
  }, [stream, myVideo]); // Run whenever stream is ready

  useEffect(() => {
    // 2. Force User Video (When they answer)
    if (callAccepted && !callEnded && userVideo.current) {
        console.log("Attaching THEIR stream to video element");
        
        // --- ADD THESE LINES TO DEBUG ---
        if (userVideo.current.srcObject) {
            console.log("Stream is already attached!");
            userVideo.current.play().catch(e => console.error("Error playing video:", e));
        } else {
            console.log("Waiting for stream...");
        }
    }
  }, [callAccepted, callEnded, userVideo]);
  // ------------------------------------

  return (
    <div className="h-screen w-screen bg-slate-900 flex flex-col items-center justify-center relative overflow-hidden">
      
      {/* 1. THEIR VIDEO (Main Screen) */}
      <div className="absolute inset-0 flex items-center justify-center">
        {callAccepted && !callEnded ? (
          <video 
            playsInline 
            ref={userVideo} 
            autoPlay 
            className="w-full h-full object-cover" 
          />
        ) : (
          <div className="text-white text-center animate-pulse">
             <h2 className="text-3xl font-bold mb-2">Calling {otherUserName}...</h2>
             <p className="text-slate-400">Waiting for them to answer...</p>
          </div>
        )}
      </div>

      {/* 2. MY VIDEO (Small Box) */}
      {stream && (
        <div className="absolute top-4 right-4 w-48 h-36 bg-black rounded-xl border-2 border-slate-700 shadow-2xl overflow-hidden z-10">
          <video 
            playsInline 
            muted 
            ref={myVideo} 
            autoPlay 
            className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect
          /> 
          <div className="absolute bottom-2 left-2 bg-black/50 px-2 rounded text-xs text-white">You</div>
        </div>
      )}

      {/* Controls Bar */}
      <div className="absolute bottom-8 flex gap-4 bg-slate-800/80 p-4 rounded-full backdrop-blur-md z-20">
         <button className="p-4 rounded-full bg-slate-700 text-white hover:bg-slate-600"><Mic /></button>
         <button className="p-4 rounded-full bg-slate-700 text-white hover:bg-slate-600"><Video /></button>
         <button className="p-4 rounded-full bg-amber-600 text-white hover:bg-amber-700 animate-pulse"><Gamepad2 /></button> 
         <button 
            onClick={() => { leaveCall(); navigate('/'); }} 
            className="p-4 rounded-full bg-red-600 text-white hover:bg-red-700"
         >
            <PhoneOff />
         </button>
      </div>
    </div>
  );
};

export default VideoCall;