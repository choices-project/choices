import { type NextRequest, NextResponse } from 'next/server'

import { 
  getFilingRequirements,
  calculateFilingDeadline,
  type OfficeType
} from '@/lib/filing/filing-requirements'
import { logger } from '@/lib/utils/logger'

/**
 * Type guard for OfficeType
 */
function isOfficeType(value: string | null): value is OfficeType {
  return value === 'federal' || value === 'state' || value === 'local'
}

/**
 * GET /api/filing/calculate-deadline
 * Calculate filing deadline based on election date
 * 
 * Query parameters:
 * - level: 'federal' | 'state' | 'local'
 * - office: Office name
 * - state: State code (optional)
 * - electionDate: ISO date string (required)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const levelParam = searchParams.get('level')
    const office = searchParams.get('office')
    const state = searchParams.get('state') ?? undefined
    const electionDateStr = searchParams.get('electionDate')

    if (!levelParam || !office || !electionDateStr) {
      return NextResponse.json(
        { error: 'Level, office, and electionDate are required' },
        { status: 400 }
      )
    }

    // Validate level is a valid OfficeType
    if (!isOfficeType(levelParam)) {
      return NextResponse.json(
        { error: 'Invalid level. Must be: federal, state, or local' },
        { status: 400 }
      )
    }

    const requirement = getFilingRequirements(levelParam, office, state)

    if (!requirement) {
      return NextResponse.json({
        found: false,
        message: 'Filing requirements not found for this office'
      })
    }

    const electionDate = new Date(electionDateStr)
    if (isNaN(electionDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid election date' },
        { status: 400 }
      )
    }

    const deadline = calculateFilingDeadline(requirement, electionDate)

    if (!deadline) {
      return NextResponse.json({
        found: true,
        deadline: null,
        message: requirement.deadlines.filingDeadline.description,
        note: requirement.deadlines.filingDeadline.note ?? null
      })
    }

    const now = new Date()
    const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    const isPast = deadline < now
    const isSoon = daysUntil <= 30 && daysUntil > 0

    return NextResponse.json({
      found: true,
      deadline: deadline.toISOString(),
      deadlineFormatted: deadline.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      daysUntil,
      isPast,
      isSoon,
      urgency: isPast ? 'past' : isSoon ? 'soon' : 'normal',
      description: requirement.deadlines.filingDeadline.description,
      note: requirement.deadlines.filingDeadline.note ?? null
    })
  } catch (error) {
    logger.error('Deadline calculation error:', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

