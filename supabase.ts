import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// ─── Type definitions for our database schema ────────────────────────────

export interface FactoryRow {
  id: string;
  name: string;
  industry: string;
  owner_id: string;
  created_at: string;
}

export interface FactoryMemberRow {
  id: string;
  factory_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'operator' | 'viewer';
  created_at: string;
}

export interface UserProfileRow {
  id: string;
  full_name: string | null;
  created_at: string;
  updated_at: string;
}
