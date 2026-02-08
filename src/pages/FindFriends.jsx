// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Phone, UserPlus, Star, Heart } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import VoiceAssistant from '@/components/voice/VoiceAssistant';
import LargeButton from '@/components/ui/LargeButton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useVideoCall } from '@/context/SocketContext';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/lib/authContext'; // Import your Auth Context

export default function FindFriends() {
  const navigate = useNavigate();
  const voiceRef = useRef(null);
  const [activeTab, setActiveTab] = useState("matches");
  
  // Get Current User
  const { user: myProfile } = useAuth();
  
  // Get Friends from LocalStorage
  const [friends, setFriends] = useState(() => {
    const saved = localStorage.getItem('myFriends');
    return saved ? JSON.parse(saved) : [];
  });

  // Socket Context
  const { callUser, onlineUsers } = useVideoCall();

  // --- QUERY: GET REAL PROFILES ---
  const { data: allProfiles, isLoading, refetch } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      console.log("🔍 Fetching profiles from Supabase...");
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) {
        console.error("❌ Supabase Error:", error.message);
        return [];
      }

      console.log(`✅ Found ${data.length} profiles:`, data);
      return data || [];
    }
  });

  // Save friends when changed
  useEffect(() => {
    localStorage.setItem('myFriends', JSON.stringify(friends));
  }, [friends]);

  // --- MATCHING LOGIC ---
  const matches = React.useMemo(() => {
    if (!allProfiles || !myProfile) return [];
    
    const onlineUserIds = new Set(onlineUsers.map(u => u.userId));
    
    return allProfiles
      .filter(p => p.id !== myProfile.id) // 1. Don't show MYSELF
      .filter(p => !friends.some(f => f.id === p.id)) // 2. Don't show existing FRIENDS
      .map(profile => {
        // Simple compatibility score (random for now if no interests)
        const compatibilityScore = 50 + Math.floor(Math.random() * 50);
        
        // Check if Online (Socket)
        const isOnline = onlineUserIds.has(profile.id);

        return { ...profile, compatibilityScore, is_online: isOnline };
      })
      .sort((a, b) => b.is_online - a.is_online); // Show Online users first
  }, [allProfiles, myProfile, friends, onlineUsers]);

  // --- ACTIONS ---
  // --- UPDATED CALL FUNCTION ---
  const handleCall = (user) => {
    // 1. Find the "Socket ID" for this user
    // We look through the onlineUsers list to find the one matching this profile's ID
    const targetSocketUser = onlineUsers.find(u => u.userId === user.id);

    if (!targetSocketUser) {
      alert(`${user.display_name} is offline or not connected to the call server.`);
      return;
    }

    voiceRef.current?.speak(`Calling ${user.display_name}...`);
    
    console.log(`📞 Calling ${user.display_name} at Socket ID: ${targetSocketUser.socketId}`);

    // 2. Call the SOCKET ID, not the Database ID
    callUser(targetSocketUser.socketId);
    
    // 3. Navigate
    navigate(`/VideoCall?userId=${user.id}&userName=${encodeURIComponent(user.display_name)}`);
  };

  const handleAddFriend = (user) => {
    if (!friends.some(f => f.id === user.id)) {
      setFriends([...friends, user]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Find Friends</h1>
          <p className="text-slate-600">
             Logged in as: <span className="font-bold text-amber-600">{myProfile?.display_name || "Guest"}</span>
          </p>
        </div>

        {/* Refresh Button */}
        <div className="flex justify-center mb-6">
            <LargeButton onClick={() => refetch()} variant="secondary" icon={RefreshCw}>
                Refresh List
            </LargeButton>
        </div>

        <Tabs defaultValue="matches" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="matches">New Matches ({matches.length})</TabsTrigger>
                <TabsTrigger value="friends">My Friends ({friends.length})</TabsTrigger>
            </TabsList>

            {/* MATCHES LIST */}
            <TabsContent value="matches" className="space-y-4">
                {isLoading ? (
                     <div className="text-center py-10">Loading profiles...</div>
                ) : matches.length === 0 ? (
                    <div className="text-center py-10 bg-white rounded-xl shadow-sm border border-slate-200">
                        <p className="text-lg text-slate-600 mb-2">No one else is here yet!</p>
                        <p className="text-sm text-slate-400">
                           (If you just created Alice, open a new Incognito window and create Bob to see him here.)
                        </p>
                    </div>
                ) : (
                    matches.map((user) => (
                        <div key={user.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center">
                            {/* Avatar */}
                            <div className="relative">
                                <img 
                                  src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.display_name}`} 
                                  alt={user.display_name} 
                                  className="w-16 h-16 rounded-full bg-slate-100" 
                                />
                                {user.is_online && (
                                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                                )}
                            </div>
                            
                            {/* Info */}
                            <div className="flex-1 text-center md:text-left">
                                <h3 className="text-xl font-bold text-slate-800">{user.display_name}</h3>
                                <p className="text-slate-500 text-sm">{user.bio || "Ready to play!"}</p>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                                <button onClick={() => handleAddFriend(user)} className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200">
                                    <UserPlus size={20} />
                                </button>
                                <button 
                                    onClick={() => handleCall(user)} 
                                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-green-500 text-white font-bold hover:bg-green-600 shadow-md"
                                >
                                    <Phone size={18} /> Call
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </TabsContent>

            {/* FRIENDS LIST */}
            <TabsContent value="friends">
                <div className="text-center py-10 text-slate-400">
                    {friends.length === 0 ? "You haven't added any friends yet." : "Your friends will appear here."}
                </div>
            </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}