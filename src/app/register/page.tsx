'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, UserPlus, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { RegistrationForm } from '@/components/RegistrationForm'
import { RegistrationFormData } from '@/types'
import { generateBadgeUID } from '@/lib/utils'
import { QRCodeGenerator } from '@/components/QRCodeGenerator'
import { toast } from 'sonner'

export default function RegisterPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [badgeUID, setBadgeUID] = useState('')
  const [attendeeName, setAttendeeName] = useState('')
  const [eventName, setEventName] = useState('')

  const handleSubmit = async (data: RegistrationFormData) => {
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Registration failed')
      }
      const json = await res.json()
      setBadgeUID(json.badge_uid)
      setAttendeeName(json.attendee_name || data.full_name)
      setEventName(json.event_name || '')
      setIsSuccess(true)
      toast.success('Registration successful!')
      setTimeout(() => { router.push('/') }, 10000) // Give more time to view QR code
    } catch (error) {
      console.error('Registration error:', error)
      toast.error('Registration failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Registration Successful!
            </h1>
            <p className="text-gray-600 mb-6">
              Your registration has been completed successfully.
            </p>
            <div className="bg-white rounded-lg p-4 border mb-6">
              <div className="text-sm text-gray-500 mb-1">Badge ID</div>
              <div className="text-lg font-mono font-bold text-blue-600">{badgeUID}</div>
            </div>
            
            {/* QR Code Generator */}
            <div className="mb-6">
              <QRCodeGenerator
                badgeUID={badgeUID}
                attendeeName={attendeeName}
                eventCode={eventName}
                className="max-w-sm mx-auto"
              />
            </div>
            
            <p className="text-sm text-gray-500">
              Please save this badge ID and QR code for check-in purposes.
            </p>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a
                href="/printer/qz-setup.html"
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center btn-primary btn-md"
              >
                Print Badge
              </a>
              <button
                onClick={() => router.push('/checkin')}
                className="w-full btn-outline btn-md"
              >
                Go to Check-in
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
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
              <UserPlus className="w-5 h-5 text-blue-600" />
              <span className="font-medium">New Registration</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Event Registration
            </h1>
            <p className="text-gray-600">
              Complete your registration for the event
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg border">
            <RegistrationForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
          </div>
        </div>
      </main>
    </div>
  )
}


