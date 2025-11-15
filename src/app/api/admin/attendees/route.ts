import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { validateRequest, sanitizeInput } from '@/lib/validation'
import { logger } from '@/lib/logger'

const attendeeUpdateSchema = z.object({
  full_name: z.string().min(2).max(255).optional(),
  email: z.string().email().max(254).optional(),
  phone: z.string().min(10).max(20).optional(),
  category: z.string().min(1).optional(),
  institution: z.string().min(2).max(255).optional(),
  meal_entitled: z.boolean().optional(),
  kit_entitled: z.boolean().optional(),
  notes: z.string().max(1000).optional(),
})

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const event_id = searchParams.get('event_id')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')
    const search = searchParams.get('search')

    let query = supabaseAdmin
      .from('attendees')
      .select(`
        *,
        events (
          event_name,
          event_date
        ),
        check_ins (
          check_in_type,
          checked_in_at,
          location
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (event_id) {
      query = query.eq('event_id', event_id)
    }

    if (search) {
      const sanitizedSearch = sanitizeInput(search)
      query = query.or(`full_name.ilike.%${sanitizedSearch}%,email.ilike.%${sanitizedSearch}%,badge_uid.ilike.%${sanitizedSearch}%`)
    }

    const { data: attendees, error, count } = await query

    if (error) {
      logger.error('Error fetching attendees', { error: error.message })
      return NextResponse.json(
        { error: 'Failed to fetch attendees' },
        { status: 500 }
      )
    }

    logger.info('Attendees fetched successfully', { 
      count: attendees?.length || 0,
      total: count,
      eventId: event_id,
      search: search
    })

    return NextResponse.json({
      success: true,
      data: attendees || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    })

  } catch (error: any) {
    logger.error('Attendees API error', { error: error.message })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
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

    const { searchParams } = new URL(req.url)
    const attendeeId = searchParams.get('id')

    if (!attendeeId) {
      return NextResponse.json(
        { error: 'Attendee ID is required' },
        { status: 400 }
      )
    }

    const body = await req.json()
    
    // Sanitize input data
    const sanitizedData: any = {}
    if (body.full_name) sanitizedData.full_name = sanitizeInput(body.full_name)
    if (body.email) sanitizedData.email = sanitizeInput(body.email)
    if (body.phone) sanitizedData.phone = sanitizeInput(body.phone)
    if (body.institution) sanitizedData.institution = sanitizeInput(body.institution)
    if (body.notes) sanitizedData.notes = sanitizeInput(body.notes)
    if (body.category) sanitizedData.category = body.category
    if (typeof body.meal_entitled === 'boolean') sanitizedData.meal_entitled = body.meal_entitled
    if (typeof body.kit_entitled === 'boolean') sanitizedData.kit_entitled = body.kit_entitled

    const parse = attendeeUpdateSchema.safeParse(sanitizedData)
    
    if (!parse.success) {
      return NextResponse.json(
        { 
          error: 'Invalid payload', 
          details: parse.error.flatten() 
        }, 
        { status: 400 }
      )
    }

    // Update attendee
    const { data: attendee, error } = await supabaseAdmin
      .from('attendees')
      .update(parse.data)
      .eq('id', attendeeId)
      .select()
      .single()

    if (error) {
      logger.error('Error updating attendee', { 
        error: error.message, 
        attendeeId,
        updateData: parse.data 
      })
      return NextResponse.json(
        { error: 'Failed to update attendee' },
        { status: 500 }
      )
    }

    if (!attendee) {
      return NextResponse.json(
        { error: 'Attendee not found' },
        { status: 404 }
      )
    }

    logger.info('Attendee updated successfully', { 
      attendeeId: attendee.id,
      badgeUID: attendee.badge_uid,
      updatedFields: Object.keys(parse.data)
    })

    return NextResponse.json({
      success: true,
      data: attendee
    })

  } catch (error: any) {
    logger.error('Update attendee API error', { error: error.message })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(req, rateLimitConfigs.admin)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    }

    const { searchParams } = new URL(req.url)
    const attendeeId = searchParams.get('id')

    if (!attendeeId) {
      return NextResponse.json(
        { error: 'Attendee ID is required' },
        { status: 400 }
      )
    }

    // Get attendee info before deletion for logging
    const { data: attendee } = await supabaseAdmin
      .from('attendees')
      .select('badge_uid, full_name')
      .eq('id', attendeeId)
      .single()

    // Delete attendee (this will cascade delete check-ins due to foreign key)
    const { error } = await supabaseAdmin
      .from('attendees')
      .delete()
      .eq('id', attendeeId)

    if (error) {
      logger.error('Error deleting attendee', { 
        error: error.message, 
        attendeeId 
      })
      return NextResponse.json(
        { error: 'Failed to delete attendee' },
        { status: 500 }
      )
    }

    logger.info('Attendee deleted successfully', { 
      attendeeId,
      badgeUID: attendee?.badge_uid,
      fullName: attendee?.full_name
    })

    return NextResponse.json({
      success: true,
      message: 'Attendee deleted successfully'
    })

  } catch (error: any) {
    logger.error('Delete attendee API error', { error: error.message })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

