'use client'

import { useState, useEffect } from 'react'
import { 
  Users, 
  Calendar, 
  CheckCircle, 
  TrendingUp, 
  Download, 
  Plus, 
  Search, 
  Filter,
  BarChart3,
  PieChart,
  Activity,
  Settings
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDateTime, formatDate } from '@/lib/utils'

interface DashboardStats {
  totalAttendees: number
  totalCheckIns: number
  totalEvents: number
  todayCheckIns: number
  newRegistrationsToday: number
  activeEvents: number
}

interface AnalyticsData {
  overview: {
    totalAttendees: number
    totalCheckIns: number
    totalEvents: number
    period: string
  }
  checkInBreakdown: {
    meal: number
    kit: number
    general: number
  }
  categoryBreakdown: Record<string, number>
  entitlementsBreakdown: {
    mealEntitled: number
    kitEntitled: number
    bothEntitled: number
  }
  dailyStats: Array<{
    date: string
    registrations: number
    checkIns: number
  }>
  topEvents: Array<{
    id: string
    name: string
    date: string
    attendeeCount: number
  }>
}

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalAttendees: 0,
    totalCheckIns: 0,
    totalEvents: 0,
    todayCheckIns: 0,
    newRegistrationsToday: 0,
    activeEvents: 0
  })
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('7d')

  useEffect(() => {
    loadDashboardData()
  }, [selectedPeriod])

  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      // Load basic stats
      const statsResponse = await fetch('/api/admin/analytics')
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setAnalytics(statsData.data)
        
        // Extract basic stats from analytics
        setStats({
          totalAttendees: statsData.data.overview.totalAttendees,
          totalCheckIns: statsData.data.overview.totalCheckIns,
          totalEvents: statsData.data.overview.totalEvents,
          todayCheckIns: statsData.data.dailyStats[0]?.checkIns || 0,
          newRegistrationsToday: statsData.data.dailyStats[0]?.registrations || 0,
          activeEvents: statsData.data.topEvents.length
        })
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  const exportData = async (type: 'attendees' | 'checkins' | 'analytics') => {
    try {
      const response = await fetch(`/api/admin/export/${type}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
        toast.success(`${type} data exported successfully`)
      } else {
        throw new Error('Export failed')
      }
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export data')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Overview of your registration system</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="input"
          >
            <option value="1d">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button
            onClick={() => loadDashboardData()}
            className="btn-primary btn-md"
          >
            <Activity className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Attendees</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalAttendees.toLocaleString()}</p>
              <p className="text-xs text-green-600">+{stats.newRegistrationsToday} today</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Check-ins</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCheckIns.toLocaleString()}</p>
              <p className="text-xs text-green-600">+{stats.todayCheckIns} today</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Events</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeEvents}</p>
              <p className="text-xs text-gray-500">Total: {stats.totalEvents}</p>
            </div>
            <Calendar className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Check-in Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalAttendees > 0 
                  ? Math.round((stats.totalCheckIns / stats.totalAttendees) * 100)
                  : 0}%
              </p>
              <p className="text-xs text-gray-500">Overall</p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Check-in Breakdown */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <PieChart className="w-5 h-5 mr-2" />
              Check-in Breakdown
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Meal Check-ins</span>
                </div>
                <span className="font-semibold">{analytics.checkInBreakdown.meal}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Kit Check-ins</span>
                </div>
                <span className="font-semibold">{analytics.checkInBreakdown.kit}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">General Check-ins</span>
                </div>
                <span className="font-semibold">{analytics.checkInBreakdown.general}</span>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Attendee Categories
            </h3>
            <div className="space-y-3">
              {Object.entries(analytics.categoryBreakdown).map(([category, count]) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 capitalize">{category}</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => exportData('attendees')}
            className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium">Export Attendees</span>
          </button>
          
          <button
            onClick={() => exportData('checkins')}
            className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium">Export Check-ins</span>
          </button>
          
          <button
            onClick={() => exportData('analytics')}
            className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <BarChart3 className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium">Export Analytics</span>
          </button>
          
          <button
            className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Settings className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium">System Settings</span>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      {analytics && analytics.dailyStats.length > 0 && (
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Date</th>
                  <th className="text-right py-2">Registrations</th>
                  <th className="text-right py-2">Check-ins</th>
                </tr>
              </thead>
              <tbody>
                {analytics.dailyStats.slice(0, 7).map((day) => (
                  <tr key={day.date} className="border-b">
                    <td className="py-2">{formatDate(day.date)}</td>
                    <td className="text-right py-2">{day.registrations}</td>
                    <td className="text-right py-2">{day.checkIns}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}


