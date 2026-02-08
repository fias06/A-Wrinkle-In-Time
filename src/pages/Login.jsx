import React, { useEffect } from 'react';
import { useAuth } from '@/lib/authContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';

export default function Login() {
  const { signInWithGoogle, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // If user is already logged in, send them to the next step
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate('/onboarding');
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    const checkProfile = async () => {
      if (isAuthenticated && user) {
        // Check if they already finished onboarding
        const { data } = await supabase
          .from('profiles')
          .select('onboarding_complete')
          .eq('id', user.id)
          .single();
  
        if (data?.onboarding_complete) {
          navigate('/FindFriends');
        } else {
          navigate('/Onboarding');
        }
      }
    };
    checkProfile();
  }, [isAuthenticated, user]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-amber-50">
      <div className="max-w-md w-full p-8 bg-white rounded-3xl shadow-xl text-center">
        <h1 className="text-4xl font-bold text-slate-800 mb-4">Connect</h1>
        <p className="text-slate-600 mb-8 text-lg">
          Sign in to start meeting new friends and video calling.
        </p>

        <button
          onClick={signInWithGoogle}
          className="w-full flex items-center justify-center gap-4 bg-white border-2 border-slate-200 py-4 px-6 rounded-2xl text-xl font-bold text-slate-700 hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
        >
          <img 
            src="https://www.svgrepo.com/show/475656/google-color.svg" 
            alt="Google" 
            className="w-8 h-8" 
          />
          Continue with Google
        </button>
      </div>
    </div>
  );
}