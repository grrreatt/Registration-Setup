'use client'

import { useState } from 'react'
import { ArrowLeft, Search, CheckCircle, XCircle, User, Calendar, Building, QrCode } from 'lucide-react'
import Link from 'next/link'
import { CheckInForm } from '@/components/CheckInForm'
import { CheckInFormData } from '@/types'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { formatDateTime } from '@/lib/utils'

export default function CheckInPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedAttendee, setSelectedAttendee] = useState<any>(null)

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const { data, error } = await supabase
        .from('attendees')
        .select(`
          *,
          events (
            event_name,
            event_date
          ),
          check_ins (
            check_in_type,
            checked_in_at
          )
        `)
        .or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,badge_uid.ilike.%${searchQuery}%`)
        .limit(10)

      if (error) {
        throw error
      }

      setSearchResults(data || [])
    } catch (error) {
      console.error('Search error:', error)
      toast.error('Search failed. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }

  const handleCheckIn = async (data: CheckInFormData) => {
    try {
      // Find the attendee
      const { data: attendee, error: attendeeError } = await supabase
        .from('attendees')
        .select('*')
        .eq('badge_uid', data.badge_uid)
        .single()

      if (attendeeError || !attendee) {
        toast.error('Attendee not found')
        return
      }

      // Check if already checked in for this type
      const { data: existingCheckIn } = await supabase
        .from('check_ins')
        .select('*')
        .eq('attendee_id', attendee.id)
        .eq('check_in_type', data.check_in_type)
        .single()

      if (existingCheckIn) {
        toast.error(`Already checked in for ${data.check_in_type}`)
        return
      }

      // Perform check-in
      const { error: checkInError } = await supabase
        .from('check_ins')
        .insert({
          attendee_id: attendee.id,
          check_in_type: data.check_in_type,
          checked_in_by: 'system',
          location: data.location || 'main',
          notes: data.notes
        })

      if (checkInError) {
        throw checkInError
      }

      toast.success(`Successfully checked in for ${data.check_in_type}`)
      
      // Refresh search results
      if (searchQuery) {
        handleSearch()
      }

    } catch (error) {
      console.error('Check-in error:', error)
      toast.error('Check-in failed. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
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
              <Search className="w-5 h-5 text-green-600" />
              <span className="font-medium">Check In</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Attendee Check-In
            </h1>
            <p className="text-gray-600 mb-4">
              Search for attendees and perform check-ins
            </p>
            <Link
              href="/checkin/qr"
              className="inline-flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              <QrCode className="w-5 h-5" />
              <span>Use QR Code Scanner</span>
            </Link>
          </div>

          {/* Search Section */}
          <div className="bg-white rounded-lg shadow-lg border p-6 mb-8">
            <div className="flex space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by name, email, or badge ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="input w-full"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="btn-primary btn-md disabled:opacity-50"
              >
                {isSearching ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg border mb-8">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-900">
                  Search Results ({searchResults.length})
                </h2>
              </div>
              <div className="divide-y">
                {searchResults.map((attendee) => (
                  <div key={attendee.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <User className="w-5 h-5 text-blue-600" />
                          <h3 className="text-lg font-semibold text-gray-900">
                            {attendee.full_name}
                          </h3>
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            {attendee.category}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4" />
                            <span>{attendee.events?.event_name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Building className="w-4 h-4" />
                            <span>{attendee.institution}</span>
                          </div>
                          <div>
                            <span className="font-medium">Badge ID:</span> {attendee.badge_uid}
                          </div>
                        </div>
                        <div className="mt-3 flex space-x-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">Meal:</span>
                            {attendee.meal_entitled ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-600" />
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">Kit:</span>
                            {attendee.kit_entitled ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-600" />
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="ml-6">
                        <button
                          onClick={() => setSelectedAttendee(attendee)}
                          className="btn-primary btn-sm"
                        >
                          Check In
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Check-In Form */}
          {selectedAttendee && (
            <div className="bg-white rounded-lg shadow-lg border">
              <CheckInForm 
                attendee={selectedAttendee}
                onSubmit={handleCheckIn}
                onCancel={() => setSelectedAttendee(null)}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}


