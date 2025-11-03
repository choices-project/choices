/**
 * Filing Requirements Database
 * 
 * Comprehensive database of filing requirements by jurisdiction.
 * Helps candidates understand what they need to file officially.
 * 
 * @created 2025-01-30
 */

export type OfficeType = 'federal' | 'state' | 'local'
export type FederalOffice = 'house' | 'senate' | 'president'
export type StateOffice = 'governor' | 'lt-governor' | 'attorney-general' | 'secretary-of-state' | 'treasurer' | 'state-senate' | 'state-house' | 'state-assembly'
export type LocalOffice = 'mayor' | 'city-council' | 'county-commissioner' | 'school-board' | 'sheriff' | 'district-attorney'

export type FilingRequirement = {
  jurisdiction: string
  office: string
  level: OfficeType
  state?: string
  
  // Filing Information
  authority: {
    name: string
    website: string
    phone?: string
    email?: string
    filingPortal?: string
    mailingAddress?: string
  }
  
  // Requirements
  requiredForms: string[]
  filingFees: {
    amount: number
    currency: string
    acceptedMethods: string[]
    feeSchedule?: Record<string, number> // Different fees by date or office type
  }
  
  // Deadlines
  deadlines: {
    filingDeadline: {
      description: string
      daysBeforePrimary: number | null
      daysBeforeElection: number | null
      specificDate?: string
      note?: string
    }
    withdrawalDeadline?: {
      description: string
      daysBeforeElection: number
    }
  }
  
  // Requirements
  eligibility: {
    residency?: string[]
    age?: number
    citizenship?: string[]
    other?: string[]
  }
  
  // Submission Methods
  submissionMethods: {
    online: boolean
    onlineUrl?: string
    paper: boolean
    inPerson: boolean
    locations?: string[]
  }
  
  // Additional Info
  signaturesRequired?: number
  petitionRequirements?: {
    signatures: number
    deadline: string
    districts?: Record<string, number> // Different sig requirements by district
  }
  
  // Links
  helpfulLinks: {
    filingGuide?: string
    formLibrary?: string
    candidateGuide?: string
    faq?: string
  }
  
  // Notes
  notes?: string[]
  commonMistakes?: string[]
}

/**
 * Filing Requirements Database
 * Community-maintained database of filing requirements
 */
