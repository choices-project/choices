'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  User, 
  Shield, 
  Download, 
  Edit, 
  Settings, 
  CheckCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react'
import { useProfile, useProfileLoadingStates, useProfileErrorStates, useExportData } from '@/lib/hooks/use-profile'
import { useAuth } from '@/hooks/useAuth'

export default function ProfilePage() {
  const { isLoading: authLoading } = useAuth()
  const { data: profileData, isLoading, error } = useProfile()
  const { isAnyUpdating } = useProfileLoadingStates()
  const { profileError } = useProfileErrorStates()
  const exportMutation = useExportData()
  
  const [showExportConfirm, setShowExportConfirm] = useState(false)

  // Handle export data
  const handleExportData = () => {
    exportMutation.mutate()
      setShowExportConfirm(false)
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading profile...</span>
        </div>
      </div>
    )
  }

  if (error || !profileData?.success) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {profileError?.message || 'Failed to load profile. Please try again.'}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const profile = profileData.data

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile.avatar_url} alt={profile.display_name} />
              <AvatarFallback>
                {profile.display_name?.charAt(0) || profile.email?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-2xl" data-testid="profile-username">{profile.display_name || 'User'}</CardTitle>
              <CardDescription className="text-lg" data-testid="profile-email">@{profile.username || 'username'}</CardDescription>
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <Shield className="h-3 w-3" />
                  <span>{profile.trust_tier}</span>
                </Badge>
                {profile.is_admin && (
                  <Badge variant="destructive">Admin</Badge>
                )}
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

        {/* Profile Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Basic Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
              <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p className="text-sm">{profile.email}</p>
              </div>
              <div>
              <label className="text-sm font-medium text-gray-500">Username</label>
              <p className="text-sm">@{profile.username}</p>
            </div>
              <div>
              <label className="text-sm font-medium text-gray-500">Display Name</label>
              <p className="text-sm">{profile.display_name}</p>
              </div>
              <div>
              <label className="text-sm font-medium text-gray-500">Bio</label>
              <p className="text-sm">{profile.bio || 'No bio provided'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Account Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
                <div>
              <label className="text-sm font-medium text-gray-500">Trust Tier</label>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">{profile.trust_tier}</Badge>
                <span className="text-sm text-gray-500">
                  {profile.trust_tier === 'T0' && 'New User'}
                  {profile.trust_tier === 'T1' && 'Verified User'}
                  {profile.trust_tier === 'T2' && 'Trusted User'}
                  {profile.trust_tier === 'T3' && 'VIP User'}
                </span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Member Since</label>
              <p className="text-sm">
                {new Date(profile.created_at).toLocaleDateString()}
              </p>
              </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Last Updated</label>
              <p className="text-sm">
                {new Date(profile.updated_at).toLocaleDateString()}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600">Active</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Account Actions</CardTitle>
          <CardDescription>
            Manage your account and data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Button 
              variant="outline" 
              onClick={() => setShowExportConfirm(true)}
              disabled={exportMutation.isPending}
            >
              {exportMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Export Data
            </Button>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Privacy Settings
            </Button>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Export Confirmation Modal */}
      {showExportConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-md mx-4">
            <CardHeader>
              <CardTitle>Export Your Data</CardTitle>
              <CardDescription>
                This will download a JSON file containing all your profile data, votes, and polls.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  The exported data will include your personal information. Keep it secure.
                </AlertDescription>
              </Alert>
              <div className="flex space-x-2">
              <Button
                onClick={handleExportData}
                  disabled={exportMutation.isPending}
                className="flex-1"
              >
                  {exportMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Export Data
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowExportConfirm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Loading Overlay */}
      {isAnyUpdating && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Updating profile...</span>
          </div>
        </div>
      )}
    </div>
  )
}