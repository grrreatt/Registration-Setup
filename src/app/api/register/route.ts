import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { generateBadgeUID } from '@/lib/utils'
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { validateRequest, sanitizeInput, validateEmail, validatePhone } from '@/lib/validation'

const registrationSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters').max(255),
  email: z.string().email('Please enter a valid email address').max(254),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').max(20),
  event_id: z.string().min(1, 'Event selection is required'),
  category: z.string().min(1, 'Category selection is required'),
  institution: z.string().min(2, 'Institution must be at least 2 characters').max(255),
  meal_entitled: z.boolean(),
  kit_entitled: z.boolean(),
  notes: z.string().max(1000).optional(),
})

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(req, rateLimitConfigs.registration)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        { status: 429 }
      )
    }

    // Validate request
    const validationResult = await validateRequest(req)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error },
        { status: validationResult.status }
      )
    }

    const body = await req.json()
    
    // Sanitize input data
    const sanitizedData = {
      full_name: sanitizeInput(body.full_name),
      email: sanitizeInput(body.email),
      phone: sanitizeInput(body.phone),
      institution: sanitizeInput(body.institution),
      event_id: body.event_id,
      category: body.category,
      meal_entitled: Boolean(body.meal_entitled),
      kit_entitled: Boolean(body.kit_entitled),
      notes: body.notes ? sanitizeInput(body.notes) : undefined,
    }

    // Validate sanitized data
    const parse = registrationSchema.safeParse(sanitizedData)
    if (!parse.success) {
      return NextResponse.json(
        { 
          error: 'Invalid registration data', 
          details: parse.error.flatten() 
        }, 
        { status: 400 }
      )
    }

    // Additional validation
    if (!validateEmail(parse.data.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    if (!validatePhone(parse.data.phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      )
    }

    // Check if event exists
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('id, event_name, event_date')
      .eq('id', parse.data.event_id)
      .single()

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Check if attendee already exists for this event
    const { data: existingAttendee } = await supabaseAdmin
      .from('attendees')
      .select('id')
      .eq('event_id', parse.data.event_id)
      .eq('email', parse.data.email)
      .single()

    if (existingAttendee) {
      return NextResponse.json(
        { error: 'You are already registered for this event' },
        { status: 409 }
      )
    }

    // Generate unique badge UID
    const badge_uid = generateBadgeUID()

    // Create attendee
    const { data: attendee, error } = await supabaseAdmin
      .from('attendees')
      .insert({
        event_id: parse.data.event_id,
        badge_uid,
        full_name: parse.data.full_name,
        email: parse.data.email,
        category: parse.data.category,
        institution: parse.data.institution,
        phone: parse.data.phone,
        meal_entitled: parse.data.meal_entitled,
        kit_entitled: parse.data.kit_entitled,
        notes: parse.data.notes ?? null,
        badge_print_template: 'TPL_A6_V1',
      })
      .select()
      .single()

    if (error) {
      console.error('Registration error:', error)
      return NextResponse.json(
        { error: 'Registration failed. Please try again.' },
        { status: 500 }
      )
    }

    // Log successful registration
    console.log(`Registration successful: ${parse.data.full_name} (${badge_uid}) for event: ${event.event_name}`)

    return NextResponse.json({ 
      success: true, 
      badge_uid,
      attendee_name: parse.data.full_name,
      event_name: event.event_name
    })

  } catch (error: any) {
    console.error('Registration API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


