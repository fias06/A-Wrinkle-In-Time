import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Video, VideoOff, Mic, MicOff, Phone, PhoneOff, ArrowLeft, Users, Gamepad2 } from 'lucide-react';
import { createPageUrl } from '@/utils';
import VoiceAssistant from '@/components/voice/VoiceAssistant';
import LargeButton from '@/components/ui/LargeButton';
import CoopGame from '@/components/game/CoopGame';

export default function VideoCall() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const partnerId = searchParams.get('partner');
  
  const voiceRef = useRef(null);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [showGame, setShowGame] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    // Simulate connection after a delay
    const timer = setTimeout(() => {
      setIsConnected(true);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

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

  const handleVoiceCommand = (command) => {
    const lower = command.toLowerCase();

    if (lower.includes('mute')) {
      setIsMuted(true);
      voiceRef.current?.speak("Microphone muted.");
    } else if (lower.includes('unmute')) {
      setIsMuted(false);
      voiceRef.current?.speak("Microphone unmuted.");
    } else if (lower.includes('video off') || lower.includes('hide video')) {
      setIsVideoOn(false);
      voiceRef.current?.speak("Video turned off.");
    } else if (lower.includes('video on') || lower.includes('show video')) {
      setIsVideoOn(true);
      voiceRef.current?.speak("Video turned on.");
    } else if (lower.includes('end') || lower.includes('hang up') || lower.includes('disconnect')) {
      handleEndCall();
    } else if (lower.includes('game') || lower.includes('play')) {
      setShowGame(true);
      voiceRef.current?.speak("Opening the game!");
    } else if (lower.includes('close game')) {
      setShowGame(false);
      voiceRef.current?.speak("Game closed.");
    }
  };

  const handleEndCall = () => {
    voiceRef.current?.speak("Ending call. Goodbye!");
    setTimeout(() => {
      navigate(createPageUrl('FindFriends'));
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/50 to-transparent">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(createPageUrl('FindFriends'))}
            className="flex items-center gap-2 text-lg text-white/80 hover:text-white transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          
          {isConnected && (
            <div className="flex items-center gap-3 text-white">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="text-lg font-medium">{formatDuration(callDuration)}</span>
            </div>
          )}
          
          <div className="w-20" />
        </div>
      </div>

      {/* Main Video Area */}
      <div className="relative h-screen">
        {/* Remote Video (Full Screen) */}
        <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
          {isConnected ? (
            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-16 h-16 text-white" />
              </div>
              <p className="text-2xl text-white font-medium">Connected with Friend</p>
              <p className="text-slate-400 mt-2">Video call in progress</p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-xl text-white">Connecting...</p>
            </motion.div>
          )}
        </div>

        {/* Local Video (Picture in Picture) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-24 right-4 w-32 h-44 md:w-48 md:h-64 bg-slate-700 rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-600"
        >
          {isVideoOn ? (
            <div className="w-full h-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center">
              <Video className="w-12 h-12 text-slate-400" />
            </div>
          ) : (
            <div className="w-full h-full bg-slate-800 flex items-center justify-center">
              <VideoOff className="w-12 h-12 text-slate-500" />
            </div>
          )}
        </motion.div>

        {/* Game Overlay */}
        {showGame && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute inset-x-4 top-32 bottom-40 bg-slate-900/95 rounded-3xl p-4 z-10"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl text-white font-bold flex items-center gap-2">
                <Gamepad2 className="w-6 h-6 text-amber-500" />
                Co-op Game
              </h3>
              <button
                onClick={() => setShowGame(false)}
                className="text-slate-400 hover:text-white text-lg"
              >
                Close
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

        {/* Voice Assistant */}
        <div className="absolute bottom-36 left-4 right-4 z-10">
          <VoiceAssistant
            ref={voiceRef}
            greeting="You're in a video call. Say 'mute' to mute, 'end call' to hang up, or 'play game' to start a game together!"
            onCommand={handleVoiceCommand}
            compact
          />
        </div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent"
        >
          <div className="max-w-lg mx-auto flex items-center justify-center gap-4">
            <LargeButton
              onClick={() => setIsMuted(!isMuted)}
              variant={isMuted ? "danger" : "secondary"}
              icon={isMuted ? MicOff : Mic}
              disabled={false}
              className="!rounded-full !w-16 !h-16"
              ariaLabel={isMuted ? "Unmute microphone" : "Mute microphone"}
            >
              {""}
            </LargeButton>

            <LargeButton
              onClick={() => setIsVideoOn(!isVideoOn)}
              variant={!isVideoOn ? "danger" : "secondary"}
              icon={isVideoOn ? Video : VideoOff}
              disabled={false}
              className="!rounded-full !w-16 !h-16"
              ariaLabel={isVideoOn ? "Turn off video" : "Turn on video"}
            >
              {""}
            </LargeButton>

            <LargeButton
              onClick={() => setShowGame(!showGame)}
              variant="primary"
              icon={Gamepad2}
              disabled={!isConnected}
              className="!rounded-full !w-16 !h-16"
              ariaLabel="Play game together"
            >
              {""}
            </LargeButton>

            <LargeButton
              onClick={handleEndCall}
              variant="danger"
              icon={PhoneOff}
              disabled={false}
              className="!rounded-full !w-20 !h-16"
              ariaLabel="End call"
            >
              {""}
            </LargeButton>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
