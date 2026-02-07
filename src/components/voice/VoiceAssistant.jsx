import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';
import VoiceButton from './VoiceButton';
import { cn } from "@/lib/utils";

const VoiceAssistant = forwardRef(({ 
  onCommand,
  greeting,
  showButton = true,
  className 
}, ref) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isMuted, setIsMuted] = useState(false);

  const speak = useCallback((text) => {
    if (isMuted || !text) return Promise.resolve();
    
    return new Promise((resolve) => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.85;
        utterance.pitch = 1;
        utterance.volume = 1;
        
        // Try to get a friendly voice
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => 
          v.name.includes('Samantha') || 
          v.name.includes('Karen') ||
          v.name.includes('Google UK English Female')
        );
        if (preferredVoice) utterance.voice = preferredVoice;
        
        setCurrentMessage(text);
        setIsSpeaking(true);
        
        utterance.onend = () => {
          setIsSpeaking(false);
          setCurrentMessage('');
          resolve();
        };
        
        utterance.onerror = () => {
          setIsSpeaking(false);
          setCurrentMessage('');
          resolve();
        };
        
        window.speechSynthesis.speak(utterance);
      } else {
        resolve();
      }
    });
  }, [isMuted]);

  useImperativeHandle(ref, () => ({
    speak,
    stopSpeaking: () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      setCurrentMessage('');
    }
  }));

  useEffect(() => {
    // Load voices
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
    
    // Play greeting on mount
    if (greeting) {
      const timer = setTimeout(() => {
        speak(greeting);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [greeting, speak]);

  return (
    <div className={cn("flex flex-col items-center", className)}>
      {/* Speaking indicator */}
      <AnimatePresence>
        {isSpeaking && currentMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="mb-8 max-w-lg mx-auto"
          >
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white px-8 py-6 rounded-3xl shadow-2xl">
              <div className="flex items-start gap-4">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="p-3 bg-amber-500 rounded-full flex-shrink-0"
                >
                  <Volume2 className="w-6 h-6" />
                </motion.div>
                <p className="text-2xl leading-relaxed font-medium">
                  {currentMessage}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice button */}
      {showButton && (
        <VoiceButton
          onCommand={onCommand}
          isListening={isListening}
          setIsListening={setIsListening}
          size="large"
        />
      )}

      {/* Mute toggle */}
      <button
        onClick={() => setIsMuted(!isMuted)}
        className={cn(
          "mt-6 flex items-center gap-2 px-4 py-2 rounded-full transition-all",
          "text-lg font-medium",
          isMuted 
            ? "bg-slate-200 text-slate-600" 
            : "bg-amber-100 text-amber-700"
        )}
        aria-label={isMuted ? "Unmute voice assistant" : "Mute voice assistant"}
      >
        {isMuted ? (
          <>
            <VolumeX className="w-5 h-5" />
            Voice Off
          </>
        ) : (
          <>
            <Volume2 className="w-5 h-5" />
            Voice On
          </>
        )}
      </button>
    </div>
  );
});

VoiceAssistant.displayName = 'VoiceAssistant';

export default VoiceAssistant;