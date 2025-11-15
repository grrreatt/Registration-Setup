'use client'

import { useState, useEffect } from 'react'
import { generateQRCode, createBadgeQRData } from '@/lib/qr-code'
import { Download, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

interface QRCodeGeneratorProps {
  badgeUID: string
  eventCode?: string
  attendeeName?: string
  className?: string
}

export function QRCodeGenerator({ 
  badgeUID, 
  eventCode, 
  attendeeName,
  className = '' 
}: QRCodeGeneratorProps) {
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    generateQR()
  }, [badgeUID, eventCode])

  const generateQR = async () => {
    setIsGenerating(true)
    try {
      const qrData = createBadgeQRData(badgeUID, eventCode)
      const dataURL = await generateQRCode(qrData, {
        width: 256,
        margin: 2,
        color: {
          dark: '#1f2937',
          light: '#ffffff'
        }
      })
      setQrCodeDataURL(dataURL)
    } catch (error) {
      console.error('Error generating QR code:', error)
      toast.error('Failed to generate QR code')
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadQRCode = () => {
    if (!qrCodeDataURL) return

    const link = document.createElement('a')
    link.download = `badge-${badgeUID}-qr.png`
    link.href = qrCodeDataURL
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast.success('QR code downloaded')
  }

  const copyQRData = async () => {
    const qrData = createBadgeQRData(badgeUID, eventCode)
    try {
      await navigator.clipboard.writeText(qrData)
      setCopied(true)
      toast.success('QR data copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy QR data')
    }
  }

  if (isGenerating) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}>
        <div className="text-center p-8">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Generating QR Code...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg border p-6 ${className}`}>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Badge QR Code
        </h3>
        
        {qrCodeDataURL && (
          <div className="mb-4">
            <img
              src={qrCodeDataURL}
              alt={`QR Code for ${badgeUID}`}
              className="mx-auto border rounded-lg shadow-sm"
              style={{ width: 256, height: 256 }}
            />
          </div>
        )}

        <div className="space-y-2 mb-4">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Badge ID:</span> {badgeUID}
          </p>
          {attendeeName && (
            <p className="text-sm text-gray-600">
              <span className="font-medium">Name:</span> {attendeeName}
            </p>
          )}
          {eventCode && (
            <p className="text-sm text-gray-600">
              <span className="font-medium">Event:</span> {eventCode}
            </p>
          )}
        </div>

        <div className="flex space-x-3 justify-center">
          <button
            onClick={downloadQRCode}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </button>
          
          <button
            onClick={copyQRData}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            {copied ? (
              <Check className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            <span>{copied ? 'Copied' : 'Copy Data'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
