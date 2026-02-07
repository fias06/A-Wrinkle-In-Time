import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, Camera, Save, LogOut, Edit2, Check, 
  Globe, Heart, Clock 
} from 'lucide-react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import LargeButton from '@/components/ui/LargeButton';
import InterestTag from '@/components/matching/InterestTag';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const INTERESTS = [
  'Gardening', 'Chess', 'History', 'Music', 'Cooking',
  'Travel', 'Photography', 'Reading', 'Art', 'Nature',
  'Movies', 'Knitting', 'Puzzles', 'Walking', 'Birdwatching',
  'Fishing', 'Cards', 'Dancing', 'Crafts', 'Pets'
];

const LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Italian',
  'Portuguese', 'Chinese', 'Japanese', 'Korean', 'Arabic'
];

export default function Profile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch (e) {
        // Return null if auth fails
        return null;
      }
    }
  });

  const { data: profile, isLoading } = useQuery({
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

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      // Save to localStorage
      localStorage.setItem('userProfile', JSON.stringify(data));
      
      // Try to save to backend
      try {
        if (profile?.id && !profile.id.startsWith('mock')) {
          await base44.entities.UserProfile.update(profile.id, data);
        }
      } catch (e) {
        console.log('Backend not available, saved to localStorage');
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myProfile']);
      setIsEditing(false);
    },
    onError: () => {
      setIsEditing(false);
    }
  });

  useEffect(() => {
    if (profile) {
      setEditedProfile(profile);
    }
  }, [profile]);

  const toggleInterest = (interest) => {
    if (!editedProfile) return;
    const currentInterests = editedProfile.interests || [];
    const newInterests = currentInterests.includes(interest)
      ? currentInterests.filter(i => i !== interest)
      : [...currentInterests, interest];
    
    setEditedProfile({ ...editedProfile, interests: newInterests });
  };

  const handleSave = () => {
    if (editedProfile) {
      updateMutation.mutate(editedProfile);
    }
  };

  const handleLogout = () => {
    base44.auth.logout(createPageUrl('Home'));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Try to upload to backend
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setEditedProfile({ ...editedProfile, avatar_url: file_url });
    } catch (error) {
      // If backend fails, create a local URL
      const localUrl = URL.createObjectURL(file);
      setEditedProfile({ ...editedProfile, avatar_url: localUrl });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-2xl text-slate-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    navigate(createPageUrl('Onboarding'));
    return null;
  }

  const displayProfile = isEditing ? editedProfile : profile;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-amber-50 py-8 px-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">
            My Profile
          </h1>
        </div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-8 border-4 border-slate-200 shadow-xl mb-8"
        >
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4">
              {displayProfile?.avatar_url ? (
                <img
                  src={displayProfile.avatar_url}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover border-4 border-amber-300"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center border-4 border-amber-300">
                  <span className="text-5xl font-bold text-white">
                    {displayProfile?.display_name?.[0]?.toUpperCase() || '?'}
                  </span>
                </div>
              )}
              
              {isEditing && (
                <label className="absolute bottom-0 right-0 w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-amber-600 transition-all">
                  <Camera className="w-5 h-5 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {isEditing ? (
              <Input
                value={editedProfile?.display_name || ''}
                onChange={(e) => setEditedProfile({ ...editedProfile, display_name: e.target.value })}
                className="text-2xl font-bold text-center max-w-xs border-2 h-auto py-2"
                placeholder="Your name"
              />
            ) : (
              <h2 className="text-3xl font-bold text-slate-800">
                {displayProfile?.display_name}
              </h2>
            )}

            <p className="text-lg text-slate-500 mt-2">{user?.email}</p>
          </div>

          {/* Language */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-xl font-semibold text-slate-700 mb-4">
              <Globe className="w-6 h-6 text-amber-500" />
              Language
            </div>
            {isEditing ? (
              <div className="flex flex-wrap gap-3">
                {LANGUAGES.map((lang) => (
                  <motion.button
                    key={lang}
                    onClick={() => setEditedProfile({ ...editedProfile, language: lang })}
                    className={`px-5 py-3 rounded-xl text-lg font-medium transition-all ${
                      editedProfile?.language === lang
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                    whileTap={{ scale: 0.95 }}
                  >
                    {lang}
                  </motion.button>
                ))}
              </div>
            ) : (
              <p className="text-xl text-slate-600">
                {displayProfile?.language || 'Not set'}
              </p>
            )}
          </div>

          {/* Bio */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-xl font-semibold text-slate-700 mb-4">
              <User className="w-6 h-6 text-amber-500" />
              About Me
            </div>
            {isEditing ? (
              <Textarea
                value={editedProfile?.bio || ''}
                onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
                placeholder="Tell others a little about yourself..."
                className="text-lg border-2 min-h-[120px]"
              />
            ) : (
              <p className="text-xl text-slate-600">
                {displayProfile?.bio || 'No bio yet'}
              </p>
            )}
          </div>

          {/* Interests */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-xl font-semibold text-slate-700 mb-4">
              <Heart className="w-6 h-6 text-amber-500" />
              My Interests
            </div>
            {isEditing ? (
              <div className="flex flex-wrap gap-3">
                {INTERESTS.map((interest) => (
                  <InterestTag
                    key={interest}
                    interest={interest}
                    selected={(editedProfile?.interests || []).includes(interest)}
                    onClick={() => toggleInterest(interest)}
                    size="small"
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {(displayProfile?.interests || []).map((interest) => (
                  <span
                    key={interest}
                    className="bg-amber-100 text-amber-800 px-4 py-2 rounded-xl text-lg font-medium"
                  >
                    {interest}
                  </span>
                ))}
                {(!displayProfile?.interests || displayProfile.interests.length === 0) && (
                  <p className="text-xl text-slate-500">No interests added yet</p>
                )}
              </div>
            )}
          </div>

          {/* Member since */}
          <div className="flex items-center gap-2 text-lg text-slate-500">
            <Clock className="w-5 h-5" />
            Member since {new Date(profile.created_date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long'
            })}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4">
          {isEditing ? (
            <div className="flex gap-4">
              <LargeButton
                onClick={handleSave}
                variant="success"
                icon={Check}
                className="flex-1"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </LargeButton>
              <LargeButton
                onClick={() => {
                  setIsEditing(false);
                  setEditedProfile(profile);
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </LargeButton>
            </div>
          ) : (
            <LargeButton
              onClick={() => setIsEditing(true)}
              variant="primary"
              icon={Edit2}
            >
              Edit Profile
            </LargeButton>
          )}

          <LargeButton
            onClick={handleLogout}
            variant="outline"
            icon={LogOut}
          >
            Sign Out
          </LargeButton>
        </div>
      </div>
    </div>
  );
}