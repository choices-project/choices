'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, CheckCircle, AlertCircle } from 'lucide-react'
import { usePWA } from '@/hooks/usePWA'

type NotificationPermissionState = 'default' | 'granted' | 'denied'

type NotificationPermissionProps = {
  className?: string
}

export default function NotificationPermission({ className = '' }: NotificationPermissionProps) {
  const pwa = usePWA()
  const [permission, setPermission] = useState<NotificationPermissionState>('default')
  const [isRequesting, setIsRequesting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (pwa.notificationsSupported) {
      setPermission(pwa.notificationsPermission)
    }
  }, [pwa.notificationsSupported, pwa.notificationsPermission])

  const handleRequestPermission = async () => {
    setIsRequesting(true)
    setError(null)
    
    try {
      const granted = await pwa.requestNotificationPermission()
      if (granted) {
        setPermission('granted')
      } else {
        setPermission('denied')
        setError('Notification permission denied')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request permission')
    } finally {
      setIsRequesting(false)
    }
  }

  if (!pwa.notificationsSupported) {
    return (
      <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-2 text-yellow-800">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">Notifications are not supported in your browser</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Bell className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-medium text-gray-800">Notification Permission</h3>
        </div>
        <span className={`text-xs px-2 py-1 rounded ${
          permission === 'granted' ? 'bg-green-100 text-green-800' :
          permission === 'denied' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {permission.charAt(0).toUpperCase() + permission.slice(1)}
        </span>
      </div>

      {permission === 'default' && (
        <button
          onClick={handleRequestPermission}
          disabled={isRequesting}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          data-testid="request-notification-permission"
        >
          {isRequesting ? 'Requesting...' : 'Request Permission'}
        </button>
      )}

      {permission === 'granted' && (
        <div className="flex items-center space-x-2 text-green-800">
          <CheckCircle className="w-5 h-5" />
          <span className="text-sm">Notifications are enabled</span>
        </div>
      )}

      {permission === 'denied' && (
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-red-800">
            <BellOff className="w-5 h-5" />
            <span className="text-sm">Notifications are blocked</span>
          </div>
          <p className="text-xs text-gray-600">
            Please enable notifications in your browser settings
          </p>
        </div>
      )}

      {error && (
        <div className="mt-2 p-2 bg-red-100 rounded border">
          <div className="flex items-center space-x-2 text-red-800">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}
    </div>
  )
}
