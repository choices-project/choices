import type { NextRequest } from 'next/server'

import { withErrorHandling, successResponse, validationError } from '@/lib/api';
import { 
  getFilingRequirements,
  calculateFilingDeadline,
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

  if (!levelParam || !office || !electionDateStr) {
    return validationError({ 
      level: !levelParam ? 'Level is required' : '',
      office: !office ? 'Office is required' : '',
      electionDate: !electionDateStr ? 'Election date is required' : ''
    });
  }

  if (!isOfficeType(levelParam)) {
    return validationError({ level: 'Invalid level. Must be: federal, state, or local' });
  }

    const requirement = getFilingRequirements(levelParam, office, state)

  if (!requirement) {
    return successResponse({
      found: false,
      message: 'Filing requirements not found for this office'
    });
  }

  const electionDate = new Date(electionDateStr)
  if (isNaN(electionDate.getTime())) {
    return validationError({ electionDate: 'Invalid election date' });
  }

  const deadline = calculateFilingDeadline(requirement, electionDate)

  if (!deadline) {
    return successResponse({
      found: true,
      deadline: null,
      message: requirement.deadlines.filingDeadline.description,
      note: requirement.deadlines.filingDeadline.note ?? null
    });
  }

  const now = new Date()
  const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  const isPast = deadline < now
  const isSoon = daysUntil <= 30 && daysUntil > 0

  return successResponse({
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
  });
});

