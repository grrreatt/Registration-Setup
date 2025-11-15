import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { rateLimit } from '@/lib/rate-limit'
import { validateRequest } from '@/lib/validation'

const checkInSchema = z.object({
  badge_uid: z.string().min(1, 'Badge UID is required'),
  check_in_type: z.enum(['meal', 'kit', 'general']),
  location: z.string().optional(),
  notes: z.string().optional(),
  checked_in_by: z.string().optional().default('system'),
})

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(req)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    }

    // Validate request origin
    const validationResult = await validateRequest(req)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error },
        { status: validationResult.status }
      )
    }

    const body = await req.json()
    const parse = checkInSchema.safeParse(body)
    
    if (!parse.success) {
      return NextResponse.json(
        { 
          error: 'Invalid payload', 
          details: parse.error.flatten() 
        }, 
        { status: 400 }
      )
    }

    const { badge_uid, check_in_type, location, notes, checked_in_by } = parse.data

    // Check if attendee exists
    const { data: attendee, error: attendeeError } = await supabaseAdmin
      .from('attendees')
      .select('id, full_name, meal_entitled, kit_entitled')
      .eq('badge_uid', badge_uid)
      .single()

    if (attendeeError || !attendee) {
      return NextResponse.json(
        { error: 'Attendee not found' },
        { status: 404 }
      )
    }

    // Validate entitlements
    if (check_in_type === 'meal' && !attendee.meal_entitled) {
      return NextResponse.json(
        { error: 'Attendee is not entitled to meals' },
        { status: 403 }
      )
    }

    if (check_in_type === 'kit' && !attendee.kit_entitled) {
      return NextResponse.json(
        { error: 'Attendee is not entitled to kits' },
        { status: 403 }
      )
    }

    // Check if already checked in
    const { data: existingCheckIn } = await supabaseAdmin
      .from('check_ins')
      .select('id')
      .eq('attendee_id', attendee.id)
      .eq('check_in_type', check_in_type)
      .single()

    if (existingCheckIn) {
      return NextResponse.json(
        { error: `Already checked in for ${check_in_type}` },
        { status: 409 }
      )
    }

    // Perform check-in
    const { data: checkIn, error: checkInError } = await supabaseAdmin
      .from('check_ins')
      .insert({
        attendee_id: attendee.id,
        check_in_type,
        checked_in_by,
        location: location || 'main',
        notes,
      })
      .select()
      .single()

    if (checkInError) {
      console.error('Check-in error:', checkInError)
      return NextResponse.json(
        { error: 'Failed to process check-in' },
        { status: 500 }
      )
    }

    // Log the check-in event
    console.log(`Check-in successful: ${attendee.full_name} (${badge_uid}) - ${check_in_type}`)

    return NextResponse.json({
      success: true,
      message: 'Check-in successful',
      data: {
        attendee_name: attendee.full_name,
        check_in_type,
        checked_in_at: checkIn.checked_in_at,
      }
    })

  } catch (error: any) {
    console.error('Check-in API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const badge_uid = searchParams.get('badge_uid')

    if (!badge_uid) {
      return NextResponse.json(
        { error: 'Badge UID is required' },
        { status: 400 }
      )
    }

    // Get attendee with check-in status
    const { data: attendee, error } = await supabaseAdmin
      .from('attendees')
      .select(`
        id,
        badge_uid,
        full_name,
        email,
        category,
        institution,
        meal_entitled,
        kit_entitled,
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
      .eq('badge_uid', badge_uid)
      .single()

    if (error || !attendee) {
      return NextResponse.json(
        { error: 'Attendee not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: attendee
    })

  } catch (error: any) {
    console.error('Get attendee error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
