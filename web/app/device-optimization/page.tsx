'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDeviceDetection } from '@/hooks/useDeviceDetection'

// UI Components
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

// Icons
import { ArrowLeft, Smartphone, Monitor, Tablet, Wifi, WifiOff, Zap, Camera, MapPin, Download, Settings, AlertCircle } from 'lucide-react'

// Utilities
import { devLog } from '@/lib/logger'

export default function DeviceOptimizationPage() {
  const router = useRouter()
  const {
    deviceInfo,
    capabilities,
    optimizationSettings,
    isLoading,
    error,
    updateOptimizationSettings,
    checkNetworkStatus,
    requestCameraAccess,
    requestLocationAccess,
    enableOfflineMode
  } = useDeviceDetection()

  const [networkStatus, setNetworkStatus] = useState<{ online: boolean; speed: 'slow' | 'medium' | 'fast' } | null>(null)
  const [isCheckingNetwork, setIsCheckingNetwork] = useState(false)
  const [isEnablingOffline, setIsEnablingOffline] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleNetworkCheck = useCallback(async () => {
    setIsCheckingNetwork(true)
    try {
      const status = await checkNetworkStatus()
      setNetworkStatus(status)
      devLog('Network status:', status)
    } catch (error) {
      devLog('Error checking network status:', error)
    } finally {
      setIsCheckingNetwork(false)
    }
  }, [checkNetworkStatus])

  const handleOfflineModeToggle = useCallback(async () => {
    if (!optimizationSettings?.offline_mode) {
      setIsEnablingOffline(true)
      try {
        const success = await enableOfflineMode()
        if (success) {
          updateOptimizationSettings({ offline_mode: true })
        }
      } catch (error) {
        devLog('Error enabling offline mode:', error)
      } finally {
        setIsEnablingOffline(false)
      }
    } else {
      updateOptimizationSettings({ offline_mode: false })
    }
  }, [optimizationSettings?.offline_mode, enableOfflineMode, updateOptimizationSettings])

  const handleSettingToggle = useCallback((setting: string, value: boolean) => {
    updateOptimizationSettings({ [setting]: value })
  }, [updateOptimizationSettings])

  const getDeviceIcon = useCallback((type: string) => {
    switch (type) {
      case 'mobile': return <Smartphone className="h-6 w-6" />
      case 'tablet': return <Tablet className="h-6 w-6" />
      case 'desktop': return <Monitor className="h-6 w-6" />
      default: return <Monitor className="h-6 w-6" />
    }
  }, [])

  const getNetworkIcon = useCallback((online: boolean, speed: string) => {
    if (!online) return <WifiOff className="h-5 w-5 text-red-500" />
    switch (speed) {
      case 'slow': return <Wifi className="h-5 w-5 text-yellow-500" />
      case 'fast': return <Wifi className="h-5 w-5 text-green-500" />
      default: return <Wifi className="h-5 w-5 text-blue-500" />
    }
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Detecting device capabilities...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Failed to detect device capabilities: {error}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  if (!deviceInfo || !capabilities || !optimizationSettings) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Device information not available</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Device Optimization</h1>
                <p className="text-gray-600">Optimize your experience for your device</p>
              </div>
            </div>
            <Button
              onClick={() => setShowAdvanced(!showAdvanced)}
              variant="outline"
              className="flex items-center"
            >
              <Settings className="h-4 w-4 mr-2" />
              {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Device Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Device Information
              </CardTitle>
              <CardDescription>
                Your device capabilities and current settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Device Type */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getDeviceIcon(deviceInfo.type)}
                  <div>
                    <p className="font-medium">Device Type</p>
                    <p className="text-sm text-gray-600 capitalize">{deviceInfo.type}</p>
                  </div>
                </div>
                <Badge variant="outline" className="capitalize">
                  {deviceInfo.os} • {deviceInfo.browser}
                </Badge>
              </div>

              {/* Screen Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Screen Resolution</p>
                  <p className="text-sm text-gray-600">
                    {deviceInfo.screen_size.width} × {deviceInfo.screen_size.height}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Pixel Ratio</p>
                  <p className="text-sm text-gray-600">{deviceInfo.pixel_ratio}x</p>
                </div>
              </div>

              {/* Capabilities */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Capabilities</p>
                <div className="flex flex-wrap gap-2">
                  {capabilities.offline_support && (
                    <Badge variant="secondary" className="text-xs">
                      <Download className="h-3 w-3 mr-1" />
                      Offline Support
                    </Badge>
                  )}
                  {capabilities.push_notifications && (
                    <Badge variant="secondary" className="text-xs">
                      <Zap className="h-3 w-3 mr-1" />
                      Push Notifications
                    </Badge>
                  )}
                  {capabilities.camera_access && (
                    <Badge variant="secondary" className="text-xs">
                      <Camera className="h-3 w-3 mr-1" />
                      Camera Access
                    </Badge>
                  )}
                  {capabilities.location_access && (
                    <Badge variant="secondary" className="text-xs">
                      <MapPin className="h-3 w-3 mr-1" />
                      Location Access
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Network Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Wifi className="h-5 w-5 mr-2" />
                Network Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {networkStatus ? getNetworkIcon(networkStatus.online, networkStatus.speed) : <Wifi className="h-5 w-5" />}
                  <div>
                    <p className="font-medium">Connection</p>
                    <p className="text-sm text-gray-600">
                      {networkStatus ? (
                        networkStatus.online ? `Online (${networkStatus.speed})` : 'Offline'
                      ) : (
                        'Unknown'
                      )}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleNetworkCheck}
                  disabled={isCheckingNetwork}
                  size="sm"
                  variant="outline"
                >
                  {isCheckingNetwork ? 'Checking...' : 'Check Status'}
                </Button>
              </div>

              {capabilities.battery_level !== undefined && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Battery Level</p>
                    <span className="text-sm text-gray-600">{capabilities.battery_level.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${capabilities.battery_level}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Optimization Settings */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Optimization Settings
              </CardTitle>
              <CardDescription>
                Adjust settings for optimal performance on your device
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Image Quality */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">High Quality Images</p>
                    <p className="text-sm text-gray-600">
                      {optimizationSettings.image_quality === 'high' ? 'Enabled' : 'Optimized for performance'}
                    </p>
                  </div>
                  <Button
                    variant={optimizationSettings.image_quality === 'high' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleSettingToggle('image_quality', optimizationSettings.image_quality !== 'high')}
                  >
                    {optimizationSettings.image_quality === 'high' ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>

                {/* Animations */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Animations</p>
                    <p className="text-sm text-gray-600">
                      {optimizationSettings.animation_enabled ? 'Smooth animations' : 'Reduced motion'}
                    </p>
                  </div>
                  <Button
                    variant={optimizationSettings.animation_enabled ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleSettingToggle('animation_enabled', !optimizationSettings.animation_enabled)}
                  >
                    {optimizationSettings.animation_enabled ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>

                {/* Real-time Updates */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Real-time Updates</p>
                    <p className="text-sm text-gray-600">
                      {optimizationSettings.realtimeupdates ? 'Live updates enabled' : 'Manual refresh only'}
                    </p>
                  </div>
                  <Button
                    variant={optimizationSettings.realtimeupdates ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleSettingToggle('realtimeupdates', !optimizationSettings.realtimeupdates)}
                  >
                    {optimizationSettings.realtimeupdates ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>

                {/* Data Saver */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Data Saver</p>
                    <p className="text-sm text-gray-600">
                      {optimizationSettings.datasaver ? 'Reduced data usage' : 'Full content'}
                    </p>
                  </div>
                  <Button
                    variant={optimizationSettings.datasaver ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleSettingToggle('datasaver', !optimizationSettings.datasaver)}
                  >
                    {optimizationSettings.datasaver ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>

                {/* Offline Mode */}
                {capabilities.offlinesupport && (
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Offline Mode</p>
                      <p className="text-sm text-gray-600">
                        {optimizationSettings.offlinemode ? 'Available offline' : 'Online only'}
                      </p>
                    </div>
                    <Button
                      variant={optimizationSettings.offlinemode ? 'default' : 'outline'}
                      size="sm"
                      onClick={handleOfflineModeToggle}
                      disabled={isEnablingOffline}
                    >
                      {isEnablingOffline ? 'Enabling...' : (optimizationSettings.offlinemode ? 'Enabled' : 'Disabled')}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Advanced Features */}
          {showAdvanced && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="h-5 w-5 mr-2" />
                  Advanced Features
                </CardTitle>
                <CardDescription>
                  Access device-specific features and permissions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Camera Access */}
                  {capabilities.cameraaccess && (
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Camera className="h-5 w-5" />
                        <div>
                          <p className="font-medium">Camera Access</p>
                          <p className="text-sm text-gray-600">Use camera for profile photos</p>
                        </div>
                      </div>
                      <Button
                        onClick={requestCameraAccess}
                        size="sm"
                        variant="outline"
                      >
                        Request Access
                      </Button>
                    </div>
                  )}

                  {/* Location Access */}
                  {capabilities.locationaccess && (
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <MapPin className="h-5 w-5" />
                        <div>
                          <p className="font-medium">Location Access</p>
                          <p className="text-sm text-gray-600">Enable location-based features</p>
                        </div>
                      </div>
                      <Button
                        onClick={requestLocationAccess}
                        size="sm"
                        variant="outline"
                      >
                        Request Access
                      </Button>
                    </div>
                  )}

                  {/* Storage Information */}
                  {capabilities.storagequota > 0 && (
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center space-x-3 mb-2">
                        <Download className="h-5 w-5" />
                        <p className="font-medium">Available Storage</p>
                      </div>
                      <p className="text-sm text-gray-600">
                        {Math.round(capabilities.storagequota / (1024 * 1024 * 1024))} GB available
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
