// @ts-nocheck
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';

export default function Login() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);

    try {
      // 1. Create a "Real" Profile in Supabase
      const newProfile = {
        display_name: name,
        bio: "I'm new here!",
        interests: ['Newbie'], // Default interest so app doesn't crash
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
        is_online: true
      };

      const { data, error } = await supabase
        .from('profiles')
        .insert([newProfile])
        .select()
        .single();

      if (error) throw error;

      // 2. Save "Session" to Browser (Hackathon style)
      localStorage.setItem('userProfile', JSON.stringify(data));

      // 3. Force Reload to load the new user context
      window.location.href = '/FindFriends';

    } catch (error) {
      console.error("Login Error:", error);
      alert("Error joining: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6 text-slate-800">Welcome</h1>
        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">What's your name?</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-400 outline-none"
              placeholder="e.g. Alice"
              required
            />
          </div>
          <button 
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50"
          >
            {loading ? "Joining..." : "Join Community"}
          </button>
        </form>
      </div>
    </div>
  );
}

