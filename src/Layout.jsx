import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { appClient } from '@/api/appClient';
import { Home, Users, Gamepad2, User, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";
import VoiceButton from '@/components/voice/VoiceButton';

// ElevenLabs configuration
const ELEVEN_LABS_API_KEY = import.meta.env.VITE_ELEVEN_LABS_API_KEY;
const ELEVEN_LABS_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel voice

// Page descriptions for voice announcements
const PAGE_ANNOUNCEMENTS = {
  'Home': 'Welcome to A Wrinkle in Time. Find friends, play games, and connect with others.',
  'FindFriends': 'Find Friends page. Browse and connect with people who share your interests.',
  'Game': 'Play Games. Choose a game to play solo or with a friend.',
  'Profile': 'Your Profile. View and edit your personal information and preferences.',
  'VideoCall': 'Video Call. Connecting you with your friend.',
  'Onboarding': 'Welcome! Let\'s set up your profile.'
};

export default function Layout({ children, currentPageName }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const lastAnnouncedPage = useRef(null);
  const navigate = useNavigate();

  // Fallback to browser speech synthesis
  const speakWithBrowserTTS = useCallback((text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // ElevenLabs text-to-speech function with fallback
  const speakWithElevenLabs = useCallback(async (text) => {
    if (!text) return;
    
    console.log('🔊 Speaking:', text);
    console.log('🔑 API Key exists:', !!ELEVEN_LABS_API_KEY);

    // If no API key or already speaking, use browser fallback
    if (!ELEVEN_LABS_API_KEY) {
      console.log('⚠️ No API key, using browser TTS');
      speakWithBrowserTTS(text);
      return;
    }

    if (isSpeaking) {
      console.log('⚠️ Already speaking, skipping');
      return;
    }

    setIsSpeaking(true);
    try {
      console.log('📡 Calling ElevenLabs API...');
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
        console.log('❌ ElevenLabs API error, using browser TTS fallback');
        setIsSpeaking(false);
        speakWithBrowserTTS(text);
        return;
      }

      const audioBlob = await response.blob();
      console.log('🎵 Audio blob size:', audioBlob.size);
      
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      audio.onended = () => {
        console.log('✅ Audio finished playing');
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = (e) => {
        console.log('❌ Audio error:', e);
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        speakWithBrowserTTS(text);
      };

      audio.oncanplaythrough = () => {
        console.log('🎵 Audio ready to play');
      };

      console.log('▶️ Attempting to play audio...');
      await audio.play();
      console.log('✅ Audio play started');
    } catch (error) {
      console.log('❌ ElevenLabs speak error:', error);
      setIsSpeaking(false);
      speakWithBrowserTTS(text);
    }
  }, [isSpeaking, speakWithBrowserTTS]);

  // Announce page when it changes (only for voice-navigated pages)
  const announceAndNavigate = useCallback((pageName) => {
    const announcement = PAGE_ANNOUNCEMENTS[pageName] || `Navigating to ${pageName}`;
    speakWithElevenLabs(announcement);
    navigate(createPageUrl(pageName));
  }, [navigate, speakWithElevenLabs]);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const auth = await appClient.auth.isAuthenticated();
    setIsAuthenticated(auth);
  };

  // Global voice command handler
  const handleGlobalVoiceCommand = useCallback((command) => {
    const cmd = command.toLowerCase();
    console.log('🎤 Global command:', cmd);

    // Navigation commands with voice announcements
    if (cmd.includes('home') || cmd.includes('main')) {
      announceAndNavigate('Home');
    } else if (cmd.includes('find') || cmd.includes('friends') || cmd.includes('connect')) {
      announceAndNavigate('FindFriends');
    } else if (cmd.includes('game') || cmd.includes('play')) {
      announceAndNavigate('Game');
    } else if (cmd.includes('profile') || cmd.includes('settings')) {
      announceAndNavigate('Profile');
    } else if (cmd.includes('video') || cmd.includes('call')) {
      announceAndNavigate('VideoCall');
    }
    // Scroll commands
    else if (cmd.includes('scroll up') || cmd.includes('go up')) {
      speakWithElevenLabs('Scrolling up');
      window.scrollBy({ top: -400, behavior: 'smooth' });
    } else if (cmd.includes('scroll down') || cmd.includes('go down')) {
      speakWithElevenLabs('Scrolling down');
      window.scrollBy({ top: 400, behavior: 'smooth' });
    } else if (cmd === 'up') {
      window.scrollBy({ top: -300, behavior: 'smooth' });
    } else if (cmd === 'down') {
      window.scrollBy({ top: 300, behavior: 'smooth' });
    } else if (cmd.includes('top') || cmd.includes('beginning')) {
      speakWithElevenLabs('Going to top of page');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (cmd.includes('bottom') || cmd.includes('end')) {
      speakWithElevenLabs('Going to bottom of page');
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
    // Click commands
    else if (cmd.includes('click') || cmd.includes('press') || cmd.includes('tap')) {
      const buttons = document.querySelectorAll('button, a, [role="button"]');
      for (const btn of buttons) {
        const text = btn.textContent?.toLowerCase() || '';
        const label = btn.getAttribute('aria-label')?.toLowerCase() || '';
        if (text.includes(cmd.replace(/click|press|tap/g, '').trim()) ||
            label.includes(cmd.replace(/click|press|tap/g, '').trim())) {
          btn.click();
          return;
        }
      }
    }
    // Back command
    else if (cmd.includes('back') || cmd.includes('previous')) {
      speakWithElevenLabs('Going back');
      window.history.back();
    }
    // Help command - read current page info
    else if (cmd.includes('help') || cmd.includes('where am i') || cmd.includes('what page')) {
      const announcement = PAGE_ANNOUNCEMENTS[currentPageName] || `You are on the ${currentPageName} page`;
      speakWithElevenLabs(announcement);
    }
  }, [announceAndNavigate, speakWithElevenLabs, currentPageName]);

  // Pages without navigation
  const hideNav = ['VideoCall', 'Onboarding'].includes(currentPageName);

  const navItems = [
    { name: 'Home', icon: Home, page: 'Home' },
    { name: 'Online Friends', icon: Users, page: 'FindFriends' },
    { name: 'Play Games', icon: Gamepad2, page: 'Game' },
    { name: 'My Profile', icon: User, page: 'Profile' },
  ];

  if (hideNav) {
    return <main>{children}</main>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-amber-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white/80 backdrop-blur-md border-b-4 border-amber-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link 
              to={createPageUrl('Home')}
              className="flex items-center gap-3"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg">
                <span className="text-2xl">🌟</span>
              </div>
              <span className="text-2xl font-bold text-slate-800 hidden sm:block">
                A Wrinkle in Time
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  className={cn(
                    "flex items-center gap-2 px-5 py-3 rounded-xl text-lg font-medium transition-all",
                    currentPageName === item.page
                      ? "bg-amber-100 text-amber-700"
                      : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="w-7 h-7 text-slate-700" />
              ) : (
                <Menu className="w-7 h-7 text-slate-700" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t-2 border-amber-100 bg-white"
            >
              <div className="p-4 space-y-2">
                {navItems.map((item) => (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    onClick={() => setIsMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-4 px-6 py-4 rounded-xl text-xl font-medium transition-all",
                      currentPageName === item.page
                        ? "bg-amber-100 text-amber-700"
                        : "text-slate-600 hover:bg-slate-100"
                    )}
                  >
                    <item.icon className="w-7 h-7" />
                    {item.name}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Main Content */}
      <main>{children}</main>

      {/* Bottom Navigation (Mobile) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-4 border-amber-100 px-4 py-3 z-50">
        <div className="flex justify-around">
          {navItems.slice(0, 4).map((item) => (
            <Link
              key={item.page}
              to={createPageUrl(item.page)}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all",
                currentPageName === item.page
                  ? "text-amber-600"
                  : "text-slate-500"
              )}
            >
              <item.icon className={cn(
                "w-7 h-7",
                currentPageName === item.page && "text-amber-500"
              )} />
              <span className="text-sm font-medium">{item.name.split(' ')[0]}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Spacer for bottom nav on mobile */}
      <div className="md:hidden h-24" />

      {/* Global Fixed Voice Button - Bottom Left (hidden on Game page which has its own) */}
      {currentPageName !== 'Game' && (
        <VoiceButton 
          onCommand={handleGlobalVoiceCommand}
          size="medium"
          className=""
          fixed={true}
        />
      )}
    </div>
  );
}