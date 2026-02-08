import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gamepad2, Users, ArrowLeft, Play, Volume2, VolumeX } from 'lucide-react';
import { createPageUrl } from '@/utils';
import CoopGame from '@/components/game/CoopGame';
import LargeButton from '@/components/ui/LargeButton';

// Genre-specific music tracks (royalty-free from Pixabay)
const GENRE_MUSIC = {
  pop: [
    'https://cdn.pixabay.com/audio/2022/10/25/audio_946bc26c14.mp3', // Upbeat pop
    'https://cdn.pixabay.com/audio/2023/07/03/audio_54076c53b9.mp3', // Happy pop
  ],
  rock: [
    'https://cdn.pixabay.com/audio/2022/03/10/audio_a47e2b1c5f.mp3', // Rock energy
    'https://cdn.pixabay.com/audio/2022/11/22/audio_c9944a1e78.mp3', // Guitar rock
  ],
  jazz: [
    'https://cdn.pixabay.com/audio/2022/08/23/audio_d8c7ac7a2b.mp3', // Smooth jazz
    'https://cdn.pixabay.com/audio/2024/11/06/audio_8b43c85f95.mp3', // Jazz cafe
  ],
  classical: [
    'https://cdn.pixabay.com/audio/2022/02/15/audio_7921e7731b.mp3', // Classical piano
    'https://cdn.pixabay.com/audio/2023/09/25/audio_3dfbb38c9d.mp3', // Orchestra
  ],
  country: [
    'https://cdn.pixabay.com/audio/2022/08/02/audio_884fe92c21.mp3', // Country acoustic
    'https://cdn.pixabay.com/audio/2024/02/14/audio_a1c01a3520.mp3', // Country guitar
  ],
  bollywood: [
    'https://cdn.pixabay.com/audio/2022/08/31/audio_419263cb5c.mp3', // Indian fusion
    'https://cdn.pixabay.com/audio/2023/05/16/audio_5c5f191106.mp3', // Bollywood beat
  ],
  lofi: [
    'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3', // Lofi chill
    'https://cdn.pixabay.com/audio/2022/03/15/audio_942759bd4f.mp3', // Chill beats
  ],
  electronic: [
    'https://cdn.pixabay.com/audio/2022/04/27/audio_67bcb5ec15.mp3', // Electronic
    'https://cdn.pixabay.com/audio/2022/10/30/audio_a583ca4fc2.mp3', // Synth wave
  ],
};

// Default fallback music
const DEFAULT_MUSIC = 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3';

