import { createClient } from '@supabase/supabase-js'
import { mockSupabase } from './mockSupabase'

// Use mock data for local development if Supabase is not configured
const isLocalDev = process.env.NODE_ENV === 'development' && 
  (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('mock') || !process.env.NEXT_PUBLIC_SUPABASE_URL)

export const supabase = isLocalDev 
  ? mockSupabase as any
  : createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

export type Database = {
  public: {
    Tables: {
      events: {
        Row: {
          id: string
          event_code: string
          event_name: string
          event_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_code: string
          event_name: string
          event_date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_code?: string
          event_name?: string
          event_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      attendees: {
        Row: {
          id: string
          event_id: string
          badge_uid: string
          full_name: string
          email: string | null
          category: string
          institution: string | null
          phone: string | null
          meal_entitled: boolean
          kit_entitled: boolean
          badge_print_template: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          badge_uid: string
          full_name: string
          email?: string | null
          category: string
          institution?: string | null
          phone?: string | null
          meal_entitled?: boolean
          kit_entitled?: boolean
          badge_print_template?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          badge_uid?: string
          full_name?: string
          email?: string | null
          category?: string
          institution?: string | null
          phone?: string | null
          meal_entitled?: boolean
          kit_entitled?: boolean
          badge_print_template?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      check_ins: {
        Row: {
          id: string
          attendee_id: string
          check_in_type: 'meal' | 'kit' | 'general'
          checked_in_at: string
          checked_in_by: string | null
          location: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          attendee_id: string
          check_in_type: 'meal' | 'kit' | 'general'
          checked_in_at?: string
          checked_in_by?: string | null
          location?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          attendee_id?: string
          check_in_type?: 'meal' | 'kit' | 'general'
          checked_in_at?: string
          checked_in_by?: string | null
          location?: string | null
          notes?: string | null
        }
      }
    }
  }
}


