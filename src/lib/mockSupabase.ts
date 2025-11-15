// Mock Supabase client for local development
// This allows you to see the UI without setting up Supabase

export const mockSupabase = {
  from: (table: string) => ({
    select: (columns?: string) => ({
      eq: (column: string, value: any) => ({
        single: () => Promise.resolve({ data: getMockData(table, { [column]: value }), error: null }),
        order: (column: string, options?: any) => ({
          limit: (count: number) => Promise.resolve({ data: getMockDataArray(table, count), error: null })
        })
      }),
      order: (column: string, options?: any) => ({
        limit: (count: number) => Promise.resolve({ data: getMockDataArray(table, count), error: null })
      }),
      or: (query: string) => ({
        limit: (count: number) => Promise.resolve({ data: getMockDataArray(table, count), error: null })
      }),
      gte: (column: string, value: any) => ({
        limit: (count: number) => Promise.resolve({ data: getMockDataArray(table, count), error: null })
      })
    }),
    insert: (data: any) => ({
      select: (columns?: string) => ({
        single: () => Promise.resolve({ 
          data: { 
            id: 'mock-id-' + Date.now(), 
            badge_uid: 'REG' + Date.now().toString(36).toUpperCase(),
            ...data,
            created_at: new Date().toISOString()
          }, 
          error: null 
        })
      })
    }),
    update: (data: any) => ({
      eq: (column: string, value: any) => ({
        select: (columns?: string) => ({
          single: () => Promise.resolve({ 
            data: { 
              id: value, 
              ...data,
              updated_at: new Date().toISOString()
            }, 
            error: null 
          })
        })
      })
    }),
    delete: () => ({
      eq: (column: string, value: any) => Promise.resolve({ data: null, error: null })
    })
  })
}

function getMockData(table: string, filters: any) {
  switch (table) {
    case 'events':
      return {
        id: 'event-1',
        event_code: 'MEDCONF25',
        event_name: 'Medical Conference 2025',
        event_date: '2025-01-15',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    case 'attendees':
      return {
        id: 'attendee-1',
        event_id: 'event-1',
        badge_uid: 'REG123456789',
        full_name: 'Dr. John Smith',
        email: 'john.smith@example.com',
        category: 'delegate',
        institution: 'AIIMS New Delhi',
        phone: '9876543201',
        meal_entitled: true,
        kit_entitled: true,
        badge_print_template: 'TPL_A6_V1',
        notes: 'VIP attendee',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        events: {
          event_name: 'Medical Conference 2025',
          event_date: '2025-01-15'
        },
        check_ins: [
          {
            check_in_type: 'meal',
            checked_in_at: '2024-01-15T14:30:00Z',
            location: 'Main Hall'
          }
        ]
      }
    default:
      return null
  }
}

function getMockDataArray(table: string, count: number) {
  const data = []
  for (let i = 0; i < count; i++) {
    data.push(getMockData(table, {}))
  }
  return data
}

