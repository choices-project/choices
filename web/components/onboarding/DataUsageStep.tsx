'use client'

import { useState } from 'react'
import { Shield, BarChart3, Eye, Lock, ArrowRight, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'

type DataUsageStepProps = {
  data: any
  onUpdate: () => void
  onNext: () => void
  onBack: () => void
}

type DataSharingLevel = 'none' | 'analytics_only' | 'research' | 'full'

export default function DataUsageStep({ data, onUpdate, onNext, onBack }: DataUsageStepProps) {
  const [dataSharingLevel, setDataSharingLevel] = useState<DataSharingLevel>(data.dataSharing || 'analytics_only')
  const [allowContact, setAllowContact] = useState(data.allowContact || false)
  const [allowResearch, setAllowResearch] = useState(data.allowResearch || false)
  const [currentSection, setCurrentSection] = useState<'overview' | 'controls' | 'preview'>('overview')

  const handleNext = () => {
    if (currentSection === 'overview') {
      setCurrentSection('controls')
    } else if (currentSection === 'controls') {
      setCurrentSection('preview')
    } else if (currentSection === 'preview') {
      onUpdate()
      onNext()
    }
  }

  const handleBack = () => {
    if (currentSection === 'preview') {
      setCurrentSection('controls')
    } else if (currentSection === 'controls') {
      setCurrentSection('overview')
    } else {
      // If we're at the overview section, go to the previous onboarding step
      onBack()
    }
  }

  const renderOverview = () => (
    <div className="space-y-8" >
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-gray-900">How We Use Your Data</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          We believe in complete transparency about how your data is used. 
          You have full control over what information is shared and how it&apos;s used.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="text-center">
          <CardHeader>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-lg">Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">
              We use aggregated data to improve our platform and provide better insights
            </p>
            <div className="space-y-2 text-left">
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>No personal information</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>Aggregated only</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>Anonymized data</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardHeader>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Eye className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-lg">Research</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">
              Help improve democratic processes through academic research
            </p>
            <div className="space-y-2 text-left">
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>Academic partners only</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>Ethics board approved</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>Opt-in required</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardHeader>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Lock className="h-6 w-6 text-purple-600" />
            </div>
            <CardTitle className="text-lg">Privacy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">
              Your privacy is our top priority. We never sell your personal data
            </p>
            <div className="space-y-2 text-left">
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>No data sales</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>End-to-end encryption</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>Right to deletion</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <Button onClick={handleNext} size="lg">
          Configure Your Preferences
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  const renderControls = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Your Data Preferences</h3>
        <p className="text-gray-600">Choose how your data is used. You can change these settings anytime.</p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Data Sharing Level
          </CardTitle>
          <CardDescription>
            Choose how much data you&apos;re comfortable sharing for platform improvement
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                 onClick={() => setDataSharingLevel('none')}>
              <input
                type="radio"
                name="data-sharing"
                checked={dataSharingLevel === 'none'}
                onChange={() => setDataSharingLevel('none')}
                className="text-blue-600"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">No Data Sharing</div>
                    <div className="text-sm text-gray-600">Minimal data collection, basic functionality only</div>
                  </div>
                  <Badge variant="secondary">Most Private</Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                 onClick={() => setDataSharingLevel('analytics_only')}>
              <input
                type="radio"
                name="data-sharing"
                checked={dataSharingLevel === 'analytics_only'}
                onChange={() => setDataSharingLevel('analytics_only')}
                className="text-blue-600"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Analytics Only</div>
                    <div className="text-sm text-gray-600">Aggregated data for platform improvement</div>
                  </div>
                  <Badge variant="default">Recommended</Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                 onClick={() => setDataSharingLevel('research')}>
              <input
                type="radio"
                name="data-sharing"
                checked={dataSharingLevel === 'research'}
                onChange={() => setDataSharingLevel('research')}
                className="text-blue-600"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Include Research</div>
                    <div className="text-sm text-gray-600">Help improve democratic processes</div>
                  </div>
                  <Badge variant="outline">Academic Use</Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                 onClick={() => setDataSharingLevel('full')}>
              <input
                type="radio"
                name="data-sharing"
                checked={dataSharingLevel === 'full'}
                onChange={() => setDataSharingLevel('full')}
                className="text-blue-600"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Full Participation</div>
                    <div className="text-sm text-gray-600">Maximum data sharing for comprehensive insights</div>
                  </div>
                  <Badge variant="destructive">Least Private</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Additional Preferences</CardTitle>
          <CardDescription>Fine-tune your privacy settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allow Contact for Research</Label>
                <p className="text-sm text-gray-600">
                  Researchers may contact you about participating in studies
                </p>
              </div>
              <input
                type="checkbox"
                checked={allowContact}
                onChange={(e) => setAllowContact(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Participate in Research Studies</Label>
                <p className="text-sm text-gray-600">
                  Help improve democratic processes through academic research
                </p>
              </div>
              <input
                type="checkbox"
                checked={allowResearch}
                onChange={(e) => setAllowResearch(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
            </div>
        </CardContent>
      </Card>

      <div className="flex justify-between max-w-2xl mx-auto">
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={handleNext}>
          Preview Your Settings
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  const renderPreview = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Your Privacy Summary</h3>
        <p className="text-gray-600">Here&apos;s how your data will be used based on your preferences</p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Data Sharing Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">Data Sharing Level</span>
              <Badge variant={dataSharingLevel === 'none' ? 'secondary' : dataSharingLevel === 'analytics_only' ? 'default' : 'outline'}>
                {dataSharingLevel === 'none' ? 'None' : 
                 dataSharingLevel === 'analytics_only' ? 'Analytics Only' :
                 dataSharingLevel === 'research' ? 'Include Research' : 'Full Participation'}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">Research Contact</span>
              <Badge variant={allowContact ? 'default' : 'secondary'}>
                {allowContact ? 'Allowed' : 'Not Allowed'}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium">Research Participation</span>
              <Badge variant={allowResearch ? 'default' : 'secondary'}>
                {allowResearch ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Your Rights</p>
                <ul className="space-y-1">
                  <li>• You can change these settings anytime in your profile</li>
                  <li>• You can request deletion of your data at any time</li>
                  <li>• We&apos;ll notify you of any changes to our data practices</li>
                  <li>• You can opt out of research participation at any time</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between max-w-2xl mx-auto">
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={handleNext} >
          Save Preferences
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (currentSection) {
      case 'overview':
        return renderOverview()
      case 'controls':
        return renderControls()
      case 'preview':
        return renderPreview()
      default:
        return renderOverview()
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {renderContent()}
    </div>
  )
}
