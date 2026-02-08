import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { cn } from "@/lib/utils";

export default function VoiceButton({ 
  onCommand, 
  size = "medium",
  className,
  fixed = false
}) {
  const [transcript, setTranscript] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const shouldBeListeningRef = useRef(true);
  const restartTimeoutRef = useRef(null);
  const onCommandRef = useRef(onCommand);

  // Keep onCommand ref updated without restarting recognition
  useEffect(() => {
    onCommandRef.current = onCommand;
  }, [onCommand]);

  // Initialize and keep recognition ALWAYS running - only runs ONCE
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.log('Speech recognition not supported');
      return;
    }

    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    
    const createRecognition = () => {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        console.log('🎤 LISTENING - speak now!');
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        setTranscript(interimTranscript || finalTranscript);

        if (finalTranscript) {
          console.log('🗣️ HEARD:', finalTranscript);
          const command = finalTranscript.toLowerCase().trim();
          // Use ref to get latest callback without restarting effect
          onCommandRef.current?.(command);
          setTimeout(() => setTranscript(''), 2000);
        }
      };

      recognition.onend = () => {
        console.log('🎤 Recognition ended, restarting...');
        setIsListening(false);
        
        // ALWAYS restart unless paused
        if (shouldBeListeningRef.current) {
          clearTimeout(restartTimeoutRef.current);
          restartTimeoutRef.current = setTimeout(() => {
            tryStart();
          }, 100);
        }
      };

      recognition.onerror = (event) => {
        console.log('🎤 Error:', event.error);
        setIsListening(false);
        
        // Restart on any error unless paused
        if (shouldBeListeningRef.current) {
          const delay = event.error === 'no-speech' ? 100 : 500;
          clearTimeout(restartTimeoutRef.current);
          restartTimeoutRef.current = setTimeout(() => {
            tryStart();
          }, delay);
        }
      };

      return recognition;
    };

    const tryStart = () => {
      if (!shouldBeListeningRef.current) return;
      
      try {
        if (recognitionRef.current) {
          recognitionRef.current.abort();
        }
      } catch (e) {}
      
      try {
        recognitionRef.current = createRecognition();
        recognitionRef.current.start();
      } catch (e) {
        console.log('Start failed, retrying...', e.message);
        clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = setTimeout(tryStart, 300);
      }
    };

    // Start immediately
    shouldBeListeningRef.current = true;
    tryStart();

    return () => {
      shouldBeListeningRef.current = false;
      clearTimeout(restartTimeoutRef.current);
      try {
        recognitionRef.current?.abort();
      } catch (e) {}
    };
  }, []); // Empty array - only run once on mount

  const togglePause = () => {
    const newPaused = !isPaused;
    setIsPaused(newPaused);
    shouldBeListeningRef.current = !newPaused;

    if (newPaused) {
      // Stop listening
      clearTimeout(restartTimeoutRef.current);
      try {
        recognitionRef.current?.abort();
      } catch (e) {}
      setIsListening(false);
    } else {
      // Resume listening - recreate and start
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      
      const createAndStart = () => {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-US';
          
          recognition.onstart = () => {
            console.log('🎤 RESUMED LISTENING!');
            setIsListening(true);
          };
          
          recognition.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
              if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
              } else {
                interimTranscript += event.results[i][0].transcript;
              }
            }
            setTranscript(interimTranscript || finalTranscript);
            if (finalTranscript) {
              console.log('🗣️ HEARD:', finalTranscript);
              onCommand?.(finalTranscript.toLowerCase().trim());
              setTimeout(() => setTranscript(''), 2000);
            }
          };
          
          recognition.onend = () => {
            setIsListening(false);
            if (shouldBeListeningRef.current) {
              setTimeout(createAndStart, 100);
            }
          };
          
          recognition.onerror = () => {
            setIsListening(false);
            if (shouldBeListeningRef.current) {
              setTimeout(createAndStart, 300);
            }
          };
          
          recognitionRef.current = recognition;
          recognition.start();
        } catch (e) {
          if (shouldBeListeningRef.current) {
            setTimeout(createAndStart, 300);
          }
        }
      };
      
      createAndStart();
    }
  };

  const sizeClasses = {
    small: "w-12 h-12",
    medium: "w-14 h-14",
    large: "w-20 h-20"
  };

  const iconSizes = {
    small: "w-5 h-5",
    medium: "w-6 h-6",
    large: "w-9 h-9"
  };

  const buttonContent = (
    <>
      <button
        onClick={togglePause}
        className={cn(
          "rounded-full flex items-center justify-center transition-all shadow-lg",
          sizeClasses[size],
          isListening && !isPaused
            ? "bg-green-500 hover:bg-green-600 animate-pulse" 
            : isPaused
            ? "bg-gray-400 hover:bg-gray-500"
            : "bg-yellow-500 hover:bg-yellow-600 animate-pulse"
        )}
        aria-label={isPaused ? "Resume listening" : "Pause listening"}
      >
        {isPaused ? (
          <MicOff className={cn("text-white", iconSizes[size])} />
        ) : (
          <Mic className={cn("text-white", iconSizes[size])} />
        )}
      </button>

      {/* Status */}
      <span className={cn(
        "text-xs font-medium whitespace-nowrap",
        isListening && !isPaused ? "text-green-600" : isPaused ? "text-gray-500" : "text-yellow-600"
      )}>
        {isPaused ? "Paused" : isListening ? "Listening..." : "Starting..."}
      </span>

      {/* Transcript bubble */}
      {transcript && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black/90 text-white px-3 py-2 rounded-lg text-sm max-w-[250px] whitespace-nowrap overflow-hidden text-ellipsis">
          🎤 "{transcript}"
        </div>
      )}
    </>
  );

  if (fixed) {
    return (
      <div className="fixed bottom-6 left-6 z-50 flex flex-col items-center gap-1">
        {buttonContent}
      </div>
    );
  }

  return (
    <div className={cn("relative flex flex-col items-center gap-1", className)}>
      {buttonContent}
    </div>
  );
}