import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gamepad2, Users, ArrowLeft, Play, Volume2, VolumeX, Mic } from 'lucide-react';
import { createPageUrl } from '@/utils';
import LargeButton from '@/components/ui/LargeButton';
import VoiceButton from '@/components/voice/VoiceButton';

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

// Game configurations
const GAMES = {
  pond: {
    id: 'pond',
    name: '🐸 Pond Adventure',
    description: 'A cooperative puzzle game where two players work together! Navigate the pond, step on pressure plates to open doors, and reach the goal flower together.',
    src: '/pond-game/index.html',
    player1: { color: 'emerald', controls: 'Arrow Keys or WASD' },
    player2: { color: 'blue', controls: 'IJKL keys' },
    howToPlay: ['Stand on plates', 'Open doors', 'Reach the flower!'],
    voiceCommands: ['up', 'down', 'left', 'right']
  },
  rodent: {
    id: 'rodent',
    name: '🐿️ Rodent Rampage',
    description: 'Protect Nonna and Nonno from the invading squirrels! A fun action game where you defend against waves of mischievous rodents.',
    src: '/protecc-the-prosciutt/index.html',
    player1: { color: 'red', controls: 'Arrow Keys to move, Space to shoot' },
    player2: { color: 'orange', controls: 'WASD to move, E to shoot' },
    howToPlay: ['Defend the garden', 'Shoot the squirrels', 'Protect the prosciutto!'],
    voiceCommands: ['up', 'down', 'left', 'right', 'shoot', 'fire']
  },
  bridge: {
    id: 'bridge',
    name: '🌉 Bridge Builder',
    description: 'Work together to build bridges and cross dangerous gaps! A strategic puzzle game where teamwork is essential to reach the other side.',
    src: '/bridge_deployable/index.html',
    player1: { color: 'amber', controls: 'Arrow Keys to move' },
    player2: { color: 'purple', controls: 'WASD to move' },
    howToPlay: ['Build bridges together', 'Cross the gaps', 'Reach the goal!'],
    voiceCommands: ['left', 'right', 'down', 'drop', 'rotate']
  }
};

