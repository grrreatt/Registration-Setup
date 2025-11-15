'use client'

import { useState } from 'react'
import { Search, UserPlus, Users, Settings } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Registration System</span>
            </div>
            <nav className="flex items-center space-x-4">
              <Link 
                href="/admin" 
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>Admin</span>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl text-center">
          {/* Logo and Title */}
          <div className="mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Event Registration
            </h1>
            <p className="text-lg text-gray-600">
              Register for events, check-in, and manage your attendance
            </p>
          </div>

          {/* Search Box */}
          <div className="mb-8">
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, email, or badge ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 text-lg border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-8 py-3 rounded-full hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
            >
              <UserPlus className="w-5 h-5" />
              <span className="font-medium">New Registration</span>
            </Link>
            <Link
              href="/checkin"
              className="flex items-center justify-center space-x-2 bg-white text-gray-700 px-8 py-3 rounded-full border border-gray-300 hover:bg-gray-50 transition-colors shadow-lg hover:shadow-xl"
            >
              <Search className="w-5 h-5" />
              <span className="font-medium">Check In</span>
            </Link>
          </div>

          {/* Quick Stats */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="text-2xl font-bold text-blue-600">1,234</div>
              <div className="text-sm text-gray-600">Total Registrations</div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="text-2xl font-bold text-green-600">892</div>
              <div className="text-sm text-gray-600">Checked In Today</div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="text-2xl font-bold text-purple-600">5</div>
              <div className="text-sm text-gray-600">Active Events</div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 Registration System. Built with Next.js and Supabase.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
