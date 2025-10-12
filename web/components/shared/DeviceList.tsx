'use client'

import { Smartphone, Monitor, Tablet, Laptop, Trash2, Plus, QrCode } from 'lucide-react'
import React, { useState, useCallback, useMemo, useEffect } from 'react'
import QRCode from 'qrcode'

interface Device {
  id: string
  name: string
  type: 'mobile' | 'desktop' | 'tablet' | 'laptop'
  lastUsed: string
  isActive: boolean
  icon?: string
}

interface DeviceListProps {
  devices: Device[]
  onAddDevice?: () => void
  onRemoveDevice?: (deviceId: string) => void
  onGenerateQR?: (deviceId: string) => void
  className?: string
  isLoading?: boolean
  hasError?: boolean
  onRetry?: () => void
}

const getDeviceIcon = (type: Device['type']) => {
  switch (type) {
    case 'mobile':
      return <Smartphone className="w-5 h-5" />
    case 'desktop':
      return <Monitor className="w-5 h-5" />
    case 'tablet':
      return <Tablet className="w-5 h-5" />
    case 'laptop':
      return <Laptop className="w-5 h-5" />
    default:
      return <Smartphone className="w-5 h-5" />
  }
}

export const DeviceList: React.FC<DeviceListProps> = ({
  devices,
  onAddDevice,
  onRemoveDevice,
  onGenerateQR,
  className = '',
  isLoading = false,
  hasError = false,
  onRetry,
}) => {
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null)
  const [showQRCode, setShowQRCode] = useState<string | null>(null)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')

  // Memoize devices to prevent unnecessary re-renders
  const memoizedDevices = useMemo(() => devices, [devices])

  const handleRemoveDevice = useCallback((deviceId: string) => {
    if (onRemoveDevice) {
      onRemoveDevice(deviceId)
    }
  }, [onRemoveDevice])

  const handleGenerateQR = useCallback((deviceId: string) => {
    if (onGenerateQR) {
      onGenerateQR(deviceId)
      setShowQRCode(deviceId)
    }
  }, [onGenerateQR])

  // Generate QR code when showQRCode changes
  useEffect(() => {
    if (showQRCode) {
      const generateQR = async () => {
        try {
          const device = devices.find(d => d.id === showQRCode)
          if (device) {
            const qrData = JSON.stringify({
              deviceId: device.id,
              deviceName: device.name,
              deviceType: device.type,
              timestamp: new Date().toISOString(),
              setupUrl: `${window.location.origin}/devices/setup/${device.id}`
            })
            
            const qrDataUrl = await QRCode.toDataURL(qrData, {
              width: 128,
              margin: 2,
              color: {
                dark: '#000000',
                light: '#FFFFFF'
              }
            })
            setQrCodeDataUrl(qrDataUrl)
          }
        } catch (error) {
          console.error('Failed to generate QR code:', error)
        }
      }
      
      generateQR()
    }
  }, [showQRCode, devices])

  const handleAddDevice = useCallback(() => {
    if (onAddDevice) {
      onAddDevice()
    }
  }, [onAddDevice])

  const handleRetry = useCallback(() => {
    if (onRetry) {
      onRetry()
    }
  }, [onRetry])

  // Loading state
  if (isLoading) {
    return (
      <div 
        className={`device-list ${className}`}
        data-testid="device-list"
      >
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2">Loading devices...</span>
        </div>
      </div>
    )
  }

  // Error state
  if (hasError) {
    return (
      <div 
        className={`device-list ${className}`}
        data-testid="device-list"
      >
        <div className="flex flex-col items-center justify-center p-8">
          <span className="text-red-600 mb-4">Failed to load devices</span>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            data-testid="retry-button"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Empty state
  if (memoizedDevices.length === 0) {
    return (
      <div 
        className={`device-list ${className}`}
        data-testid="device-list"
      >
        <div className="flex flex-col items-center justify-center p-8">
          <span className="text-gray-500 mb-4">No devices found</span>
          {onAddDevice && (
            <button
              onClick={handleAddDevice}
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              data-testid="add-device-button"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Device
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div 
      className={`device-list ${className}`}
      data-testid="device-list"
      role="list"
      aria-label="Device list"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Your Devices</h3>
        {onAddDevice && (
          <button
            onClick={handleAddDevice}
            className="flex items-center px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            data-testid="add-device-button"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Device
          </button>
        )}
      </div>

      {/* Device List */}
      <div className="space-y-3">
        {memoizedDevices.map((device) => (
          <div
            key={device.id}
            className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
              selectedDevice === device.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
            }`}
            data-testid="device-item"
            role="listitem"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setSelectedDevice(device.id)
              }
            }}
            onClick={() => setSelectedDevice(device.id)}
          >
            {/* Device Info */}
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {getDeviceIcon(device.type)}
              </div>
              <div>
                <h4 className="font-medium text-gray-900">{device.name}</h4>
                <p className="text-sm text-gray-500">
                  Last used: {new Date(device.lastUsed).toLocaleDateString()}
                </p>
                {device.isActive && (
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                )}
              </div>
            </div>

            {/* Device Actions */}
            <div className="flex items-center space-x-2">
              {onGenerateQR && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleGenerateQR(device.id)
                  }}
                  className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded"
                  title="Generate QR Code"
                  data-testid="qr-code-button"
                >
                  <QrCode className="w-4 h-4" />
                </button>
              )}
              
              {onRemoveDevice && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemoveDevice(device.id)
                  }}
                  className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded"
                  title="Remove Device"
                  data-testid="remove-device-button"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* QR Code Modal */}
      {showQRCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">QR Code for Device Setup</h3>
            <div className="bg-gray-100 p-4 rounded text-center">
              <div className="w-32 h-32 bg-white mx-auto mb-4 flex items-center justify-center">
                {qrCodeDataUrl ? (
                  <img 
                    src={qrCodeDataUrl} 
                    alt="QR Code for device setup" 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-gray-500">Generating QR Code...</span>
                )}
              </div>
              <p className="text-sm text-gray-600">
                Scan this QR code with your device to complete setup
              </p>
            </div>
            <button
              onClick={() => setShowQRCode(null)}
              className="mt-4 w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Export for testing
export default DeviceList
