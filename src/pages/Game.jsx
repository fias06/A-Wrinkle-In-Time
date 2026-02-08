import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gamepad2, Users, ArrowLeft, Play, Volume2, VolumeX, Mic } from 'lucide-react';
import { createPageUrl } from '@/utils';
import LargeButton from '@/components/ui/LargeButton';
import VoiceButton from '@/components/voice/VoiceButton';

// ElevenLabs API key from environment
const ELEVEN_LABS_API_KEY = import.meta.env.VITE_ELEVEN_LABS_API_KEY;
const ELEVEN_LABS_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel - warm, friendly voice

// Genre prompts for ElevenLabs sound generation
const GENRE_PROMPTS = {
  pop: 'upbeat happy pop instrumental music, cheerful and energetic',
  rock: 'energetic rock instrumental music with electric guitar',
  jazz: 'smooth relaxing jazz instrumental music, saxophone and piano',
  classical: 'beautiful classical piano music, peaceful and elegant',
  country: 'acoustic country instrumental music with guitar',
  bollywood: 'upbeat bollywood fusion instrumental music',
  lofi: 'chill lofi hip hop beats, relaxing study music',
  electronic: 'electronic synth wave instrumental music',
};

// Fallback music tracks (royalty-free from Pixabay) in case ElevenLabs fails
const FALLBACK_MUSIC = {
  pop: 'https://cdn.pixabay.com/audio/2022/10/25/audio_946bc26c14.mp3',
  rock: 'https://cdn.pixabay.com/audio/2022/03/10/audio_a47e2b1c5f.mp3',
  jazz: 'https://cdn.pixabay.com/audio/2022/08/23/audio_d8c7ac7a2b.mp3',
  classical: 'https://cdn.pixabay.com/audio/2022/02/15/audio_7921e7731b.mp3',
  country: 'https://cdn.pixabay.com/audio/2022/08/02/audio_884fe92c21.mp3',
  bollywood: 'https://cdn.pixabay.com/audio/2022/08/31/audio_419263cb5c.mp3',
  lofi: 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3',
  electronic: 'https://cdn.pixabay.com/audio/2022/04/27/audio_67bcb5ec15.mp3',
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
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speakQueueRef = useRef([]);

  // Browser TTS fallback
  const speakWithBrowserTTS = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  // ElevenLabs text-to-speech function with fallback
  const speakWithElevenLabs = async (text) => {
    if (!text) return;
    
    console.log('🔊 Game speaking:', text);

    if (!ELEVEN_LABS_API_KEY) {
      console.log('⚠️ No API key, using browser TTS');
      speakWithBrowserTTS(text);
      return;
    }

    if (isSpeaking) {
      speakQueueRef.current.push(text);
      return;
    }

    setIsSpeaking(true);
    try {
      console.log('📡 Game calling ElevenLabs API...');
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVEN_LABS_VOICE_ID}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVEN_LABS_API_KEY
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        })
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        console.log('❌ ElevenLabs TTS error, using browser fallback');
        setIsSpeaking(false);
        speakWithBrowserTTS(text);
        return;
      }

      const audioBlob = await response.blob();
      console.log('🎵 Audio blob size:', audioBlob.size);
      
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      // Lower background music while speaking
      if (audioRef.current) audioRef.current.volume = musicVolume * 0.3;

      audio.onended = () => {
        console.log('✅ Audio finished playing');
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        if (audioRef.current) audioRef.current.volume = musicVolume;
        if (speakQueueRef.current.length > 0) {
          const next = speakQueueRef.current.shift();
          speakWithElevenLabs(next);
        }
      };

      audio.onerror = (e) => {
        console.log('❌ Audio error:', e);
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        if (audioRef.current) audioRef.current.volume = musicVolume;
        speakWithBrowserTTS(text);
      };

      console.log('▶️ Attempting to play audio...');
      await audio.play();
      console.log('✅ Audio play started');
    } catch (error) {
      console.log('❌ ElevenLabs speak error:', error);
      setIsSpeaking(false);
      if (audioRef.current) audioRef.current.volume = musicVolume;
      speakWithBrowserTTS(text);
    }
  };

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
        
        // Speak feedback for the action
        const actionFeedback = {
          'left': 'Moving left',
          'right': 'Moving right',
          'up': 'Moving up',
          'down': 'Moving down',
          'shoot': 'Shooting!',
          'drop': 'Dropping piece',
          'rotate': 'Rotating',
          'start': 'Starting game!',
          'pause': 'Game paused',
          'restart': 'Restarting game'
        };
        if (actionFeedback[action]) {
          speakWithElevenLabs(actionFeedback[action]);
        }
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

  // Generate music using ElevenLabs or use fallback
  const generateElevenLabsMusic = async (genre) => {
    try {
      console.log('🎵 Generating music with ElevenLabs for genre:', genre);
      
      // ElevenLabs Sound Effects API
      const response = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': ELEVEN_LABS_API_KEY,
        },
        body: JSON.stringify({
          text: GENRE_PROMPTS[genre] || GENRE_PROMPTS.lofi,
          duration_seconds: 30,
          prompt_influence: 0.5,
        }),
      });

      if (!response.ok) {
        console.log('ElevenLabs API error, using fallback music');
        return FALLBACK_MUSIC[genre] || DEFAULT_MUSIC;
      }

      // Get audio blob and create URL
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      console.log('🎵 ElevenLabs music generated successfully!');
      return audioUrl;
    } catch (error) {
      console.log('ElevenLabs error, using fallback:', error.message);
      return FALLBACK_MUSIC[genre] || DEFAULT_MUSIC;
    }
  };

  // Get music URL (fallback for immediate use)
  const getFallbackMusicUrl = () => {
    return FALLBACK_MUSIC[userGenre] || DEFAULT_MUSIC;
  };

  // Initialize and manage background music
  useEffect(() => {
    let isMounted = true;
    let currentAudio = null;

    const initMusic = async () => {
      // Start with fallback music immediately
      const fallbackUrl = getFallbackMusicUrl();
      const audio = new Audio(fallbackUrl);
      audio.loop = true;
      audio.volume = musicVolume;
      audio.preload = 'auto';
      
      if (!isMounted) return;
      
      audioRef.current = audio;
      currentAudio = audio;

      // Handle when audio can play
      const handleCanPlay = () => {
        if (musicEnabled && audioRef.current && isMounted) {
          audioRef.current.play().catch((e) => {
            console.log('Audio autoplay blocked:', e.message);
          });
        }
      };

      audio.addEventListener('canplaythrough', handleCanPlay);

      // Try playing immediately
      if (musicEnabled) {
        audio.play().catch(() => {
          console.log('Music will play after user interaction');
        });
      }

      // Try to generate ElevenLabs music in background
      try {
        const elevenLabsUrl = await generateElevenLabsMusic(userGenre);
        if (isMounted && elevenLabsUrl && elevenLabsUrl !== fallbackUrl) {
          // Switch to ElevenLabs generated music
          const wasPlaying = !audioRef.current?.paused;
          const currentTime = audioRef.current?.currentTime || 0;
          
          audioRef.current.pause();
          audioRef.current.src = elevenLabsUrl;
          audioRef.current.load();
          
          if (wasPlaying && musicEnabled) {
            audioRef.current.play().catch(() => {});
          }
          console.log('🎵 Switched to ElevenLabs generated music!');
        }
      } catch (e) {
        console.log('Using fallback music');
      }
    };

    initMusic();

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
      isMounted = false;
      document.removeEventListener('click', startMusicOnInteraction);
      document.removeEventListener('keydown', startMusicOnInteraction);
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = '';
      }
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
              <button
                onClick={() => setSelectedGame(null)}
                className="px-8 py-4 text-xl font-bold rounded-2xl border-4 border-amber-500 bg-slate-800 text-amber-400 hover:bg-amber-500 hover:text-white transition-all"
              >
                ← Back to Games
              </button>
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