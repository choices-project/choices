'use client'

import { Edit, Building2, FileText, Globe, Phone, Mail, CheckCircle, AlertCircle, FileCheck, Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

import { JourneyProgress } from '@/components/candidate/JourneyProgress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useUserStore } from '@/lib/stores/userStore'
import logger from '@/lib/utils/logger'
import type { CandidatePlatformRow } from '@/types/candidate'

export default function CandidateDashboardPage() {
  const router = useRouter()
  const { isAuthenticated } = useUserStore()
  const [platforms, setPlatforms] = useState<CandidatePlatformRow[]>([])
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState<string | null>(null) // Platform ID being verified

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth')
      return
    }

    fetch('/api/candidate/platform')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPlatforms(data.platforms || [])
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [isAuthenticated, router])

  const handleVerifyFEC = async (platformId: string, fecId: string) => {
    if (!fecId) {
      alert('Please enter a FEC ID in the official filing section first')
      return
    }

    setVerifying(platformId)
    try {
      const response = await fetch('/api/candidate/verify-fec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platformId, fecId })
      })

      const result = await response.json()

      if (result.success) {
        // Refresh platforms to show updated status
        const refreshResponse = await fetch('/api/candidate/platform')
        const refreshData = await refreshResponse.json()
        if (refreshData.success) {
          setPlatforms(refreshData.platforms || [])
        }
        alert(`✅ Verified! ${result.candidate.name} is ${result.candidate.active ? 'active' : 'registered'} in FEC database.`)
      } else {
        alert(`❌ ${result.message || 'Verification failed'}`)
      }
    } catch (error) {
      logger.error('FEC verification error:', error)
      alert('Failed to verify with FEC. Please try again.')
    } finally {
      setVerifying(null)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Candidate Dashboard</h1>
          <p className="text-gray-600">Manage your candidacy and platform</p>
        </div>
        <Button onClick={() => router.push('/candidate/declare')}>
          <Building2 className="w-4 h-4 mr-2" />
          Declare New Candidacy
        </Button>
      </div>

      {/* Journey Progress - Show for most recent platform */}
      {platforms.length > 0 && platforms[0] && (
        <div className="mb-8">
          <JourneyProgress platformId={platforms[0].id} />
        </div>
      )}

      {platforms.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Candidacies Yet</h3>
            <p className="text-gray-600 mb-6">
              Declare your candidacy to start building your platform and connecting with voters.
            </p>
            <Button onClick={() => router.push('/candidate/declare')}>
              Declare Candidacy
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {platforms.map((platform) => (
            <Card key={platform.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl mb-2">{platform.candidate_name}</CardTitle>
                    <CardDescription className="text-lg">{platform.office}</CardDescription>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {platform.party && (
                        <Badge variant="outline">{platform.party}</Badge>
                      )}
                      <Badge variant={platform.verified ? 'default' : 'secondary'}>
                        {platform.verified ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verified
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Pending Verification
                          </>
                        )}
                      </Badge>
                      <Badge variant="outline">{platform.status}</Badge>
                      {platform.filing_status && (
                        <Badge 
                          variant={
                            platform.filing_status === 'verified' ? 'default' :
                            platform.filing_status === 'pending_verification' ? 'secondary' :
                            platform.filing_status === 'filed' ? 'outline' : 'secondary'
                          }
                        >
                          {platform.filing_status === 'verified' && <FileCheck className="w-3 h-3 mr-1" />}
                          {platform.filing_status === 'pending_verification' && <Clock className="w-3 h-3 mr-1" />}
                          Filing: {platform.filing_status.replace('_', ' ')}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {platform.level === 'federal' && platform.official_filing_id && (
                      <Button
                        onClick={() => handleVerifyFEC(platform.id, platform.official_filing_id ?? '')}
                        variant="outline"
                        disabled={verifying === platform.id}
                        className="text-green-600 border-green-600 hover:bg-green-50"
                      >
                        {verifying === platform.id ? (
                          <>Verifying...</>
                        ) : (
                          <>
                            <FileCheck className="w-4 h-4 mr-2" />
                            Verify with FEC
                          </>
                        )}
                      </Button>
                    )}
                    <Button
                      onClick={() => router.push(`/candidate/platform/${platform.id}/edit`)}
                      variant="outline"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Platform
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Platform Positions */}
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center">
                      <FileText className="w-4 h-4 mr-2" />
                      Platform Positions ({platform.platform_positions?.length || 0})
                    </h4>
                    {platform.platform_positions && platform.platform_positions.length > 0 ? (
                      <ul className="space-y-2">
                        {platform.platform_positions.slice(0, 5).map((pos, idx) => (
                          <li key={idx} className="text-sm">
                            <span className="font-medium">{pos.title}:</span> {pos.position}
                          </li>
                        ))}
                        {platform.platform_positions.length > 5 && (
                          <li className="text-sm text-gray-500">
                            +{platform.platform_positions.length - 5} more positions
                          </li>
                        )}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">No platform positions added yet</p>
                    )}
                  </div>

                  {/* Campaign Info */}
                  <div>
                    <h4 className="font-semibold mb-3">Campaign Information</h4>
                    <div className="space-y-2 text-sm">
                      {platform.campaign_website && (
                        <div className="flex items-center">
                          <Globe className="w-4 h-4 mr-2 text-gray-400" />
                          <a href={platform.campaign_website} target="_blank" rel="noopener" className="text-blue-600 hover:underline">
                            {platform.campaign_website}
                          </a>
                        </div>
                      )}
                      {platform.campaign_email && (
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 mr-2 text-gray-400" />
                          {platform.campaign_email}
                        </div>
                      )}
                      {platform.campaign_phone && (
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 mr-2 text-gray-400" />
                          {platform.campaign_phone}
                        </div>
                      )}
                      {!platform.campaign_website && !platform.campaign_email && !platform.campaign_phone && (
                        <p className="text-gray-500">No campaign contact information</p>
                      )}
                    </div>
                  </div>
                </div>

                {platform.experience && (
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="font-semibold mb-2">Experience</h4>
                    <p className="text-sm text-gray-700">{platform.experience}</p>
                  </div>
                )}

                {platform.endorsements && platform.endorsements.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2">Endorsements ({platform.endorsements.length})</h4>
                    <div className="flex flex-wrap gap-2">
                      {platform.endorsements.map((endorsement, idx) => (
                        <Badge key={idx} variant="outline">{endorsement}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Official Filing Information */}
                {(platform.filing_status && platform.filing_status !== 'not_filed') && (
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="font-semibold mb-3 flex items-center">
                      <FileCheck className="w-4 h-4 mr-2" />
                      Official Filing Status
                    </h4>
                    <div className="space-y-2 text-sm">
                      {platform.official_filing_id && (
                        <div>
                          <span className="font-medium">Filing ID:</span> {platform.official_filing_id}
                        </div>
                      )}
                      {platform.filing_jurisdiction && (
                        <div>
                          <span className="font-medium">Election Authority:</span> {platform.filing_jurisdiction}
                        </div>
                      )}
                      {platform.official_filing_date && (
                        <div>
                          <span className="font-medium">Filing Date:</span> {new Date(platform.official_filing_date).toLocaleDateString()}
                        </div>
                      )}
                      {platform.filing_deadline && (
                        <div>
                          <span className="font-medium">Filing Deadline:</span>{' '}
                          {new Date(platform.filing_deadline).toLocaleDateString()}
                          {new Date(platform.filing_deadline) < new Date() && (
                            <Badge variant="destructive" className="ml-2">Past Due</Badge>
                          )}
                        </div>
                      )}
                      {platform.election_date && (
                        <div>
                          <span className="font-medium">Election Date:</span> {new Date(platform.election_date).toLocaleDateString()}
                        </div>
                      )}
                      {platform.filing_document_url && (
                        <div>
                          <a 
                            href={platform.filing_document_url} 
                            target="_blank" 
                            rel="noopener"
                            className="text-blue-600 hover:underline flex items-center"
                          >
                            <FileText className="w-4 h-4 mr-1" />
                            View Filing Document
                          </a>
                        </div>
                      )}
                      {platform.ballot_access_confirmed && (
                        <Badge variant="default" className="mt-2">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Ballot Access Confirmed
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Filing Reminder */}
                {(!platform.filing_status || platform.filing_status === 'not_filed') && platform.filing_deadline && (
                  <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                      <div className="text-sm text-yellow-800">
                        <p className="font-semibold mb-1">Filing Deadline Reminder</p>
                        <p>
                          Filing deadline: {new Date(platform.filing_deadline).toLocaleDateString()}
                          {new Date(platform.filing_deadline) < new Date() && (
                            <span className="font-semibold text-red-600 ml-2">⚠️ Past Due</span>
                          )}
                        </p>
                        <p className="mt-2">
                          Remember to file with {platform.filing_jurisdiction ?? 'the appropriate election authority'} 
                          {' '}to be legally recognized as a candidate.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

