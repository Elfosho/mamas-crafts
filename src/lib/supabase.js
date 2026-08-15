import { createClient } from '@supabase/supabase-js';

// ─── Supabase Configuration ───────────────────────────────────────────────────
// Replace these values with your actual project URL and anon key from:
// https://supabase.com/dashboard → Settings → API
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    '❌ Supabase credentials missing! Create a .env file with:\n' +
    'VITE_SUPABASE_URL=your_project_url\n' +
    'VITE_SUPABASE_ANON_KEY=your_anon_key'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // Automatically refresh tokens before they expire
    autoRefreshToken: true,
    // Persist sessions in localStorage
    persistSession: true,
    // Detect session from URL (needed for email confirmation links)
    detectSessionInUrl: true,
  },
});

export default supabase;
