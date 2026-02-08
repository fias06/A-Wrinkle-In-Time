import { createClient } from '@supabase/supabase-js'

// In Vite, we use 'import.meta.env' instead of 'process.env'
// @ts-ignore - Vite provides import.meta.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
// @ts-ignore - Vite provides import.meta.env
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate that required environment variables are present
if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase environment variables are missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key'
)