// Mock Data for Development and Testing
export interface MockPoll {
  id: string
  question: string
  options: string[]
  totalVotes: number
  results: Record<number, number>
  expiresAt: string
  category: string
  isActive: boolean
  description?: string
  createdBy?: string
}

export interface MockDemographics {
  totalUsers: number
  ageDistribution: Array<{ range: string; count: number; percentage: number }>
  geographicSpread: Array<{ state: string; count: number; percentage: number }>
  commonInterests: Array<{ interest: string; count: number; percentage: number }>
  topValues: Array<{ value: string; count: number; percentage: number }>
  educationLevels: Array<{ level: string; count: number; percentage: number }>
  incomeBrackets: Array<{ bracket: string; count: number; percentage: number }>
  urbanRural: Array<{ type: string; count: number; percentage: number }>
  recentPolls: any[]
  recentVotes: any[]
  lastUpdated: string
}

export interface MockUser {
  id: string
  email: string
  name: string
  verificationTier: string
  isActive: boolean
  createdAt: string
  lastLogin: string
}

// Generate realistic mock data
export const generateMockPolls = (): MockPoll[] => {
  const baseTime = Date.now()
  
  return [
    {
      id: '1',
      question: 'What is the most important issue facing our community?',
      options: ['Healthcare', 'Education', 'Environment', 'Economy'],
      totalVotes: 1247,
      results: { 0: 456, 1: 234, 2: 345, 3: 212 },
      expiresAt: new Date(baseTime + 7 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'Community',
      isActive: true,
      description: 'Help us understand the priorities of our community members.',
      createdBy: 'Community Council'
    },
    {
      id: '2',
      question: 'How should we prioritize local infrastructure projects?',
      options: ['Roads & Bridges', 'Public Transit', 'Parks & Recreation', 'Utilities'],
      totalVotes: 892,
      results: { 0: 234, 1: 345, 2: 178, 3: 135 },
      expiresAt: new Date(baseTime + 5 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'Infrastructure',
      isActive: true,
      description: 'Your input will guide our infrastructure investment decisions.',
      createdBy: 'City Planning Department'
    },
    {
      id: '3',
      question: 'Which environmental initiative should receive priority funding?',
      options: ['Renewable Energy', 'Waste Reduction', 'Green Spaces', 'Water Conservation'],
      totalVotes: 1567,
      results: { 0: 567, 1: 234, 2: 456, 3: 310 },
      expiresAt: new Date(baseTime + 10 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'Environment',
      isActive: true,
      description: 'Help us make our community more sustainable.',
      createdBy: 'Environmental Committee'
    },
    {
      id: '4',
      question: 'What type of community event would you most like to see?',
      options: ['Cultural Festival', 'Sports Tournament', 'Art Exhibition', 'Food Fair'],
      totalVotes: 734,
      results: { 0: 234, 1: 156, 2: 189, 3: 155 },
      expiresAt: new Date(baseTime + 3 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'Events',
      isActive: true,
      description: 'We want to organize events that bring our community together.',
      createdBy: 'Events Committee'
    },
    {
      id: '5',
      question: 'How should we improve public safety in our neighborhood?',
      options: ['More Police Patrols', 'Better Lighting', 'Community Watch', 'Youth Programs'],
      totalVotes: 1023,
      results: { 0: 234, 1: 345, 2: 289, 3: 155 },
      expiresAt: new Date(baseTime + 6 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'Safety',
      isActive: true,
      description: 'Your safety is our top priority.',
      createdBy: 'Public Safety Department'
    }
  ]
}

export const generateMockDemographics = (): MockDemographics => {
  const mockTotalUsers = 1250
  
  return {
    totalUsers: mockTotalUsers,
    ageDistribution: [
      { range: '18-24', count: Math.floor(mockTotalUsers * 0.15), percentage: 15 },
      { range: '25-34', count: Math.floor(mockTotalUsers * 0.30), percentage: 30 },
      { range: '35-44', count: Math.floor(mockTotalUsers * 0.24), percentage: 24 },
      { range: '45-54', count: Math.floor(mockTotalUsers * 0.18), percentage: 18 },
      { range: '55-64', count: Math.floor(mockTotalUsers * 0.09), percentage: 9 },
      { range: '65+', count: Math.floor(mockTotalUsers * 0.06), percentage: 6 }
    ],
    geographicSpread: [
      { state: 'California', count: Math.floor(mockTotalUsers * 0.18), percentage: 18 },
      { state: 'Texas', count: Math.floor(mockTotalUsers * 0.14), percentage: 14 },
      { state: 'New York', count: Math.floor(mockTotalUsers * 0.12), percentage: 12 },
      { state: 'Florida', count: Math.floor(mockTotalUsers * 0.11), percentage: 11 },
      { state: 'Illinois', count: Math.floor(mockTotalUsers * 0.09), percentage: 9 },
      { state: 'Pennsylvania', count: Math.floor(mockTotalUsers * 0.08), percentage: 8 },
      { state: 'Ohio', count: Math.floor(mockTotalUsers * 0.07), percentage: 7 },
      { state: 'Michigan', count: Math.floor(mockTotalUsers * 0.06), percentage: 6 },
      { state: 'Georgia', count: Math.floor(mockTotalUsers * 0.05), percentage: 5 },
      { state: 'North Carolina', count: Math.floor(mockTotalUsers * 0.05), percentage: 5 }
    ],
    commonInterests: [
      { interest: 'Affordable Healthcare', count: Math.floor(mockTotalUsers * 0.84), percentage: 84 },
      { interest: 'Quality Education', count: Math.floor(mockTotalUsers * 0.78), percentage: 78 },
      { interest: 'Economic Security', count: Math.floor(mockTotalUsers * 0.72), percentage: 72 },
      { interest: 'Environmental Protection', count: Math.floor(mockTotalUsers * 0.66), percentage: 66 },
      { interest: 'Community Safety', count: Math.floor(mockTotalUsers * 0.60), percentage: 60 },
      { interest: 'Infrastructure Investment', count: Math.floor(mockTotalUsers * 0.54), percentage: 54 }
    ],
    topValues: [
      { value: 'Family & Community', count: Math.floor(mockTotalUsers * 0.90), percentage: 90 },
      { value: 'Fairness & Justice', count: Math.floor(mockTotalUsers * 0.84), percentage: 84 },
      { value: 'Personal Freedom', count: Math.floor(mockTotalUsers * 0.78), percentage: 78 },
      { value: 'Hard Work & Responsibility', count: Math.floor(mockTotalUsers * 0.72), percentage: 72 },
      { value: 'Innovation & Progress', count: Math.floor(mockTotalUsers * 0.66), percentage: 66 },
      { value: 'Tradition & Stability', count: Math.floor(mockTotalUsers * 0.60), percentage: 60 }
    ],
    educationLevels: [
      { level: 'Bachelor\'s Degree', count: Math.floor(mockTotalUsers * 0.36), percentage: 36 },
      { level: 'Some College', count: Math.floor(mockTotalUsers * 0.24), percentage: 24 },
      { level: 'High School', count: Math.floor(mockTotalUsers * 0.21), percentage: 21 },
      { level: 'Graduate Degree', count: Math.floor(mockTotalUsers * 0.15), percentage: 15 },
      { level: 'Less than HS', count: Math.floor(mockTotalUsers * 0.06), percentage: 6 }
    ],
    incomeBrackets: [
      { bracket: '$50k-$75k', count: Math.floor(mockTotalUsers * 0.24), percentage: 24 },
      { bracket: '$30k-$50k', count: Math.floor(mockTotalUsers * 0.21), percentage: 21 },
      { bracket: '$75k-$100k', count: Math.floor(mockTotalUsers * 0.18), percentage: 18 },
      { bracket: '$100k+', count: Math.floor(mockTotalUsers * 0.15), percentage: 15 },
      { bracket: '$20k-$30k', count: Math.floor(mockTotalUsers * 0.12), percentage: 12 },
      { bracket: 'Under $20k', count: Math.floor(mockTotalUsers * 0.09), percentage: 9 }
    ],
    urbanRural: [
      { type: 'Urban', count: Math.floor(mockTotalUsers * 0.60), percentage: 60 },
      { type: 'Suburban', count: Math.floor(mockTotalUsers * 0.30), percentage: 30 },
      { type: 'Rural', count: Math.floor(mockTotalUsers * 0.12), percentage: 12 }
    ],
    recentPolls: [
      { poll_id: '1', title: 'Community Priorities', total_votes: 1247, participation_rate: 85 },
      { poll_id: '2', title: 'Infrastructure Projects', total_votes: 892, participation_rate: 72 },
      { poll_id: '3', title: 'Environmental Initiatives', total_votes: 1567, participation_rate: 91 }
    ],
    recentVotes: [
      { poll_id: '1', title: 'Community Priorities', vote_count: 45, voted_at: new Date().toISOString() },
      { poll_id: '2', title: 'Infrastructure Projects', vote_count: 32, voted_at: new Date(Date.now() - 3600000).toISOString() },
      { poll_id: '3', title: 'Environmental Initiatives', vote_count: 67, voted_at: new Date(Date.now() - 7200000).toISOString() }
    ],
    lastUpdated: new Date().toISOString()
  }
}

export const generateMockUsers = (): MockUser[] => {
  return [
    {
      id: '1',
      email: 'john.doe@example.com',
      name: 'John Doe',
      verificationTier: 'T2',
      isActive: true,
      createdAt: '2024-01-15T10:30:00Z',
      lastLogin: new Date().toISOString()
    },
    {
      id: '2',
      email: 'jane.smith@example.com',
      name: 'Jane Smith',
      verificationTier: 'T1',
      isActive: true,
      createdAt: '2024-01-20T14:45:00Z',
      lastLogin: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: '3',
      email: 'mike.johnson@example.com',
      name: 'Mike Johnson',
      verificationTier: 'T3',
      isActive: true,
      createdAt: '2024-01-10T09:15:00Z',
      lastLogin: new Date(Date.now() - 7200000).toISOString()
    }
  ]
}

// Mock data API responses
export const getMockPollsResponse = () => ({
  polls: generateMockPolls()
})

export const getMockDemographicsResponse = () => generateMockDemographics()

export const getMockUsersResponse = () => ({
  users: generateMockUsers()
})

// Mock data for specific scenarios
export const getMockDataForScenario = (scenario: 'empty' | 'loading' | 'error' | 'success') => {
  switch (scenario) {
    case 'empty':
      return { polls: [], users: [], demographics: { totalUsers: 0, ageDistribution: [] } }
    case 'loading':
      return { loading: true }
    case 'error':
      return { error: 'Failed to load data', polls: [], users: [] }
    case 'success':
    default:
      return {
        polls: generateMockPolls(),
        users: generateMockUsers(),
        demographics: generateMockDemographics()
      }
  }
}
