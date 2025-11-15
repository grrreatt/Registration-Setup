import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { validateRequest } from '@/lib/validation'
import { logger } from '@/lib/logger'

const eventSchema = z.object({
  event_code: z.string().min(2, 'Event code must be at least 2 characters').max(50),
  event_name: z.string().min(2, 'Event name must be at least 2 characters').max(255),
  event_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format'
  }),
})

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const active = searchParams.get('active')
    const limit = parseInt(searchParams.get('limit') || '50')
    
    let query = supabaseAdmin
      .from('events')
      .select(`
        *,
        attendees (
          id,
          badge_uid,
          full_name,
          category
        )
      `)
      .order('event_date', { ascending: false })
      .limit(limit)

    if (active === 'true') {
      const today = new Date().toISOString().split('T')[0]
      query = query.gte('event_date', today)
    }

    const { data: events, error } = await query

    if (error) {
      logger.error('Error fetching events', { error: error.message })
      return NextResponse.json(
        { error: 'Failed to fetch events' },
        { status: 500 }
      )
    }

    logger.info('Events fetched successfully', { count: events?.length || 0 })

    return NextResponse.json({
      success: true,
      data: events || []
    })

  } catch (error: any) {
    logger.error('Events API error', { error: error.message })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(req, rateLimitConfigs.admin)
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
    const parse = eventSchema.safeParse(body)
    
    if (!parse.success) {
      return NextResponse.json(
        { 
          error: 'Invalid payload', 
          details: parse.error.flatten() 
        }, 
        { status: 400 }
      )
    }

    const { event_code, event_name, event_date } = parse.data

    // Check if event code already exists
    const { data: existingEvent } = await supabaseAdmin
      .from('events')
      .select('id')
      .eq('event_code', event_code)
      .single()

    if (existingEvent) {
      return NextResponse.json(
        { error: 'Event code already exists' },
        { status: 409 }
      )
    }

    // Create event
    const { data: event, error } = await supabaseAdmin
      .from('events')
      .insert({
        event_code,
        event_name,
        event_date,
      })
      .select()
      .single()

    if (error) {
      logger.error('Error creating event', { error: error.message, eventData: parse.data })
      return NextResponse.json(
        { error: 'Failed to create event' },
        { status: 500 }
      )
    }

    logger.info('Event created successfully', { eventId: event.id, eventCode: event_code })

    return NextResponse.json({
      success: true,
      data: event
    }, { status: 201 })

  } catch (error: any) {
    logger.error('Create event API error', { error: error.message })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

