'use client'

import { 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  FileText, 
  DollarSign, 
  ExternalLink,
  HelpCircle,
  MapPin,
  Phone,
  Mail
} from 'lucide-react'
import { useState, useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type FilingRequirement = {
  found: boolean
  requirement?: {
    authority: {
      name: string
      website: string
      phone?: string
      email?: string
      filingPortal?: string
      mailingAddress?: string
    }
    filingFees: {
      amount: number
      currency: string
      acceptedMethods: string[]
    }
    deadlines: {
      filingDeadline: {
        description: string
        daysBeforePrimary?: number
        daysBeforeElection?: number
        note?: string
      }
    }
    requiredForms: string[]
    submissionMethods: {
      online: boolean
      onlineUrl?: string
      paper: boolean
      inPerson: boolean
    }
    eligibility: {
      age?: number
      residency?: string[]
      citizenship?: string[]
    }
    checklist: string[]
    calculatedDeadline?: string
    helpfulLinks: {
      filingGuide?: string
      formLibrary?: string
      candidateGuide?: string
      faq?: string
    }
    notes?: string[]
    commonMistakes?: string[]
  }
  message?: string
}

type FilingAssistantProps = {
  level: 'federal' | 'state' | 'local'
  office: string
  state?: string
  electionDate?: string
  className?: string
}

export function FilingAssistant({ 
  level, 
  office, 
  state, 
  electionDate,
  className = '' 
}: FilingAssistantProps) {
  const [requirements, setRequirements] = useState<FilingRequirement | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(true)

  useEffect(() => {
    const fetchRequirements = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          level,
          office
        })
        if (state) params.append('state', state)
        if (electionDate) params.append('electionDate', electionDate)

        const response = await fetch(`/api/filing/requirements?${params.toString()}`)
        const data = await response.json()
        setRequirements(data)
      } catch (error) {
        console.error('Failed to fetch filing requirements:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRequirements()
  }, [level, office, state, electionDate])

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center">
          <div className="text-gray-500">Loading filing requirements...</div>
        </CardContent>
      </Card>
    )
  }

  if (!requirements || !requirements.found || !requirements.requirement) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <HelpCircle className="w-5 h-5 mr-2" />
            Filing Requirements
          </CardTitle>
          <CardDescription>
            {requirements?.message ?? 'Filing requirements not found for this office.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>What to do:</strong> Contact your local election authority for filing requirements:
            </p>
            <ul className="list-disc list-inside mt-2 text-sm text-blue-800 space-y-1">
              <li>For federal offices: Visit <a href="https://www.fec.gov" target="_blank" rel="noopener" className="underline">FEC.gov</a></li>
              <li>For state offices: Visit your Secretary of State website</li>
              <li>For local offices: Contact your local Board of Elections or City Clerk</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    )
  }

  const req = requirements.requirement
  const deadlineDate = req.calculatedDeadline ? new Date(req.calculatedDeadline) : null
  const isDeadlineSoon = deadlineDate && deadlineDate < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  const isDeadlinePast = deadlineDate && deadlineDate < new Date()

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Filing Requirements & Guidance
            </CardTitle>
            <CardDescription>
              Step-by-step guide for filing in {req.authority.name}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Collapse' : 'Expand'}
          </Button>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-6">
          {/* Deadline Warning */}
          {deadlineDate && (
            <div className={`border rounded-lg p-4 ${
              isDeadlinePast 
                ? 'bg-red-50 border-red-200' 
                : isDeadlineSoon 
                ? 'bg-yellow-50 border-yellow-200' 
                : 'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-start">
                {isDeadlinePast ? (
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
                ) : (
                  <Clock className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={`font-semibold ${
                    isDeadlinePast ? 'text-red-800' : 'text-yellow-800'
                  }`}>
                    {isDeadlinePast ? '⚠️ Filing Deadline Passed' : '📅 Filing Deadline'}
                  </p>
                  <p className={`text-sm mt-1 ${
                    isDeadlinePast ? 'text-red-700' : 'text-yellow-700'
                  }`}>
                    {req.deadlines.filingDeadline.description}
                  </p>
                  {deadlineDate && (
                    <p className={`font-medium mt-2 ${
                      isDeadlinePast ? 'text-red-800' : 'text-yellow-800'
                    }`}>
                      Deadline: {deadlineDate.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                      {req.deadlines.filingDeadline.note && (
                        <span className="block text-xs mt-1 font-normal">
                          {req.deadlines.filingDeadline.note}
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Filing Fees */}
          {req.filingFees.amount > 0 && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-start">
                <DollarSign className="w-5 h-5 text-gray-600 mr-2 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900">Filing Fee</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    ${req.filingFees.amount} {req.filingFees.currency}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Payment methods: {req.filingFees.acceptedMethods.join(', ')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Eligibility Requirements */}
          {(req.eligibility.age || req.eligibility.residency || req.eligibility.citizenship) && (
            <div>
              <h4 className="font-semibold mb-2 flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                Eligibility Requirements
              </h4>
              <ul className="space-y-1 text-sm">
                {req.eligibility.age && (
                  <li>• Must be at least <strong>{req.eligibility.age} years old</strong></li>
                )}
                {req.eligibility.citizenship && (
                  <li>• Citizenship: {req.eligibility.citizenship.join(', ')}</li>
                )}
                {req.eligibility.residency && (
                  <li>• Residency: {req.eligibility.residency.join(', ')}</li>
                )}
              </ul>
            </div>
          )}

          {/* Filing Checklist */}
          {req.checklist && req.checklist.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                Filing Checklist
              </h4>
              <div className="space-y-2">
                {req.checklist.map((item, index) => (
                  <div key={index} className="flex items-start">
                    <input 
                      type="checkbox" 
                      className="mt-1 mr-3" 
                      id={`checklist-${index}`}
                    />
                    <label 
                      htmlFor={`checklist-${index}`}
                      className="text-sm flex-1"
                    >
                      {item}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Required Forms */}
          {req.requiredForms && req.requiredForms.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2 flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                Required Forms
              </h4>
              <ul className="space-y-1">
                {req.requiredForms.map((form, index) => (
                  <li key={index} className="text-sm flex items-center">
                    <span className="w-2 h-2 rounded-full bg-blue-600 mr-2" />
                    {form}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Submission Methods */}
          <div>
            <h4 className="font-semibold mb-2 flex items-center">
              <MapPin className="w-4 h-4 mr-2" />
              How to File
            </h4>
            <div className="space-y-2">
              {req.submissionMethods.online && req.submissionMethods.onlineUrl && (
                <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <div>
                      <p className="font-medium">Online Filing Available</p>
                      <p className="text-sm text-gray-600">File directly through official portal</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <a 
                      href={req.submissionMethods.onlineUrl} 
                      target="_blank" 
                      rel="noopener"
                      className="flex items-center"
                    >
                      File Online
                      <ExternalLink className="w-4 h-4 ml-1" />
                    </a>
                  </Button>
                </div>
              )}
              {req.submissionMethods.paper && (
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center mb-2">
                    <FileText className="w-5 h-5 text-gray-600 mr-2" />
                    <p className="font-medium">Paper Filing</p>
                  </div>
                  {req.authority.mailingAddress && (
                    <p className="text-sm text-gray-600">
                      Mail to: {req.authority.mailingAddress}
                    </p>
                  )}
                </div>
              )}
              {req.submissionMethods.inPerson && (
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center">
                    <MapPin className="w-5 h-5 text-gray-600 mr-2" />
                    <p className="font-medium">In-Person Filing</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h4 className="font-semibold mb-2 flex items-center">
              <Phone className="w-4 h-4 mr-2" />
              Contact Election Authority
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <ExternalLink className="w-4 h-4 mr-2 text-gray-400" />
                <a 
                  href={req.authority.website} 
                  target="_blank" 
                  rel="noopener"
                  className="text-blue-600 hover:underline"
                >
                  {req.authority.website}
                </a>
              </div>
              {req.authority.phone && (
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-2 text-gray-400" />
                  <a href={`tel:${req.authority.phone}`} className="text-blue-600 hover:underline">
                    {req.authority.phone}
                  </a>
                </div>
              )}
              {req.authority.email && (
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-2 text-gray-400" />
                  <a href={`mailto:${req.authority.email}`} className="text-blue-600 hover:underline">
                    {req.authority.email}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Helpful Links */}
          {(req.helpfulLinks.filingGuide || req.helpfulLinks.formLibrary || req.helpfulLinks.candidateGuide) && (
            <div>
              <h4 className="font-semibold mb-2">Additional Resources</h4>
              <div className="space-y-2">
                {req.helpfulLinks.filingGuide && (
                  <a 
                    href={req.helpfulLinks.filingGuide}
                    target="_blank"
                    rel="noopener"
                    className="flex items-center text-sm text-blue-600 hover:underline"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Filing Guide
                  </a>
                )}
                {req.helpfulLinks.formLibrary && (
                  <a 
                    href={req.helpfulLinks.formLibrary}
                    target="_blank"
                    rel="noopener"
                    className="flex items-center text-sm text-blue-600 hover:underline"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Form Library
                  </a>
                )}
                {req.helpfulLinks.candidateGuide && (
                  <a 
                    href={req.helpfulLinks.candidateGuide}
                    target="_blank"
                    rel="noopener"
                    className="flex items-center text-sm text-blue-600 hover:underline"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Candidate Guide
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Common Mistakes */}
          {req.commonMistakes && req.commonMistakes.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold mb-2 flex items-center text-yellow-800">
                <AlertCircle className="w-4 h-4 mr-2" />
                Common Mistakes to Avoid
              </h4>
              <ul className="space-y-1 text-sm text-yellow-800">
                {req.commonMistakes.map((mistake, index) => (
                  <li key={index}>• {mistake}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Notes */}
          {req.notes && req.notes.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold mb-2 text-blue-800">Important Notes</h4>
              <ul className="space-y-1 text-sm text-blue-800">
                {req.notes.map((note, index) => (
                  <li key={index}>• {note}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}

