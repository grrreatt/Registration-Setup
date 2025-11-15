import { createClient } from '@supabase/supabase-js'
import { mockSupabase } from './mockSupabase'

// Use mock data for local development if Supabase is not configured
const isLocalDev = process.env.NODE_ENV === 'development' && 
  (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('mock') || !process.env.NEXT_PUBLIC_SUPABASE_URL)

// Server-side Supabase client with service role for privileged operations (bypasses RLS)
export const supabaseAdmin = isLocalDev 
  ? mockSupabase as any
  : createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

export type { Database } from './supabase'


