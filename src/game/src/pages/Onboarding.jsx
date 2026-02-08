import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, User, Globe, Heart, Music, Camera, RefreshCw } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { appClient } from '@/api/base44Client';
import VoiceButton from '@/components/voice/VoiceButton';
import LargeButton from '@/components/ui/LargeButton';
import InterestTag from '@/components/matching/InterestTag';
import AccessibleCard from '@/components/ui/AccessibleCard';
import { Input } from "@/components/ui/input";

const INTERESTS = [
  'Gardening', 'Chess', 'History', 'Music', 'Cooking',
  'Travel', 'Photography', 'Reading', 'Art', 'Nature',
  'Movies', 'Knitting', 'Puzzles', 'Walking', 'Birdwatching',
  'Fishing', 'Cards', 'Dancing', 'Crafts', 'Pets'
];

const LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Italian',
  'Portuguese', 'Chinese', 'Japanese', 'Korean', 'Arabic',
  'Hindi', 'Russian', 'Dutch', 'Polish', 'Swedish'
];

const MUSIC_GENRES = [
  { id: 'pop', name: 'Pop', emoji: '🎵' },
  { id: 'rock', name: 'Rock', emoji: '🎸' },
  { id: 'jazz', name: 'Jazz', emoji: '🎷' },
  { id: 'classical', name: 'Classical', emoji: '🎻' },
  { id: 'country', name: 'Country', emoji: '🤠' },
  { id: 'bollywood', name: 'Bollywood', emoji: '💃' },
  { id: 'lofi', name: 'Lo-Fi / Chill', emoji: '☕' },
  { id: 'electronic', name: 'Electronic', emoji: '🎧' },
];

