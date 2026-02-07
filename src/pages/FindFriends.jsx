import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, RefreshCw, Filter, Users, Loader2 } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import VoiceAssistant from '@/components/voice/VoiceAssistant';
import UserCard from '@/components/matching/UserCard';
import LargeButton from '@/components/ui/LargeButton';
import InterestTag from '@/components/matching/InterestTag';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

// Mock profiles for demo when backend is not available
const MOCK_PROFILES = [
  {
    id: 'mock1',
    display_name: 'Margaret',
    interests: ['Gardening', 'Reading', 'Cooking', 'Nature'],
    language: 'English',
    bio: 'Love spending time in my garden and trying new recipes!',
    onboarding_complete: true,
    is_online: true
  },
  {
    id: 'mock2',
    display_name: 'Robert',
    interests: ['Chess', 'History', 'Reading', 'Music'],
    language: 'English',
    bio: 'Retired teacher who loves a good chess match.',
    onboarding_complete: true,
    is_online: true
  },
  {
    id: 'mock3',
    display_name: 'Helen',
    interests: ['Knitting', 'Cooking', 'Music', 'Pets'],
    language: 'English',
    bio: 'Passionate about crafts and my two cats!',
    onboarding_complete: true,
    is_online: false
  },
  {
    id: 'mock4',
    display_name: 'James',
    interests: ['Photography', 'Travel', 'Nature', 'Birdwatching'],
    language: 'English',
    bio: 'Amateur photographer who loves wildlife.',
    onboarding_complete: true,
    is_online: true
  },
  {
    id: 'mock5',
    display_name: 'Patricia',
    interests: ['Dancing', 'Music', 'Movies', 'Art'],
    language: 'Spanish',
    bio: 'Former dance instructor. Love classic films!',
    onboarding_complete: true,
    is_online: true
  }
];

