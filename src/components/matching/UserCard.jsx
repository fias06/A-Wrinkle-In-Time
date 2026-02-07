import React from 'react';
import { motion } from 'framer-motion';
import { Phone, MessageCircle, Star, Globe } from 'lucide-react';
import LargeButton from '../ui/LargeButton';
import { cn } from "@/lib/utils";

export default function UserCard({
  user,
  sharedInterests = [],
  compatibilityScore,
  onCall,
  onMessage,
  className
}) {
  const initials = user?.display_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || '?';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-white rounded-3xl p-8 border-4 border-slate-200",
        "shadow-xl hover:shadow-2xl transition-all",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-6 mb-6">
        {/* Avatar */}
        {user?.avatar_url ? (
          <img
            src={user.avatar_url}
            alt={user.display_name}
            className="w-24 h-24 rounded-2xl object-cover border-4 border-amber-200"
          />
        ) : (
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center border-4 border-amber-200">
            <span className="text-3xl font-bold text-white">{initials}</span>
          </div>
        )}

        {/* Info */}
        <div className="flex-1">
          <h3 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">
            {user?.display_name || 'Friend'}
          </h3>
          
          {user?.language && (
            <div className="flex items-center gap-2 text-lg text-slate-600 mb-2">
              <Globe className="w-5 h-5" />
              <span>Speaks {user.language}</span>
            </div>
          )}

          {compatibilityScore && (
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              <span className="text-lg font-semibold text-amber-600">
                {compatibilityScore}% Match
              </span>
            </div>
          )}
        </div>

        {/* Online indicator */}
        {user?.is_online && (
          <div className="flex items-center gap-2 bg-emerald-100 px-4 py-2 rounded-full">
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-lg font-medium text-emerald-700">Online</span>
          </div>
        )}
      </div>

      {/* Bio */}
      {user?.bio && (
        <p className="text-xl text-slate-600 mb-6 leading-relaxed">
          {user.bio}
        </p>
      )}

      {/* Shared Interests */}
      {sharedInterests.length > 0 && (
        <div className="mb-6">
          <p className="text-lg font-medium text-slate-500 mb-3">
            You both enjoy:
          </p>
          <div className="flex flex-wrap gap-3">
            {sharedInterests.map((interest) => (
              <span
                key={interest}
                className="bg-amber-100 text-amber-800 px-4 py-2 rounded-xl text-lg font-medium"
              >
                {interest}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <LargeButton
          onClick={onCall}
          variant="success"
          icon={Phone}
          className="flex-1"
          ariaLabel={`Call ${user?.display_name}`}
        >
          Start Call
        </LargeButton>
        <LargeButton
          onClick={onMessage}
          variant="secondary"
          icon={MessageCircle}
          className="flex-1"
          ariaLabel={`Message ${user?.display_name}`}
        >
          Say Hello
        </LargeButton>
      </div>
    </motion.div>
  );
}