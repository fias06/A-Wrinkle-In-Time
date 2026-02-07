import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, User, Globe, Heart } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
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

const STEPS = [
  { id: 'name', title: 'What should we call you?', icon: User },
  { id: 'interests', title: 'What do you enjoy?', icon: Heart },
  { id: 'language', title: 'What language do you speak?', icon: Globe },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    display_name: '',
    interests: [],
    language: '',
    bio: ''
  });
  const [isLoading, setIsLoading] = useState(false);

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
        const profiles = await base44.entities.UserProfile.list();
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
      // Name step - use the spoken name (but not if it's a command)
      if (!cmd.includes('next') && !cmd.includes('back') && !cmd.includes('up') && !cmd.includes('down')) {
        setFormData(prev => ({ ...prev, display_name: command }));
      }
    } 
    else if (currentStep === 1) {
      // Interests step
      const foundInterest = INTERESTS.find(i => cmd.includes(i.toLowerCase()));
      if (foundInterest) {
        toggleInterest(foundInterest);
      }
    }
    else if (currentStep === 2) {
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
        const existingProfiles = await base44.entities.UserProfile.list();
        if (existingProfiles.length > 0) {
          await base44.entities.UserProfile.update(existingProfiles[0].id, profileData);
        } else {
          await base44.entities.UserProfile.create(profileData);
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
      case 0: return formData.display_name.trim().length > 0;
      case 1: return formData.interests.length > 0;
      case 2: return formData.language.length > 0;
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

            {currentStep === 1 && (
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

            {currentStep === 2 && (
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