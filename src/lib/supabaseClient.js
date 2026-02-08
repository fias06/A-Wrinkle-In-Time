// @ts-nocheck
import { createClient } from '@supabase/supabase-js';

// 1. Get these from your Supabase Dashboard -> Project Settings -> API
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Use placeholder values if env vars are missing (prevents app crash)
// The app will still work, but Supabase features won't function
const finalUrl = supabaseUrl || 'https://placeholder.supabase.co';
const finalKey = supabaseAnonKey || 'placeholder-key';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Missing Supabase Environment Variables! Supabase features will not work.');
  console.warn('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
}

export const supabase = createClient(finalUrl, finalKey);