'use client'

import { Bell, BellOff, Settings, AlertCircle } from 'lucide-react'
import React, { useState, useEffect } from 'react';


import { usePWA } from '@/hooks/usePWA'
import { logger } from '@/lib/utils/logger'

type NotificationPreferencesProps = {
  className?: string
}

export default function NotificationPreferences({ className = '' }: NotificationPreferencesProps) {
  const pwa = usePWA()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')
  const [preferences, setPreferences] = useState({
    pollNotifications: true,
    commentNotifications: true,
    systemNotifications: true,
    emailNotifications: false
  })

  useEffect(() => {
    if (pwa.notificationsSupported) {
      setNotificationPermission(pwa.notificationsPermission)
    }
  }, [pwa.notificationsSupported, pwa.notificationsPermission])

  const handleRequestPermission = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      const granted = await pwa.requestNotificationPermission()
      if (granted) {
        setNotificationPermission('granted')
        setSuccess('Notification permission granted!')
        logger.info('Notification permission granted')
      } else {
        setNotificationPermission('denied')
        setError('Notification permission denied.')
        logger.warn('Notification permission denied')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request notification permission.')
      logger.error('Error requesting notification permission:', err as Error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubscribe = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      const subscribed = await pwa.subscribeToNotifications()
      if (subscribed) {
        setSuccess('Successfully subscribed to push notifications!')
        logger.info('Subscribed to push notifications')
      } else {
        setError('Failed to subscribe to push notifications.')
        logger.error('Failed to subscribe to push notifications')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to subscribe to push notifications.')
      logger.error('Error subscribing to push notifications:', err as Error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnsubscribe = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      const unsubscribed = await pwa.unsubscribeFromNotifications()
      if (unsubscribed) {
        setSuccess('Successfully unsubscribed from push notifications.')
        logger.info('Unsubscribed from push notifications')
      } else {
        setError('Failed to unsubscribe from push notifications.')
        logger.error('Failed to unsubscribe from push notifications')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unsubscribe from push notifications.')
      logger.error('Error unsubscribing from push notifications:', err as Error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePreferenceChange = (key: keyof typeof preferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  if (!pwa.notificationsSupported) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-800">
              Notifications are not supported in your browser.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white shadow-sm rounded-lg p-6 ${className}`} data-testid="notification-preferences">
      <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
        <Settings className="h-5 w-5 mr-2 text-blue-600" /> Notification Preferences
      </h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert" data-testid="notification-error">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{success}</span>
        </div>
      )}

      <div className="space-y-4">
        {/* Permission Status */}
        <div>
          <p className="text-sm text-gray-700 mb-2">
            Current permission status: <span className={`font-medium ${notificationPermission === 'granted' ? 'text-green-600' : notificationPermission === 'denied' ? 'text-red-600' : 'text-gray-600'}`}>
              {notificationPermission.charAt(0).toUpperCase() + notificationPermission.slice(1)}
            </span>
          </p>
          
          {notificationPermission === 'default' && (
            <button
              onClick={handleRequestPermission}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              data-testid="request-notification-permission"
            >
              <Bell className="h-5 w-5 mr-2" />
              {isLoading ? 'Requesting...' : 'Request Notification Permission'}
            </button>
          )}
          
          {notificationPermission === 'granted' && (
            <div className="flex space-x-2">
              <button
                onClick={handleSubscribe}
                disabled={isLoading || pwa.notificationsEnabled}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                data-testid="subscribe-notifications"
              >
                <Bell className="h-5 w-5 mr-2" />
                {isLoading ? 'Subscribing...' : 'Subscribe to Push Notifications'}
              </button>
              <button
                onClick={handleUnsubscribe}
                disabled={isLoading || !pwa.notificationsEnabled}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                <BellOff className="h-5 w-5 mr-2" />
                {isLoading ? 'Unsubscribing...' : 'Unsubscribe'}
              </button>
            </div>
          )}
          
          {notificationPermission === 'denied' && (
            <p className="text-sm text-red-600 mt-2">
              Notifications are blocked. Please enable them in your browser settings.
            </p>
          )}
        </div>

        {/* Notification Types */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-gray-900">Notification Types</h3>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="h-5 w-5 text-blue-600" />
              <div>
                <label className="text-sm font-medium text-gray-700">Poll Notifications</label>
                <p className="text-xs text-gray-500">Get notified about new polls and results</p>
              </div>
            </div>
            <button
              onClick={() => handlePreferenceChange('pollNotifications')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.pollNotifications ? 'bg-blue-600' : 'bg-gray-200'
              }`}
              data-testid="poll-notifications-toggle"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.pollNotifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="h-5 w-5 text-green-600" />
              <div>
                <label className="text-sm font-medium text-gray-700">Comment Notifications</label>
                <p className="text-xs text-gray-500">Get notified about new comments on polls</p>
              </div>
            </div>
            <button
              onClick={() => handlePreferenceChange('commentNotifications')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.commentNotifications ? 'bg-green-600' : 'bg-gray-200'
              }`}
              data-testid="comment-notifications-toggle"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.commentNotifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="h-5 w-5 text-purple-600" />
              <div>
                <label className="text-sm font-medium text-gray-700">System Notifications</label>
                <p className="text-xs text-gray-500">Get notified about system updates and maintenance</p>
              </div>
            </div>
            <button
              onClick={() => handlePreferenceChange('systemNotifications')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.systemNotifications ? 'bg-purple-600' : 'bg-gray-200'
              }`}
              data-testid="system-notifications-toggle"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.systemNotifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
