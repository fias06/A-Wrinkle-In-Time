import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, User, Globe, Heart } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import VoiceAssistant from '@/components/voice/VoiceAssistant';
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
  const voiceRef = useRef(null);
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
      const profiles = await base44.entities.UserProfile.list();
      if (profiles.length > 0 && profiles[0].onboarding_complete) {
        navigate(createPageUrl('FindFriends'));
      }
    } catch (e) {
      // No profile yet
    }
  };

  const speakCurrentStep = () => {
    const messages = {
      0: "What name would you like your new friends to call you?",
      1: "Select the activities you enjoy. You can pick as many as you like!",
      2: "What language do you prefer to speak? This helps us find friends who speak the same language."
    };
    voiceRef.current?.speak(messages[currentStep]);
  };

  useEffect(() => {
    const timer = setTimeout(speakCurrentStep, 500);
    return () => clearTimeout(timer);
  }, [currentStep]);

  const handleVoiceCommand = (command) => {
    const lower = command.toLowerCase();

    // Navigation commands
    if (lower.includes('next') || lower.includes('continue')) {
      handleNext();
      return;
    }
    if (lower.includes('back') || lower.includes('previous')) {
      handleBack();
      return;
    }

    // Step-specific handling
    if (currentStep === 0) {
      // Name step - use the spoken name
      setFormData(prev => ({ ...prev, display_name: command }));
      voiceRef.current?.speak(`Nice to meet you, ${command}! Say 'next' when you're ready to continue.`);
    } 
    else if (currentStep === 1) {
      // Interests step
      const foundInterest = INTERESTS.find(i => lower.includes(i.toLowerCase()));
      if (foundInterest) {
        toggleInterest(foundInterest);
        voiceRef.current?.speak(`Added ${foundInterest}. Keep adding more or say 'next' to continue.`);
      }
    }
    else if (currentStep === 2) {
      // Language step
      const foundLanguage = LANGUAGES.find(l => lower.includes(l.toLowerCase()));
      if (foundLanguage) {
        setFormData(prev => ({ ...prev, language: foundLanguage }));
        voiceRef.current?.speak(`Great, I've selected ${foundLanguage}. Say 'next' to complete your profile.`);
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
        onboarding_complete: true,
        is_online: true,
        last_active: new Date().toISOString()
      };

      const existingProfiles = await base44.entities.UserProfile.list();
      if (existingProfiles.length > 0) {
        await base44.entities.UserProfile.update(existingProfiles[0].id, profileData);
      } else {
        await base44.entities.UserProfile.create(profileData);
      }

      voiceRef.current?.speak("Wonderful! Your profile is all set. Let's find you some friends!");
      setTimeout(() => {
        navigate(createPageUrl('FindFriends'));
      }, 2000);
    } catch (error) {
      voiceRef.current?.speak("Something went wrong. Let's try again.");
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

        {/* Voice Assistant */}
        <div className="mb-8">
          <VoiceAssistant
            ref={voiceRef}
            onCommand={handleVoiceCommand}
            showButton={true}
          />
        </div>

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