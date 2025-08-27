'use client'

import { useState, useEffect } from 'react'
import { 
  Smartphone, 
  Monitor, 
  Tablet, 
  Trash2, 
  Plus, 
  QrCode,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react'
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
  onAddDevice: () => void
  onDeviceRemoved: () => void
  className?: string
}

export default function DeviceList({ 
  userId, 
  onAddDevice, 
  onDeviceRemoved, 
  className = '' 
}: DeviceListProps) {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [removingDevice, setRemovingDevice] = useState<string | null>(null)
  const [showQRCode, setShowQRCode] = useState<string | null>(null)
  const [qrCodeData, setQrCodeData] = useState<string>('')

  useEffect(() => {
    loadDevices()
  }, [userId])

  const loadDevices = async () => {
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
  }

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
        onDeviceRemoved()
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

  const handleAddDevice = () => {
    onAddDevice()
  }

     if (loading) {
     return (
       <div className={`space-y-4 ${className}`}>
         <div data-testid="loading-indicator" className="flex items-center justify-center py-8">
           <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
           <span className="ml-2 text-gray-600">Loading devices...</span>
         </div>
       </div>
     )
   }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Your Devices</h3>
        <button
          onClick={handleAddDevice}
          className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Device</span>
        </button>
      </div>

             {/* Error Message */}
       {error && (
         <div data-testid="error-message" className="bg-red-50 border border-red-200 rounded-md p-3">
           <div className="flex items-center space-x-2">
             <AlertCircle className="w-5 h-5 text-red-600" />
             <span className="text-sm text-red-700">{error}</span>
           </div>
         </div>
       )}

             {/* Device List */}
       {devices.length === 0 ? (
         <div data-testid="empty-state" className="text-center py-8">
           <Smartphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
           <h4 className="text-lg font-medium text-gray-900 mb-2">No devices found</h4>
           <p className="text-gray-600 mb-4">
             You haven't set up biometric authentication on any devices yet.
           </p>
           <button
             data-testid="add-device-button"
             onClick={handleAddDevice}
             className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
           >
             <Plus className="w-4 h-4" />
             <span>Set up your first device</span>
           </button>
         </div>
       ) : (
         <div className="space-y-3">
           {devices.map((device) => (
             <div
               key={device.id}
               data-testid="device-item"
               className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
             >
                               <div className="flex items-center justify-between">
                   <div className="flex items-center space-x-3">
                     <div className="flex-shrink-0">
                       <div data-testid="device-icon">
                         {getDeviceIcon(device)}
                       </div>
                     </div>
                     <div>
                       <div className="flex items-center space-x-2">
                         <h4 data-testid="device-name" className="text-sm font-medium text-gray-900">
                           {device.name}
                         </h4>
                         {device.isCurrent && (
                           <span data-testid="current-badge" className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                             Current
                           </span>
                         )}
                       </div>
                       <p className="text-sm text-gray-500">
                         {device.authenticatorType} • Last used {device.lastUsed}
                       </p>
                     </div>
                   </div>
                
                                 <div className="flex items-center space-x-2">
                   {/* QR Code Button */}
                   <button
                     data-testid="qr-code-button"
                     onClick={() => handleShowQRCode(device.id)}
                     className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                     title="Show QR code for setup"
                   >
                     <QrCode className="w-4 h-4" />
                   </button>
                   
                   {/* Remove Button */}
                   {!device.isCurrent && (
                     <button
                       data-testid="remove-button"
                       onClick={() => handleRemoveDevice(device.id)}
                       disabled={removingDevice === device.id}
                       className="p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                       title="Remove device"
                     >
                       {removingDevice === device.id ? (
                         <Loader2 className="w-4 h-4 animate-spin" />
                       ) : (
                         <Trash2 className="w-4 h-4" />
                       )}
                     </button>
                   )}
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}

             {/* QR Code Modal */}
       {showQRCode && (
         <div data-testid="qr-code-modal" className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
             <div className="text-center">
               <h3 className="text-lg font-medium text-gray-900 mb-4">
                 Add Another Device
               </h3>
               <p className="text-sm text-gray-600 mb-4">
                 Scan this QR code with your other device to set up biometric authentication.
               </p>
               
               {/* QR Code Display */}
               <div className="bg-gray-100 rounded-lg p-4 mb-4">
                 <div data-testid="qr-code-data" className="text-xs font-mono break-all text-gray-600">
                   {qrCodeData}
                 </div>
               </div>
               
               <div className="flex space-x-3">
                 <button
                   data-testid="close-modal"
                   onClick={() => setShowQRCode(null)}
                   className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                 >
                   Close
                 </button>
                 <button
                   data-testid="copy-qr-code"
                   onClick={() => {
                     navigator.clipboard.writeText(qrCodeData)
                     // Show success message
                   }}
                   className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                 >
                   Copy Code
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
        <div className="flex items-start space-x-2">
          <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-blue-900 mb-1">
              Multiple devices supported
            </h4>
            <p className="text-sm text-blue-700">
              You can use biometric authentication on multiple devices. Each device will have its own secure credentials.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}



