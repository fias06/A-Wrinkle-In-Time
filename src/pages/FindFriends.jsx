// @ts-nocheck
import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Loader2, UserCheck, UserMinus, Video } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

// --- SUPABASE & AUTH IMPORTS ---
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/authContext';

// --- UI COMPONENTS ---
import UserCard from '@/components/matching/UserCard';
import LargeButton from '@/components/ui/LargeButton';

export default function FindFriends() {
  const navigate = useNavigate();
  const { user } = useAuth(); // Using real authentication context
  
  const [showFriendsList, setShowFriendsList] = useState(false);
  const [friends, setFriends] = useState(() => {
    const saved = localStorage.getItem('myFriends');
    return saved ? JSON.parse(saved) : [];
  });

  // 1. Fetch YOUR profile from Supabase
  const { data: myProfile, isLoading: isMyProfileLoading } = useQuery({
    queryKey: ['myProfile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      // If the row doesn't exist yet, this will return null
      return data || null;
    },
    enabled: !!user?.id
  });

  // 2. Fetch ALL other users who have completed setup
  const { data: allProfiles, isLoading: isAllProfilesLoading } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('onboarding_complete', true); // Only show visible users
      
      if (error) return [];
      return data || [];
    }
  });

  // 3. Simple Interest Matching Logic
  const userInterests = myProfile?.interests || [];
  
  const matches = (allProfiles || [])
    .filter(p => p.id !== user?.id) // Don't show yourself in the list
    .map(p => {
      const profileInterests = p.interests || [];
      // Identify common interests for the UserCard display
      const shared = profileInterests.filter(i => userInterests.includes(i));
      return { ...p, sharedInterests: shared };
    });

  // --- EVENT HANDLERS ---
  const handleCall = (targetUser) => {
    // Navigate to video call with Stream-compatible params
    navigate(`/VideoCall?userId=${targetUser.id}&userName=${encodeURIComponent(targetUser.display_name)}`);
  };

  const handleAddFriend = (user) => {
    if (!friends.some(f => f.id === user.id)) {
      const newFriends = [...friends, user];
      setFriends(newFriends);
      localStorage.setItem('myFriends', JSON.stringify(newFriends));
    }
  };

  const handleRemoveFriend = (userId) => {
    const newFriends = friends.filter(f => f.id !== userId);
    setFriends(newFriends);
    localStorage.setItem('myFriends', JSON.stringify(newFriends));
  };

  // 4. CRITICAL GUARDS: Handle Wiped Tables & Empty Profiles
  if (isMyProfileLoading || isAllProfilesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50">
        <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
      </div>
    );
  }

  // 🟢 If your profile was wiped or isn't finished, force a return to Onboarding
  if (!myProfile || myProfile.onboarding_complete !== true) {
    return <Navigate to="/Onboarding" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-amber-50 py-10 px-6">
      <div className="max-w-4xl mx-auto">
        
        <header className="text-center mb-10">
          <h1 className="text-5xl font-black text-slate-800 mb-3 tracking-tight">Friends Online</h1>
          <p className="text-xl text-slate-500">Connect with others and start a session!</p>
        </header>

        <div className="flex justify-center mb-10">
           <LargeButton
            onClick={() => setShowFriendsList(!showFriendsList)}
            variant={showFriendsList ? "primary" : "outline"}
            icon={UserCheck}
            className="shadow-lg"
          >
            My Friends ({friends.length})
          </LargeButton>
        </div>

        <div className="grid gap-6">
          <AnimatePresence mode="wait">
            {showFriendsList ? (
              /* --- RENDER FRIENDS LIST --- */
              friends.map(f => (
                <motion.div 
                  key={f.id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-6 rounded-[2rem] shadow-md border-2 border-slate-100 flex items-center justify-between"
                >
                  <div className="flex items-center gap-5">
                    <img 
                      src={f.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${f.id}`}
                      className="w-20 h-20 rounded-full border-4 border-amber-200 object-cover"
                      alt={f.display_name}
                    />
                    <div>
                      <h3 className="text-2xl font-bold text-slate-800">{f.display_name}</h3>
                      <p className="text-slate-400 font-medium">Friend</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                     <LargeButton onClick={() => handleCall(f)} variant="success" icon={Video}>Call</LargeButton>
                     <button onClick={() => handleRemoveFriend(f.id)} className="p-4 text-red-500 bg-red-50 rounded-2xl hover:bg-red-100 transition-colors">
                        <UserMinus size={24} />
                     </button>
                  </div>
                </motion.div>
              ))
            ) : (
              /* --- RENDER DISCOVERY MATCHES --- */
              matches.length > 0 ? (
                matches.map(p => (
                  <UserCard
                    key={p.id}
                    user={p}
                    sharedInterests={p.sharedInterests}
                    onCall={() => handleCall(p)}
                    onMessage={() => handleAddFriend(p)}
                    isFriend={friends.some(f => f.id === p.id)}
                  />
                ))
              ) : (
                <div className="text-center py-20 bg-white rounded-[3rem] border-4 border-dashed border-slate-200">
                  <Users size={64} className="mx-auto text-slate-200 mb-4" />
                  <p className="text-2xl font-bold text-slate-400">No other users are online yet...</p>
                </div>
              )
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}