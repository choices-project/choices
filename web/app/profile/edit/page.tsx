'use client'

import { useAuth } from '@/contexts/AuthContext'
import { devLog } from '@/lib/logger';
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback, createContext, useContext } from 'react'
import { ArrowLeft, Save, User, Heart, Shield } from 'lucide-react'

interface UserProfile {
  id: string
  user_id: string
  display_name: string
  bio: string | null
  primary_concerns: string[]
  community_focus: string[]
  participation_style: 'observer' | 'contributor' | 'leader'
  demographics: any
  privacy_settings: any
  created_at: string
  updated_at: string
}

export default function EditProfilePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    display_name: '',
    bio: '',
    primary_concerns: [] as string[],
    community_focus: [] as string[],
    participation_style: 'observer' as 'observer' | 'contributor' | 'leader',
    privacy_settings: {
      shareProfile: false,
      shareDemographics: false,
      shareParticipation: false,
      allowAnalytics: false
    }
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirectTo=/profile/edit')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      loadProfile()
    }
  }, [user])

  const loadProfile = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/profile')
      if (response.ok) {
        const data = await response.json()
        if (data.profile) {
          setProfile(data.profile)
          setFormData({
            display_name: data.profile.display_name || '',
            bio: data.profile.bio || '',
            primary_concerns: data.profile.primary_concerns || [],
            community_focus: data.profile.community_focus || [],
            participation_style: data.profile.participation_style || 'observer',
            privacy_settings: data.profile.privacy_settings || {
              shareProfile: false,
              shareDemographics: false,
              shareParticipation: false,
              allowAnalytics: false
            }
          })
        }
      }
    } catch (error) {
      devLog('Error loading profile:', error)
      setError('Failed to load profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setError(null)
      setSuccess(null)

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setSuccess('Profile updated successfully!')
        // Reload profile data
        await loadProfile()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update profile')
      }
    } catch (error: any) {
      devLog('Error saving profile:', error)
      setError(error instanceof Error ? error.message : "Unknown error" || 'Failed to save profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handlePrivacyChange = (setting: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      privacy_settings: {
        ...prev.privacy_settings,
        [setting]: value
      }
    }))
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </button>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`
                flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors
                ${isSaving 
                  ? 'bg-gray-400 text-white cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
                }
              `}
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800">{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Basic Information */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Basic Information
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={formData.display_name}
                    onChange={(e) => handleInputChange('display_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your display name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Participation Style
                  </label>
                  <select
                    value={formData.participation_style}
                    onChange={(e) => handleInputChange('participation_style', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="observer">Observer - I prefer to watch and learn</option>
                    <option value="contributor">Contributor - I like to share ideas and feedback</option>
                    <option value="leader">Leader - I enjoy creating and organizing polls</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Values & Interests */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <Heart className="w-5 h-5 mr-2" />
                Values & Interests
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Concerns
                  </label>
                  <input
                    type="text"
                    value={formData.primary_concerns.join(', ')}
                    onChange={(e) => handleInputChange('primary_concerns', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter concerns separated by commas (e.g., environment, education, healthcare)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    What issues matter most to you?
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Community Focus
                  </label>
                  <input
                    type="text"
                    value={formData.community_focus.join(', ')}
                    onChange={(e) => handleInputChange('community_focus', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter focus areas separated by commas (e.g., local, national, global)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    What communities do you focus on?
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Privacy Settings
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Share Profile Publicly</h4>
                    <p className="text-sm text-gray-600">Allow others to see your profile information</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.privacy_settings.shareProfile}
                      onChange={(e) => handlePrivacyChange('shareProfile', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Share Demographics</h4>
                    <p className="text-sm text-gray-600">Include your demographics in analytics</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.privacy_settings.shareDemographics}
                      onChange={(e) => handlePrivacyChange('shareDemographics', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Share Participation</h4>
                    <p className="text-sm text-gray-600">Show your voting activity to others</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.privacy_settings.shareParticipation}
                      onChange={(e) => handlePrivacyChange('shareParticipation', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Allow Analytics</h4>
                    <p className="text-sm text-gray-600">Help improve the platform with usage data</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.privacy_settings.allowAnalytics}
                      onChange={(e) => handlePrivacyChange('allowAnalytics', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Privacy Notice */}
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">Privacy Notice</h4>
              <p className="text-blue-800 text-sm">
                Your privacy is important to us. You can change these settings anytime, and we'll never share your personal information without your explicit consent. All data is encrypted and stored securely.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
