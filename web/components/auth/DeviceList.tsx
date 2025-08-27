'use client'

import { useState, useEffect, useCallback } from 'react'
import { Smartphone, Monitor, Tablet, X, QrCode, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getUserCredentials, removeCredential, generateQRCodeData } from '@/lib/webauthn'

interface Device {
  id: string
  name: string
  type: string
  lastUsed: string
  isCurrent: boolean
  authenticatorType: string
}

interface DeviceListProps {
  userId: string
  className?: string
  onDeviceRemoved?: () => void
}

export default function DeviceList({ userId, className = '', onDeviceRemoved }: DeviceListProps) {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [removingDevice, setRemovingDevice] = useState<string | null>(null)
  const [showQRCode, setShowQRCode] = useState<string | null>(null)
  const [qrCodeData, setQrCodeData] = useState<string>('')

  const loadDevices = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      
      const result = await getUserCredentials(userId)
      
      if (result.success && result.credentials) {
        setDevices(result.credentials.map((cred: any) => ({
          id: cred.id,
          name: cred.name || getDeviceName(cred.deviceInfo),
          type: cred.deviceInfo?.deviceType || 'unknown',
          lastUsed: cred.lastUsed || 'Never',
          isCurrent: cred.isCurrent || false,
          authenticatorType: cred.authenticatorType || 'unknown'
        })))
      } else {
        setError(result.error || 'Failed to load devices')
      }
    } catch (err) {
      setError('Failed to load devices')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    loadDevices()
  }, [loadDevices])

  const getDeviceName = (deviceInfo: any) => {
    if (!deviceInfo) return 'Unknown Device'
    
    const { deviceType, browser, platform } = deviceInfo
    
    if (deviceType === 'ios') {
      return platform === 'apple' ? 'iPhone/iPad' : 'iOS Device'
    } else if (deviceType === 'android') {
      return 'Android Device'
    } else if (deviceType === 'macos') {
      return 'Mac'
    } else if (deviceType === 'windows') {
      return 'Windows PC'
    } else if (deviceType === 'linux') {
      return 'Linux PC'
    }
    
    return `${deviceType} (${browser})`
  }

  const getDeviceIcon = (device: Device) => {
    switch (device.type) {
      case 'ios':
        return <Smartphone className="w-5 h-5" />
      case 'android':
        return <Smartphone className="w-5 h-5" />
      case 'macos':
      case 'windows':
      case 'linux':
        return <Monitor className="w-5 h-5" />
      default:
        return <Tablet className="w-5 h-5" />
    }
  }

  const handleRemoveDevice = async (deviceId: string) => {
    if (!confirm('Are you sure you want to remove this device? You won\'t be able to sign in with it anymore.')) {
      return
    }

    try {
      setRemovingDevice(deviceId)
      
      const result = await removeCredential(deviceId)
      
      if (result.success) {
        setDevices(devices.filter(d => d.id !== deviceId))
        onDeviceRemoved?.()
      } else {
        setError(result.error || 'Failed to remove device')
      }
    } catch (err) {
      setError('Failed to remove device')
    } finally {
      setRemovingDevice(null)
    }
  }

  const handleShowQRCode = async (deviceId: string) => {
    try {
      const result = await generateQRCodeData(userId)
      
      if (result.success && result.qrData) {
        setQrCodeData(result.qrData)
        setShowQRCode(deviceId)
      } else {
        setError(result.error || 'Failed to generate QR code')
      }
    } catch (err) {
      setError('Failed to generate QR code')
    }
  }

  const handleHideQRCode = () => {
    setShowQRCode(null)
    setQrCodeData('')
  }

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="text-red-600 bg-red-50 p-4 rounded-lg">
          <p className="font-semibold">Error loading devices</p>
          <p className="text-sm">{error}</p>
          <Button 
            onClick={loadDevices} 
            variant="outline" 
            size="sm" 
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Trusted Devices</h2>
        <Button 
          onClick={loadDevices} 
          variant="outline" 
          size="sm"
        >
          Refresh
        </Button>
      </div>

      {devices.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-gray-500 mb-4">
              <Smartphone className="w-12 h-12 mx-auto mb-2" />
              <p>No trusted devices found</p>
              <p className="text-sm">Add a device to enable biometric sign-in</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {devices.map((device) => (
            <Card key={device.id} className="relative">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-gray-600">
                      {getDeviceIcon(device)}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {device.name}
                        {device.isCurrent && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {device.authenticatorType} • Last used: {device.lastUsed}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShowQRCode(device.id)}
                      disabled={showQRCode === device.id}
                    >
                      <QrCode className="w-4 h-4" />
                    </Button>
                    
                    {!device.isCurrent && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveDevice(device.id)}
                        disabled={removingDevice === device.id}
                        className="text-red-600 hover:text-red-700"
                      >
                        {removingDevice === device.id ? (
                          <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                {showQRCode === device.id && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">QR Code for {device.name}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleHideQRCode}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="bg-white p-4 rounded border">
                      <div className="text-center text-sm text-gray-600">
                        QR Code data: {qrCodeData}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}



