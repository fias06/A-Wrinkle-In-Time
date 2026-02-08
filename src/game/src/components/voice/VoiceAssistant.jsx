import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';
import VoiceButton from './VoiceButton';
import { cn } from "@/lib/utils";

const ELEVENLABS_API_KEY = 'sk_b2f7e426e2eef8b2f5f0b02d239a744c04068c80bc3c00a0';
const ELEVENLABS_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel - warm, friendly voice

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
  const [audioElement, setAudioElement] = useState(null);

  const speak = useCallback(async (text) => {
    if (isMuted || !text) return Promise.resolve();
    
    setCurrentMessage(text);
    setIsSpeaking(true);

    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY
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

      if (!response.ok) {
        throw new Error('ElevenLabs API error');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      setAudioElement(audio);

      return new Promise((resolve) => {
        audio.onended = () => {
          setIsSpeaking(false);
          setCurrentMessage('');
          URL.revokeObjectURL(audioUrl);
          resolve();
        };

        audio.onerror = () => {
          setIsSpeaking(false);
          setCurrentMessage('');
          URL.revokeObjectURL(audioUrl);
          resolve();
        };

        audio.play().catch(() => {
          // Fallback to browser speech synthesis if audio fails
          fallbackSpeak(text).then(resolve);
        });
      });
    } catch (error) {
      console.error('ElevenLabs TTS error:', error);
      // Fallback to browser speech synthesis
      return fallbackSpeak(text);
    }
  }, [isMuted]);

  // Fallback to browser speech synthesis
  const fallbackSpeak = useCallback((text) => {
    return new Promise((resolve) => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.85;
        utterance.pitch = 1;
        utterance.volume = 1;
        
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
        setIsSpeaking(false);
        setCurrentMessage('');
        resolve();
      }
    });
  }, []);

  useImperativeHandle(ref, () => ({
    speak,
    stopSpeaking: () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      setCurrentMessage('');
    }
  }));

  useEffect(() => {
    // Load voices for fallback
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