'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  User, 
  Shield, 
  Download, 
  Trash2, 
  Fingerprint, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react'
import { devLog } from '@/lib/logger'
import BiometricSetup from '@/components/auth/BiometricSetup'
import { useAuth } from '@/hooks/useAuth'

interface UserProfile {
  id: string
  email: string
  verificationtier: string
  createdat: string
  updatedat: string
}

interface BiometricCredential {
  id: string
  credentialId: string
  deviceType: string
  authenticatorType: string
  signCount: number
  createdAt: string
  lastUsedAt: string
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, isLoading, logout } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [mounted, setMounted] = useState(false)
  const [biometricCredentials, setBiometricCredentials] = useState<BiometricCredential[]>([])
  const [trustScore, setTrustScore] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showExportConfirm, setShowExportConfirm] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (user) {
      loadUserData()
    }
  }, [user])

  const loadUserData = async () => {
    try {
      if (!user) {
        router.push('/login')
        return
      }

      // Get user profile from API
      const response = await fetch('/api/profile')
      if (response.ok) {
        const data = await response.json()
        setProfile(data.profile)
      } else {
        setError('Failed to load profile data')
      }

      // Get biometric credentials from API
      const credentialsResponse = await fetch('/api/auth/webauthn/credentials')
      if (credentialsResponse.ok) {
        const credentialsData = await credentialsResponse.json()
        setBiometricCredentials(credentialsData.credentials || [])
      }

      // Get trust score from API
      const trustResponse = await fetch('/api/auth/webauthn/trust-score')
      if (trustResponse.ok) {
        const trustData = await trustResponse.json()
        setTrustScore(trustData.score || null)
      }

    } catch (error) {
      devLog('Error loading user data:', error)
      setError('Failed to load user data')
    }
  }

  const handleExportData = async () => {
    try {
      setIsExporting(true)
      setError(null)

      // Collect all user data
      const exportData = {
        profile: profile,
        biometricCredentials: biometricCredentials,
        trustScore: trustScore,
        exportDate: new Date().toISOString(),
        exportVersion: '1.0'
      }

      // Create and download file
      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `choices-data-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setSuccess('Data exported successfully')
      setShowExportConfirm(false)

    } catch (error) {
      devLog('Error exporting data:', error)
      setError('Failed to export data')
    } finally {
      setIsExporting(false)
    }
  }

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true)
      setError(null)

      if (!user) {
        setError('Authentication service not available')
        return
      }

      // Delete account via API
      const response = await fetch('/api/auth/delete-account', {
        method: 'DELETE'
      })

      if (response.ok) {
        await logout()
        setSuccess('Account deleted successfully')
        setTimeout(() => {
          router.push('/')
        }, 2000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to delete account')
      }

    } catch (error) {
      devLog('Error deleting account:', error)
      setError('Failed to delete account')
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleDeleteBiometricCredential = async (credentialId: string) => {
    try {
      const response = await fetch(`/api/auth/webauthn/credentials/${credentialId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setSuccess('Biometric credential deleted successfully')
        loadUserData() // Reload data
      } else {
        setError('Failed to delete biometric credential')
      }
    } catch (error) {
      devLog('Error deleting biometric credential:', error)
      setError('Failed to delete biometric credential')
    }
  }

  const getTierDisplayName = (tier: string) => {
    switch (tier) {
      case 'T0': return 'Anonymous'
      case 'T1': return 'Basic'
      case 'T2': return 'Verified'
      case 'T3': return 'Premium'
      case 'T4': return 'Admin'
      default: return tier
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'T0': return 'bg-gray-100 text-gray-800'
      case 'T1': return 'bg-blue-100 text-blue-800'
      case 'T2': return 'bg-green-100 text-green-800'
      case 'T3': return 'bg-purple-100 text-purple-800'
      case 'T4': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!mounted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>Please log in to view your profile</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl" data-testid="profile-page">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <User className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Profile & Settings</h1>
            <p className="text-gray-600">Manage your account and privacy settings</p>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Information
            </CardTitle>
            <CardDescription>
              Your account details and verification status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  value={profile?.email || ''}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div>
                <Label>Verification Tier</Label>
                <div className="mt-2">
                  <Badge className={getTierColor(profile?.verificationtier || 'unverified')}>
                    {getTierDisplayName(profile?.verificationtier || 'unverified')}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Account Created</Label>
                <p className="text-sm text-gray-600 mt-1">
                  {profile?.createdat ? new Date(profile.createdat).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
              <div>
                <Label>Last Updated</Label>
                <p className="text-sm text-gray-600 mt-1">
                  {profile?.updatedat ? new Date(profile.updatedat).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Biometric Authentication */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Fingerprint className="h-5 w-5" />
              Biometric Authentication
            </CardTitle>
            <CardDescription>
              Manage your biometric login settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            {biometricCredentials.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Trust Score</p>
                    <p className="text-sm text-gray-600">
                      {trustScore ? `${(trustScore * 100).toFixed(1)}%` : 'Not available'}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {biometricCredentials.length} credential{biometricCredentials.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  {biometricCredentials.map((credential: any) => (
                    <div key={credential.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{credential.authenticatorType}</p>
                        <p className="text-sm text-gray-600">
                          {credential.deviceType} • {credential.signCount} uses
                        </p>
                        <p className="text-xs text-gray-500">
                          Added {new Date(credential.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteBiometricCredential(credential.credentialId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Fingerprint className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No biometric credentials configured</p>
                <BiometricSetup 
                  userId={user.id} 
                  username={profile?.email || ''}
                  onSuccess={loadUserData}
                  onError={() => setError('Biometric setup failed')}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Privacy & Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Privacy & Data
            </CardTitle>
            <CardDescription>
              Manage your data and privacy settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">Your Privacy Rights</h4>
                  <p className="text-sm text-blue-800 mt-1">
                    You have the right to access, export, and delete your personal data. 
                    You can also manage your biometric authentication settings.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-medium">Export Your Data</h4>
                <p className="text-sm text-gray-600">
                  Download a copy of all your personal data including profile information 
                  and biometric credentials.
                </p>
                <Button 
                  onClick={() => setShowExportConfirm(true)}
                  className="w-full"
                  variant="outline"
                  data-testid="export-data-button"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Delete Account</h4>
                <p className="text-sm text-gray-600">
                  Permanently delete your account and all associated data. 
                  This action cannot be undone.
                </p>
                <Button 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full"
                  variant="destructive"
                  data-testid="delete-account-button"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Confirmation Modal */}
      {showExportConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-medium mb-4">Export Your Data</h3>
            <p className="text-gray-600 mb-4">
              This will download a JSON file containing all your personal data including:
            </p>
            <ul className="text-sm text-gray-600 mb-4 space-y-1">
              <li>• Account profile information</li>
              <li>• Biometric authentication data</li>
              <li>• Trust scores and metrics</li>
              <li>• Account creation and update timestamps</li>
            </ul>
            <div className="flex gap-3">
              <Button
                onClick={handleExportData}
                disabled={isExporting}
                className="flex-1"
              >
                {isExporting ? 'Exporting...' : 'Export Data'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowExportConfirm(false)}
                disabled={isExporting}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <h3 className="text-lg font-medium text-red-900">Delete Account</h3>
            </div>
            <p className="text-gray-600 mb-4">
              This action will permanently delete your account and all associated data including:
            </p>
            <ul className="text-sm text-gray-600 mb-4 space-y-1">
              <li>• Your profile and account information</li>
              <li>• All biometric authentication credentials</li>
              <li>• Voting history and participation data</li>
              <li>• Trust scores and authentication logs</li>
            </ul>
            <p className="text-sm text-red-600 mb-4 font-medium">
              This action cannot be undone. Please confirm that you want to proceed.
            </p>
            <div className="flex gap-3">
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="flex-1"
              >
                {isDeleting ? 'Deleting...' : 'Delete Account'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