export default function Game() {
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [musicVolume, setMusicVolume] = useState(0.3);
  const [userGenre, setUserGenre] = useState('lofi');
  const gameRef = useRef(null);
  const audioRef = useRef(null);

  // Load user's music preference
  useEffect(() => {
    const profile = localStorage.getItem('userProfile');
    if (profile) {
      const parsed = JSON.parse(profile);
      if (parsed.music_genre) {
        setUserGenre(parsed.music_genre);
      }
    }
  }, []);

  // Get music URL based on user's genre preference
  const getMusicUrl = () => {
    const tracks = GENRE_MUSIC[userGenre];
    if (tracks && tracks.length > 0) {
      return tracks[Math.floor(Math.random() * tracks.length)];
    }
    return DEFAULT_MUSIC;
  };

  // Initialize and manage background music
  useEffect(() => {
    // Create audio element with user's preferred genre
    const audio = new Audio(getMusicUrl());
    audio.loop = true;
    audio.volume = musicVolume;
    audioRef.current = audio;

    // Try to play music (may be blocked by browser until user interaction)
    if (musicEnabled) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Auto-play was prevented, will play on user interaction
          console.log('Music will play after user interaction');
        });
      }
    }

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [userGenre]);

  // Handle music toggle
  useEffect(() => {
    if (audioRef.current) {
      if (musicEnabled) {
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
      }
    }
  }, [musicEnabled]);

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = musicVolume;
    }
  }, [musicVolume]);

  const toggleMusic = () => {
    setMusicEnabled(!musicEnabled);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 py-8 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(createPageUrl('Home'))}
            className="flex items-center gap-2 text-xl text-slate-300 hover:text-white transition-all"
          >
            <ArrowLeft className="w-6 h-6" />
            Back
          </button>
          
          <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
            <Gamepad2 className="w-10 h-10 text-amber-500" />
            Play Together
          </h1>
          
          {/* Music Control */}
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleMusic}
                className={`p-3 rounded-xl transition-all ${
                  musicEnabled 
                    ? 'bg-amber-500 text-white hover:bg-amber-600' 
                    : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                }`}
                aria-label={musicEnabled ? 'Mute music' : 'Play music'}
              >
                {musicEnabled ? (
                  <Volume2 className="w-6 h-6" />
                ) : (
                  <VolumeX className="w-6 h-6" />
                )}
              </button>
              {musicEnabled && (
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={musicVolume}
                  onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                  className="w-20 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  aria-label="Music volume"
                />
              )}
            </div>
            {musicEnabled && (
              <span className="text-xs text-amber-400 capitalize">
                🎵 {userGenre.replace('lofi', 'Lo-Fi')} music
              </span>
            )}
          </div>
        </div>

        {isPlaying ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <CoopGame
              ref={gameRef}
              isPlayer1={true}
              onGameAction={() => {}}
              remoteAction={null}
            />
            
            <div className="mt-6 text-center">
              <LargeButton
                onClick={() => setIsPlaying(false)}
                variant="outline"
                className="border-slate-600 text-white hover:bg-slate-800"
              >
                Stop Practice
              </LargeButton>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {/* Game intro */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-800 rounded-3xl p-8 border-4 border-slate-700"
            >
              <h2 className="text-2xl font-bold text-white mb-4">
                🎮 Gold & Silver Adventure
              </h2>
              <p className="text-xl text-slate-300 mb-6 leading-relaxed">
                A cooperative puzzle game where two players work together! 
                One controls Gold, the other controls Silver. 
                Stand on buttons to open doors and reach the goal together.
              </p>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="bg-amber-500/20 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500" />
                    <span className="text-xl font-bold text-amber-400">Gold Player</span>
                  </div>
                  <p className="text-lg text-slate-300">
                    Opens the purple door by standing on the purple button
                  </p>
                </div>
                
                <div className="bg-violet-500/20 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-violet-500" />
                    <span className="text-xl font-bold text-violet-400">Silver Player</span>
                  </div>
                  <p className="text-lg text-slate-300">
                    Opens the gold door by standing on the gold button
                  </p>
                </div>
              </div>

              <h3 className="text-xl font-semibold text-white mb-3">
                🎤 Voice Controls
              </h3>
              <div className="flex flex-wrap gap-3 text-lg">
                <span className="bg-slate-700 px-4 py-2 rounded-xl text-white">"Jump"</span>
                <span className="bg-slate-700 px-4 py-2 rounded-xl text-white">"Left"</span>
                <span className="bg-slate-700 px-4 py-2 rounded-xl text-white">"Right"</span>
              </div>
            </motion.div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <LargeButton
                onClick={() => setIsPlaying(true)}
                variant="primary"
                icon={Play}
                className="flex-1"
              >
                Practice Solo
              </LargeButton>
              
              <LargeButton
                onClick={() => navigate(createPageUrl('FindFriends'))}
                variant="secondary"
                icon={Users}
                className="flex-1"
              >
                Find a Partner
              </LargeButton>
            </div>

            {/* How to play with friends */}
            <div className="bg-slate-800/50 rounded-2xl p-6 text-center">
              <p className="text-xl text-slate-300">
                💡 <strong>Tip:</strong> During a video call, tap the game icon to play together!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}