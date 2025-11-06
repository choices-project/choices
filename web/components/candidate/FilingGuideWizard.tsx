'use client'

import { 
  ChevronRight, 
  CheckCircle, 
  ArrowRight, 
  FileText,
  DollarSign,
  AlertCircle,
  ExternalLink,
  Save
} from 'lucide-react'
import React, { useState, useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type GuideStep = {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  content: React.ReactNode
  completed?: boolean
}

type FilingGuideWizardProps = {
  level: 'federal' | 'state' | 'local'
  office: string
  state?: string
  onComplete?: () => void
  className?: string
}

export function FilingGuideWizard({
  level,
  office,
  state,
  onComplete,
  className = ''
}: FilingGuideWizardProps) {
  // Load saved progress from localStorage
  const getSavedProgress = () => {
    if (typeof window === 'undefined') return { step: 0, completed: new Set<string>() }
    try {
      const saved = localStorage.getItem(`filing-guide-${level}-${office}-${state ?? 'general'}`)
      if (saved) {
        const parsed = JSON.parse(saved)
        return {
          step: parsed.step ?? 0,
          completed: new Set<string>(parsed.completed ?? [])
        }
      }
    } catch {
      // Ignore errors
    }
    return { step: 0, completed: new Set<string>() }
  }

  const saved = getSavedProgress()
  const [currentStep, setCurrentStep] = useState(saved.step)
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(saved.completed)
  
  // Save progress to localStorage
  const saveProgress = (step: number, completed: Set<string>) => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(
        `filing-guide-${level}-${office}-${state ?? 'general'}`,
        JSON.stringify({
          step,
          completed: Array.from(completed),
          timestamp: new Date().toISOString()
        })
      )
    } catch {
      // Ignore errors (private browsing, etc.)
    }
  }
  
  // Fetch requirements to enhance guide content
  const [requirements, setRequirements] = useState<any>(null)
  const [_loadingRequirements, setLoadingRequirements] = useState(false)
  
  useEffect(() => {
    const fetchRequirements = async () => {
      setLoadingRequirements(true)
      try {
        const params = new URLSearchParams({ level, office })
        if (state) params.append('state', state)
        const response = await fetch(`/api/filing/requirements?${params.toString()}`)
        const data = await response.json()
        if (data.found) {
          setRequirements(data.requirement)
        }
      } catch {
        // Ignore errors
      } finally {
        setLoadingRequirements(false)
      }
    }
    fetchRequirements()
  }, [level, office, state])

  const steps: GuideStep[] = [
    {
      id: 'understand',
      title: 'Understand Requirements',
      description: 'Learn what you need to file',
      icon: <FileText className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            Before filing, it's important to understand the specific requirements for your office and jurisdiction.
          </p>
          
          {/* Show actual requirements if available */}
          {requirements && (
            <div className="space-y-3">
              {requirements.eligibility && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 text-blue-900">Eligibility Requirements:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
                    {requirements.eligibility.age && (
                      <li>Age: At least {requirements.eligibility.age} years old</li>
                    )}
                    {requirements.eligibility.citizenship && (
                      <li>Citizenship: {requirements.eligibility.citizenship.join(', ')}</li>
                    )}
                    {requirements.eligibility.residency && (
                      <li>Residency: {requirements.eligibility.residency.join(', ')}</li>
                    )}
                  </ul>
                </div>
              )}
              
              {requirements.filingFees && requirements.filingFees.amount > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 text-yellow-900">Filing Fee:</h4>
                  <p className="text-2xl font-bold text-yellow-800">
                    ${requirements.filingFees.amount.toLocaleString()} {requirements.filingFees.currency}
                  </p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Payment: {requirements.filingFees.acceptedMethods.join(', ')}
                  </p>
                </div>
              )}
              
              {requirements.requiredForms && requirements.requiredForms.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Required Forms:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    {requirements.requiredForms.map((form: string, i: number) => (
                      <li key={i}>{form}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          
          {!requirements && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold mb-2">What You'll Learn:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                  <li>Eligibility requirements (age, residency, citizenship)</li>
                  <li>Required forms and documents</li>
                  <li>Filing fees and payment methods</li>
                  <li>Deadlines and important dates</li>
                  <li>Submission methods (online, mail, in-person)</li>
                </ul>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Tip:</strong> Requirements vary by jurisdiction. Make sure you're following the rules for your specific office and location.
                </p>
              </div>
            </>
          )}
        </div>
      )
    },
    {
      id: 'prepare',
      title: 'Gather Documents',
      description: 'Collect everything you need',
      icon: <CheckCircle className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            Prepare all required documents before starting the filing process. This will make everything go smoothly.
          </p>
          <div className="space-y-3">
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2 flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                Documents You'll Need
              </h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                <li>Proof of citizenship (birth certificate, passport)</li>
                <li>Proof of residency (driver's license, utility bill)</li>
                <li>Financial disclosure forms (if required)</li>
                <li>Campaign finance organization documents</li>
                <li>Petition signatures (if required)</li>
              </ul>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2 flex items-center">
                <DollarSign className="w-4 h-4 mr-2" />
                Payment Ready
              </h4>
              <p className="text-sm text-gray-700">
                Have your payment method ready if filing fees apply. Accepted methods vary by jurisdiction.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'file',
      title: 'File Officially',
      description: 'Submit through official channels',
      icon: <ArrowRight className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            Now it's time to file through the official election authority. Follow the steps carefully.
          </p>
          
          {/* Show actual filing portal if available */}
          {requirements?.submissionMethods && (
            <div className="space-y-3">
              {requirements.submissionMethods.online && requirements.authority.filingPortal && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 text-green-800 flex items-center">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Online Filing Available
                  </h4>
                  <p className="text-sm text-green-700 mb-3">
                    You can file online through the official portal:
                  </p>
                  <Button
                    asChild
                    className="w-full"
                  >
                    <a href={requirements.authority.filingPortal} target="_blank" rel="noopener">
                      File Online Now
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                </div>
              )}
              
              {requirements.authority.website && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Official Authority:</h4>
                  <p className="text-sm text-gray-700 mb-2">{requirements.authority.name}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <a href={requirements.authority.website} target="_blank" rel="noopener">
                      Visit Official Website
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                  {requirements.authority.phone && (
                    <p className="text-sm text-gray-600 mt-2">
                      Phone: <a href={`tel:${requirements.authority.phone}`} className="text-blue-600 hover:underline">{requirements.authority.phone}</a>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold mb-2 text-green-800">Filing Steps:</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-green-800">
              <li>Go to the official filing portal or office</li>
              <li>Complete all required forms accurately</li>
              <li>Attach all required documents</li>
              <li>Pay filing fees (if required)</li>
              <li>Submit your filing</li>
              <li>Save your filing receipt/confirmation number</li>
            </ol>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <AlertCircle className="w-4 h-4 inline mr-1" />
              <strong>Important:</strong> After filing, return here to verify your filing. You'll need your official filing ID or confirmation number.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'verify',
      title: 'Verify Filing',
      description: 'Confirm your filing is complete',
      icon: <CheckCircle className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            Once you've filed officially, verify your filing with us to update your candidate status.
          </p>
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-2">What to Do Next:</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>Get your official filing ID or confirmation number from the election authority</li>
              <li>Return to your candidate dashboard</li>
              <li>Enter your filing information in the "Official Filing" section</li>
              <li>Upload proof of filing document (optional but recommended)</li>
              <li>Click "Verify with FEC" if filing for federal office</li>
            </ol>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Why verify?</strong> Verification confirms your candidacy is official and makes your profile more credible to voters.
            </p>
          </div>
        </div>
      )
    }
  ]

  const markStepComplete = (stepId: string) => {
    const newCompleted = new Set(completedSteps)
    newCompleted.add(stepId)
    setCompletedSteps(newCompleted)
    saveProgress(currentStep, newCompleted)
  }

  const nextStep = () => {
    const currentStepData = steps[currentStep];
    if (!currentStepData) return;
    
    if (currentStep < steps.length - 1) {
      markStepComplete(currentStepData.id)
      const next = currentStep + 1
      setCurrentStep(next)
      saveProgress(next, completedSteps)
    } else {
      markStepComplete(currentStepData.id)
      if (onComplete) onComplete()
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      const prev = currentStep - 1
      setCurrentStep(prev)
      saveProgress(prev, completedSteps)
    }
  }

  const goToStep = (index: number) => {
    const targetStep = steps[index];
    if (!targetStep) return;
    if (index <= currentStep || completedSteps.has(targetStep.id)) {
      setCurrentStep(index)
      saveProgress(index, completedSteps)
    }
  }

  const currentStepData = steps[currentStep]
  const isLastStep = currentStep === steps.length - 1
  const progress = ((currentStep + 1) / steps.length) * 100

  if (!currentStepData) {
    return <div>Loading...</div>;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Filing Guide: {office}</CardTitle>
        <CardDescription>
          Step-by-step guide to officially filing for candidacy
        </CardDescription>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-gray-500">
            Step {currentStep + 1} of {steps.length}
          </span>
          <span className="text-sm font-medium text-blue-600">
            {Math.round(progress)}% Complete
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step Navigation */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <button
                onClick={() => goToStep(index)}
                className={`flex flex-col items-center flex-1 ${
                  index <= currentStep ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                }`}
                disabled={index > currentStep}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                  index < currentStep 
                    ? 'bg-green-500 text-white' 
                    : index === currentStep 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {index < currentStep ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    step.icon
                  )}
                </div>
                <span className={`text-xs text-center ${
                  index === currentStep ? 'font-semibold text-blue-600' : 'text-gray-500'
                }`}>
                  {step.title}
                </span>
              </button>
              {index < steps.length - 1 && (
                <ChevronRight className="w-4 h-4 text-gray-400 mx-1" />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="border-t pt-6">
          <div className="mb-4">
            <h3 className="text-xl font-semibold mb-2 flex items-center">
              {currentStepData.icon}
              <span className="ml-2">{currentStepData.title}</span>
            </h3>
            <p className="text-gray-600">{currentStepData.description}</p>
          </div>
          <div className="min-h-[200px]">
            {currentStepData.content}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            Previous
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => saveProgress(currentStep, completedSteps)}
              className="text-sm"
            >
              <Save className="w-4 h-4 mr-1" />
              Save Progress
            </Button>
            <Button
              onClick={nextStep}
              className="flex items-center"
            >
              {isLastStep ? 'Complete Guide' : 'Next Step'}
              {!isLastStep && <ChevronRight className="w-4 h-4 ml-1" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

