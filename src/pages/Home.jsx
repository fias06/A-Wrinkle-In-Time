import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Gamepad2, Heart, ArrowRight, Sparkles } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import LargeButton from '@/components/ui/LargeButton';
import AccessibleCard from '@/components/ui/AccessibleCard';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    // Check localStorage for profile
    const localProfile = localStorage.getItem('userProfile');
    if (localProfile) {
      setHasProfile(true);
      setIsAuthenticated(true);
      return;
    }
    
    // Try backend auth
    try {
      const authenticated = await base44.auth.isAuthenticated();
      setIsAuthenticated(authenticated);
    } catch (e) {
      setIsAuthenticated(false);
    }
  };

  const features = [
    {
      icon: Users,
      title: "Find New Friends",
      description: "Connect with people who share your interests from around the world",
      color: "amber",
      link: "FindFriends"
    },
    {
      icon: Gamepad2,
      title: "Play Together",
      description: "Enjoy fun cooperative games during your video calls",
      color: "violet",
      link: "Game"
    },
    {
      icon: Heart,
      title: "Share Stories",
      description: "Build meaningful friendships through conversations",
      color: "rose",
      link: "FindFriends"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-amber-50">
      {/* Hero Section */}
      <div className="max-w-5xl mx-auto px-6 py-12 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 px-6 py-3 rounded-full text-xl font-medium mb-8">
            <Sparkles className="w-6 h-6" />
            Voice-First Connection
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-slate-800 leading-tight mb-6">
            Make Friends,
            <span className="text-amber-600 block">Play Together</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Connect with wonderful people around the world who share your interests. 
            No typing required – just use your voice!
          </p>
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="grid md:grid-cols-3 gap-6 mb-12"
        >
          {features.map((feature, index) => (
            <Link key={feature.title} to={createPageUrl(feature.link)}>
              <AccessibleCard
                ariaLabel={`${feature.title}: ${feature.description}`}
                className="h-full"
              >
                <div className={`w-16 h-16 rounded-2xl bg-${feature.color}-100 flex items-center justify-center mb-4`}>
                  <feature.icon className={`w-8 h-8 text-${feature.color}-600`} />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">
                  {feature.title}
                </h3>
                <p className="text-lg text-slate-600 mb-4">
                  {feature.description}
                </p>
                <div className="flex items-center gap-2 text-amber-600 font-semibold text-lg">
                  Get Started <ArrowRight className="w-5 h-5" />
                </div>
              </AccessibleCard>
            </Link>
          ))}
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          {isAuthenticated ? (
            <>
              <Link to={createPageUrl('FindFriends')}>
                <LargeButton variant="primary" icon={Users}>
                  Find Friends Now
                </LargeButton>
              </Link>
              <Link to={createPageUrl('Profile')}>
                <LargeButton variant="outline">
                  View My Profile
                </LargeButton>
              </Link>
            </>
          ) : (
            <>
              <LargeButton 
                variant="primary" 
                icon={Users}
                onClick={() => base44.auth.redirectToLogin(createPageUrl('Onboarding'))}
              >
                Get Started Free
              </LargeButton>
              <LargeButton 
                variant="outline"
                onClick={() => base44.auth.redirectToLogin()}
              >
                I Already Have an Account
              </LargeButton>
            </>
          )}
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-16 text-center"
        >
          <p className="text-lg text-slate-500 mb-4">Trusted by seniors worldwide</p>
          <div className="flex flex-wrap justify-center gap-6">
            <div className="flex items-center gap-2 text-slate-600">
              <span className="text-3xl">🌍</span>
              <span className="text-xl font-medium">50+ Countries</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <span className="text-3xl">👥</span>
              <span className="text-xl font-medium">10,000+ Friends Made</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <span className="text-3xl">⭐</span>
              <span className="text-xl font-medium">4.9 Rating</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}