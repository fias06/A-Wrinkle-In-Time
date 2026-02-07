import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gamepad2, Users, ArrowLeft, Play } from 'lucide-react';
import { createPageUrl } from '@/utils';
import CoopGame from '@/components/game/CoopGame';
import LargeButton from '@/components/ui/LargeButton';

export default function Game() {
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const gameRef = useRef(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 py-8 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(createPageUrl('Home'))}
            className="flex items-center gap-2 text-xl text-slate-300 hover:text-white transition-all"
          >
            <ArrowLeft className="w-6 h-6" />
            Back
          </button>
          
          <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
            <Gamepad2 className="w-10 h-10 text-amber-500" />
            Play Together
          </h1>
          
          <div className="w-20" /> {/* Spacer */}
        </div>

        {isPlaying ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <CoopGame
              ref={gameRef}
              isPlayer1={true}
              onGameAction={() => {}}
              remoteAction={null}
            />
            
            <div className="mt-6 text-center">
              <LargeButton
                onClick={() => setIsPlaying(false)}
                variant="outline"
                className="border-slate-600 text-white hover:bg-slate-800"
              >
                Stop Practice
              </LargeButton>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {/* Game intro */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-800 rounded-3xl p-8 border-4 border-slate-700"
            >
              <h2 className="text-2xl font-bold text-white mb-4">
                🎮 Gold & Silver Adventure
              </h2>
              <p className="text-xl text-slate-300 mb-6 leading-relaxed">
                A cooperative puzzle game where two players work together! 
                One controls Gold, the other controls Silver. 
                Stand on buttons to open doors and reach the goal together.
              </p>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="bg-amber-500/20 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500" />
                    <span className="text-xl font-bold text-amber-400">Gold Player</span>
                  </div>
                  <p className="text-lg text-slate-300">
                    Opens the purple door by standing on the purple button
                  </p>
                </div>
                
                <div className="bg-violet-500/20 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-violet-500" />
                    <span className="text-xl font-bold text-violet-400">Silver Player</span>
                  </div>
                  <p className="text-lg text-slate-300">
                    Opens the gold door by standing on the gold button
                  </p>
                </div>
              </div>

              <h3 className="text-xl font-semibold text-white mb-3">
                🎤 Voice Controls
              </h3>
              <div className="flex flex-wrap gap-3 text-lg">
                <span className="bg-slate-700 px-4 py-2 rounded-xl text-white">"Jump"</span>
                <span className="bg-slate-700 px-4 py-2 rounded-xl text-white">"Left"</span>
                <span className="bg-slate-700 px-4 py-2 rounded-xl text-white">"Right"</span>
              </div>
            </motion.div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <LargeButton
                onClick={() => setIsPlaying(true)}
                variant="primary"
                icon={Play}
                className="flex-1"
              >
                Practice Solo
              </LargeButton>
              
              <LargeButton
                onClick={() => navigate(createPageUrl('FindFriends'))}
                variant="secondary"
                icon={Users}
                className="flex-1"
              >
                Find a Partner
              </LargeButton>
            </div>

            {/* How to play with friends */}
            <div className="bg-slate-800/50 rounded-2xl p-6 text-center">
              <p className="text-xl text-slate-300">
                💡 <strong>Tip:</strong> During a video call, tap the game icon to play together!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}