export default function Game() {
  const navigate = useNavigate();
  const [selectedGame, setSelectedGame] = useState(null); // null = selection screen, 'pond' or 'rodent' = playing
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [musicVolume, setMusicVolume] = useState(0.3);
  const [userGenre, setUserGenre] = useState('lofi');
  const audioRef = useRef(null);
  const iframeRef = useRef(null);

  // Voice command handler for games
  const handleVoiceCommand = (command) => {
    const cmd = command.toLowerCase().trim();
    console.log('🎮 Game voice command:', cmd);

    // Send command to iframe
    if (iframeRef.current && iframeRef.current.contentWindow) {
      // Parse the command and send appropriate game action
      let action = null;
      
      if (cmd.includes('left')) action = 'left';
      else if (cmd.includes('right')) action = 'right';
      else if (cmd.includes('up') || cmd.includes('jump')) action = 'up';
      else if (cmd.includes('down')) action = 'down';
      else if (cmd.includes('shoot') || cmd.includes('fire') || cmd.includes('attack')) action = 'shoot';
      else if (cmd.includes('drop') || cmd.includes('fall')) action = 'drop';
      else if (cmd.includes('rotate') || cmd.includes('turn') || cmd.includes('spin')) action = 'rotate';
      else if (cmd.includes('start') || cmd.includes('play') || cmd.includes('begin')) action = 'start';
      else if (cmd.includes('pause') || cmd.includes('stop')) action = 'pause';
      else if (cmd.includes('restart') || cmd.includes('reset') || cmd.includes('again')) action = 'restart';
      
      if (action) {
        // Check for player specification (e.g., "player one left", "player 2 up")
        let player = 2; // default to player 2
        if (cmd.includes('player one') || cmd.includes('player 1') || cmd.includes('first')) {
          player = 1;
        }
        
        console.log(`🎮 Sending ${action} to game for player ${player}`);
        iframeRef.current.contentWindow.postMessage({ type: 'voice-command', action, player }, '*');
      }
    }

    // Handle navigation commands
    if (cmd.includes('back') || cmd.includes('exit') || cmd.includes('quit')) {
      setSelectedGame(null);
    } else if (cmd.includes('home')) {
      navigate(createPageUrl('Home'));
    }
  };

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
    audio.preload = 'auto';
    audioRef.current = audio;

    // Handle when audio can play
    const handleCanPlay = () => {
      if (musicEnabled && audioRef.current) {
        audioRef.current.play().catch((e) => {
          console.log('Audio autoplay blocked, waiting for user interaction:', e.message);
        });
      }
    };

    audio.addEventListener('canplaythrough', handleCanPlay);

    // Also try playing immediately if browser allows
    if (musicEnabled) {
      audio.play().catch(() => {
        console.log('Music will play after user interaction');
      });
    }

    // Add click handler to start music on first user interaction
    const startMusicOnInteraction = () => {
      if (musicEnabled && audioRef.current && audioRef.current.paused) {
        audioRef.current.play().catch(() => {});
      }
      document.removeEventListener('click', startMusicOnInteraction);
      document.removeEventListener('keydown', startMusicOnInteraction);
    };
    document.addEventListener('click', startMusicOnInteraction);
    document.addEventListener('keydown', startMusicOnInteraction);

    return () => {
      audio.removeEventListener('canplaythrough', handleCanPlay);
      document.removeEventListener('click', startMusicOnInteraction);
      document.removeEventListener('keydown', startMusicOnInteraction);
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

        {selectedGame ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center"
          >
            <div className="w-full max-w-4xl bg-slate-800 rounded-3xl p-4 border-4 border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">{GAMES[selectedGame].name}</h2>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Mic className="w-4 h-4 text-amber-500" />
                  <span>Voice: {GAMES[selectedGame].voiceCommands.join(', ')}</span>
                </div>
              </div>
              <iframe
                ref={iframeRef}
                src={GAMES[selectedGame].src}
                title={GAMES[selectedGame].name}
                className="w-full rounded-2xl"
                style={{ height: '600px', border: 'none' }}
                allow="autoplay"
              />
            </div>
            
            {/* Voice Button for game controls */}
            <VoiceButton
              onCommand={handleVoiceCommand}
              size="large"
              fixed={true}
            />
            
            <div className="mt-6 text-center">
              <LargeButton
                onClick={() => setSelectedGame(null)}
                variant="outline"
                className="border-slate-600 text-white hover:bg-slate-800"
              >
                Back to Games
              </LargeButton>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {/* Game Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-6"
            >
              <h2 className="text-2xl font-bold text-white mb-2">Choose a Game</h2>
              <p className="text-slate-400">Select a game to play solo or with a friend!</p>
            </motion.div>

            {/* Game Cards */}
            <div className="grid md:grid-cols-2 gap-6">
              {Object.values(GAMES).map((game, index) => (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-slate-800 rounded-3xl p-6 border-4 border-slate-700 hover:border-amber-500 transition-all cursor-pointer"
                  onClick={() => setSelectedGame(game.id)}
                >
                  <h3 className="text-2xl font-bold text-white mb-3">{game.name}</h3>
                  <p className="text-slate-300 mb-4 leading-relaxed">{game.description}</p>
                  
                  <div className="space-y-3 mb-4">
                    <div className={`bg-${game.player1.color}-500/20 rounded-xl p-3`}>
                      <span className={`text-${game.player1.color}-400 font-semibold`}>Player 1:</span>
                      <span className="text-slate-300 ml-2">{game.player1.controls}</span>
                    </div>
                    <div className={`bg-${game.player2.color}-500/20 rounded-xl p-3`}>
                      <span className={`text-${game.player2.color}-400 font-semibold`}>Player 2:</span>
                      <span className="text-slate-300 ml-2">{game.player2.controls}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {game.howToPlay.map((tip, i) => (
                      <span key={i} className="bg-slate-700 px-3 py-1 rounded-lg text-sm text-white">
                        {tip}
                      </span>
                    ))}
                  </div>

                  <button className="mt-4 w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2">
                    <Play className="w-5 h-5" />
                    Play Now
                  </button>
                </motion.div>
              ))}
            </div>

            {/* Find Partner Button */}
            <div className="flex justify-center">
              <LargeButton
                onClick={() => navigate(createPageUrl('FindFriends'))}
                variant="secondary"
                icon={Users}
                className="px-8"
              >
                Find a Partner to Play With
              </LargeButton>
            </div>

            {/* Tip */}
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