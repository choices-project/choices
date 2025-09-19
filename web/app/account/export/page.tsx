'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabaseAuth } from '@/contexts/AuthContext'

// UI Components
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

import { Badge } from '@/components/ui/badge'

// Icons
import { ArrowLeft, Download, FileText, User, Vote, MessageSquare, Settings, CheckCircle, Database, Clock, AlertCircle } from 'lucide-react'

// Utilities
import { devLog } from '@/lib/logger'

type ExportOptions = {
  profile: boolean
  polls: boolean
  votes: boolean
  comments: boolean
  analytics: boolean
  settings: boolean
  format: 'json' | 'csv' | 'pdf'
  dateRange: 'all' | '30d' | '90d' | '1y'
}

type ExportHistory = {
  id: string
  createdat: string
  format: string
  size: string
  status: 'completed' | 'processing' | 'failed'
  downloadurl?: string
}

export default function DataExportPage() {
  const router = useRouter()
  const { user } = useSupabaseAuth()
  
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    profile: true,
    polls: true,
    votes: true,
    comments: true,
    analytics: true,
    settings: true,
    format: 'json',
    dateRange: 'all'
  })
    const [isExporting, setIsExporting] = useState(false)
  const [exportHistory, setExportHistory] = useState<ExportHistory[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleOptionToggle = useCallback((option: keyof ExportOptions) => {
    setExportOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }))
  }, [])

  const handleFormatChange = useCallback((format: 'json' | 'csv' | 'pdf') => {
    setExportOptions(prev => ({
      ...prev,
      format
    }))
  }, [])

  const handleDateRangeChange = useCallback((dateRange: 'all' | '30d' | '90d' | '1y') => {
    setExportOptions(prev => ({
      ...prev,
      dateRange
    }))
  }, [])

  const exportData = useCallback(async () => {
    if (!user) return

    try {
      setIsExporting(true)
      setError(null)

      const response = await fetch('/api/user/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exportOptions)
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `user-data-${user.email}-${new Date().toISOString().split('T')[0]}.${exportOptions.format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        // Add to export history
        const newExport: ExportHistory = {
          id: Date.now().toString(),
          createdat: new Date().toISOString(),
          format: exportOptions.format.toUpperCase(),
          size: `${(blob.size / 1024).toFixed(1)} KB`,
          status: 'completed',
          downloadurl: url
        }
        setExportHistory(prev => [newExport, ...prev])
      } else {
        throw new Error('Failed to export data')
      }
    } catch (error) {
      devLog('Error exporting data:', error)
      setError('Failed to export data')
    } finally {
      setIsExporting(false)
    }
  }, [user, exportOptions])

  const loadExportHistory = useCallback(async () => {
    if (!user) return

    try {
      const response = await fetch('/api/user/export/history')
      if (response.ok) {
        const data = await response.json()
        setExportHistory(data.history)
      }
    } catch (error) {
      devLog('Error loading export history:', error)
    }
  }, [user])

  // Load export history on component mount
  useEffect(() => {
    loadExportHistory()
  }, [loadExportHistory])

  const getFormatDescription = useCallback((format: string) => {
    switch (format) {
      case 'json': return 'Structured data format, best for developers'
      case 'csv': return 'Spreadsheet format, best for analysis'
      case 'pdf': return 'Document format, best for printing'
      default: return ''
    }
  }, [])

  const getDateRangeDescription = useCallback((dateRange: string) => {
    switch (dateRange) {
      case 'all': return 'All your data from the beginning'
      case '30d': return 'Last 30 days of data'
      case '90d': return 'Last 90 days of data'
      case '1y': return 'Last year of data'
      default: return ''
    }
  }, [])

  const selectedCount = Object.values(exportOptions).filter(Boolean).length - 2 // Exclude format and dateRange

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/account-settings')}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Account Settings
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Data Export</h1>
                <p className="text-gray-600">Download your data in various formats</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Export Options */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  Export Options
                </CardTitle>
                <CardDescription>
                  Select what data you want to export and in what format
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Data Types */}
                <div>
                  <h4 className="font-medium mb-3">Data Types</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <User className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-medium">Profile Information</p>
                          <p className="text-sm text-gray-600">Your personal profile and account details</p>
                        </div>
                      </div>
                      <Button
                        variant={exportOptions.profile ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleOptionToggle('profile')}
                      >
                        {exportOptions.profile ? 'Included' : 'Include'}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Vote className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium">Polls & Votes</p>
                          <p className="text-sm text-gray-600">Polls you created and votes you cast</p>
                        </div>
                      </div>
                      <Button
                        variant={exportOptions.polls ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleOptionToggle('polls')}
                      >
                        {exportOptions.polls ? 'Included' : 'Include'}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <MessageSquare className="h-5 w-5 text-purple-600" />
                        <div>
                          <p className="font-medium">Comments</p>
                          <p className="text-sm text-gray-600">Comments you made on polls</p>
                        </div>
                      </div>
                      <Button
                        variant={exportOptions.comments ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleOptionToggle('comments')}
                      >
                        {exportOptions.comments ? 'Included' : 'Include'}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-orange-600" />
                        <div>
                          <p className="font-medium">Analytics</p>
                          <p className="text-sm text-gray-600">Your activity and engagement data</p>
                        </div>
                      </div>
                      <Button
                        variant={exportOptions.analytics ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleOptionToggle('analytics')}
                      >
                        {exportOptions.analytics ? 'Included' : 'Include'}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Settings className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="font-medium">Settings</p>
                          <p className="text-sm text-gray-600">Your account and privacy settings</p>
                        </div>
                      </div>
                      <Button
                        variant={exportOptions.settings ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleOptionToggle('settings')}
                      >
                        {exportOptions.settings ? 'Included' : 'Include'}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Export Format */}
                <div>
                  <h4 className="font-medium mb-3">Export Format</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {(['json', 'csv', 'pdf'] as const).map((format) => (
                      <button
                        key={format}
                        onClick={() => handleFormatChange(format)}
                        className={`p-3 border rounded-lg text-left transition-colors ${
                          exportOptions.format === format
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-medium capitalize">{format}</div>
                        <div className="text-sm text-gray-600">{getFormatDescription(format)}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date Range */}
                <div>
                  <h4 className="font-medium mb-3">Date Range</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(['all', '30d', '90d', '1y'] as const).map((dateRange) => (
                      <button
                        key={dateRange}
                        onClick={() => handleDateRangeChange(dateRange)}
                        className={`p-3 border rounded-lg text-left transition-colors ${
                          exportOptions.dateRange === dateRange
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-medium">
                          {dateRange === 'all' ? 'All Time' : 
                           dateRange === '30d' ? 'Last 30 Days' :
                           dateRange === '90d' ? 'Last 90 Days' : 'Last Year'}
                        </div>
                        <div className="text-sm text-gray-600">{getDateRangeDescription(dateRange)}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Export Button */}
                <div className="pt-4">
                  <Button
                    onClick={exportData}
                    disabled={isExporting || selectedCount === 0}
                    className="w-full"
                    size="lg"
                  >
                    {isExporting ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Download className="h-5 w-5 mr-2" />
                    )}
                    {isExporting ? 'Exporting...' : `Export Data (${selectedCount} items)`}
                  </Button>
                  {selectedCount === 0 && (
                    <p className="text-sm text-gray-600 mt-2 text-center">
                      Please select at least one data type to export
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Export History */}
            {exportHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    Recent Exports
                  </CardTitle>
                  <CardDescription>
                    Your recent data export history
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {exportHistory.slice(0, 5).map((exportItem) => (
                      <div key={exportItem.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-5 w-5 text-gray-600" />
                          <div>
                            <p className="font-medium">
                              {exportItem.format} Export
                            </p>
                            <p className="text-sm text-gray-600">
                              {new Date(exportItem.createdat).toLocaleDateString()} • {exportItem.size}
                            </p>
                          </div>
                        </div>
                        <Badge 
                          variant={exportItem.status === 'completed' ? 'default' : 
                                  exportItem.status === 'processing' ? 'secondary' : 'destructive'}
                        >
                          {exportItem.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Information */}
            <Card>
              <CardHeader>
                <CardTitle>About Data Export</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Complete Control</p>
                    <p className="text-xs text-gray-600">Choose exactly what data to export</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Multiple Formats</p>
                    <p className="text-xs text-gray-600">Export in JSON, CSV, or PDF format</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Date Filtering</p>
                    <p className="text-xs text-gray-600">Export data from specific time periods</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Secure Download</p>
                    <p className="text-xs text-gray-600">Your data is encrypted during transfer</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Privacy Notice */}
            <Card>
              <CardHeader>
                <CardTitle>Privacy Notice</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Your exported data contains only the information you've shared with the platform. 
                  We never include sensitive information like passwords or payment details.
                </p>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => router.push('/account/delete')}
                  variant="outline"
                  className="w-full"
                >
                  Delete Account
                </Button>
                <Button
                  onClick={() => router.push('/profile/edit')}
                  variant="outline"
                  className="w-full"
                >
                  Edit Profile
                </Button>
                <Button
                  onClick={() => router.push('/user-type')}
                  variant="outline"
                  className="w-full"
                >
                  User Type Analysis
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
