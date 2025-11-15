'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Users, Calendar, CheckCircle, Download, Plus, Search, Filter } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { formatDateTime, formatDate } from '@/lib/utils'
import { Attendee, Event, CheckIn } from '@/types'

export default function AdminPage() {
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEvent, setSelectedEvent] = useState<string>('all')
  const [stats, setStats] = useState({
    totalAttendees: 0,
    totalCheckIns: 0,
    totalEvents: 0,
    todayCheckIns: 0,
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      // Load events
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: true })

      // Load attendees with event info
      const { data: attendeesData } = await supabase
        .from('attendees')
        .select(`
          *,
          events (
            event_name,
            event_date
          )
        `)
        .order('created_at', { ascending: false })

      // Load check-ins
      const { data: checkInsData } = await supabase
        .from('check_ins')
        .select(`
          *,
          attendees (
            full_name,
            badge_uid
          )
        `)
        .order('checked_in_at', { ascending: false })

      setEvents(eventsData || [])
      setAttendees(attendeesData || [])
      setCheckIns(checkInsData || [])

      // Calculate stats
      const today = new Date().toISOString().split('T')[0]
      const todayCheckIns = (checkInsData as CheckIn[] | undefined)?.filter((ci: CheckIn) => 
        ci.checked_in_at?.startsWith(today)
      ).length || 0

      setStats({
        totalAttendees: attendeesData?.length || 0,
        totalCheckIns: checkInsData?.length || 0,
        totalEvents: eventsData?.length || 0,
        todayCheckIns,
      })

    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredAttendees = attendees.filter(attendee => {
    const matchesSearch = 
      attendee.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      attendee.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      attendee.badge_uid.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesEvent = selectedEvent === 'all' || attendee.event_id === selectedEvent
    
    return matchesSearch && matchesEvent
  })

  const exportToCSV = () => {
    const headers = [
      'Badge ID',
      'Full Name',
      'Email',
      'Phone',
      'Category',
      'Institution',
      'Event',
      'Meal Entitled',
      'Kit Entitled',
      'Registration Date',
      'Notes'
    ]

    const csvData = filteredAttendees.map(attendee => [
      attendee.badge_uid,
      attendee.full_name,
      attendee.email || '',
      attendee.phone || '',
      attendee.category,
      attendee.institution || '',
      attendee.events?.event_name || '',
      attendee.meal_entitled ? 'Yes' : 'No',
      attendee.kit_entitled ? 'Yes' : 'No',
      formatDate(attendee.created_at),
      attendee.notes || ''
    ])

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attendees_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    
    toast.success('CSV exported successfully')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href="/"
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="font-medium">Admin Dashboard</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Attendees</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalAttendees}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Check-ins</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCheckIns}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Events</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalEvents}</p>
              </div>
              <Calendar className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Check-ins</p>
                <p className="text-2xl font-bold text-gray-900">{stats.todayCheckIns}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search attendees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input w-full pl-10"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                className="input"
              >
                <option value="all">All Events</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.event_name}
                  </option>
                ))}
              </select>
            </div>
            
            <button
              onClick={exportToCSV}
              className="btn-primary btn-md flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Attendees Table */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              Attendees ({filteredAttendees.length})
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attendee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entitlements
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registration Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAttendees.map((attendee) => (
                  <tr key={attendee.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {attendee.full_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {attendee.email}
                        </div>
                        <div className="text-xs text-gray-400 font-mono">
                          {attendee.badge_uid}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {attendee.events?.event_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(attendee.events?.event_date || '')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {attendee.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        {attendee.meal_entitled && (
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                            Meal
                          </span>
                        )}
                        {attendee.kit_entitled && (
                          <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                            Kit
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(attendee.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredAttendees.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No attendees found</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}


