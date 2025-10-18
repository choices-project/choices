'use client'

import { User, Camera, Save, Shield, ArrowLeft, Heart, Users, Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'

// UI Components
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

// Icons

// Utilities
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { devLog } from '@/lib/utils/logger'

// Types - Updated to match new database schema
interface UserProfile {
  id: string
  user_id: string
  username: string
  email: string
  display_name?: string
  bio?: string
  avatar_url?: string
  trust_tier: 'T0' | 'T1' | 'T2' | 'T3'
  is_admin: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  // Enhanced profile fields
  preferences?: Record<string, any>
  privacy_settings?: PrivacySettings
  primary_concerns?: string[]
  community_focus?: string[]
  participation_style?: 'observer' | 'contributor' | 'leader'
  demographics?: Record<string, any>
}

interface PrivacySettings {
  profile_visibility: 'public' | 'private' | 'friends'
  show_email: boolean
  show_activity: boolean
  allow_messages: boolean
  share_demographics: boolean
  allow_analytics: boolean
}

interface UserProfileUpdate {
  displayname: string
  bio: string | null
  primaryconcerns: string[]
  communityfocus: string[]
  participationstyle: 'observer' | 'contributor' | 'leader'
  privacysettings: PrivacySettings
  avatar?: string
}

interface ProfileUpdateResponse {
  success: boolean
  profile: UserProfile
  message?: string
}

const PARTICIPATIONSTYLES = [
  { value: 'observer', label: 'Observer', description: 'I prefer to watch and learn from the community' },
  { value: 'contributor', label: 'Contributor', description: 'I actively participate in discussions and polls' },
  { value: 'leader', label: 'Leader', description: 'I create polls and guide community discussions' }
]

const CONCERNOPTIONS = [
  'Environmental Protection',
  'Social Justice',
  'Economic Equality',
  'Education Access',
  'Healthcare',
  'Technology Ethics',
  'Local Community',
  'Global Issues',
  'Mental Health',
  'Digital Privacy'
]

const COMMUNITYFOCUSOPTIONS = [
  'Local Government',
  'Non-Profit Organizations',
  'Educational Institutions',
  'Healthcare Systems',
  'Environmental Groups',
  'Social Movements',
  'Technology Communities',
  'Cultural Organizations',
  'Business Networks',
  'Youth Programs'
]

export default function EditProfilePage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  
  // State management
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Form state
  const [formData, setFormData] = useState<UserProfileUpdate>({
    displayname: '',
    bio: '',
    primaryconcerns: [],
    communityfocus: [],
    participationstyle: 'observer',
    privacysettings: {
      profile_visibility: 'public',
      show_email: false,
      show_activity: true,
      allow_messages: true,
      share_demographics: false,
      allow_analytics: true
    }
  })

  // Avatar state
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/profile')
      if (response.ok) {
        const data = await response.json()
        if (data.profile) {
          setProfile(data.profile)
          setFormData({
            displayname: data.profile.displayname || '',
            bio: data.profile.bio || '',
            primaryconcerns: data.profile.primaryconcerns || [],
            communityfocus: data.profile.communityfocus || [],
            participationstyle: data.profile.participationstyle || 'observer',
            privacysettings: data.profile.privacysettings || {
              profilevisibility: 'public',
              showemail: false,
              showactivity: true,
              allowmessages: true,
              sharedemographics: false,
              allowanalytics: true
            }
          })
        }
      } else {
        setError('Failed to load profile')
      }
    } catch (error) {
      devLog('Error loading profile:', { error })
      setError('Failed to load profile')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirectTo=/profile/edit')
    }
  }, [user, authLoading, router])

  // Load profile data
  useEffect(() => {
    if (user) {
      loadProfile()
    }
  }, [user, loadProfile])


  const handleAvatarFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const handleAvatarUpload = useCallback(async () => {
    if (!avatarFile) return

    try {
      setIsUploadingAvatar(true)
      const formData = new FormData()
      formData.append('avatar', avatarFile)

      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        setFormData(prev => ({ ...prev, avatar: data.avatarurl }))
        setSuccess('Avatar updated successfully')
        setAvatarFile(null)
        setAvatarPreview(null)
      } else {
        setError('Failed to upload avatar')
      }
    } catch (error) {
      devLog('Error uploading avatar:', { error })
      setError('Failed to upload avatar')
    } finally {
      setIsUploadingAvatar(false)
    }
  }, [avatarFile])

  const handleSave = useCallback(async () => {
    try {
      setIsSaving(true)
      setError(null)
      setSuccess(null)

      const response = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const data: ProfileUpdateResponse = await response.json()
        if (data.success) {
          setProfile(data.profile)
          setSuccess('Profile updated successfully')
        } else {
          setError(data.message || 'Failed to update profile')
        }
      } else {
        setError('Failed to update profile')
      }
    } catch (error) {
      devLog('Error updating profile:', { error })
      setError('Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }, [formData])

  const handleConcernToggle = useCallback((concern: string) => {
    setFormData(prev => ({
      ...prev,
      primaryconcerns: prev.primaryconcerns.includes(concern)
        ? prev.primaryconcerns.filter(c => c !== concern)
        : [...prev.primaryconcerns, concern]
    }))
  }, [])

  const handleFocusToggle = useCallback((focus: string) => {
    setFormData(prev => ({
      ...prev,
      communityfocus: prev.communityfocus.includes(focus)
        ? prev.communityfocus.filter(f => f !== focus)
        : [...prev.communityfocus, focus]
    }))
  }, [])

  const handlePrivacyChange = useCallback((key: keyof PrivacySettings, value: any) => {
    setFormData(prev => ({
      ...prev,
      privacysettings: {
        ...prev.privacysettings,
        [key]: value
      }
    }))
  }, [])

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
    <div className="min-h-screen bg-gray-50" data-testid="profile-edit-page">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/profile')}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Profile
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
                <p className="text-gray-600">Update your profile information and preferences</p>
              </div>
            </div>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center"
              data-testid="save-changes-button"
            >
              {isSaving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alerts */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Basic Information
                </CardTitle>
                <CardDescription>
                  Update your basic profile information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="displayname">Display Name</Label>
                  <Input
                    id="displayname"
                    name="displayName"
                    value={formData.displayname}
                    onChange={(e) => setFormData(prev => ({ ...prev, displayname: e.target.value }))}
                    placeholder="Enter your display name"
                    data-testid="display-name-input"
                  />
                </div>
                
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={formData.bio || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell us about yourself..."
                    rows={4}
                    data-testid="bio-textarea"
                  />
                </div>

                <div>
                  <Label htmlFor="participationstyle">Participation Style</Label>
                  <Select
                    value={formData.participationstyle}
                    onValueChange={(value: 'observer' | 'contributor' | 'leader') => 
                      setFormData(prev => ({ ...prev, participationstyle: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PARTICIPATIONSTYLES.map(style => (
                        <SelectItem key={style.value} value={style.value}>
                          <div>
                            <div className="font-medium">{style.label}</div>
                            <div className="text-sm text-gray-500">{style.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Primary Concerns */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Heart className="h-5 w-5 mr-2" />
                  What Matters to You
                </CardTitle>
                <CardDescription>
                  Select the issues that are most important to you
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {CONCERNOPTIONS.map(concern => (
                    <Badge
                      key={concern}
                      variant={formData.primaryconcerns.includes(concern) ? 'default' : 'outline'}
                      className={cn(
                        'cursor-pointer hover:bg-blue-50',
                        formData.primaryconcerns.includes(concern) && 'bg-blue-600 text-white hover:bg-blue-700'
                      )}
                      onClick={() => handleConcernToggle(concern)}
                    >
                      {concern}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Community Focus */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Community Focus
                </CardTitle>
                <CardDescription>
                  Choose the types of communities you&apos;re most interested in
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {COMMUNITYFOCUSOPTIONS.map(focus => (
                    <Badge
                      key={focus}
                      variant={formData.communityfocus.includes(focus) ? 'default' : 'outline'}
                      className={cn(
                        'cursor-pointer hover:bg-green-50',
                        formData.communityfocus.includes(focus) && 'bg-green-600 text-white hover:bg-green-700'
                      )}
                      onClick={() => handleFocusToggle(focus)}
                    >
                      {focus}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Avatar */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Camera className="h-5 w-5 mr-2" />
                  Profile Picture
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={avatarPreview || formData.avatar || profile?.avatar_url || ''} />
                    <AvatarFallback>
                      <User className="h-12 w-12" />
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="avatar" className="cursor-pointer">
                    <div className="flex items-center justify-center w-full px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                      <Upload className="h-4 w-4 mr-2" />
                      Choose Image
                    </div>
                  </Label>
                  <input
                    id="avatar"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileChange}
                    className="hidden"
                  />
                  
                  {avatarFile && (
                    <div className="space-y-2">
                      <Button
                        onClick={handleAvatarUpload}
                        disabled={isUploadingAvatar}
                        size="sm"
                        className="w-full"
                      >
                        {isUploadingAvatar ? 'Uploading...' : 'Upload Avatar'}
                      </Button>
                      <Button
                        onClick={() => {
                          setAvatarFile(null)
                          setAvatarPreview(null)
                        }}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Privacy Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Privacy Settings
                </CardTitle>
                <CardDescription>
                  Control who can see your information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="profilevisibility">Profile Visibility</Label>
                  <Select
                    value={formData.privacysettings.profile_visibility}
                    onValueChange={(value: 'public' | 'private' | 'friends') =>
                      handlePrivacyChange('profile_visibility', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="friends">Friends Only</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Show Email</Label>
                      <p className="text-sm text-gray-500">Allow others to see your email</p>
                    </div>
                    <Switch
                      checked={formData.privacysettings.show_email}
                      onChange={(e) => handlePrivacyChange('show_email', e.target.checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Show Activity</Label>
                      <p className="text-sm text-gray-500">Show your voting and poll activity</p>
                    </div>
                    <Switch
                      checked={formData.privacysettings.show_activity}
                      onChange={(e) => handlePrivacyChange('show_activity', e.target.checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Allow Messages</Label>
                      <p className="text-sm text-gray-500">Allow other users to message you</p>
                    </div>
                    <Switch
                      checked={formData.privacysettings.allow_messages}
                      onChange={(e) => handlePrivacyChange('allow_messages', e.target.checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Share Demographics</Label>
                      <p className="text-sm text-gray-500">Share demographic data for analytics</p>
                    </div>
                    <Switch
                      checked={formData.privacysettings.share_demographics}
                      onChange={(e) => handlePrivacyChange('share_demographics', e.target.checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Allow Analytics</Label>
                      <p className="text-sm text-gray-500">Help improve the platform with usage data</p>
                    </div>
                    <Switch
                      checked={formData.privacysettings.allow_analytics}
                      onChange={(e) => handlePrivacyChange('allow_analytics', e.target.checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
