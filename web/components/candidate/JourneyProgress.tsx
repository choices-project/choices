'use client'

import { 
  CheckCircle2, 
  Circle, 
  AlertCircle, 
  ArrowRight,
  Calendar,
  FileText,
  Zap
} from 'lucide-react'
import { useState, useEffect } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

import logger from '@/lib/utils/logger'

type JourneyProgressProps = {
  platformId: string
  className?: string
}

export function JourneyProgress({ platformId, className = '' }: JourneyProgressProps) {
  const [progress, setProgress] = useState<any>(null)
  const [checklist, setChecklist] = useState<any[]>([])
  const [nextAction, setNextAction] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProgress = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/candidate/journey/progress?platformId=${platformId}`)
        if (!response.ok) {
          throw new Error(`Failed to fetch journey progress: ${response.statusText}`)
        }
        const result = await response.json()
        // API returns { success: true, data: { progress, checklist, nextAction, ... } } structure
        const data = result?.success && result?.data ? result.data : result
        
        if (data?.progress) {
          setProgress(data.progress)
          setChecklist(data.checklist ?? [])
          setNextAction(data.nextAction)
        }
      } catch (error) {
        logger.error('Failed to fetch journey progress:', error)
      } finally {
        setLoading(false)
      }
    }

    if (platformId) {
      fetchProgress()
    }
  }, [platformId])

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="py-8">
          <div className="flex flex-col items-center justify-center space-y-3" role="status" aria-live="polite" aria-busy="true">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400" aria-hidden="true" />
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Loading your journey progress...</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Please wait while we fetch your progress</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!progress) {
    return null
  }

  const progressPercent = checklist.filter((item: any) => item.completed).length / checklist.length * 100
  const urgencyColors: Record<string, string> = {
    low: 'bg-blue-100 text-blue-800 border-blue-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    critical: 'bg-red-100 text-red-800 border-red-200'
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Zap className="w-5 h-5 mr-2 text-yellow-500" />
              Your Candidate Journey
            </CardTitle>
            <CardDescription>
              Track your progress from declaration to active campaign
            </CardDescription>
          </div>
          <Badge variant="outline" className="ml-2">
            {progress.currentStage.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
          </Badge>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm text-gray-500">{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Next Action */}
        {nextAction && (
          <div className={`border rounded-lg p-4 ${urgencyColors[nextAction.urgency]}`}>
            <div className="flex items-start">
              {nextAction.urgency === 'critical' ? (
                <AlertCircle className="w-5 h-5 mr-2 mt-0.5" />
              ) : (
                <ArrowRight className="w-5 h-5 mr-2 mt-0.5" />
              )}
              <div className="flex-1">
                <h4 className="font-semibold mb-1">{nextAction.action}</h4>
                <p className="text-sm mb-2">{nextAction.description}</p>
                {nextAction.actionUrl && (
                  <Button
                    size="sm"
                    variant={nextAction.urgency === 'critical' ? 'destructive' : 'default'}
                    asChild
                  >
                    <a href={nextAction.actionUrl}>
                      {nextAction.actionLabel ?? 'Take Action'}
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </a>
                  </Button>
                )}
                {nextAction.dueDate && (
                  <p className="text-xs mt-2 opacity-75">
                    Due: {new Date(nextAction.dueDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Deadline Warning */}
        {progress.daysUntilDeadline !== undefined && progress.daysUntilDeadline >= 0 && progress.currentStage !== 'filed' && (
          <div className={`border rounded-lg p-4 ${
            progress.daysUntilDeadline <= 1 
              ? 'bg-red-50 border-red-200' 
              : progress.daysUntilDeadline <= 7 
              ? 'bg-orange-50 border-orange-200' 
              : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-start">
              <Calendar className="w-5 h-5 mr-2 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold mb-1">
                  Filing Deadline: {progress.daysUntilDeadline} {progress.daysUntilDeadline === 1 ? 'day' : 'days'}
                </h4>
                <p className="text-sm">
                  {progress.daysUntilDeadline <= 1 
                    ? '⚠️ Deadline is very soon! File immediately.'
                    : progress.daysUntilDeadline <= 7
                    ? '⏰ Deadline approaching. Complete your filing now.'
                    : '📅 Make sure you\'re on track to meet your filing deadline.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Checklist */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center">
            <FileText className="w-4 h-4 mr-2" />
            Your Action Items
          </h4>
          <div className="space-y-2">
            {checklist.map((item: any) => (
              <div
                key={item.id}
                className={`flex items-start p-3 rounded-lg border ${
                  item.completed 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="mt-0.5 mr-3">
                  {item.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className={`text-sm ${item.completed ? 'text-green-800 line-through' : 'text-gray-900'}`}>
                    {item.label}
                  </p>
                  {item.actionUrl && !item.completed && (
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 h-auto mt-1 text-xs"
                      asChild
                    >
                      <a href={item.actionUrl}>
                        {item.actionLabel ?? 'Take action'}
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stage Info */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Days Since Declaration</p>
              <p className="text-2xl font-bold">{progress.daysSinceDeclaration}</p>
            </div>
            {progress.lastActiveAt && (
              <div className="text-right">
                <p className="text-sm font-medium">Last Active</p>
                <p className="text-sm text-gray-500">
                  {new Date(progress.lastActiveAt).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