export const FILING_REQUIREMENTS: Record<string, FilingRequirement[]> = {
  // Federal
  federal: [
    {
      jurisdiction: 'Federal',
      office: 'U.S. House of Representatives',
      level: 'federal',
      authority: {
        name: 'Federal Election Commission (FEC)',
        website: 'https://www.fec.gov',
        phone: '(800) 424-9530',
        filingPortal: 'https://efiling.fec.gov/',
        mailingAddress: 'Federal Election Commission, 1050 First Street NE, Washington, DC 20463'
      },
      requiredForms: [
        'FEC Form 2 - Statement of Candidacy',
        'FEC Form 1 - Statement of Organization (if raising/spending $5,000+)'
      ],
      filingFees: {
        amount: 0,
        currency: 'USD',
        acceptedMethods: ['None required - no filing fee for federal offices']
      },
      deadlines: {
        filingDeadline: {
          description: '15 days after raising or spending $5,000',
          daysBeforePrimary: null,
          daysBeforeElection: null,
          note: 'No specific calendar deadline - triggered by fundraising threshold'
        }
      },
      eligibility: {
        citizenship: ['U.S. citizen'],
        residency: ['Must be resident of state where running'],
        age: 25
      },
      submissionMethods: {
        online: true,
        onlineUrl: 'https://efiling.fec.gov/',
        paper: true,
        inPerson: false
      },
      helpfulLinks: {
        filingGuide: 'https://www.fec.gov/help-candidates-and-committees/filing-reports/',
        formLibrary: 'https://www.fec.gov/help-candidates-and-committees/forms/',
        candidateGuide: 'https://www.fec.gov/help-candidates-and-committees/',
        faq: 'https://www.fec.gov/help-candidates-and-committees/frequently-asked-questions/'
      },
      notes: [
        'Filing is required within 15 days of raising or spending $5,000',
        'Can file before raising money (pre-candidacy filing)',
        'Must file electronically if raising/spending $50,000+',
        'Forms available in FECFile software or via web portal'
      ],
      commonMistakes: [
        'Waiting too long after reaching $5,000 threshold',
        'Filing wrong form type',
        'Incorrect district information',
        'Missing required attachments'
      ]
    },
    {
      jurisdiction: 'Federal',
      office: 'U.S. Senate',
      level: 'federal',
      authority: {
        name: 'Federal Election Commission (FEC)',
        website: 'https://www.fec.gov',
        phone: '(800) 424-9530',
        filingPortal: 'https://efiling.fec.gov/',
        mailingAddress: 'Federal Election Commission, 1050 First Street NE, Washington, DC 20463'
      },
      requiredForms: [
        'FEC Form 2 - Statement of Candidacy',
        'FEC Form 1 - Statement of Organization (if raising/spending $5,000+)'
      ],
      filingFees: {
        amount: 0,
        currency: 'USD',
        acceptedMethods: ['None required - no filing fee for federal offices']
      },
      deadlines: {
        filingDeadline: {
          description: '15 days after raising or spending $5,000',
          daysBeforePrimary: null,
          daysBeforeElection: null,
          note: 'No specific calendar deadline - triggered by fundraising threshold'
        }
      },
      eligibility: {
        citizenship: ['U.S. citizen'],
        residency: ['Must be resident of state where running'],
        age: 30
      },
      submissionMethods: {
        online: true,
        onlineUrl: 'https://efiling.fec.gov/',
        paper: true,
        inPerson: false
      },
      helpfulLinks: {
        filingGuide: 'https://www.fec.gov/help-candidates-and-committees/filing-reports/',
        formLibrary: 'https://www.fec.gov/help-candidates-and-committees/forms/',
        candidateGuide: 'https://www.fec.gov/help-candidates-and-committees/'
      }
    },
    {
      jurisdiction: 'Federal',
      office: 'President',
      level: 'federal',
      authority: {
        name: 'Federal Election Commission (FEC)',
        website: 'https://www.fec.gov',
        phone: '(800) 424-9530',
        filingPortal: 'https://efiling.fec.gov/',
        mailingAddress: 'Federal Election Commission, 1050 First Street NE, Washington, DC 20463'
      },
      requiredForms: [
        'FEC Form 2 - Statement of Candidacy',
        'FEC Form 1 - Statement of Organization (if raising/spending $5,000+)'
      ],
      filingFees: {
        amount: 0,
        currency: 'USD',
        acceptedMethods: ['None required - no filing fee for federal offices']
      },
      deadlines: {
        filingDeadline: {
          description: '15 days after raising or spending $5,000',
          daysBeforePrimary: null,
          daysBeforeElection: null,
          note: 'No specific calendar deadline - triggered by fundraising threshold'
        }
      },
      eligibility: {
        citizenship: ['Natural-born U.S. citizen'],
        residency: ['14 years resident of United States'],
        age: 35
      },
      submissionMethods: {
        online: true,
        onlineUrl: 'https://efiling.fec.gov/',
        paper: true,
        inPerson: false
      },
      helpfulLinks: {
        filingGuide: 'https://www.fec.gov/help-candidates-and-committees/filing-reports/',
        formLibrary: 'https://www.fec.gov/help-candidates-and-committees/forms/'
      }
    }
  ],
  
  // State requirements - comprehensive coverage for top states
  state: [
    // California
    {
      jurisdiction: 'California',
      office: 'Governor',
      level: 'state',
      state: 'CA',
      authority: {
        name: 'California Secretary of State',
        website: 'https://www.sos.ca.gov',
        phone: '(916) 657-2166',
        filingPortal: 'https://cal-access.sos.ca.gov/',
        mailingAddress: 'Secretary of State, Elections Division, 1500 11th Street, Sacramento, CA 95814'
      },
      requiredForms: [
        'Candidate Intention Statement (Form 501)',
        'Candidate Statement of Economic Interests (Form 700)',
        'Nomination Papers'
      ],
      filingFees: {
        amount: 3624,
        currency: 'USD',
        acceptedMethods: ['Check', 'Money Order', 'Credit Card (online only)'],
        feeSchedule: {
          '2024': 3624,
          '2025': 3750 // Estimated
        }
      },
      deadlines: {
        filingDeadline: {
          description: '75 days before primary election',
          daysBeforePrimary: 75,
          daysBeforeElection: null,
          note: 'Filing deadline varies by election cycle - check with Secretary of State'
        }
      },
      eligibility: {
        citizenship: ['U.S. citizen'],
        residency: ['Must be resident of California for 5 years immediately preceding election'],
        age: 18
      },
      submissionMethods: {
        online: true,
        onlineUrl: 'https://cal-access.sos.ca.gov/',
        paper: true,
        inPerson: true,
        locations: ['Secretary of State Office, Sacramento']
      },
      petitionRequirements: {
        signatures: 65,
        deadline: '75 days before primary'
      },
      helpfulLinks: {
        filingGuide: 'https://www.sos.ca.gov/elections/political-parties/candidates/',
        candidateGuide: 'https://www.sos.ca.gov/elections/political-parties/candidates/guide/'
      },
      notes: [
        'Must file nomination papers with required signatures',
        'Financial disclosure forms required',
        'Can file online via Cal-Access system'
      ],
      commonMistakes: [
        'Missing required nomination signatures',
        'Filing after deadline',
        'Incomplete financial disclosure forms',
        'Wrong filing location'
      ]
    },
    {
      jurisdiction: 'California',
      office: 'State Senate',
      level: 'state',
      state: 'CA',
      authority: {
        name: 'California Secretary of State',
        website: 'https://www.sos.ca.gov',
        phone: '(916) 657-2166',
        filingPortal: 'https://cal-access.sos.ca.gov/',
        mailingAddress: 'Secretary of State, Elections Division, 1500 11th Street, Sacramento, CA 95814'
      },
      requiredForms: [
        'Candidate Intention Statement (Form 501)',
        'Candidate Statement of Economic Interests (Form 700)',
        'Nomination Papers'
      ],
      filingFees: {
        amount: 1045,
        currency: 'USD',
        acceptedMethods: ['Check', 'Money Order', 'Credit Card (online only)']
      },
      deadlines: {
        filingDeadline: {
          description: '75 days before primary election',
          daysBeforePrimary: 75,
          daysBeforeElection: null
        }
      },
      eligibility: {
        citizenship: ['U.S. citizen'],
        residency: ['Must be resident of district for 1 year immediately preceding election'],
        age: 18
      },
      submissionMethods: {
        online: true,
        onlineUrl: 'https://cal-access.sos.ca.gov/',
        paper: true,
        inPerson: true
      },
      petitionRequirements: {
        signatures: 40,
        deadline: '75 days before primary'
      },
      helpfulLinks: {
        filingGuide: 'https://www.sos.ca.gov/elections/political-parties/candidates/',
        candidateGuide: 'https://www.sos.ca.gov/elections/political-parties/candidates/guide/'
      }
    },
    {
      jurisdiction: 'California',
      office: 'State Assembly',
      level: 'state',
      state: 'CA',
      authority: {
        name: 'California Secretary of State',
        website: 'https://www.sos.ca.gov',
        phone: '(916) 657-2166',
        filingPortal: 'https://cal-access.sos.ca.gov/',
        mailingAddress: 'Secretary of State, Elections Division, 1500 11th Street, Sacramento, CA 95814'
      },
      requiredForms: [
        'Candidate Intention Statement (Form 501)',
        'Candidate Statement of Economic Interests (Form 700)',
        'Nomination Papers'
      ],
      filingFees: {
        amount: 1045,
        currency: 'USD',
        acceptedMethods: ['Check', 'Money Order', 'Credit Card (online only)']
      },
      deadlines: {
        filingDeadline: {
          description: '75 days before primary election',
          daysBeforePrimary: 75,
          daysBeforeElection: null
        }
      },
      eligibility: {
        citizenship: ['U.S. citizen'],
        residency: ['Must be resident of district for 1 year immediately preceding election'],
        age: 18
      },
      submissionMethods: {
        online: true,
        onlineUrl: 'https://cal-access.sos.ca.gov/',
        paper: true,
        inPerson: true
      },
      petitionRequirements: {
        signatures: 40,
        deadline: '75 days before primary'
      },
      helpfulLinks: {
        filingGuide: 'https://www.sos.ca.gov/elections/political-parties/candidates/',
        candidateGuide: 'https://www.sos.ca.gov/elections/political-parties/candidates/guide/'
      }
    },
    // Texas
    {
      jurisdiction: 'Texas',
      office: 'Governor',
      level: 'state',
      state: 'TX',
      authority: {
        name: 'Texas Secretary of State',
        website: 'https://www.sos.texas.gov',
        phone: '(512) 463-5650',
        filingPortal: 'https://www.sos.texas.gov/elections/candidates/',
        mailingAddress: 'Secretary of State, Elections Division, P.O. Box 12060, Austin, TX 78711'
      },
      requiredForms: [
        'Application for Place on Ballot',
        'Campaign Treasurer Appointment',
        'Financial Disclosure Statement'
      ],
      filingFees: {
        amount: 3750,
        currency: 'USD',
        acceptedMethods: ['Check', 'Money Order']
      },
      deadlines: {
        filingDeadline: {
          description: '78 days before primary election',
          daysBeforePrimary: 78,
          daysBeforeElection: null
        }
      },
      eligibility: {
        citizenship: ['U.S. citizen'],
        residency: ['Must be resident of Texas for 5 years immediately preceding election'],
        age: 30
      },
      submissionMethods: {
        online: false,
        paper: true,
        inPerson: true,
        locations: ['Secretary of State Office, Austin']
      },
      petitionRequirements: {
        signatures: 50,
        deadline: '78 days before primary'
      },
      helpfulLinks: {
        filingGuide: 'https://www.sos.texas.gov/elections/candidates/guide/',
        candidateGuide: 'https://www.sos.texas.gov/elections/candidates/'
      }
    },
    // Florida
    {
      jurisdiction: 'Florida',
      office: 'Governor',
      level: 'state',
      state: 'FL',
      authority: {
        name: 'Florida Division of Elections',
        website: 'https://dos.myflorida.com/elections',
        phone: '(850) 245-6200',
        filingPortal: 'https://dos.elections.myflorida.com/candidates/',
        mailingAddress: 'Division of Elections, R.A. Gray Building, 500 South Bronough Street, Tallahassee, FL 32399'
      },
      requiredForms: [
        'DS-DE 9 - Appointment of Campaign Treasurer and Designation of Campaign Depository',
        'DS-DE 84 - Statement of Candidate',
        'Financial Disclosure Forms'
      ],
      filingFees: {
        amount: 10596,
        currency: 'USD',
        acceptedMethods: ['Check', 'Money Order', 'Credit Card (online)']
      },
      deadlines: {
        filingDeadline: {
          description: 'Qualifying week (typically 60 days before primary)',
          daysBeforePrimary: 60,
          daysBeforeElection: null,
          note: 'Qualifying period is a specific week - dates announced each cycle'
        }
      },
      eligibility: {
        citizenship: ['U.S. citizen'],
        residency: ['Must be resident of Florida for 7 years immediately preceding election'],
        age: 30
      },
      submissionMethods: {
        online: true,
        onlineUrl: 'https://dos.elections.myflorida.com/candidates/',
        paper: true,
        inPerson: true,
        locations: ['Division of Elections, Tallahassee']
      },
      petitionRequirements: {
        signatures: 124696, // 1% of registered voters
        deadline: 'Qualifying week'
      },
      helpfulLinks: {
        filingGuide: 'https://dos.myflorida.com/elections/candidates-committees/candidates/',
        candidateGuide: 'https://dos.myflorida.com/elections/candidates-committees/candidates/qualifying/'
      }
    }
  ],
  
  // Local offices (examples)
  local: [
    {
      jurisdiction: 'General',
      office: 'Mayor',
      level: 'local',
      authority: {
        name: 'Local City Clerk or Board of Elections',
        website: '',
        phone: '',
        mailingAddress: 'Contact your local city clerk or board of elections'
      },
      requiredForms: [
        'Candidate filing form (varies by municipality)',
        'Financial disclosure (if required)'
      ],
      filingFees: {
        amount: 0,
        currency: 'USD',
        acceptedMethods: ['Varies by municipality'],
        feeSchedule: {
          'small_city': 0,
          'medium_city': 25,
          'large_city': 100
        }
      },
      deadlines: {
        filingDeadline: {
          description: 'Typically 30-60 days before election (varies by municipality)',
          daysBeforeElection: 45,
          daysBeforePrimary: null,
          note: 'Check with your local city clerk for exact dates'
        }
      },
      eligibility: {
        citizenship: ['U.S. citizen'],
        residency: ['Must be resident of municipality'],
        age: 18
      },
      submissionMethods: {
        online: false,
        paper: true,
        inPerson: true,
        locations: ['City Clerk Office']
      },
      helpfulLinks: {
        candidateGuide: 'Contact your local city clerk for candidate guide'
      },
      notes: [
        'Requirements vary significantly by municipality',
        'Contact local city clerk for specific forms and deadlines',
        'Many small cities have no filing fee',
        'Some cities require petition signatures'
      ]
    },
    {
      jurisdiction: 'General',
      office: 'City Council',
      level: 'local',
      authority: {
        name: 'Local City Clerk or Board of Elections',
        website: '',
        phone: '',
        mailingAddress: 'Contact your local city clerk or board of elections'
      },
      requiredForms: [
        'Candidate filing form (varies by municipality)'
      ],
      filingFees: {
        amount: 0,
        currency: 'USD',
        acceptedMethods: ['Varies by municipality']
      },
      deadlines: {
        filingDeadline: {
          description: 'Typically 30-60 days before election',
          daysBeforeElection: 45,
          daysBeforePrimary: null,
          note: 'Check with your local city clerk'
        }
      },
      eligibility: {
        citizenship: ['U.S. citizen'],
        residency: ['Must be resident of city/council district'],
        age: 18
      },
      submissionMethods: {
        online: false,
        paper: true,
        inPerson: true
      },
      helpfulLinks: {
        candidateGuide: 'Contact your local city clerk for candidate guide'
      },
      notes: [
        'Requirements vary by municipality',
        'Contact local city clerk for specific requirements'
      ]
    }
  ]
}

