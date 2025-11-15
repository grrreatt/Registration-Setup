export interface Event {
  id: string
  event_code: string
  event_name: string
  event_date: string
  created_at: string
  updated_at: string
}

export interface Attendee {
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

export interface CheckIn {
  id: string
  attendee_id: string
  check_in_type: 'meal' | 'kit' | 'general'
  checked_in_at: string
  checked_in_by: string | null
  location: string | null
  notes: string | null
}

export interface RegistrationFormData {
  full_name: string
  email: string
  phone: string
  event_id: string
  category: string
  institution: string
  meal_entitled: boolean
  kit_entitled: boolean
  notes?: string
}

export interface CheckInFormData {
  badge_uid: string
  check_in_type: 'meal' | 'kit' | 'general'
  location?: string
  notes?: string
}

export const EVENT_CATEGORIES = [
  'delegate',
  'faculty',
  'chairperson',
  'exhibitor',
  'staff',
  'speaker',
  'organizer'
] as const

export const CHECK_IN_TYPES = [
  'meal',
  'kit',
  'general'
] as const