const STEPS = [
  { id: 'photo', title: 'Let\'s create your avatar!', icon: Camera },
  { id: 'name', title: 'What should we call you?', icon: User },
  { id: 'interests', title: 'What do you enjoy?', icon: Heart },
  { id: 'music', title: 'What music do you like?', icon: Music },
  { id: 'language', title: 'What language do you speak?', icon: Globe },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    display_name: '',
    interests: [],
    music_genre: '',
    language: '',
    bio: '',
    avatar_url: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  
  // Camera state
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [cartoonAvatar, setCartoonAvatar] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const streamRef = useRef(null);

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 640, height: 480 } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      console.error('Camera error:', err);
      alert('Could not access camera. Please allow camera permissions.');
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Apply cartoon/caricature effect
  const applyCartoonEffect = (imageData) => {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    // Step 1: Posterize (reduce colors)
    const levels = 6;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.round(data[i] / (256 / levels)) * (256 / levels);     // R
      data[i + 1] = Math.round(data[i + 1] / (256 / levels)) * (256 / levels); // G
      data[i + 2] = Math.round(data[i + 2] / (256 / levels)) * (256 / levels); // B
    }
    
    // Step 2: Increase saturation and add warm tint for cartoon look
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Convert to HSL-like boost
      const avg = (r + g + b) / 3;
      const boost = 1.4;
      
      data[i] = Math.min(255, avg + (r - avg) * boost + 15);     // R with warm tint
      data[i + 1] = Math.min(255, avg + (g - avg) * boost + 5);  // G
      data[i + 2] = Math.min(255, avg + (b - avg) * boost - 10); // B slightly reduced
    }
    
    // Step 3: Edge enhancement for cartoon outline effect
    const tempData = new Uint8ClampedArray(data);
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        
        // Simple edge detection
        const leftIdx = (y * width + (x - 1)) * 4;
        const rightIdx = (y * width + (x + 1)) * 4;
        const topIdx = ((y - 1) * width + x) * 4;
        const bottomIdx = ((y + 1) * width + x) * 4;
        
        const gx = Math.abs(tempData[rightIdx] - tempData[leftIdx]);
        const gy = Math.abs(tempData[bottomIdx] - tempData[topIdx]);
        const edge = gx + gy;
        
        // Darken edges
        if (edge > 30) {
          const darkFactor = Math.min(1, edge / 100);
          data[idx] = Math.max(0, data[idx] - 50 * darkFactor);
          data[idx + 1] = Math.max(0, data[idx + 1] - 50 * darkFactor);
          data[idx + 2] = Math.max(0, data[idx + 2] - 50 * darkFactor);
        }
      }
    }
    
    return imageData;
  };

  // Capture photo and create cartoon avatar
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsProcessing(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = 300;
    canvas.height = 300;
    
    // Calculate crop for square (center crop)
    const size = Math.min(video.videoWidth, video.videoHeight);
    const startX = (video.videoWidth - size) / 2;
    const startY = (video.videoHeight - size) / 2;
    
    // Draw cropped and scaled video frame
    ctx.drawImage(video, startX, startY, size, size, 0, 0, 300, 300);
    
    // Save original capture
    const originalDataUrl = canvas.toDataURL('image/png');
    setCapturedPhoto(originalDataUrl);
    
    // Apply cartoon effect
    const imageData = ctx.getImageData(0, 0, 300, 300);
    const cartoonImageData = applyCartoonEffect(imageData);
    ctx.putImageData(cartoonImageData, 0, 0);
    
    // Add circular mask with border
    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    ctx.arc(150, 150, 145, 0, Math.PI * 2);
    ctx.fill();
    
    // Add colorful border
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(150, 150, 145, 0, Math.PI * 2);
    ctx.stroke();
    
    // Get final cartoon avatar
    const cartoonDataUrl = canvas.toDataURL('image/png');
    setCartoonAvatar(cartoonDataUrl);
    setFormData(prev => ({ ...prev, avatar_url: cartoonDataUrl }));
    
    setIsProcessing(false);
    stopCamera();
  };

  // Retake photo
  const retakePhoto = () => {
    setCapturedPhoto(null);
    setCartoonAvatar(null);
    setFormData(prev => ({ ...prev, avatar_url: '' }));
    startCamera();
  };

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Auto-start camera when on photo step
  useEffect(() => {
    if (currentStep === 0 && !cartoonAvatar) {
      startCamera();
    } else if (currentStep !== 0) {
      stopCamera();
    }
  }, [currentStep]);

  useEffect(() => {
    loadExistingProfile();
  }, []);

  const loadExistingProfile = async () => {
    try {
      // Check localStorage first for offline support
      const localProfile = localStorage.getItem('userProfile');
      if (localProfile) {
        const profile = JSON.parse(localProfile);
        if (profile.onboarding_complete) {
          navigate(createPageUrl('FindFriends'));
          return;
        }
      }
      
      // Try to load from backend if available
      try {
        const profiles = await appClient.entities.UserProfile.list();
        if (profiles.length > 0 && profiles[0].onboarding_complete) {
          localStorage.setItem('userProfile', JSON.stringify(profiles[0]));
          navigate(createPageUrl('FindFriends'));
        }
      } catch (e) {
        // Backend not available, continue with local storage
      }
    } catch (e) {
      // No profile yet
    }
  };

  useEffect(() => {
    // Can add TTS later if needed
  }, [currentStep]);

  const handleVoiceCommand = (command) => {
    const cmd = command.toLowerCase();
    console.log('Voice command:', cmd);

    // Navigation commands
    if (cmd.includes('next') || cmd.includes('continue') || cmd.includes('done')) {
      handleNext();
      return;
    }
    if (cmd.includes('back') || cmd.includes('previous')) {
      handleBack();
      return;
    }
    if (cmd.includes('home')) {
      navigate(createPageUrl('Home'));
      return;
    }

    // Scroll commands
    if (cmd.includes('go up') || cmd.includes('scroll up') || cmd === 'up') {
      window.scrollBy({ top: -300, behavior: 'smooth' });
      return;
    }
    if (cmd.includes('go down') || cmd.includes('scroll down') || cmd === 'down') {
      window.scrollBy({ top: 300, behavior: 'smooth' });
      return;
    }

    // Step-specific handling
    if (currentStep === 0) {
      // Photo step - voice commands for capture
      if (cmd.includes('capture') || cmd.includes('take') || cmd.includes('photo') || cmd.includes('picture') || cmd.includes('cheese')) {
        capturePhoto();
      } else if (cmd.includes('retake') || cmd.includes('again') || cmd.includes('redo')) {
        retakePhoto();
      }
    }
    else if (currentStep === 1) {
      // Name step - use the spoken name (but not if it's a command)
      if (!cmd.includes('next') && !cmd.includes('back') && !cmd.includes('up') && !cmd.includes('down')) {
        setFormData(prev => ({ ...prev, display_name: command }));
      }
    } 
    else if (currentStep === 2) {
      // Interests step
      const foundInterest = INTERESTS.find(i => cmd.includes(i.toLowerCase()));
      if (foundInterest) {
        toggleInterest(foundInterest);
      }
    }
    else if (currentStep === 3) {
      // Music genre step
      const foundGenre = MUSIC_GENRES.find(g => cmd.includes(g.name.toLowerCase()) || cmd.includes(g.id));
      if (foundGenre) {
        setFormData(prev => ({ ...prev, music_genre: foundGenre.id }));
      }
    }
    else if (currentStep === 4) {
      // Language step
      const foundLanguage = LANGUAGES.find(l => cmd.includes(l.toLowerCase()));
      if (foundLanguage) {
        setFormData(prev => ({ ...prev, language: foundLanguage }));
      }
    }
  };

  const toggleInterest = (interest) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleNext = async () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      await saveProfile();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const saveProfile = async () => {
    setIsLoading(true);
    try {
      const profileData = {
        ...formData,
        id: Date.now().toString(),
        onboarding_complete: true,
        is_online: true,
        last_active: new Date().toISOString()
      };

      // Save to localStorage for offline support
      localStorage.setItem('userProfile', JSON.stringify(profileData));

      // Try to save to backend if available
      try {
        const existingProfiles = await appClient.entities.UserProfile.list();
        if (existingProfiles.length > 0) {
          await appClient.entities.UserProfile.update(existingProfiles[0].id, profileData);
        } else {
          await appClient.entities.UserProfile.create(profileData);
        }
      } catch (e) {
        // Backend not available, but we saved to localStorage so continue
        console.log('Backend not available, using local storage');
      }

      setTimeout(() => {
        navigate(createPageUrl('FindFriends'));
      }, 1000);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return cartoonAvatar !== null; // Photo step - need avatar
      case 1: return formData.display_name.trim().length > 0;
      case 2: return formData.interests.length > 0;
      case 3: return formData.music_genre.length > 0;
      case 4: return formData.language.length > 0;
      default: return true;
    }
  };

  const CurrentIcon = STEPS[currentStep].icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-amber-50 py-8 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between mb-4">
            {STEPS.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center justify-center w-14 h-14 rounded-full text-xl font-bold transition-all ${
                  index <= currentStep
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-200 text-slate-400'
                }`}
              >
                {index < currentStep ? (
                  <Check className="w-7 h-7" />
                ) : (
                  index + 1
                )}
              </div>
            ))}
          </div>
          <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-amber-500"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="mb-8"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 mb-4">
                <CurrentIcon className="w-10 h-10 text-amber-600" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-800">
                {STEPS[currentStep].title}
              </h2>
            </div>

            {/* Step-specific content */}
            {currentStep === 0 && (
              <div className="flex flex-col items-center">
                <canvas ref={canvasRef} className="hidden" />
                
                {!cartoonAvatar ? (
                  <>
                    {/* Camera View */}
                    <div className="relative w-72 h-72 rounded-full overflow-hidden border-8 border-amber-300 shadow-2xl mb-6 bg-slate-800">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover scale-125"
                        style={{ transform: 'scaleX(-1)' }}
                      />
                      {!cameraActive && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                          <Camera className="w-20 h-20 text-slate-500" />
                        </div>
                      )}
                    </div>
                    
                    <p className="text-center text-lg text-slate-600 mb-6">
                      Position your face in the circle and tap capture!
                    </p>
                    
                    <LargeButton
                      onClick={capturePhoto}
                      variant="primary"
                      icon={Camera}
                      disabled={!cameraActive || isProcessing}
                    >
                      {isProcessing ? 'Creating Avatar...' : 'Capture Photo'}
                    </LargeButton>
                    
                    <p className="text-center text-slate-500 mt-4">
                      Or say "cheese" or "capture"
                    </p>
                  </>
                ) : (
                  <>
                    {/* Show cartoon avatar */}
                    <div className="relative mb-6">
                      <img
                        src={cartoonAvatar}
                        alt="Your cartoon avatar"
                        className="w-72 h-72 rounded-full shadow-2xl"
                      />
                      <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white px-4 py-2 rounded-full text-lg font-bold">
                        ✨ Your Avatar!
                      </div>
                    </div>
                    
                    <p className="text-center text-xl text-slate-700 font-medium mb-4">
                      Looking great! This will be your profile picture.
                    </p>
                    
                    <LargeButton
                      onClick={retakePhoto}
                      variant="outline"
                      icon={RefreshCw}
                    >
                      Retake Photo
                    </LargeButton>
                  </>
                )}
              </div>
            )}

            {currentStep === 1 && (
              <div className="max-w-md mx-auto">
                <Input
                  type="text"
                  value={formData.display_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                  placeholder="Your name"
                  className="text-2xl p-6 h-auto text-center border-4 border-slate-200 focus:border-amber-400 rounded-2xl"
                  aria-label="Enter your name"
                />
                <p className="text-center text-lg text-slate-500 mt-4">
                  Or say your name into the microphone below
                </p>
              </div>
            )}

            {currentStep === 2 && (
              <div>
                <p className="text-center text-lg text-slate-600 mb-6">
                  Tap your interests or say them aloud (selected: {formData.interests.length})
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  {INTERESTS.map((interest) => (
                    <InterestTag
                      key={interest}
                      interest={interest}
                      selected={formData.interests.includes(interest)}
                      onClick={() => toggleInterest(interest)}
                    />
                  ))}
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div>
                <p className="text-center text-lg text-slate-600 mb-6">
                  Choose your favorite music for games! Or say it aloud.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
                  {MUSIC_GENRES.map((genre) => (
                    <AccessibleCard
                      key={genre.id}
                      selected={formData.music_genre === genre.id}
                      onClick={() => setFormData(prev => ({ ...prev, music_genre: genre.id }))}
                      ariaLabel={genre.name}
                      className="text-center py-6"
                    >
                      <span className="text-4xl mb-2 block">{genre.emoji}</span>
                      <span className="text-lg font-semibold">{genre.name}</span>
                    </AccessibleCard>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div>
                <p className="text-center text-lg text-slate-600 mb-6">
                  Tap your preferred language or say it aloud
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                  {LANGUAGES.map((language) => (
                    <AccessibleCard
                      key={language}
                      selected={formData.language === language}
                      onClick={() => setFormData(prev => ({ ...prev, language }))}
                      ariaLabel={language}
                      className="text-center"
                    >
                      <span className="text-xl font-semibold">{language}</span>
                    </AccessibleCard>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Voice Button - Fixed bottom left */}
        <VoiceButton
          onCommand={handleVoiceCommand}
          size="medium"
          fixed={true}
        />

        {/* Navigation Buttons */}
        <div className="flex justify-between gap-4">
          <LargeButton
            onClick={handleBack}
            variant="outline"
            disabled={currentStep === 0}
            icon={ArrowLeft}
          >
            Back
          </LargeButton>

          <LargeButton
            onClick={handleNext}
            variant="primary"
            disabled={!canProceed() || isLoading}
            icon={currentStep === STEPS.length - 1 ? Check : ArrowRight}
          >
            {isLoading ? 'Saving...' : currentStep === STEPS.length - 1 ? 'Complete' : 'Next'}
          </LargeButton>
        </div>
      </div>
    </div>
  );
}