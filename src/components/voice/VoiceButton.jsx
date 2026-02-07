import React, { useState, useEffect, useCallback } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";

export default function VoiceButton({ 
  onCommand, 
  isListening, 
  setIsListening,
  size = "large",
  className 
}) {
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event) => {
        const current = event.resultIndex;
        const result = event.results[current];
        const text = result[0].transcript;
        setTranscript(text);
        
        if (result.isFinal) {
          onCommand?.(text.toLowerCase().trim());
          setTranscript('');
        }
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      recognitionInstance.onerror = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }
  }, [onCommand, setIsListening]);

  const toggleListening = useCallback(() => {
    if (!recognition) return;
    
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  }, [recognition, isListening, setIsListening]);

  const sizeClasses = {
    small: "w-16 h-16",
    medium: "w-20 h-20",
    large: "w-28 h-28"
  };

  const iconSizes = {
    small: "w-7 h-7",
    medium: "w-9 h-9",
    large: "w-12 h-12"
  };

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <motion.button
        onClick={toggleListening}
        className={cn(
          "relative rounded-full flex items-center justify-center transition-all",
          "focus:outline-none focus:ring-4 focus:ring-amber-400 focus:ring-offset-4",
          sizeClasses[size],
          isListening 
            ? "bg-gradient-to-br from-rose-500 to-rose-600 shadow-2xl shadow-rose-500/50" 
            : "bg-gradient-to-br from-amber-500 to-amber-600 shadow-xl shadow-amber-500/40 hover:shadow-2xl hover:shadow-amber-500/50"
        )}
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.05 }}
        aria-label={isListening ? "Stop listening" : "Start voice command"}
      >
        {/* Pulsing rings when listening */}
        <AnimatePresence>
          {isListening && (
            <>
              <motion.div
                initial={{ scale: 1, opacity: 0.6 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute inset-0 rounded-full bg-rose-400"
              />
              <motion.div
                initial={{ scale: 1, opacity: 0.4 }}
                animate={{ scale: 1.8, opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                className="absolute inset-0 rounded-full bg-rose-400"
              />
            </>
          )}
        </AnimatePresence>

        {isListening ? (
          <MicOff className={cn("text-white relative z-10", iconSizes[size])} />
        ) : (
          <Mic className={cn("text-white relative z-10", iconSizes[size])} />
        )}
      </motion.button>

      {/* Transcript display */}
      <AnimatePresence>
        {transcript && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-slate-800 text-white px-6 py-3 rounded-2xl text-xl font-medium shadow-lg"
          >
            "{transcript}"
          </motion.div>
        )}
      </AnimatePresence>

      {/* Helper text */}
      <p className={cn(
        "text-center font-medium",
        size === "large" ? "text-xl" : "text-lg",
        isListening ? "text-rose-600" : "text-slate-600"
      )}>
        {isListening ? "I'm listening..." : "Tap to speak"}
      </p>
    </div>
  );
}