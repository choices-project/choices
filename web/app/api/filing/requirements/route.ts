import { type NextRequest, NextResponse } from 'next/server'

import { 
  getFilingRequirements, 
  calculateFilingDeadline,
  getFilingChecklist,
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
 * GET /api/filing/requirements
 * Get filing requirements for a specific office and jurisdiction
 * 
 * Query parameters:
 * - level: 'federal' | 'state' | 'local'
 * - office: Office name (e.g., "U.S. House of Representatives")
 * - state: State code (optional, for state/local offices)
 * - electionDate: ISO date string (optional, for deadline calculation)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const levelParam = searchParams.get('level')
    const office = searchParams.get('office')
    const state = searchParams.get('state') ?? undefined
    const electionDateStr = searchParams.get('electionDate')

    if (!levelParam || !office) {
      return NextResponse.json(
        { error: 'Level and office are required' },
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
        message: `Filing requirements not found for ${office}${state ? ` in ${state}` : ''}. This may be a custom office or requirements need to be added.`,
        suggestion: 'Check with your local election authority for filing requirements.'
      })
    }

    // Calculate deadline if election date provided
    let calculatedDeadline: Date | null = null
    if (electionDateStr) {
      try {
        const electionDate = new Date(electionDateStr)
        calculatedDeadline = calculateFilingDeadline(requirement, electionDate)
      } catch {
        // Invalid date, skip deadline calculation
      }
    }

    // Get checklist
    const checklist = getFilingChecklist(requirement)

    return NextResponse.json({
      found: true,
      requirement: {
        ...requirement,
        calculatedDeadline: calculatedDeadline?.toISOString() ?? null,
        checklist
      }
    })
  } catch (error) {
    logger.error('Filing requirements lookup error:', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

