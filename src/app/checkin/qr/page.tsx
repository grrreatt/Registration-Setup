'use client'

import { useState } from 'react'
import { ArrowLeft, QrCode, Search, CheckCircle, User } from 'lucide-react'
import Link from 'next/link'
import { QRCodeScanner } from '@/components/QRCodeScanner'
import { CheckInForm } from '@/components/CheckInForm'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { CheckInFormData } from '@/types'

export default function QRCheckInPage() {
  const [selectedAttendee, setSelectedAttendee] = useState<any>(null)
  const [isLoadingAttendee, setIsLoadingAttendee] = useState(false)

  const handleQRScanSuccess = async (badgeUID: string, qrData: any) => {
    setIsLoadingAttendee(true)
    try {
      // Fetch attendee details
      const { data: attendee, error } = await supabase
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
        .eq('badge_uid', badgeUID)
        .single()

      if (error || !attendee) {
        toast.error('Attendee not found')
        return
      }

      setSelectedAttendee(attendee)
    } catch (error) {
      console.error('Error fetching attendee:', error)
      toast.error('Failed to load attendee details')
    } finally {
      setIsLoadingAttendee(false)
    }
  }

  const handleQRScanError = (error: string) => {
    console.error('QR scan error:', error)
  }

  const handleCheckIn = async (data: CheckInFormData) => {
    try {
      const response = await fetch('/api/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Check-in failed')
      }

      toast.success(`Successfully checked in for ${data.check_in_type}`)
      setSelectedAttendee(null) // Close the form

    } catch (error: any) {
      console.error('Check-in error:', error)
      toast.error(error.message || 'Check-in failed. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href="/checkin"
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Check-in</span>
            </Link>
            <div className="flex items-center space-x-2">
              <QrCode className="w-5 h-5 text-green-600" />
              <span className="font-medium">QR Code Check-in</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              QR Code Check-in
            </h1>
            <p className="text-gray-600">
              Scan a badge QR code to quickly check in attendees
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* QR Scanner */}
            <div>
              <QRCodeScanner
                onScanSuccess={handleQRScanSuccess}
                onScanError={handleQRScanError}
                className="h-fit"
              />
            </div>

            {/* Attendee Info & Check-in Form */}
            <div className="space-y-6">
              {isLoadingAttendee && (
                <div className="bg-white rounded-lg border p-6">
                  <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading attendee details...</p>
                  </div>
                </div>
              )}

              {selectedAttendee && !isLoadingAttendee && (
                <div className="space-y-6">
                  {/* Attendee Info Card */}
                  <div className="bg-white rounded-lg border p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <User className="w-6 h-6 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        Attendee Information
                      </h3>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Name:</span>
                        <p className="text-gray-900">{selectedAttendee.full_name}</p>
                      </div>
                      
                      <div>
                        <span className="text-sm font-medium text-gray-500">Badge ID:</span>
                        <p className="text-gray-900 font-mono">{selectedAttendee.badge_uid}</p>
                      </div>
                      
                      <div>
                        <span className="text-sm font-medium text-gray-500">Event:</span>
                        <p className="text-gray-900">{selectedAttendee.events?.event_name}</p>
                      </div>
                      
                      <div>
                        <span className="text-sm font-medium text-gray-500">Category:</span>
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {selectedAttendee.category}
                        </span>
                      </div>
                      
                      <div>
                        <span className="text-sm font-medium text-gray-500">Institution:</span>
                        <p className="text-gray-900">{selectedAttendee.institution}</p>
                      </div>
                    </div>
                  </div>

                  {/* Check-in Form */}
                  <div className="bg-white rounded-lg border">
                    <CheckInForm 
                      attendee={selectedAttendee}
                      onSubmit={handleCheckIn}
                      onCancel={() => setSelectedAttendee(null)}
                    />
                  </div>
                </div>
              )}

              {!selectedAttendee && !isLoadingAttendee && (
                <div className="bg-white rounded-lg border p-6">
                  <div className="text-center">
                    <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Ready to Scan
                    </h3>
                    <p className="text-gray-600">
                      Scan a badge QR code to begin the check-in process
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              How to use QR Code Check-in
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                <p>Click "Start Scanning" to activate the camera</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                <p>Point the camera at the attendee's badge QR code</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                <p>Select check-in type and complete the process</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

