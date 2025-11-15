'use client'

import { useState, useEffect, useRef } from 'react'
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { parseBadgeQRData, validateQRCodeData } from '@/lib/qr-code'
import { Camera, X, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface QRCodeScannerProps {
  onScanSuccess: (badgeUID: string, qrData: any) => void
  onScanError?: (error: string) => void
  className?: string
}

export function QRCodeScanner({ 
  onScanSuccess, 
  onScanError,
  className = '' 
}: QRCodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [scanner, setScanner] = useState<Html5QrcodeScanner | null>(null)
  const [lastScanResult, setLastScanResult] = useState<string | null>(null)
  const [scanError, setScanError] = useState<string | null>(null)
  const scannerRef = useRef<HTMLDivElement>(null)

  const startScanning = () => {
    if (isScanning) return

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
      supportedScanTypes: [Html5QrcodeSupportedFormats.QR_CODE]
    }

    const html5QrcodeScanner = new Html5QrcodeScanner(
      'qr-scanner',
      config,
      false
    )

    html5QrcodeScanner.render(
      (decodedText, decodedResult) => {
        handleScanSuccess(decodedText, decodedResult)
      },
      (errorMessage) => {
        // Handle scan errors silently for continuous scanning
        if (errorMessage !== 'NotFoundException') {
          setScanError(errorMessage)
        }
      }
    )

    setScanner(html5QrcodeScanner)
    setIsScanning(true)
    setScanError(null)
  }

  const stopScanning = () => {
    if (scanner) {
      scanner.clear().catch(console.error)
      setScanner(null)
    }
    setIsScanning(false)
    setScanError(null)
  }

  const handleScanSuccess = (decodedText: string, decodedResult: any) => {
    setLastScanResult(decodedText)
    
    // Validate QR code data
    if (!validateQRCodeData(decodedText)) {
      const errorMsg = 'Invalid QR code format'
      setScanError(errorMsg)
      onScanError?.(errorMsg)
      toast.error(errorMsg)
      return
    }

    const qrData = parseBadgeQRData(decodedText)
    if (!qrData) {
      const errorMsg = 'Failed to parse QR code data'
      setScanError(errorMsg)
      onScanError?.(errorMsg)
      toast.error(errorMsg)
      return
    }

    // Success
    onScanSuccess(qrData.badge_uid, qrData)
    toast.success(`QR Code scanned: ${qrData.badge_uid}`)
    
    // Stop scanning after successful scan
    stopScanning()
  }

  useEffect(() => {
    return () => {
      if (scanner) {
        scanner.clear().catch(console.error)
      }
    }
  }, [scanner])

  return (
    <div className={`bg-white rounded-lg border p-6 ${className}`}>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          QR Code Scanner
        </h3>

        {!isScanning ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center w-64 h-64 mx-auto bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-center">
                <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">Click to start scanning</p>
              </div>
            </div>
            
            <button
              onClick={startScanning}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Camera className="w-5 h-5" />
              <span>Start Scanning</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <div id="qr-scanner" ref={scannerRef}></div>
              
              <button
                onClick={stopScanning}
                className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {scanError && (
              <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-sm text-red-700">{scanError}</p>
              </div>
            )}

            {lastScanResult && (
              <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-sm text-green-700">
                  Last scan: {lastScanResult.substring(0, 50)}...
                </p>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 text-sm text-gray-600">
          <p>Point your camera at a badge QR code to scan</p>
        </div>
      </div>
    </div>
  )
}

