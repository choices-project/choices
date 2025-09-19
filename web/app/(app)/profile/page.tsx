'use client'

import { useState, useEffect, useCallback } from 'react'
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
import { logger } from '@/lib/logger'
// import BiometricSetup from '@/features/webauthn/components/BiometricSetup'
import { useSupabaseAuth } from '@/contexts/AuthContext'

type UserProfile = {
  id: string
  email: string
  verificationtier: string
  createdat: string
  updatedat: string
}

type BiometricCredential = {
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
  const { user, isLoading, signOut } = useSupabaseAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [biometricCredentials, setBiometricCredentials] = useState<BiometricCredential[]>([])
  const [trustScore, setTrustScore] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showExportConfirm, setShowExportConfirm] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadUserData = useCallback(async () => {
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
      logger.error('Error loading user data', error instanceof Error ? error : new Error(String(error)))
      setError('Failed to load user data')
    }
  }, [user, router])

  useEffect(() => {
    loadUserData()
  }, [loadUserData])

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
      logger.error('Error exporting data', error instanceof Error ? error : new Error(String(error)))
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
        await signOut()
        setSuccess('Account deleted successfully')
        setTimeout(() => {
          router.push('/')
        }, 2000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to delete account')
      }

    } catch (error) {
      logger.error('Error deleting account', error instanceof Error ? error : new Error(String(error)))
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
      logger.error('Error deleting biometric credential', error instanceof Error ? error : new Error(String(error)))
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

  if (!user || !profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>Failed to load profile data</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
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
            <AlertTriangle className="h-4 w-4" />
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
            <CardDescription>Your basic account details and verification status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" value={profile.email} readOnly />
              </div>
              <div>
                <Label>Verification Tier</Label>
                <Badge className={getTierColor(profile.verificationtier)}>
                  {getTierDisplayName(profile.verificationtier)}
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Account Created</Label>
                <Input value={new Date(profile.createdat).toLocaleDateString()} readOnly />
              </div>
              <div>
                <Label>Last Updated</Label>
                <Input value={new Date(profile.updatedat).toLocaleDateString()} readOnly />
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
            <CardDescription>Manage your biometric login credentials</CardDescription>
          </CardHeader>
          <CardContent>
            {/* <BiometricSetup 
              userId={user.id} 
              username={user.email || ''}
              onSuccess={loadUserData}
              onError={() => setError('Failed to setup biometric authentication')}
            /> */}
            <div className="text-center py-8">
              <p className="text-muted-foreground">Biometric setup temporarily disabled</p>
            </div>
            
            {biometricCredentials.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium mb-3">Registered Devices</h4>
                <div className="space-y-2">
                  {biometricCredentials.map((credential) => (
                    <div key={credential.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{credential.deviceType}</p>
                        <p className="text-sm text-gray-600">
                          Last used: {new Date(credential.lastUsedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteBiometricCredential(credential.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {trustScore !== null && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Trust Score: {trustScore}%</span>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  Your account security rating based on authentication patterns
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Data Management
            </CardTitle>
            <CardDescription>Export your data or delete your account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={() => setShowExportConfirm(true)}
                disabled={isExporting}
              >
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? 'Exporting...' : 'Export My Data'}
              </Button>
              
              <Button
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isDeleting ? 'Deleting...' : 'Delete Account'}
              </Button>
            </div>

            <div className="text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium mb-1">Data Export</p>
                  <p>Download all your data including profile information, biometric credentials, and trust score.</p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0 text-red-500" />
                <div>
                  <p className="font-medium mb-1 text-red-700">Account Deletion</p>
                  <p>This action is permanent and cannot be undone. All your data will be permanently deleted.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Confirmation Modal */}
      {showExportConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Export Your Data</h3>
            <p className="text-gray-600 mb-6">
              This will download a JSON file containing all your account data, including profile information, 
              biometric credentials, and trust score.
            </p>
            <div className="flex gap-3">
              <Button onClick={handleExportData} disabled={isExporting}>
                {isExporting ? 'Exporting...' : 'Export'}
              </Button>
              <Button variant="outline" onClick={() => setShowExportConfirm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-red-700">Delete Account</h3>
            <p className="text-gray-600 mb-6">
              This action is permanent and cannot be undone. All your data, including profile information, 
              biometric credentials, and voting history will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <Button variant="destructive" onClick={handleDeleteAccount} disabled={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </Button>
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
