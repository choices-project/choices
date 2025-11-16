import type { NextRequest } from 'next/server'

import { withErrorHandling, successResponse, validationError } from '@/lib/api';
import { 
  getFilingRequirements, 
  calculateFilingDeadline,
  getFilingChecklist,
  type OfficeType
} from '@/lib/filing/filing-requirements'

function isOfficeType(value: string | null): value is OfficeType {
  return value === 'federal' || value === 'state' || value === 'local'
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

export const GET = withErrorHandling(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams
  const levelParam = searchParams.get('level')
  const office = searchParams.get('office')
  const state = searchParams.get('state') ?? undefined
  const electionDateStr = searchParams.get('electionDate')

  if (!levelParam || !office) {
    return validationError({ 
      level: !levelParam ? 'Level is required' : '',
      office: !office ? 'Office is required' : ''
    });
  }

  if (!isOfficeType(levelParam)) {
    return validationError({ level: 'Invalid level. Must be: federal, state, or local' });
  }

    const requirement = getFilingRequirements(levelParam, office, state)

    if (!requirement) {
      return successResponse({
        found: false,
        message: `Filing requirements not found for ${office}${state ? ` in ${state}` : ''}. This may be a custom office or requirements need to be added.`,
        suggestion: 'Check with your local election authority for filing requirements.'
      });
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

  return successResponse({
    found: true,
    requirement: {
      ...requirement,
      calculatedDeadline: calculatedDeadline?.toISOString() ?? null,
      checklist
    }
  });
});

