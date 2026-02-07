import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Video, VideoOff, Mic, MicOff, PhoneOff, ArrowLeft, Users, Gamepad2, MessageCircle } from 'lucide-react';
import { createPageUrl } from '@/utils';
import VoiceButton from '@/components/voice/VoiceButton';
import LargeButton from '@/components/ui/LargeButton';
import CoopGame from '@/components/game/CoopGame';

export default function VideoCall() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const partnerName = searchParams.get('userName') || 'Friend';
  const partnerId = searchParams.get('userId');
  
  const localVideoRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [showGame, setShowGame] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [cameraError, setCameraError] = useState(null);

  // Initialize camera
  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setCameraError(null);
      } catch (err) {
        console.error('Error accessing camera:', err);
        setCameraError('Camera access denied. Please allow camera access to use video calling.');
      }
    };

    initCamera();

    // Cleanup on unmount
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Update video element when stream changes
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Simulate connection
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
    }, 2500);
    
    return () => clearTimeout(timer);
  }, [partnerName]);

  // Call duration timer
  useEffect(() => {
    let interval;
    if (isConnected) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isConnected]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
      }
    }
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const handleVoiceCommand = (command) => {
    const cmd = command.toLowerCase();
    console.log('Voice command:', cmd);

    // Mute/unmute
    if (cmd.includes('mute') && !cmd.includes('unmute')) {
      if (!isMuted) toggleMute();
    } else if (cmd.includes('unmute')) {
      if (isMuted) toggleMute();
    }
    // Video on/off
    else if (cmd.includes('video off') || cmd.includes('camera off') || cmd.includes('hide')) {
      if (isVideoOn) toggleVideo();
    } else if (cmd.includes('video on') || cmd.includes('camera on') || cmd.includes('show')) {
      if (!isVideoOn) toggleVideo();
    }
    // End call
    else if (cmd.includes('end') || cmd.includes('hang up') || cmd.includes('leave') || cmd.includes('bye')) {
      handleEndCall();
    }
    // Game
    else if (cmd.includes('game') || cmd.includes('play')) {
      setShowGame(true);
    } else if (cmd.includes('close game') || cmd.includes('stop game')) {
      setShowGame(false);
    }
    // Navigation
    else if (cmd.includes('home')) {
      if (localStream) localStream.getTracks().forEach(t => t.stop());
      navigate(createPageUrl('Home'));
    } else if (cmd.includes('friends') || cmd.includes('find')) {
      if (localStream) localStream.getTracks().forEach(t => t.stop());
      navigate(createPageUrl('FindFriends'));
    }
  };

  const handleEndCall = () => {
    // Stop all tracks
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    
    navigate(createPageUrl('FindFriends'));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/70 to-transparent">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={handleEndCall}
            className="flex items-center gap-2 text-lg text-white/80 hover:text-white transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Leave
          </button>
          
          <div className="flex items-center gap-3 text-white">
            {isConnecting ? (
              <span className="text-amber-400">Connecting...</span>
            ) : isConnected ? (
              <>
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <span className="text-lg font-medium">{formatDuration(callDuration)}</span>
              </>
            ) : null}
          </div>
          
          <div className="text-white font-medium text-lg">
            {partnerName}
          </div>
        </div>
      </div>

      {/* Main Video Area */}
      <div className="relative h-screen">
        {/* Remote Video (Full Screen) - Simulated partner */}
        <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
          {isConnecting ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <div className="w-20 h-20 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
              <p className="text-2xl text-white mb-2">Calling {partnerName}...</p>
              <p className="text-slate-400">Please wait while we connect you</p>
            </motion.div>
          ) : isConnected ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              {/* Simulated partner avatar */}
              <div className="w-40 h-40 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
                <span className="text-6xl font-bold text-white">
                  {partnerName.charAt(0).toUpperCase()}
                </span>
              </div>
              <p className="text-3xl text-white font-medium mb-2">{partnerName}</p>
              <p className="text-slate-400 text-lg">Video call connected</p>
              
              {/* Simulated video placeholder message */}
              <div className="mt-8 bg-slate-700/50 rounded-2xl p-4 max-w-md mx-auto">
                <p className="text-slate-300 text-sm">
                  🎥 In a real implementation, your friend's video would appear here.
                  <br />
                  This is a demo showing your camera working!
                </p>
              </div>
            </motion.div>
          ) : null}
        </div>

        {/* Local Video (Picture in Picture) - Your camera */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          drag
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          className="absolute top-24 right-4 w-36 h-48 md:w-48 md:h-64 bg-slate-700 rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-600 z-10"
        >
          {cameraError ? (
            <div className="w-full h-full bg-slate-800 flex flex-col items-center justify-center p-4 text-center">
              <VideoOff className="w-10 h-10 text-red-400 mb-2" />
              <p className="text-xs text-slate-400">Camera unavailable</p>
            </div>
          ) : isVideoOn ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover mirror"
              style={{ transform: 'scaleX(-1)' }}
            />
          ) : (
            <div className="w-full h-full bg-slate-800 flex flex-col items-center justify-center">
              <VideoOff className="w-10 h-10 text-slate-500 mb-2" />
              <p className="text-xs text-slate-400">Camera off</p>
            </div>
          )}
          
          {/* You label */}
          <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-xs text-white">
            You {isMuted && '🔇'}
          </div>
        </motion.div>

        {/* Game Overlay */}
        {showGame && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute inset-x-4 top-32 bottom-44 bg-slate-900/95 rounded-3xl p-4 z-20"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl text-white font-bold flex items-center gap-2">
                <Gamepad2 className="w-6 h-6 text-amber-500" />
                Co-op Game with {partnerName}
              </h3>
              <button
                onClick={() => setShowGame(false)}
                className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Close Game
              </button>
            </div>
            <CoopGame
              isPlayer1={true}
              onGameAction={() => {}}
              remoteAction={null}
              className="h-full"
            />
          </motion.div>
        )}

        {/* Voice Button - Fixed bottom left */}
        <VoiceButton
          onCommand={handleVoiceCommand}
          size="medium"
          fixed={true}
        />

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/70 to-transparent"
        >
          <div className="max-w-2xl mx-auto">
            {/* Status indicators */}
            <div className="flex justify-center gap-4 mb-4 text-sm">
              {isMuted && (
                <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full">
                  🔇 Muted
                </span>
              )}
              {!isVideoOn && (
                <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full">
                  📵 Camera Off
                </span>
              )}
            </div>
            
            {/* Control buttons with labels */}
            <div className="flex items-center justify-center gap-6">
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={toggleMute}
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                    isMuted 
                      ? 'bg-red-500 hover:bg-red-600 text-white' 
                      : 'bg-slate-600 hover:bg-slate-500 text-white'
                  }`}
                  aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
                >
                  {isMuted ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
                </button>
                <span className="text-white text-sm font-medium">
                  {isMuted ? 'Unmute' : 'Mute'}
                </span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={toggleVideo}
                  disabled={!!cameraError}
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                    !isVideoOn 
                      ? 'bg-red-500 hover:bg-red-600 text-white' 
                      : 'bg-slate-600 hover:bg-slate-500 text-white'
                  } ${cameraError ? 'opacity-50 cursor-not-allowed' : ''}`}
                  aria-label={isVideoOn ? "Turn off video" : "Turn on video"}
                >
                  {isVideoOn ? <Video className="w-7 h-7" /> : <VideoOff className="w-7 h-7" />}
                </button>
                <span className="text-white text-sm font-medium">
                  {isVideoOn ? 'Video Off' : 'Video On'}
                </span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={() => setShowGame(!showGame)}
                  disabled={!isConnected}
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                    showGame 
                      ? 'bg-slate-600 hover:bg-slate-500 text-white' 
                      : 'bg-amber-500 hover:bg-amber-600 text-white'
                  } ${!isConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
                  aria-label="Play game together"
                >
                  <Gamepad2 className="w-7 h-7" />
                </button>
                <span className="text-white text-sm font-medium">
                  {showGame ? 'Close Game' : 'Play Game'}
                </span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={handleEndCall}
                  className="w-20 h-16 rounded-full flex items-center justify-center bg-red-600 hover:bg-red-700 text-white transition-all"
                  aria-label="End call"
                >
                  <PhoneOff className="w-7 h-7" />
                </button>
                <span className="text-white text-sm font-medium">End Call</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