export default function FindFriends() {
  const navigate = useNavigate();
  const voiceRef = useRef(null);
  const [selectedInterestFilter, setSelectedInterestFilter] = useState([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const { data: myProfile } = useQuery({
    queryKey: ['myProfile'],
    queryFn: async () => {
      // Try localStorage first
      const localProfile = localStorage.getItem('userProfile');
      if (localProfile) {
        return JSON.parse(localProfile);
      }
      
      // Try backend
      try {
        const profiles = await base44.entities.UserProfile.list();
        return profiles[0] || null;
      } catch (e) {
        return null;
      }
    }
  });

  const { data: allProfiles, isLoading, refetch } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      try {
        const profiles = await base44.entities.UserProfile.filter({ onboarding_complete: true });
        return profiles.length > 0 ? profiles : MOCK_PROFILES;
      } catch (e) {
        // Backend not available, use mock data
        return MOCK_PROFILES;
      }
    }
  });

  // Calculate matches with compatibility scores
  const matches = React.useMemo(() => {
    if (!allProfiles || !myProfile) return [];
    
    return allProfiles
      .filter(p => p.id !== myProfile.id)
      .map(profile => {
        const sharedInterests = (profile.interests || []).filter(
          i => (myProfile.interests || []).includes(i)
        );
        const languageMatch = profile.language === myProfile.language;
        const interestScore = sharedInterests.length * 15;
        const languageScore = languageMatch ? 30 : 0;
        const compatibilityScore = Math.min(100, interestScore + languageScore + 20);

        return {
          ...profile,
          sharedInterests,
          compatibilityScore
        };
      })
      .filter(p => {
        if (selectedInterestFilter.length === 0) return true;
        return selectedInterestFilter.some(i => (p.interests || []).includes(i));
      })
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore);
  }, [allProfiles, myProfile, selectedInterestFilter]);

  const handleVoiceCommand = (command) => {
    const lower = command.toLowerCase();

    if (lower.includes('refresh') || lower.includes('new')) {
      refetch();
      voiceRef.current?.speak("Looking for new friends...");
    } else if (lower.includes('filter')) {
      setIsFilterOpen(true);
      voiceRef.current?.speak("What interests would you like to filter by?");
    } else if (lower.includes('call') || lower.includes('first')) {
      if (matches.length > 0) {
        handleCall(matches[0]);
      }
    } else if (lower.includes('home')) {
      navigate(createPageUrl('Home'));
    } else {
      // Check if mentioning a name
      const mentionedUser = matches.find(m => 
        lower.includes(m.display_name?.toLowerCase())
      );
      if (mentionedUser) {
        handleCall(mentionedUser);
      } else {
        voiceRef.current?.speak(`I found ${matches.length} potential friends. Say a name to call them, or 'filter' to narrow down.`);
      }
    }
  };

  const handleCall = (user) => {
    voiceRef.current?.speak(`Starting a call with ${user.display_name}...`);
    navigate(createPageUrl('VideoCall') + `?userId=${user.id}&userName=${encodeURIComponent(user.display_name)}`);
  };

  const handleMessage = (user) => {
    voiceRef.current?.speak(`Opening chat with ${user.display_name}...`);
  };

  if (!myProfile?.onboarding_complete) {
    navigate(createPageUrl('Onboarding'));
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-amber-50 py-8 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">
            Find Friends
          </h1>
          <p className="text-xl text-slate-600">
            People who share your interests
          </p>
        </div>

        {/* Voice Assistant */}
        <div className="mb-8">
          <VoiceAssistant
            ref={voiceRef}
            greeting={`Welcome back, ${myProfile?.display_name}! I found ${matches.length} people who share your interests. Would you like to meet them?`}
            onCommand={handleVoiceCommand}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <LargeButton
            onClick={() => refetch()}
            variant="secondary"
            icon={RefreshCw}
          >
            Find New Friends
          </LargeButton>

          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <LargeButton variant="outline" icon={Filter}>
                Filter by Interest
                {selectedInterestFilter.length > 0 && (
                  <span className="ml-2 bg-amber-500 text-white px-3 py-1 rounded-full text-lg">
                    {selectedInterestFilter.length}
                  </span>
                )}
              </LargeButton>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[70vh]">
              <SheetHeader>
                <SheetTitle className="text-2xl">Filter by Interests</SheetTitle>
              </SheetHeader>
              <div className="flex flex-wrap gap-3 mt-6 overflow-y-auto pb-20">
                {(myProfile?.interests || []).map((interest) => (
                  <InterestTag
                    key={interest}
                    interest={interest}
                    selected={selectedInterestFilter.includes(interest)}
                    onClick={() => {
                      setSelectedInterestFilter(prev =>
                        prev.includes(interest)
                          ? prev.filter(i => i !== interest)
                          : [...prev, interest]
                      );
                    }}
                    size="large"
                  />
                ))}
              </div>
              <div className="absolute bottom-6 left-6 right-6">
                <LargeButton
                  onClick={() => {
                    setSelectedInterestFilter([]);
                    setIsFilterOpen(false);
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Clear All Filters
                </LargeButton>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-16 h-16 text-amber-500 animate-spin mb-4" />
            <p className="text-2xl text-slate-600">Finding friends...</p>
          </div>
        ) : matches.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 bg-white rounded-3xl border-4 border-slate-200"
          >
            <Users className="w-20 h-20 text-slate-300 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-slate-700 mb-4">
              No matches found yet
            </h3>
            <p className="text-xl text-slate-500 mb-6">
              Try adjusting your filters or check back later
            </p>
            <LargeButton onClick={() => setSelectedInterestFilter([])} variant="primary">
              Clear Filters
            </LargeButton>
          </motion.div>
        ) : (
          <div className="space-y-6">
            <p className="text-xl text-slate-600 text-center">
              Found <strong>{matches.length}</strong> potential friends
            </p>
            <AnimatePresence>
              {matches.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <UserCard
                    user={user}
                    sharedInterests={user.sharedInterests}
                    compatibilityScore={user.compatibilityScore}
                    onCall={() => handleCall(user)}
                    onMessage={() => handleMessage(user)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}