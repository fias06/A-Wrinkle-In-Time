import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/authContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';

export default function Login() {
  const { signInWithGoogle, user, isAuthenticated, authError } = useAuth();
  const navigate = useNavigate();
  const [isCheckingProfile, setIsCheckingProfile] = useState(false);

  // After Google sign-in: send to onboarding, or FindFriends if already onboarded
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const checkProfile = async () => {
      setIsCheckingProfile(true);
      try {
        const { data } = await supabase
          .from('profiles')
          .select('onboarding_complete')
          .eq('id', user.id)
          .maybeSingle();

        if (data?.onboarding_complete) {
          navigate('/FindFriends');
        } else {
          navigate('/Onboarding');
        }
      } catch (err) {
        console.error('Profile check error:', err);
        navigate('/Onboarding');
      } finally {
        setIsCheckingProfile(false);
      }
    };

    checkProfile();
  }, [isAuthenticated, user, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-amber-50 via-white to-slate-50 px-4 py-12">
      <div className="max-w-lg w-full text-center">
        {/* Hero */}
        <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-3 tracking-tight">
          Meet friends. Play together.
        </h1>
        <p className="text-lg text-slate-600 mb-10 max-w-md mx-auto">
          Sign in with Google to create an account and start video calling, playing games, and connecting with new people.
        </p>

        {/* CTA */}
        <div className="space-y-4">
          <button
            onClick={signInWithGoogle}
            disabled={isCheckingProfile}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-200 py-4 px-6 rounded-2xl text-lg font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.98] shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isCheckingProfile ? (
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-slate-300 border-t-amber-500 rounded-full animate-spin" />
                Taking you in…
              </span>
            ) : (
              <>
                <img
                  src="https://www.svgrepo.com/show/475656/google-color.svg"
                  alt=""
                  className="w-6 h-6"
                  aria-hidden
                />
                Continue with Google
              </>
            )}
          </button>

          {authError && (
            <p className="text-sm text-red-600 bg-red-50 rounded-xl py-2 px-4">
              {authError}
            </p>
          )}
        </div>

        <p className="mt-8 text-sm text-slate-500">
          By continuing, you agree to sign in with your Google account. We only use it to identify you in the app.
        </p>
      </div>
    </div>
  );
}
