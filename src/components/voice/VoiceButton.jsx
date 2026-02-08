import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { ELEVENLABS_API_KEY } from '@/lib/elevenlabs';

const ELEVENLABS_STT_URL = 'https://api.elevenlabs.io/v1/speech-to-text';

export default function VoiceButton({
  onCommand,
  size = "medium",
  className,
  fixed = false,
}) {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const onCommandRef = useRef(onCommand);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

  onCommandRef.current = onCommand;

  const startRecording = useCallback(async () => {
    if (!ELEVENLABS_API_KEY) {
      setErrorMessage('Set VITE_ELEVENLABS_API_KEY in .env');
      return;
    }
    setErrorMessage('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        try {
          streamRef.current?.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        } catch (e) {}
        if (chunksRef.current.length === 0) {
          setIsListening(false);
          setIsTranscribing(false);
          return;
        }
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setIsTranscribing(true);
        try {
          const formData = new FormData();
          formData.append('file', blob, 'recording.webm');
          formData.append('model_id', 'scribe_v2');
          const res = await fetch(ELEVENLABS_STT_URL, {
            method: 'POST',
            headers: {
              'xi-api-key': ELEVENLABS_API_KEY,
            },
            body: formData,
          });
          if (!res.ok) {
            const errText = await res.text();
            throw new Error(errText || res.statusText);
          }
          const data = await res.json();
          const text = (data.text || '').trim();
          if (text) {
            setTranscript(text);
            onCommandRef.current?.(text.toLowerCase());
            setTimeout(() => setTranscript(''), 3000);
          }
        } catch (e) {
          console.warn('ElevenLabs STT error:', e);
          setErrorMessage(e?.message?.slice(0, 50) || 'Transcription failed');
        } finally {
          setIsTranscribing(false);
          setIsListening(false);
        }
      };
      mediaRecorderRef.current = recorder;
      recorder.start(100);
      setIsListening(true);
      setIsActive(true);
    } catch (e) {
      console.warn('Mic access error:', e);
      setErrorMessage('Microphone access denied');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
  }, []);

  const togglePause = useCallback(() => {
    if (!ELEVENLABS_API_KEY) return;
    if (!isActive) {
      startRecording();
      return;
    }
    if (isListening) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isActive, isListening, startRecording, stopRecording]);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  if (!ELEVENLABS_API_KEY) {
    return (
      <div className={cn("flex flex-col items-center gap-1", fixed && "fixed bottom-6 left-6 z-50")}>
        <div className="w-14 h-14 rounded-full bg-slate-200 flex items-center justify-center">
          <Mic className="w-6 h-6 text-slate-500" />
        </div>
        <span className="text-xs text-slate-500 max-w-[140px] text-center">
          Add VITE_ELEVENLABS_API_KEY to .env for voice
        </span>
      </div>
    );
  }

  const sizeClasses = { small: "w-12 h-12", medium: "w-14 h-14", large: "w-20 h-20" };
  const iconSizes = { small: "w-5 h-5", medium: "w-6 h-6", large: "w-9 h-9" };

  const statusText = errorMessage
    ? errorMessage
    : isTranscribing
    ? "Transcribing…"
    : !isActive
    ? "Tap to record, tap again to send"
    : isListening
    ? "Recording… tap again to stop"
    : "Tap to start again";

  const buttonContent = (
    <>
      <button
        type="button"
        onClick={togglePause}
        disabled={isTranscribing}
        className={cn(
          "rounded-full flex items-center justify-center transition-all shadow-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 disabled:opacity-70",
          sizeClasses[size],
          isListening
            ? "bg-red-500 hover:bg-red-600"
            : isTranscribing
            ? "bg-amber-400"
            : isActive && !isListening
            ? "bg-slate-400 hover:bg-slate-500"
            : "bg-amber-500 hover:bg-amber-600 hover:scale-105"
        )}
        aria-label={!isActive ? "Start voice" : isListening ? "Stop recording" : "Start again"}
      >
        {isTranscribing ? (
          <Loader2 className={cn("text-white animate-spin", iconSizes[size])} />
        ) : isActive && !isListening ? (
          <MicOff className={cn("text-white", iconSizes[size])} />
        ) : (
          <Mic className={cn("text-white", iconSizes[size])} />
        )}
      </button>
      <span
        className={cn(
          "text-xs font-medium whitespace-nowrap max-w-[140px] text-center",
          isListening ? "text-red-600" : isTranscribing ? "text-amber-700" : isActive && !isListening ? "text-slate-500" : "text-amber-700"
        )}
      >
        {statusText}
      </span>
      {transcript && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black/90 text-white px-3 py-2 rounded-lg text-sm max-w-[250px] whitespace-nowrap overflow-hidden text-ellipsis">
          🎤 &quot;{transcript}&quot;
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
