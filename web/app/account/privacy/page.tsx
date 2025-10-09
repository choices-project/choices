'use client'

import { useState, useEffect } from 'react'
import { Shield, Eye, Download, Trash2, Settings, Lock, Globe, BarChart3, MapPin, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
// import { Switch } from '@/components/ui/switch' // Switch component not available
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

type PrivacyPreferences = {
  allowAnalytics: boolean
  allowLocationTracking: boolean
  allowUsageTracking: boolean
  allowPerformanceTracking: boolean
  allowDemographicData: boolean
  allowContactSharing: boolean
  allowResearchParticipation: boolean
  dataRetentionPreference: string
  notificationPreferences: {
    email: boolean
    push: boolean
    sms: boolean
  }
}

export default function PrivacySettingsPage() {
  const [preferences, setPreferences] = useState<PrivacyPreferences>({
    allowAnalytics: true,
    allowLocationTracking: false,
    allowUsageTracking: true,
    allowPerformanceTracking: true,
    allowDemographicData: false,
    allowContactSharing: false,
    allowResearchParticipation: false,
    dataRetentionPreference: '90_days',
    notificationPreferences: {
      email: true,
      push: true,
      sms: false
    }
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    loadPreferences()
  }, [])

  const loadPreferences = async () => {
    try {
      const response = await fetch('/api/privacy/preferences')
      if (response.ok) {
        const data = await response.json()
        setPreferences(data.preferences)
      }
    } catch {
      console.error('Failed to load preferences')
    } finally {
      setLoading(false)
    }
  }

  const savePreferences = async () => {
    setSaving(true)
    setMessage(null)
    
    try {
      const response = await fetch('/api/privacy/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Privacy preferences saved successfully!' })
      } else {
        setMessage({ type: 'error', text: 'Failed to save preferences. Please try again.' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to save preferences. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const updatePreference = (key: keyof PrivacyPreferences, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const updateNotificationPreference = (key: keyof PrivacyPreferences['notificationPreferences'], value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      notificationPreferences: {
        ...prev.notificationPreferences,
        [key]: value
      }
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading privacy settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Privacy Settings</h1>
          </div>
          <p className="text-lg text-gray-600">
            Control what data we collect and how we use it. You can change these settings at any time.
          </p>
        </div>

        {/* Message */}
        {message && (
          <Alert className={`mb-6 ${message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* Essential Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lock className="h-5 w-5 text-green-600 mr-2" />
                Essential Data (Required)
              </CardTitle>
              <CardDescription>
                This data is required for the platform to function and cannot be disabled.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <Lock className="h-4 w-4 text-green-600 mr-2" />
                    <span className="text-sm font-medium text-green-900">Account Information</span>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">Required</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <Shield className="h-4 w-4 text-green-600 mr-2" />
                    <span className="text-sm font-medium text-green-900">Voting Records</span>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">Required</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <Globe className="h-4 w-4 text-green-600 mr-2" />
                    <span className="text-sm font-medium text-green-900">Representative Data</span>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">Required</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analytics Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 text-blue-600 mr-2" />
                Analytics Data (Optional)
              </CardTitle>
              <CardDescription>
                Help us improve the platform by sharing usage data. You can opt out of any of these.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">Usage Analytics</div>
                    <div className="text-sm text-gray-600">Help us understand how you use the platform</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.allowAnalytics}
                    onChange={(e) => updatePreference('allowAnalytics', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">Performance Tracking</div>
                    <div className="text-sm text-gray-600">Monitor page load times and errors</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.allowPerformanceTracking}
                    onChange={(e) => updatePreference('allowPerformanceTracking', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">Usage Patterns</div>
                    <div className="text-sm text-gray-600">Track navigation and feature usage</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.allowUsageTracking}
                    onChange={(e) => updatePreference('allowUsageTracking', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 text-purple-600 mr-2" />
                Location Data (Optional)
              </CardTitle>
              <CardDescription>
                Location data helps us show you relevant representatives and ensure geographic accuracy in polls.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">Location Tracking</div>
                    <div className="text-sm text-gray-600">Use your location to find local representatives</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.allowLocationTracking}
                    onChange={(e) => updatePreference('allowLocationTracking', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Demographic Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="h-5 w-5 text-orange-600 mr-2" />
                Demographic Data (Optional)
              </CardTitle>
              <CardDescription>
                Demographic information helps us show you relevant polls and match you with similar voters.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">Demographic Sharing</div>
                    <div className="text-sm text-gray-600">Share age, education, and other demographics</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.allowDemographicData}
                    onChange={(e) => updatePreference('allowDemographicData', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact & Research */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 text-indigo-600 mr-2" />
                Contact & Research (Optional)
              </CardTitle>
              <CardDescription>
                Control how we can contact you and whether you want to participate in research.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">Contact Sharing</div>
                    <div className="text-sm text-gray-600">Allow other users to contact you</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.allowContactSharing}
                    onChange={(e) => updatePreference('allowContactSharing', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">Research Participation</div>
                    <div className="text-sm text-gray-600">Participate in research studies and surveys</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.allowResearchParticipation}
                    onChange={(e) => updatePreference('allowResearchParticipation', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 text-blue-600 mr-2" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose how you want to receive notifications from the platform.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">Email Notifications</div>
                    <div className="text-sm text-gray-600">Receive updates via email</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.notificationPreferences.email}
                    onChange={(e) => updateNotificationPreference('email', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">Push Notifications</div>
                    <div className="text-sm text-gray-600">Receive browser notifications</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.notificationPreferences.push}
                    onChange={(e) => updateNotificationPreference('push', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">SMS Notifications</div>
                    <div className="text-sm text-gray-600">Receive text message updates</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.notificationPreferences.sms}
                    onChange={(e) => updateNotificationPreference('sms', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Retention */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 text-gray-600 mr-2" />
                Data Retention
              </CardTitle>
              <CardDescription>
                Choose how long we keep your data before automatic deletion.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { value: '30_days', label: '30 Days', description: 'Quick deletion' },
                    { value: '90_days', label: '90 Days', description: 'Standard retention' },
                    { value: '1_year', label: '1 Year', description: 'Extended retention' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => updatePreference('dataRetentionPreference', option.value)}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        preferences.dataRetentionPreference === option.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-gray-900">{option.label}</div>
                      <div className="text-sm text-gray-600">{option.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={savePreferences} disabled={saving} className="flex-1">
              {saving ? 'Saving...' : 'Save Privacy Settings'}
            </Button>
            <Button variant="outline" asChild className="flex-1">
              <a href="/privacy">View Full Privacy Policy</a>
            </Button>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Manage your data and account settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" asChild>
                  <a href="/account/export" className="flex items-center">
                    <Download className="h-4 w-4 mr-2" />
                    Download Your Data
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="/account/delete" className="flex items-center text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
