/**
 * Candidate Journey Tracker
 * 
 * Tracks candidate progress from declaration through filing to active campaign.
 * Ensures we don't lose candidates in the gap between interest and action.
 * 
 * @created 2025-01-30
 */

export type JourneyStage = 
  | 'declared'           // Just declared candidacy
  | 'preparing'          // Gathering documents, understanding requirements
  | 'filing_in_progress' // Started filing process
  | 'filed'              // Filed officially
  | 'verified'           // Filing verified
  | 'active'             // Actively campaigning

export type JourneyMilestone = 
  | 'declaration_complete'
  | 'requirements_reviewed'
  | 'documents_gathered'
  | 'forms_started'
  | 'forms_completed'
  | 'filing_submitted'
  | 'filing_verified'
  | 'platform_launched'

export type JourneyProgress = {
  platformId: string
  userId: string
  currentStage: JourneyStage
  milestones: JourneyMilestone[]
  lastActiveAt: Date
  nextActionDue?: Date
  nextActionType?: string
  lastReminderSent?: Date
  daysSinceDeclaration: number
  daysUntilDeadline?: number
}

export type JourneyChecklistItem = {
  id: string
  label: string
  stage: JourneyStage
  required: boolean
  completed: boolean
  completedAt?: Date
  actionUrl?: string
  actionLabel?: string
}

/**
 * Get journey checklist for a candidate
 */
export function getJourneyChecklist(stage: JourneyStage): JourneyChecklistItem[] {
  const baseChecklist: JourneyChecklistItem[] = [
    {
      id: 'review_requirements',
      label: 'Review filing requirements for your office',
      stage: 'declared',
      required: true,
      completed: false,
      actionUrl: '/candidate/dashboard#requirements',
      actionLabel: 'View Requirements'
    },
    {
      id: 'gather_documents',
      label: 'Gather required documents (citizenship, residency, etc.)',
      stage: 'preparing',
      required: true,
      completed: false
    },
    {
      id: 'calculate_deadline',
      label: 'Know your filing deadline',
      stage: 'preparing',
      required: true,
      completed: false,
      actionUrl: '/candidate/dashboard#deadline',
      actionLabel: 'Check Deadline'
    },
    {
      id: 'complete_forms',
      label: 'Complete required filing forms',
      stage: 'filing_in_progress',
      required: true,
      completed: false
    },
    {
      id: 'pay_fees',
      label: 'Pay filing fees (if required)',
      stage: 'filing_in_progress',
      required: false,
      completed: false
    },
    {
      id: 'submit_filing',
      label: 'Submit official filing to election authority',
      stage: 'filing_in_progress',
      required: true,
      completed: false,
      actionLabel: 'File Now'
    },
    {
      id: 'save_receipt',
      label: 'Save filing receipt/confirmation number',
      stage: 'filed',
      required: true,
      completed: false
    },
    {
      id: 'verify_filing',
      label: 'Verify filing with Choices platform',
      stage: 'filed',
      required: true,
      completed: false,
      actionUrl: '/candidate/dashboard#verify',
      actionLabel: 'Verify Now'
    },
    {
      id: 'launch_platform',
      label: 'Launch your candidate platform publicly',
      stage: 'verified',
      required: false,
      completed: false,
      actionUrl: '/candidate/dashboard#platform',
      actionLabel: 'Launch Platform'
    }
  ]

  // Filter to show items up to current stage + next stage
  const stageOrder: JourneyStage[] = ['declared', 'preparing', 'filing_in_progress', 'filed', 'verified', 'active']
  const currentIndex = stageOrder.indexOf(stage)
  const nextStageIndex = Math.min(currentIndex + 1, stageOrder.length - 1)
  const visibleStages = stageOrder.slice(0, nextStageIndex + 1)

  return baseChecklist.filter(item => visibleStages.includes(item.stage))
}

/**
 * Calculate next action for candidate
 */
