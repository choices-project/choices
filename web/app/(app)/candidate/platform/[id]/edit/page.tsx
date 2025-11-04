'use client'

import { ArrowLeft, Save } from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import { useState, useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { logger } from '@/lib/utils/logger'
import type { CandidatePlatformRow } from '@/types/candidate'

export default function EditPlatformPage() {
  const router = useRouter()
  const params = useParams()
  const platformId = params.id as string

  const [platform, setPlatform] = useState<CandidatePlatformRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Fetch platform data
    fetch(`/api/candidate/platform?userId=current`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.platforms) {
          const found = data.platforms.find((p: CandidatePlatformRow) => p.id === platformId)
          if (found) {
            setPlatform(found)
          } else {
            setError('Platform not found')
          }
        }
      })
      .catch(() => setError('Failed to load platform'))
      .finally(() => setLoading(false))
  }, [platformId])

  const handleSave = async () => {
    if (!platform) return;
    
    setSaving(true)
    try {
      const response = await fetch('/api/candidate/platform', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: platformId,
          candidateName: platform.candidate_name,
          party: platform.party,
          photoUrl: platform.photo_url,
          experience: platform.experience,
          platformPositions: platform.platform_positions,
          endorsements: platform.endorsements,
          campaignWebsite: platform.campaign_website,
          campaignEmail: platform.campaign_email,
          campaignPhone: platform.campaign_phone,
          visibility: platform.visibility
        })
      })

      const data = await response.json()
      if (data.success) {
        router.push('/candidate/dashboard')
      } else {
        setError(data.error ?? 'Failed to save')
      }
    } catch (err) {
      logger.error('Failed to save platform:', err)
      setError('Failed to save platform')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="container mx-auto py-8">Loading...</div>
  }

  if (error || !platform) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center text-red-600">{error ?? 'Platform not found'}</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-6">
        <Button onClick={() => router.back()} variant="ghost">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Platform: {platform.candidate_name}</CardTitle>
          <CardDescription>{platform.office}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="font-semibold">Basic Information</h3>
            <div>
              <label className="block text-sm font-medium mb-2">Candidate Name</label>
              <Input
                value={platform.candidate_name ?? ''}
                onChange={(e) => setPlatform({ ...platform, candidate_name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Party</label>
              <Input
                value={platform.party ?? ''}
                onChange={(e) => setPlatform({ ...platform, party: e.target.value })}
              />
            </div>
          </div>

          {/* Platform Positions */}
          <div className="space-y-4">
            <h3 className="font-semibold">Platform Positions</h3>
            <p className="text-sm text-gray-600">
              Edit your positions. Changes will be reflected on your candidate profile.
            </p>
            {/* Platform positions editor would go here - simplified for now */}
          </div>

          {/* Experience */}
          <div>
            <label className="block text-sm font-medium mb-2">Experience</label>
            <Textarea
              value={platform.experience ?? ''}
              onChange={(e) => setPlatform({ ...platform, experience: e.target.value })}
              rows={6}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button onClick={() => router.back()} variant="outline">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

