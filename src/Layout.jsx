import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { appClient } from '@/api/base44Client';
import { Home, Users, Gamepad2, User, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";
import VoiceButton from '@/components/voice/VoiceButton';

export default function Layout({ children, currentPageName }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

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

    // Navigation commands
    if (cmd.includes('home') || cmd.includes('main')) {
      navigate(createPageUrl('Home'));
    } else if (cmd.includes('find') || cmd.includes('friends') || cmd.includes('connect')) {
      navigate(createPageUrl('FindFriends'));
    } else if (cmd.includes('game') || cmd.includes('play')) {
      navigate(createPageUrl('Game'));
    } else if (cmd.includes('profile') || cmd.includes('settings')) {
      navigate(createPageUrl('Profile'));
    } else if (cmd.includes('video') || cmd.includes('call')) {
      navigate(createPageUrl('VideoCall'));
    }
    // Scroll commands
    else if (cmd.includes('scroll up') || cmd.includes('go up')) {
      window.scrollBy({ top: -400, behavior: 'smooth' });
    } else if (cmd.includes('scroll down') || cmd.includes('go down')) {
      window.scrollBy({ top: 400, behavior: 'smooth' });
    } else if (cmd === 'up') {
      window.scrollBy({ top: -300, behavior: 'smooth' });
    } else if (cmd === 'down') {
      window.scrollBy({ top: 300, behavior: 'smooth' });
    } else if (cmd.includes('top') || cmd.includes('beginning')) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (cmd.includes('bottom') || cmd.includes('end')) {
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
      window.history.back();
    }
  }, [navigate]);

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
                Golden Connections
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

      {/* Global Fixed Voice Button - Bottom Left */}
      <VoiceButton 
        onCommand={handleGlobalVoiceCommand}
        size="medium"
        className=""
        fixed={true}
      />
    </div>
  );
}