/**
 * Get filing requirements for a specific office and jurisdiction
 */
/**
 * Normalize office name for matching
 */
function normalizeOfficeName(office: string): string {
  return office
    .toLowerCase()
    .replace(/^(us|u\.s\.|united states)\s+/i, '')
    .replace(/\s+of\s+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Check if office names match (fuzzy matching)
 */
function officeMatches(searchOffice: string, targetOffice: string): boolean {
  const normalizedSearch = normalizeOfficeName(searchOffice)
  const normalizedTarget = normalizeOfficeName(targetOffice)
  
  // Exact match
  if (normalizedSearch === normalizedTarget) return true
  
  // Contains match
  if (normalizedSearch.includes(normalizedTarget) || normalizedTarget.includes(normalizedSearch)) {
    return true
  }
  
  // Common aliases
  const aliases: Record<string, string[]> = {
    'us house': ['us house of representatives', 'house of representatives', 'representative', 'congress'],
    'us senate': ['us senator', 'senator', 'u.s. senate'],
    'state senate': ['state senator', 'senate'],
    'state assembly': ['state representative', 'assembly member', 'assembly'],
    'state house': ['state representative', 'house of representatives'],
    'governor': ['governor', 'gov'],
    'mayor': ['mayor'],
    'city council': ['city council member', 'city councilor', 'council member']
  }
  
  for (const [key, values] of Object.entries(aliases)) {
    if (values.some(v => normalizedSearch.includes(v) && normalizedTarget.includes(key))) {
      return true
    }
    if (values.some(v => normalizedTarget.includes(v) && normalizedSearch.includes(key))) {
      return true
    }
  }
  
  return false
}

export function getFilingRequirements(
  level: OfficeType,
  office: string,
  state?: string
): FilingRequirement | null {
  // Determine category
  let category: 'federal' | 'state' | 'local'
  if (level === 'federal') {
    category = 'federal'
  } else if (level === 'local') {
    category = 'local'
  } else {
    category = 'state'
  }
  
  const requirements = FILING_REQUIREMENTS[category] ?? []
  
  // Try exact match with state first
  if (state) {
    const requirement = requirements.find(r => 
      officeMatches(office, r.office) &&
      r.state === state
    )
    if (requirement) return requirement
  }
  
  // Try exact match without state
  let requirement = requirements.find(r => 
    officeMatches(office, r.office) &&
    (!r.state || !state || r.state === state)
  )
  
  // Try fuzzy match
  if (!requirement) {
    requirement = requirements.find(r => 
      officeMatches(office, r.office)
    )
  }
  
  // For local offices, return generic if specific not found
  if (!requirement && level === 'local') {
    requirement = requirements.find(r => 
      r.level === 'local' && !r.state
    )
  }
  
  return requirement ?? null
}

/**
 * Calculate filing deadline based on election date
 */
export function calculateFilingDeadline(
  requirement: FilingRequirement,
  electionDate: Date
): Date | null {
  const deadline = requirement.deadlines.filingDeadline
  
  if (deadline.daysBeforeElection) {
    const deadlineDate = new Date(electionDate)
    deadlineDate.setDate(deadlineDate.getDate() - deadline.daysBeforeElection)
    return deadlineDate
  }
  
  if (deadline.daysBeforePrimary) {
    // Would need primary date - assume 60 days before general election
    const primaryDate = new Date(electionDate)
    primaryDate.setDate(primaryDate.getDate() - 60)
    const deadlineDate = new Date(primaryDate)
    deadlineDate.setDate(deadlineDate.getDate() - deadline.daysBeforePrimary)
    return deadlineDate
  }
  
  if (deadline.specificDate) {
    return new Date(deadline.specificDate)
  }
  
  return null
}

/**
 * Get filing checklist for a candidate
 */
export function getFilingChecklist(requirement: FilingRequirement): string[] {
  const checklist: string[] = []
  
  // Forms
  requirement.requiredForms.forEach(form => {
    checklist.push(`Complete and submit: ${form}`)
  })
  
  // Fees
  if (requirement.filingFees.amount > 0) {
    checklist.push(`Pay filing fee: $${requirement.filingFees.amount} ${requirement.filingFees.currency}`)
    checklist.push(`Payment method: ${requirement.filingFees.acceptedMethods.join(', ')}`)
  }
  
  // Signatures
  if (requirement.signaturesRequired) {
    checklist.push(`Collect ${requirement.signaturesRequired} signatures`)
  }
  
  if (requirement.petitionRequirements) {
    checklist.push(`Collect ${requirement.petitionRequirements.signatures} petition signatures`)
    checklist.push(`Submit petition by: ${requirement.petitionRequirements.deadline}`)
  }
  
  // Eligibility
  if (requirement.eligibility.residency) {
    checklist.push(`Verify residency requirement: ${requirement.eligibility.residency.join(', ')}`)
  }
  
  if (requirement.eligibility.age) {
    checklist.push(`Verify age requirement: Must be at least ${requirement.eligibility.age} years old`)
  }
  
  // Submission
  if (requirement.submissionMethods.online) {
    checklist.push(`Submit via: ${requirement.authority.filingPortal ?? requirement.authority.website}`)
  } else if (requirement.submissionMethods.paper) {
    checklist.push(`Mail forms to: ${requirement.authority.mailingAddress}`)
  } else if (requirement.submissionMethods.inPerson) {
    checklist.push(`File in person at: ${requirement.submissionMethods.locations?.join(', ') ?? requirement.authority.name}`)
  }
  
  return checklist
}

