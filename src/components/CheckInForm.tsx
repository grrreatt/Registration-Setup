'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, Calendar, Building, CheckCircle, XCircle, MapPin, FileText, X } from 'lucide-react'
import { CheckInFormData, CHECK_IN_TYPES } from '@/types'

const checkInSchema = z.object({
  badge_uid: z.string().min(1, 'Badge UID is required'),
  check_in_type: z.enum(['meal', 'kit', 'general'] as const),
  location: z.string().optional(),
  notes: z.string().optional(),
})

interface CheckInFormProps {
  attendee: any
  onSubmit: (data: CheckInFormData) => Promise<void>
  onCancel: () => void
}

export function CheckInForm({ attendee, onSubmit, onCancel }: CheckInFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<CheckInFormData>({
    resolver: zodResolver(checkInSchema),
    defaultValues: {
      badge_uid: attendee.badge_uid,
    },
  })

  const handleFormSubmit = handleSubmit(async (data) => {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
      onCancel() // Close the form after successful submission
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  })

  // Check if attendee is already checked in for each type
  const checkInStatus = {
    meal: attendee.check_ins?.some((ci: any) => ci.check_in_type === 'meal'),
    kit: attendee.check_ins?.some((ci: any) => ci.check_in_type === 'kit'),
    general: attendee.check_ins?.some((ci: any) => ci.check_in_type === 'general'),
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Check In Attendee</h3>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Attendee Info */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-3 mb-3">
          <User className="w-5 h-5 text-blue-600" />
          <h4 className="text-lg font-semibold text-gray-900">{attendee.full_name}</h4>
          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
            {attendee.category}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>{attendee.events?.event_name}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Building className="w-4 h-4" />
            <span>{attendee.institution}</span>
          </div>
        </div>
        <div className="mt-3 flex space-x-6">
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

      <form onSubmit={handleFormSubmit} className="space-y-6">
        {/* Check-in Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Check-in Type *
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {CHECK_IN_TYPES.map((type) => {
              const isCheckedIn = checkInStatus[type]
              const isDisabled = isCheckedIn || 
                (type === 'meal' && !attendee.meal_entitled) ||
                (type === 'kit' && !attendee.kit_entitled)

              return (
                <label
                  key={type}
                  className={`relative flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                    isDisabled
                      ? 'bg-gray-100 border-gray-200 cursor-not-allowed'
                      : 'hover:bg-gray-50 border-gray-300'
                  }`}
                >
                  <input
                    {...register('check_in_type')}
                    type="radio"
                    value={type}
                    disabled={isDisabled}
                    className="sr-only"
                  />
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 border-2 rounded-full flex items-center justify-center ${
                      isDisabled ? 'border-gray-300' : 'border-blue-500'
                    }`}>
                      {!isDisabled && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 capitalize">
                        {type} Check-in
                      </div>
                      {isCheckedIn && (
                        <div className="text-xs text-green-600 flex items-center space-x-1">
                          <CheckCircle className="w-3 h-3" />
                          <span>Already checked in</span>
                        </div>
                      )}
                      {!attendee.meal_entitled && type === 'meal' && (
                        <div className="text-xs text-red-600">Not entitled</div>
                      )}
                      {!attendee.kit_entitled && type === 'kit' && (
                        <div className="text-xs text-red-600">Not entitled</div>
                      )}
                    </div>
                  </div>
                </label>
              )
            })}
          </div>
          {errors.check_in_type && (
            <p className="text-sm text-red-600 mt-1">{errors.check_in_type.message}</p>
          )}
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location (Optional)
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              {...register('location')}
              type="text"
              className="input w-full pl-10"
              placeholder="Enter check-in location"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes (Optional)
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
            <textarea
              {...register('notes')}
              rows={3}
              className="input w-full pl-10 resize-none"
              placeholder="Any additional notes..."
            />
          </div>
        </div>

        {/* Hidden Badge UID */}
        <input {...register('badge_uid')} type="hidden" />

        {/* Action Buttons */}
        <div className="flex space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 btn-outline btn-md"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 btn-primary btn-md disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>Check In</span>
              </div>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}


