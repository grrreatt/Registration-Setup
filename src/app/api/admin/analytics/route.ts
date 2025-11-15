import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { validateRequest } from '@/lib/validation'
import { logger } from '@/lib/logger'

export async function GET(req: NextRequest) {
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
    const event_id = searchParams.get('event_id')
    const period = searchParams.get('period') || '7d' // 7d, 30d, 90d, 1y

    // Calculate date range based on period
    const now = new Date()
    let startDate = new Date()
    
    switch (period) {
      case '1d':
        startDate.setDate(now.getDate() - 1)
        break
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 7)
    }

    // Build base query conditions
    const dateFilter = `gte.${startDate.toISOString()}`
    let eventFilter = ''
    if (event_id) {
      eventFilter = `eq.${event_id}`
    }

    // Get total attendees
    let attendeesQuery = supabaseAdmin
      .from('attendees')
      .select('id, created_at, category, meal_entitled, kit_entitled, event_id', { count: 'exact' })
      .gte('created_at', startDate.toISOString())

    if (event_id) {
      attendeesQuery = attendeesQuery.eq('event_id', event_id)
    }

    const { data: attendees, count: totalAttendees } = await attendeesQuery

    // Get total check-ins
    let checkInsQuery = supabaseAdmin
      .from('check_ins')
      .select('id, checked_in_at, check_in_type, attendee_id', { count: 'exact' })
      .gte('checked_in_at', startDate.toISOString())

    if (event_id) {
      checkInsQuery = checkInsQuery.in('attendee_id', 
        attendees?.map(a => a.id) || []
      )
    }

    const { data: checkIns, count: totalCheckIns } = await checkInsQuery

    // Get events data
    let eventsQuery = supabaseAdmin
      .from('events')
      .select('id, event_name, event_date, created_at', { count: 'exact' })
      .gte('created_at', startDate.toISOString())

    if (event_id) {
      eventsQuery = eventsQuery.eq('id', event_id)
    }

    const { data: events, count: totalEvents } = await eventsQuery

    // Calculate analytics
    const analytics = {
      overview: {
        totalAttendees: totalAttendees || 0,
        totalCheckIns: totalCheckIns || 0,
        totalEvents: totalEvents || 0,
        period: period
      },
      checkInBreakdown: {
        meal: checkIns?.filter(ci => ci.check_in_type === 'meal').length || 0,
        kit: checkIns?.filter(ci => ci.check_in_type === 'kit').length || 0,
        general: checkIns?.filter(ci => ci.check_in_type === 'general').length || 0
      },
      categoryBreakdown: attendees?.reduce((acc, attendee) => {
        acc[attendee.category] = (acc[attendee.category] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {},
      entitlementsBreakdown: {
        mealEntitled: attendees?.filter(a => a.meal_entitled).length || 0,
        kitEntitled: attendees?.filter(a => a.kit_entitled).length || 0,
        bothEntitled: attendees?.filter(a => a.meal_entitled && a.kit_entitled).length || 0
      },
      dailyStats: await getDailyStats(startDate, event_id),
      topEvents: await getTopEvents(startDate, event_id)
    }

    logger.info('Analytics fetched successfully', { 
      period, 
      eventId: event_id,
      totalAttendees: analytics.overview.totalAttendees,
      totalCheckIns: analytics.overview.totalCheckIns
    })

    return NextResponse.json({
      success: true,
      data: analytics
    })

  } catch (error: any) {
    logger.error('Analytics API error', { error: error.message })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function getDailyStats(startDate: Date, event_id?: string) {
  const days = []
  const currentDate = new Date(startDate)
  const today = new Date()

  while (currentDate <= today) {
    const dateStr = currentDate.toISOString().split('T')[0]
    
    // Get registrations for this day
    let registrationsQuery = supabaseAdmin
      .from('attendees')
      .select('id', { count: 'exact' })
      .gte('created_at', `${dateStr}T00:00:00`)
      .lt('created_at', `${dateStr}T23:59:59`)

    if (event_id) {
      registrationsQuery = registrationsQuery.eq('event_id', event_id)
    }

    const { count: registrations } = await registrationsQuery

    // Get check-ins for this day
    let checkInsQuery = supabaseAdmin
      .from('check_ins')
      .select('id', { count: 'exact' })
      .gte('checked_in_at', `${dateStr}T00:00:00`)
      .lt('checked_in_at', `${dateStr}T23:59:59`)

    if (event_id) {
      // Get attendee IDs for this event first
      const { data: eventAttendees } = await supabaseAdmin
        .from('attendees')
        .select('id')
        .eq('event_id', event_id)
      
      if (eventAttendees && eventAttendees.length > 0) {
        checkInsQuery = checkInsQuery.in('attendee_id', eventAttendees.map(a => a.id))
      } else {
        checkInsQuery = checkInsQuery.eq('attendee_id', '00000000-0000-0000-0000-000000000000') // No results
      }
    }

    const { count: checkIns } = await checkInsQuery

    days.push({
      date: dateStr,
      registrations: registrations || 0,
      checkIns: checkIns || 0
    })

    currentDate.setDate(currentDate.getDate() + 1)
  }

  return days
}

async function getTopEvents(startDate: Date, event_id?: string) {
  let query = supabaseAdmin
    .from('events')
    .select(`
      id,
      event_name,
      event_date,
      attendees (
        id
      )
    `)
    .gte('created_at', startDate.toISOString())
    .order('event_date', { ascending: false })
    .limit(10)

  if (event_id) {
    query = query.eq('id', event_id)
  }

  const { data: events } = await query

  return events?.map(event => ({
    id: event.id,
    name: event.event_name,
    date: event.event_date,
    attendeeCount: event.attendees?.length || 0
  })) || []
}


