import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { validateRequest, sanitizeInput } from '@/lib/validation'

const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  event_id: z.string().optional(),
  limit: z.number().min(1).max(100).optional().default(20),
})

export async function GET(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(req, rateLimitConfigs.search)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    }

    const { searchParams } = new URL(req.url)
    const query = searchParams.get('query')
    const event_id = searchParams.get('event_id')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      )
    }

    const sanitizedQuery = sanitizeInput(query)

    let dbQuery = supabaseAdmin
      .from('attendees')
      .select(`
        id,
        badge_uid,
        full_name,
        email,
        category,
        institution,
        phone,
        meal_entitled,
        kit_entitled,
        created_at,
        events (
          event_name,
          event_date
        ),
        check_ins (
          check_in_type,
          checked_in_at
        )
      `)
      .or(`full_name.ilike.%${sanitizedQuery}%,email.ilike.%${sanitizedQuery}%,badge_uid.ilike.%${sanitizedQuery}%`)
      .limit(limit)

    if (event_id) {
      dbQuery = dbQuery.eq('event_id', event_id)
    }

    const { data: attendees, error } = await dbQuery

    if (error) {
      console.error('Error searching attendees:', error)
      return NextResponse.json(
        { error: 'Failed to search attendees' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: attendees || []
    })

  } catch (error: any) {
    console.error('Search attendees API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(req, rateLimitConfigs.registration)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
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
    
    // Validate and sanitize input
    const attendeeData = {
      full_name: sanitizeInput(body.full_name),
      email: body.email ? sanitizeInput(body.email) : null,
      phone: body.phone ? sanitizeInput(body.phone) : null,
      institution: sanitizeInput(body.institution),
      event_id: body.event_id,
      category: body.category,
      meal_entitled: Boolean(body.meal_entitled),
      kit_entitled: Boolean(body.kit_entitled),
      notes: body.notes ? sanitizeInput(body.notes) : null,
    }

    // Check if attendee already exists for this event
    const { data: existingAttendee } = await supabaseAdmin
      .from('attendees')
      .select('id')
      .eq('event_id', attendeeData.event_id)
      .eq('email', attendeeData.email)
      .single()

    if (existingAttendee) {
      return NextResponse.json(
        { error: 'Attendee already registered for this event' },
        { status: 409 }
      )
    }

    // Generate unique badge UID
    const badge_uid = generateBadgeUID()

    // Create attendee
    const { data: attendee, error } = await supabaseAdmin
      .from('attendees')
      .insert({
        ...attendeeData,
        badge_uid,
        badge_print_template: 'TPL_A6_V1',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating attendee:', error)
      return NextResponse.json(
        { error: 'Failed to create attendee' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: attendee
    }, { status: 201 })

  } catch (error: any) {
    console.error('Create attendee API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateBadgeUID(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `REG${timestamp}${random}`.toUpperCase()
}

