'use client'

export const dynamic = 'force-dynamic'
export const runtime = 'edge'

import { useAuth } from '@/hooks/useAuth'
import { devLog } from '@/lib/logger';
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useEffect, useState, useCallback } from 'react'
import { getSupabaseBrowserClient } from '@/utils/supabase/client-minimal'
import { 
  ArrowLeft, 
  User, 
  Lock, 
  Shield, 
  Trash2, 
  Eye, 
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Mail,
  Key
} from 'lucide-react'

interface AccountSettings {
  email: string
  displayName: string
  twoFactorEnabled: boolean
}

function AccountSettingsContent() {
  const { user, isLoading: authLoading, logout } = useAuth()
  const router = useRouter()
  
  // Initialize Supabase client
  const supabase = getSupabaseBrowserClient();
  const [settings, setSettings] = useState<AccountSettings>({
    email: '',
    displayName: '',
    twoFactorEnabled: false
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Password change state
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Account deletion state
  const [showDeleteAccount, setShowDeleteAccount] = useState(false)
  const [deleteData, setDeleteData] = useState({
    password: '',
    confirmDelete: ''
  })
  const [showDeletePassword, setShowDeletePassword] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('')
  const [isRequestingReset, setIsRequestingReset] = useState(false)

  // 2FA state
  const [show2FASetup, setShow2FASetup] = useState(false)
  const [twoFactorData, setTwoFactorData] = useState({
    secret: '',
    qrCode: '',
    verificationCode: ''
  })
  const [isSettingUp2FA, setIsSettingUp2FA] = useState(false)
  const [isDisabling2FA, setIsDisabling2FA] = useState(false)



  const loadAccountSettings = useCallback(async () => {
    try {
      setIsLoading(true)
      // Load user data from auth context
      if (!supabase || !user) {
        throw new Error('User not authenticated')
      }
      
      const { data: userProfile } = await supabase
        .from('ia_users')
        .select('two_factor_enabled')
        .eq('stable_id', user.id)
        .single()

      setSettings({
        email: user.email || '',
        displayName: user.email?.split('@')[0] || '',
        twoFactorEnabled: userProfile?.two_factor_enabled || false
      })
    } catch (error) {
      devLog('Error loading account settings:', error)
      setError('Failed to load account settings')
    } finally {
      setIsLoading(false)
    }
  }, [user, supabase])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirectTo=/account-settings')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      loadAccountSettings()
    }
  }, [user, loadAccountSettings, supabase])

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match')
      return
    }

    try {
      setIsChangingPassword(true)
      setError(null)
      setSuccess(null)

      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Password changed successfully!')
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
        setShowPasswordChange(false)
      } else {
        throw new Error(data.error || 'Failed to change password')
      }
    } catch (error) {
      devLog('Error changing password:', error)
      setError(error instanceof Error ? error.message : 'Failed to change password')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteData.confirmDelete !== 'DELETE') {
      setError('Please type DELETE to confirm account deletion')
      return
    }

    try {
      setIsDeletingAccount(true)
      setError(null)

      const response = await fetch('/api/auth/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: deleteData.password,
          confirmDelete: deleteData.confirmDelete
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Account deleted successfully. Redirecting...')
        setTimeout(() => {
          logout()
          router.push('/')
        }, 2000)
      } else {
        throw new Error(data.error || 'Failed to delete account')
      }
    } catch (error) {
      devLog('Error deleting account:', error)
      setError(error instanceof Error ? error.message : 'Failed to delete account')
    } finally {
      setIsDeletingAccount(false)
    }
  }

  const handle2FASetup = async () => {
    try {
      setIsSettingUp2FA(true)
      setError(null)

      const response = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate' })
      })

      const data = await response.json()

      if (response.ok) {
        setTwoFactorData({
          secret: data.secret,
          qrCode: data.qrCode,
          verificationCode: ''
        })
        setShow2FASetup(true)
      } else {
        throw new Error(data.error || 'Failed to generate 2FA setup')
      }
    } catch (error) {
      devLog('Error setting up 2FA:', error)
      setError(error instanceof Error ? error.message : 'Failed to setup 2FA')
    } finally {
      setIsSettingUp2FA(false)
    }
  }

  const handle2FAEnable = async () => {
    if (!twoFactorData.verificationCode) {
      setError('Please enter the verification code')
      return
    }

    try {
      setIsSettingUp2FA(true)
      setError(null)

      const response = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'enable',
          code: twoFactorData.verificationCode
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Two-factor authentication enabled successfully!')
        setSettings(prev => ({ ...prev, twoFactorEnabled: true }))
        setShow2FASetup(false)
        setTwoFactorData({ secret: '', qrCode: '', verificationCode: '' })
      } else {
        throw new Error(data.error || 'Failed to enable 2FA')
      }
    } catch (error) {
      devLog('Error enabling 2FA:', error)
      setError(error instanceof Error ? error.message : 'Failed to enable 2FA')
    } finally {
      setIsSettingUp2FA(false)
    }
  }

  const handle2FADisable = async () => {
    if (!twoFactorData.verificationCode) {
      setError('Please enter the verification code')
      return
    }

    try {
      setIsDisabling2FA(true)
      setError(null)

      const response = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'disable',
          code: twoFactorData.verificationCode
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Two-factor authentication disabled successfully!')
        setSettings(prev => ({ ...prev, twoFactorEnabled: false }))
        setTwoFactorData({ secret: '', qrCode: '', verificationCode: '' })
      } else {
        throw new Error(data.error || 'Failed to disable 2FA')
      }
    } catch (error) {
      devLog('Error disabling 2FA:', error)
      setError(error instanceof Error ? error.message : 'Failed to disable 2FA')
    } finally {
      setIsDisabling2FA(false)
    }
  }

  const handleForgotPassword = async () => {
    try {
      setIsRequestingReset(true)
      setError(null)
      setSuccess(null)

      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotPasswordEmail })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(data.message)
        setForgotPasswordEmail('')
        setShowForgotPassword(false)
      } else {
        throw new Error(data.error || 'Failed to request password reset')
      }
    } catch (error) {
      devLog('Error requesting password reset:', error)
      setError(error instanceof Error ? error.message : 'Failed to request password reset')
    } finally {
      setIsRequestingReset(false)
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading account settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account and security settings</p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <p className="text-green-600">{success}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Account Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <User className="w-5 h-5 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Account Information</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={settings.email}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                <input
                  type="text"
                  value={settings.displayName}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                />
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <Shield className="w-5 h-5 text-green-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Security</h2>
            </div>
            
            <div className="space-y-4">
              {/* Change Password */}
              <div>
                <button
                  onClick={() => setShowPasswordChange(!showPasswordChange)}
                  className="flex items-center text-blue-600 hover:text-blue-800"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Change Password
                </button>
              </div>

              {/* Forgot Password */}
              <div>
                <button
                  onClick={() => setShowForgotPassword(!showForgotPassword)}
                  className="flex items-center text-blue-600 hover:text-blue-800"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Forgot Password
                </button>
              </div>

              {/* Two-Factor Authentication */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Two-Factor Authentication</p>
                  <p className="text-sm text-gray-500">
                    {settings.twoFactorEnabled 
                      ? 'Enabled - Your account is protected with 2FA' 
                      : 'Add an extra layer of security to your account'
                    }
                  </p>
                </div>
                <div className="flex space-x-2">
                  {!settings.twoFactorEnabled ? (
                    <button
                      onClick={handle2FASetup}
                      disabled={isSettingUp2FA}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isSettingUp2FA ? 'Setting up...' : 'Enable 2FA'}
                    </button>
                  ) : (
                    <button
                      onClick={() => setShow2FASetup(true)}
                      className="px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700"
                    >
                      Manage 2FA
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Password Change Form */}
        {showPasswordChange && (
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter current password"
                  />
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter new password"
                  />
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Confirm new password"
                  />
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handlePasswordChange}
                  disabled={isChangingPassword}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isChangingPassword ? 'Changing...' : 'Change Password'}
                </button>
                <button
                  onClick={() => {
                    setShowPasswordChange(false)
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Forgot Password Form */}
        {showForgotPassword && (
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reset Password</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your email address"
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleForgotPassword}
                  disabled={isRequestingReset}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isRequestingReset ? 'Sending...' : 'Send Reset Link'}
                </button>
                <button
                  onClick={() => {
                    setShowForgotPassword(false)
                    setForgotPasswordEmail('')
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Two-Factor Authentication Setup */}
        {show2FASetup && (
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Two-Factor Authentication Setup</h3>
            <div className="space-y-6">
              {!settings.twoFactorEnabled ? (
                <>
                  <div className="text-center">
                    <p className="text-gray-600 mb-4">
                      Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                    </p>
                    {twoFactorData.qrCode && (
                      <div className="inline-block p-4 bg-white border border-gray-300 rounded-lg">
                        <Image 
                          src={twoFactorData.qrCode} 
                          alt="2FA QR Code" 
                          width={224}
                          height={224}
                          className="w-32 h-32 sm:w-48 sm:h-48 md:w-56 md:h-56"
                        />
                      </div>
                    )}
                    <p className="text-sm text-gray-500 mt-2">
                      Or manually enter this secret: <code className="bg-gray-100 px-2 py-1 rounded">{twoFactorData.secret}</code>
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      value={twoFactorData.verificationCode}
                      onChange={(e) => setTwoFactorData(prev => ({ ...prev, verificationCode: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter 6-digit code from your app"
                      maxLength={6}
                    />
                  </div>
                  
                  <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                    <button
                      onClick={handle2FAEnable}
                      disabled={isSettingUp2FA || !twoFactorData.verificationCode}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isSettingUp2FA ? 'Enabling...' : 'Enable 2FA'}
                    </button>
                    <button
                      onClick={() => {
                        setShow2FASetup(false)
                        setTwoFactorData({ secret: '', qrCode: '', verificationCode: '' })
                      }}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center">
                    <p className="text-gray-600 mb-4">
                      Enter your current 2FA code to disable two-factor authentication
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      value={twoFactorData.verificationCode}
                      onChange={(e) => setTwoFactorData(prev => ({ ...prev, verificationCode: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter 6-digit code from your app"
                      maxLength={6}
                    />
                  </div>
                  
                  <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                    <button
                      onClick={handle2FADisable}
                      disabled={isDisabling2FA || !twoFactorData.verificationCode}
                      className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
                    >
                      {isDisabling2FA ? 'Disabling...' : 'Disable 2FA'}
                    </button>
                    <button
                      onClick={() => {
                        setShow2FASetup(false)
                        setTwoFactorData({ secret: '', qrCode: '', verificationCode: '' })
                      }}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Danger Zone - Delete Account */}
        <div className="bg-white rounded-lg shadow p-6 mt-8 border border-red-200">
          <div className="flex items-center mb-4">
            <Trash2 className="w-5 h-5 text-red-600 mr-2" />
            <h2 className="text-xl font-semibold text-red-900">Danger Zone</h2>
          </div>
          
          <div className="mb-4">
            <p className="text-gray-700 mb-2">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <button
              onClick={() => setShowDeleteAccount(!showDeleteAccount)}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              Delete Account
            </button>
          </div>

          {showDeleteAccount && (
            <div className="border-t border-red-200 pt-4">
              <h3 className="text-lg font-semibold text-red-900 mb-4">Confirm Account Deletion</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={showDeletePassword ? 'text' : 'password'}
                      value={deleteData.password}
                      onChange={(e) => setDeleteData(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                      placeholder="Enter your password"
                    />
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <button
                      type="button"
                      onClick={() => setShowDeletePassword(!showDeletePassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showDeletePassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type DELETE to confirm
                  </label>
                  <input
                    type="text"
                    value={deleteData.confirmDelete}
                    onChange={(e) => setDeleteData(prev => ({ ...prev, confirmDelete: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                    placeholder="Type DELETE"
                  />
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isDeletingAccount}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    {isDeletingAccount ? 'Deleting...' : 'Delete Account'}
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteAccount(false)
                      setDeleteData({ password: '', confirmDelete: '' })
                    }}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AccountSettingsPage() {
  return <AccountSettingsContent />
}

