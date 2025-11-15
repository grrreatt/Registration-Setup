'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, Mail, Phone, Building, Calendar, Users, Utensils, Package, FileText } from 'lucide-react'
import { RegistrationFormData, EVENT_CATEGORIES } from '@/types'
import { supabase } from '@/lib/supabase'
import { Event } from '@/types'

const registrationSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  event_id: z.string().min(1, 'Please select an event'),
  category: z.string().min(1, 'Please select a category'),
  institution: z.string().min(2, 'Institution must be at least 2 characters'),
  meal_entitled: z.boolean(),
  kit_entitled: z.boolean(),
  notes: z.string().optional(),
})

interface RegistrationFormProps {
  onSubmit: (data: RegistrationFormData) => Promise<void>
  isSubmitting: boolean
}

export function RegistrationForm({ onSubmit, isSubmitting }: RegistrationFormProps) {
  const [events, setEvents] = useState<Event[]>([])
  const [isLoadingEvents, setIsLoadingEvents] = useState(true)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      meal_entitled: false,
      kit_entitled: false,
    },
  })

  useEffect(() => {
    async function loadEvents() {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .order('event_date', { ascending: true })

        if (error) {
          console.error('Error loading events:', error)
          return
        }

        setEvents(data || [])
      } catch (error) {
        console.error('Error loading events:', error)
      } finally {
        setIsLoadingEvents(false)
      }
    }

    loadEvents()
  }, [])

  const handleFormSubmit = handleSubmit(onSubmit)

  return (
    <form onSubmit={handleFormSubmit} className="p-6 space-y-6">
      {/* Personal Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
          <User className="w-5 h-5 text-blue-600" />
          <span>Personal Information</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              {...register('full_name')}
              type="text"
              className="input w-full"
              placeholder="Enter your full name"
            />
            {errors.full_name && (
              <p className="text-sm text-red-600 mt-1">{errors.full_name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                {...register('email')}
                type="email"
                className="input w-full pl-10"
                placeholder="Enter your email"
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number *
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                {...register('phone')}
                type="tel"
                className="input w-full pl-10"
                placeholder="Enter your phone number"
              />
            </div>
            {errors.phone && (
              <p className="text-sm text-red-600 mt-1">{errors.phone.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Institution *
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                {...register('institution')}
                type="text"
                className="input w-full pl-10"
                placeholder="Enter your institution"
              />
            </div>
            {errors.institution && (
              <p className="text-sm text-red-600 mt-1">{errors.institution.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Event Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-green-600" />
          <span>Event Information</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event *
            </label>
            <select
              {...register('event_id')}
              className="input w-full"
              disabled={isLoadingEvents}
            >
              <option value="">Select an event</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.event_name} - {new Date(event.event_date).toLocaleDateString()}
                </option>
              ))}
            </select>
            {errors.event_id && (
              <p className="text-sm text-red-600 mt-1">{errors.event_id.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                {...register('category')}
                className="input w-full pl-10"
              >
                <option value="">Select a category</option>
                {EVENT_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            {errors.category && (
              <p className="text-sm text-red-600 mt-1">{errors.category.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Entitlements */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
          <Package className="w-5 h-5 text-purple-600" />
          <span>Entitlements</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3 p-4 border rounded-lg">
            <input
              {...register('meal_entitled')}
              type="checkbox"
              id="meal_entitled"
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="meal_entitled" className="flex items-center space-x-2 text-sm font-medium text-gray-700">
              <Utensils className="w-4 h-4 text-orange-500" />
              <span>Meal Entitled</span>
            </label>
          </div>

          <div className="flex items-center space-x-3 p-4 border rounded-lg">
            <input
              {...register('kit_entitled')}
              type="checkbox"
              id="kit_entitled"
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="kit_entitled" className="flex items-center space-x-2 text-sm font-medium text-gray-700">
              <Package className="w-4 h-4 text-purple-500" />
              <span>Kit Entitled</span>
            </label>
          </div>
        </div>
      </div>

      {/* Additional Notes */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
          <FileText className="w-5 h-5 text-gray-600" />
          <span>Additional Information</span>
        </h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes (Optional)
          </label>
          <textarea
            {...register('notes')}
            rows={3}
            className="input w-full resize-none"
            placeholder="Any additional notes or special requirements..."
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-6 border-t">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full btn-primary btn-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Registering...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Complete Registration</span>
            </div>
          )}
        </button>
      </div>
    </form>
  )
}


