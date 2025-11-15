'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Users } from 'lucide-react'

type DemoUser = {
  id: number
  name: string
  email: string
  company?: { name: string }
}

export default function DemoPage() {
  const [users, setUsers] = useState<DemoUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('https://jsonplaceholder.typicode.com/users')
        const data = await res.json()
        setUsers(data)
      } catch {
        setUsers([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Fetching live data from the internet...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">Registration Wizard · Demo</span>
          </div>
          <Link href="/" className="text-gray-600 hover:text-gray-900">Home</Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Live Users (JSONPlaceholder)</h2>
            <p className="text-sm text-gray-500">Public API data fetched client-side to simulate remote event attendees</p>
          </div>
          <div className="divide-y">
            {users.map(u => (
              <div key={u.id} className="p-6 flex items-center justify-between">
                <div>
                  <div className="text-gray-900 font-medium">{u.name}</div>
                  <div className="text-gray-500 text-sm">{u.email}</div>
                </div>
                <div className="text-xs text-gray-500">{u.company?.name || '—'}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
