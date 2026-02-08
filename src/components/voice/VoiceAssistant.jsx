// @ts-nocheck
import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Mic, MicOff } from 'lucide-react';
import PropTypes from 'prop-types'; // Import PropTypes

const VoiceAssistant = forwardRef(({ greeting, onCommand, compact = false }, ref) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Expose "speak" method to parent
  useImperativeHandle(ref, () => ({
    speak: (text) => speakText(text)
  }));

  // Speak the greeting when it changes (and isn't empty)
  useEffect(() => {
    if (greeting && greeting.trim() !== '') {
      speakText(greeting);
    }
  }, [greeting]);

  const speakText = (text) => {
    if (!text) return;
    
    // Cancel current speech to avoid overlapping
    window.speechSynthesis.cancel();
    setIsSpeaking(true);

    const utterance = new SpeechSynthesisUtterance(text);
    
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const startListening = () => {
    // Check browser support safely
    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;

    if (!SpeechRecognition) {
      alert("Browser does not support voice recognition");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = (event) => {
      const command = event.results[0][0].transcript;
      console.log("Voice Command:", command);
      if (onCommand) {
        onCommand(command);
      }
    };

    recognition.start();
  };

  const stopListening = () => {
    setIsListening(false);
  };

  if (compact) {
    return (
      <button 
        onClick={toggleListening}
        className={`p-2 rounded-full transition-all shadow-lg ${
          isListening ? 'bg-red-500 animate-pulse' : 'bg-slate-700'
        }`}
      >
        {isListening ? <Mic className="w-5 h-5 text-white" /> : <MicOff className="w-5 h-5 text-white" />}
      </button>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
      <button 
        onClick={toggleListening}
        className={`p-4 rounded-full transition-all ${
          isListening ? 'bg-red-500 text-white animate-pulse shadow-red-200' : 'bg-amber-100 text-amber-600'
        }`}
      >
        <Mic size={24} />
      </button>
      <div>
        <p className="font-bold text-slate-700">
          {isListening ? "Listening..." : "Voice Assistant"}
        </p>
        <p className="text-sm text-slate-500">
          {isSpeaking ? "Speaking..." : "Click mic to speak"}
        </p>
      </div>
    </div>
  );
});

// Defines the props so your editor stops complaining
VoiceAssistant.propTypes = {
  greeting: PropTypes.string,
  onCommand: PropTypes.func,
  compact: PropTypes.bool
};

VoiceAssistant.displayName = "VoiceAssistant";
export default VoiceAssistant;