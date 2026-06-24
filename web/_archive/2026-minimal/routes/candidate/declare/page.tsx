'use client'

import { FileText, CheckCircle, ArrowLeft, ArrowRight, FileCheck, AlertCircle } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'

import { FilingAssistant } from '@/components/candidate/FilingAssistant'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

import logger from '@/lib/utils/logger'

const STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
]

type PlatformPosition = {
  id: string
  title: string
  position: string
  description: string
  category: string
  priority: 'high' | 'medium' | 'low'
}

type CandidateWizardData = {
  // Step 1: Office Selection
  office: string
  level: 'federal' | 'state' | 'local'
  state: string
  district: string
  jurisdiction: string
  
  // Step 2: Basic Info
  candidateName: string
  party: string
  photoUrl: string
  
  // Step 3: Platform Positions
  platformPositions: PlatformPosition[]
  
  // Step 4: Experience & Details
  experience: string
  endorsements: string[]
  
  // Step 5: Campaign Info
  campaignWebsite: string
  campaignEmail: string
  campaignPhone: string
  visibility: 'high' | 'medium' | 'low'
  
  // Step 6: Official Filing (Optional)
  officialFilingId: string
  officialFilingDate: string
  filingJurisdiction: string
  filingDocumentUrl: string
  filingDocument: File | null
  electionDate: string
  filingDeadline: string
}

const INITIAL_DATA: CandidateWizardData = {
  office: '',
  level: 'federal',
  state: '',
  district: '',
  jurisdiction: '',
  candidateName: '',
  party: '',
  photoUrl: '',
  platformPositions: [],
  experience: '',
  endorsements: [],
  campaignWebsite: '',
  campaignEmail: '',
  campaignPhone: '',
  visibility: 'medium',
  officialFilingId: '',
  officialFilingDate: '',
  filingJurisdiction: '',
  filingDocumentUrl: '',
  filingDocument: null,
  electionDate: '',
  filingDeadline: ''
}

function DeclareCandidacyPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [currentStep, setCurrentStep] = useState(0)
  const [data, setData] = useState<CandidateWizardData>(INITIAL_DATA)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Pre-fill data from query parameters (when coming from "Run for Office" button)
  useEffect(() => {
    const office = searchParams.get('office')
    const state = searchParams.get('state')
    
    if (office) {
      setData(prev => ({
        ...prev,
        office,
        state: state ?? prev.state,
        // Auto-generate jurisdiction from office and state
        jurisdiction: state ? `${office} - ${state}` : office
      }))
    }
  }, [searchParams])
  
  const totalSteps = 6
  const stepNames = ['Office', 'Basic Info', 'Platform', 'Experience', 'Campaign Info', 'Official Filing']

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}
    
    switch (step) {
      case 0: // Office
        if (!data.office) newErrors.office = 'Office is required'
        if (!data.level) newErrors.level = 'Level is required'
        if (!data.state) newErrors.state = 'State is required'
        if (!data.jurisdiction) newErrors.jurisdiction = 'Jurisdiction is required'
        break
      case 1: // Basic Info
        if (!data.candidateName.trim()) newErrors.candidateName = 'Candidate name is required'
        break
      case 2: // Platform (optional for now)
        break
      case 3: // Experience (optional)
        break
      case 4: // Campaign Info (optional)
        break
      case 5: // Official Filing (optional)
        break
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep) && currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return
    
    setIsSubmitting(true)
    try {
      // 1) Start onboarding (ensures candidate profile exists)
      const onboardResp = await fetch('/api/candidates/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          displayName: data.candidateName || 'Candidate',
          office: data.office,
          jurisdiction: data.jurisdiction,
          party: data.party
        })
      })
      const onboardJson = await onboardResp.json().catch(() => ({}))
      if (!onboardResp.ok || onboardJson?.success === false || !onboardJson?.data?.slug) {
        throw new Error(onboardJson?.error ?? 'Failed to start candidate onboarding')
      }
      const slug: string = onboardJson.data.slug

      // 2) Update candidate profile with campaign links and bio; keep private until user chooses to publish
      await fetch(`/api/candidates/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          bio: data.experience || undefined,
          website: data.campaignWebsite || undefined,
          social: {
            email: data.campaignEmail || undefined,
            phone: data.campaignPhone || undefined
          },
          is_public: false
        })
      }).catch(() => undefined)

      // 3) Trigger welcome email immediately (non-blocking)
      fetch('/api/candidates/journey/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platformId: slug, // placeholder identifier for email context
          type: 'welcome'
        })
      }).catch((error) => {
        logger.error('Welcome email trigger failed (will retry via cron):', error)
      })

      // 4) Route to the public candidate page (preview) or dashboard; choose dashboard for edits
      router.push(`/candidates/${slug}`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to declare candidacy'
      setErrors({ submit: errorMessage })
    } finally {
      setIsSubmitting(false)
    }
  }

  const addPlatformPosition = () => {
    setData({
      ...data,
      platformPositions: [
        ...data.platformPositions,
        {
          id: `pos-${Date.now()}`,
          title: '',
          position: '',
          description: '',
          category: 'general',
          priority: 'medium'
        }
      ]
    })
  }

  const removePlatformPosition = (id: string) => {
    setData({
      ...data,
      platformPositions: data.platformPositions.filter(p => p.id !== id)
    })
  }

  const updatePlatformPosition = (id: string, updates: Partial<PlatformPosition>) => {
    setData({
      ...data,
      platformPositions: data.platformPositions.map(p =>
        p.id === id ? { ...p, ...updates } : p
      )
    })
  }

  const addEndorsement = () => {
    setData({
      ...data,
      endorsements: [...data.endorsements, '']
    })
  }

  const removeEndorsement = (index: number) => {
    setData({
      ...data,
      endorsements: data.endorsements.filter((_, i) => i !== index)
    })
  }

  const updateEndorsement = (index: number, value: string) => {
    setData({
      ...data,
      endorsements: data.endorsements.map((e, i) => i === index ? value : e)
    })
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Declare Candidacy</h1>
        <p className="text-gray-600">Build your political platform and run for office</p>
      </div>

      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {stepNames.map((name, index) => (
            <div key={index} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    index <= currentStep
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {index < currentStep ? <CheckCircle className="w-6 h-6" /> : index + 1}
                </div>
                <span className="mt-2 text-xs text-center">{name}</span>
              </div>
              {index < totalSteps - 1 && (
                <div
                  className={`h-1 flex-1 mx-2 ${
                    index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Step {currentStep + 1}: {stepNames[currentStep]}</CardTitle>
          <CardDescription>
            {currentStep === 0 && 'Select the office you want to run for'}
            {currentStep === 1 && 'Tell us about yourself'}
            {currentStep === 2 && 'Build your platform - what are your positions?'}
            {currentStep === 3 && 'Share your experience and endorsements'}
            {currentStep === 4 && 'Add campaign contact information'}
            {currentStep === 5 && 'Upload official filing documents (optional - can be added later)'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Office Selection */}
          {currentStep === 0 && (
            <div className="space-y-4">
              {/* Filing Assistant - Shows when office/state selected */}
              {data.office && data.level && data.state && (
                <FilingAssistant
                  level={data.level}
                  office={data.office}
                  state={data.state}
                  electionDate={data.electionDate ?? undefined}
                  className="mb-6"
                />
              )}
              <div>
                <label className="block text-sm font-medium mb-2">Office</label>
                <Input
                  value={data.office}
                  onChange={(e) => setData({ ...data, office: e.target.value })}
                  placeholder="e.g., U.S. House (CA-15)"
                  className={errors.office ? 'border-red-500' : ''}
                />
                {errors.office && <p className="text-red-500 text-sm mt-1">{errors.office}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Level</label>
                <Select value={data.level} onValueChange={(value: 'federal' | 'state' | 'local') => setData({ ...data, level: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="federal">Federal</SelectItem>
                    <SelectItem value="state">State</SelectItem>
                    <SelectItem value="local">Local</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">State</label>
                <Select value={data.state} onValueChange={(value) => setData({ ...data, state: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATES.map(state => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">District (if applicable)</label>
                <Input
                  value={data.district}
                  onChange={(e) => setData({ ...data, district: e.target.value })}
                  placeholder="e.g., CA-15"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Jurisdiction</label>
                <Input
                  value={data.jurisdiction}
                  onChange={(e) => setData({ ...data, jurisdiction: e.target.value })}
                  placeholder="Full jurisdiction identifier"
                  className={errors.jurisdiction ? 'border-red-500' : ''}
                />
                {errors.jurisdiction && <p className="text-red-500 text-sm mt-1">{errors.jurisdiction}</p>}
              </div>
            </div>
          )}

          {/* Step 2: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Candidate Name *</label>
                <Input
                  value={data.candidateName}
                  onChange={(e) => setData({ ...data, candidateName: e.target.value })}
                  placeholder="Your full name as it will appear on the ballot"
                  className={errors.candidateName ? 'border-red-500' : ''}
                />
                {errors.candidateName && <p className="text-red-500 text-sm mt-1">{errors.candidateName}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Party Affiliation</label>
                <Input
                  value={data.party}
                  onChange={(e) => setData({ ...data, party: e.target.value })}
                  placeholder="e.g., Independent, Green Party, etc."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Photo URL</label>
                <Input
                  value={data.photoUrl}
                  onChange={(e) => setData({ ...data, photoUrl: e.target.value })}
                  placeholder="https://example.com/photo.jpg"
                  type="url"
                />
              </div>
            </div>
          )}

          {/* Step 3: Platform Positions */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Platform Positions</h3>
                <Button onClick={addPlatformPosition} variant="outline" size="sm">
                  Add Position
                </Button>
              </div>
              
              {data.platformPositions.length === 0 && (
                <p className="text-gray-500 text-sm">Add your positions on key issues. You can add these later too.</p>
              )}
              
              {data.platformPositions.map((position, index) => (
                <Card key={position.id} className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-medium">Position {index + 1}</h4>
                    <Button
                      onClick={() => removePlatformPosition(position.id)}
                      variant="ghost"
                      size="sm"
                    >
                      Remove
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <Input
                        placeholder="Category (e.g., Healthcare, Education)"
                        value={position.title}
                        onChange={(e) => updatePlatformPosition(position.id, { title: e.target.value })}
                      />
                    </div>
                    <div>
                      <Input
                        placeholder="Your position (short summary)"
                        value={position.position}
                        onChange={(e) => updatePlatformPosition(position.id, { position: e.target.value })}
                      />
                    </div>
                    <div>
                      <Textarea
                        placeholder="Detailed description (optional)"
                        value={position.description}
                        onChange={(e) => updatePlatformPosition(position.id, { description: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Select
                        value={position.priority}
                        onValueChange={(value: 'high' | 'medium' | 'low') =>
                          updatePlatformPosition(position.id, { priority: value })
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">High Priority</SelectItem>
                          <SelectItem value="medium">Medium Priority</SelectItem>
                          <SelectItem value="low">Low Priority</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Step 4: Experience */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Experience & Background</label>
                <Textarea
                  value={data.experience}
                  onChange={(e) => setData({ ...data, experience: e.target.value })}
                  placeholder="Tell voters about your background, experience, and qualifications..."
                  rows={6}
                />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium">Endorsements</label>
                  <Button onClick={addEndorsement} variant="outline" size="sm">
                    Add Endorsement
                  </Button>
                </div>
                {data.endorsements.map((endorsement, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input
                      value={endorsement}
                      onChange={(e) => updateEndorsement(index, e.target.value)}
                      placeholder="Organization or person name"
                    />
                    <Button
                      onClick={() => removeEndorsement(index)}
                      variant="ghost"
                      size="sm"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Legal Disclaimer */}
          {currentStep === 5 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-semibold mb-2">⚠️ Important: Official Filing Required</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>This platform helps you prepare</strong> for official filing but does <strong>not</strong> submit official filings.</li>
                    <li><strong>You must file with the election authority</strong> (FEC for federal, Secretary of State for state, etc.) to be legally recognized as a candidate.</li>
                    <li><strong>Filing requirements vary by jurisdiction</strong> - check with your election authority for specific rules.</li>
                    <li><strong>After you file officially</strong>, come back here to enter your filing ID and verify it with us.</li>
                    <li>We can <strong>verify your filing</strong> against official databases (FEC verification available now).</li>
                  </ul>
                  <p className="mt-3 font-medium">
                    🎯 <strong>Our Goal:</strong> Making filing easier through preparation, verification, and (in the future) direct submission where possible.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Official Filing */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Official Filing ID</label>
                <Input
                  value={data.officialFilingId}
                  onChange={(e) => setData({ ...data, officialFilingId: e.target.value })}
                  placeholder="e.g., FEC ID, State filing number"
                />
                <p className="text-xs text-gray-500 mt-1">Your official filing receipt or ID number from the election authority</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Filing Date</label>
                <Input
                  value={data.officialFilingDate}
                  onChange={(e) => setData({ ...data, officialFilingDate: e.target.value })}
                  type="date"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Election Authority</label>
                <Input
                  value={data.filingJurisdiction}
                  onChange={(e) => setData({ ...data, filingJurisdiction: e.target.value })}
                  placeholder="e.g., FEC, CA Secretary of State, NYC Board of Elections"
                />
                <p className="text-xs text-gray-500 mt-1">The election authority where you filed</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Election Date</label>
                <Input
                  value={data.electionDate}
                  onChange={(e) => setData({ ...data, electionDate: e.target.value })}
                  type="date"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Filing Deadline</label>
                <Input
                  value={data.filingDeadline}
                  onChange={(e) => setData({ ...data, filingDeadline: e.target.value })}
                  type="date"
                />
                <p className="text-xs text-gray-500 mt-1">Deadline for filing (if not yet filed)</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Proof of Filing Document</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  {data.filingDocument ? (
                    <div className="space-y-2">
                      <FileCheck className="w-8 h-8 text-green-600 mx-auto" />
                      <p className="text-sm font-medium">{data.filingDocument.name}</p>
                      <p className="text-xs text-gray-500">{(data.filingDocument.size / 1024).toFixed(2)} KB</p>
                      <Button
                        onClick={() => setData({ ...data, filingDocument: null })}
                        variant="outline"
                        size="sm"
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <label htmlFor="filing-document-upload" className="cursor-pointer">
                        <Button variant="outline" size="sm" type="button" asChild>
                          <span>Upload Document</span>
                        </Button>
                        <input
                          id="filing-document-upload"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              if (file.size > 10 * 1024 * 1024) {
                                setErrors({ filingDocument: 'File size must be less than 10MB' })
                              } else {
                                setData({ ...data, filingDocument: file })
                                setErrors({})
                              }
                            }
                          }}
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-2">PDF, JPG, or PNG (max 10MB)</p>
                    </div>
                  )}
                </div>
                {errors.filingDocument && (
                  <p className="text-red-500 text-sm mt-1">{errors.filingDocument}</p>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> You can skip this step and add official filing information later from your candidate dashboard.
                </p>
              </div>

              {/* Filing Assistant - Show requirements for this office */}
              {data.office && data.level && data.state && (
                <FilingAssistant
                  level={data.level}
                  office={data.office}
                  state={data.state}
                  electionDate={data.electionDate ?? undefined}
                  className="mt-6"
                />
              )}
            </div>
          )}

          {/* Step 5: Campaign Info */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Campaign Website</label>
                <Input
                  value={data.campaignWebsite}
                  onChange={(e) => setData({ ...data, campaignWebsite: e.target.value })}
                  placeholder="https://yourcampaign.com"
                  type="url"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Campaign Email</label>
                <Input
                  value={data.campaignEmail}
                  onChange={(e) => setData({ ...data, campaignEmail: e.target.value })}
                  placeholder="contact@yourcampaign.com"
                  type="email"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Campaign Phone</label>
                <Input
                  value={data.campaignPhone}
                  onChange={(e) => setData({ ...data, campaignPhone: e.target.value })}
                  placeholder="(555) 123-4567"
                  type="tel"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Visibility Level</label>
                <Select
                  value={data.visibility}
                  onValueChange={(value: 'high' | 'medium' | 'low') =>
                    setData({ ...data, visibility: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High (Well-known candidate)</SelectItem>
                    <SelectItem value="medium">Medium (Moderate visibility)</SelectItem>
                    <SelectItem value="low">Low (Grassroots candidate)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded p-4 text-red-800">
              {errors.submit}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              onClick={handlePrev}
              variant="outline"
              disabled={currentStep === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            
            {currentStep < totalSteps - 1 ? (
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Declare Candidacy'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function DeclareCandidacyPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    }>
      <DeclareCandidacyPageContent />
    </Suspense>
  )
}