export function getNextAction(progress: JourneyProgress): {
  action: string
  description: string
  urgency: 'low' | 'medium' | 'high' | 'critical'
  dueDate?: Date
  actionUrl?: string
} | null {
  // Check if deadline approaching
  if (progress.daysUntilDeadline !== undefined) {
    if (progress.daysUntilDeadline <= 0 && progress.currentStage !== 'filed') {
      return {
        action: 'File immediately - deadline has passed',
        description: 'Your filing deadline has passed. File as soon as possible.',
        urgency: 'critical',
        actionUrl: '/candidate/dashboard#file'
      }
    }
    if (progress.daysUntilDeadline <= 1 && progress.currentStage !== 'filed') {
      return {
        action: 'File today - deadline tomorrow',
        description: 'Your filing deadline is tomorrow. Complete and submit your filing today.',
        urgency: 'critical',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        actionUrl: '/candidate/dashboard#file'
      }
    }
    if (progress.daysUntilDeadline <= 7 && progress.currentStage !== 'filed') {
      return {
        action: 'File within 7 days',
        description: `Your filing deadline is in ${progress.daysUntilDeadline} days. Complete your filing now.`,
        urgency: 'high',
        dueDate: new Date(Date.now() + progress.daysUntilDeadline * 24 * 60 * 60 * 1000),
        actionUrl: '/candidate/dashboard#file'
      }
    }
  }

  // Stage-specific next actions
  switch (progress.currentStage) {
    case 'declared':
      return {
        action: 'Review filing requirements',
        description: 'Understand what you need to file for your office.',
        urgency: 'high',
        actionUrl: '/candidate/dashboard#requirements'
      }
    
    case 'preparing':
      if (progress.daysSinceDeclaration > 7) {
        return {
          action: 'Continue filing preparation',
          description: 'You\'ve been preparing for 7+ days. Ready to start filing?',
          urgency: 'medium',
          actionUrl: '/candidate/dashboard#file'
        }
      }
      return {
        action: 'Gather required documents',
        description: 'Collect all documents needed for filing.',
        urgency: 'medium',
        actionUrl: '/candidate/dashboard#documents'
      }
    
    case 'filing_in_progress':
      return {
        action: 'Complete and submit filing',
        description: 'Finish your filing forms and submit to the election authority.',
        urgency: 'high',
        actionUrl: '/candidate/dashboard#file'
      }
    
    case 'filed':
      return {
        action: 'Verify your filing',
        description: 'Verify your official filing to update your candidate status.',
        urgency: 'high',
        actionUrl: '/candidate/dashboard#verify'
      }
    
    case 'verified':
      return {
        action: 'Launch your campaign',
        description: 'Your filing is verified! Time to launch your platform and start campaigning.',
        urgency: 'low',
        actionUrl: '/candidate/dashboard#campaign'
      }
    
    case 'active':
      return null // No action needed, they're active
    
    default:
      return null
  }
}

/**
 * Determine if reminder should be sent
 */
export function shouldSendReminder(progress: JourneyProgress): {
  shouldSend: boolean
  reminderType: 'welcome' | 'deadline_30' | 'deadline_7' | 'deadline_1' | 'check_in' | 'verify'
  message: string
} | null {
  const now = new Date()
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
  const lastReminder = progress.lastReminderSent ? new Date(progress.lastReminderSent) : null

  // Welcome reminder - 24 hours after declaration
  if (progress.daysSinceDeclaration === 1 && progress.currentStage === 'declared') {
    if (!lastReminder || lastReminder < threeDaysAgo) {
      return {
        shouldSend: true,
        reminderType: 'welcome',
        message: 'Welcome! Here\'s your next steps to officially file for office.'
      }
    }
  }

  // Check-in reminder - 3 days of no activity
  if (progress.lastActiveAt < threeDaysAgo && progress.currentStage !== 'active') {
    if (!lastReminder || lastReminder < threeDaysAgo) {
      return {
        shouldSend: true,
        reminderType: 'check_in',
        message: 'How\'s your filing process going? We\'re here to help!'
      }
    }
  }

  // Deadline reminders
  if (progress.daysUntilDeadline !== undefined && progress.currentStage !== 'filed') {
    if (progress.daysUntilDeadline === 30 && (!lastReminder?.toString().includes('deadline_30'))) {
      return {
        shouldSend: true,
        reminderType: 'deadline_30',
        message: 'Your filing deadline is in 30 days. Start preparing now!'
      }
    }
    if (progress.daysUntilDeadline === 7 && (!lastReminder?.toString().includes('deadline_7'))) {
      return {
        shouldSend: true,
        reminderType: 'deadline_7',
        message: 'Your filing deadline is in 7 days. Complete your filing now!'
      }
    }
    if (progress.daysUntilDeadline === 1 && (!lastReminder?.toString().includes('deadline_1'))) {
      return {
        shouldSend: true,
        reminderType: 'deadline_1',
        message: 'Your filing deadline is tomorrow! File today!'
      }
    }
  }

  // Verification reminder - filed but not verified after 3 days
  if (progress.currentStage === 'filed' && progress.daysSinceDeclaration > 3) {
    if (!progress.milestones.includes('filing_verified')) {
      if (!lastReminder?.toString().includes('verify')) {
        return {
          shouldSend: true,
          reminderType: 'verify',
          message: 'Did you file? Verify your filing to update your candidate status!'
        }
      }
    }
  }

  return null
}

/**
 * Calculate progress percentage
 */
export function calculateProgress(progress: JourneyProgress, checklist: JourneyChecklistItem[]): number {
  const completed = checklist.filter(item => item.completed).length
  const total = checklist.length
  return total > 0 ? Math.round((completed / total) * 100) : 0
}

/**
 * Get journey stage description
 */
export function getStageDescription(stage: JourneyStage): string {
  const descriptions: Record<JourneyStage, string> = {
    declared: 'You\'ve declared your candidacy! Review requirements and prepare to file.',
    preparing: 'Gathering documents and preparing for official filing.',
    filing_in_progress: 'Working through filing forms and requirements.',
    filed: 'Filing submitted! Verify to update your status.',
    verified: 'Filing verified! You\'re an official candidate.',
    active: 'Active campaign in progress. Good luck!'
  }
  return descriptions[stage] || ''
}

