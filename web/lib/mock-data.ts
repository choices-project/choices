/**
 * Mock data utilities
 * 
 * This module provides mock data functions for the application.
 * It replaces the old @/shared/utils/lib/mock-data imports.
 */

export function getMockDemographicsResponse() {
  return {
    demographics: {
      ageGroups: [
        { range: '18-24', count: 150, percentage: 15 },
        { range: '25-34', count: 300, percentage: 30 },
        { range: '35-44', count: 250, percentage: 25 },
        { range: '45-54', count: 200, percentage: 20 },
        { range: '55+', count: 100, percentage: 10 }
      ],
      genderDistribution: [
        { gender: 'Male', count: 500, percentage: 50 },
        { gender: 'Female', count: 450, percentage: 45 },
        { gender: 'Other', count: 50, percentage: 5 }
      ],
      educationLevels: [
        { level: 'High School', count: 200, percentage: 20 },
        { level: 'Bachelor\'s', count: 400, percentage: 40 },
        { level: 'Master\'s', count: 300, percentage: 30 },
        { level: 'PhD', count: 100, percentage: 10 }
      ],
      incomeRanges: [
        { range: '$0-30k', count: 150, percentage: 15 },
        { range: '$30k-60k', count: 300, percentage: 30 },
        { range: '$60k-100k', count: 350, percentage: 35 },
        { range: '$100k+', count: 200, percentage: 20 }
      ],
      geographicDistribution: [
        { region: 'Northeast', count: 250, percentage: 25 },
        { region: 'Southeast', count: 300, percentage: 30 },
        { region: 'Midwest', count: 200, percentage: 20 },
        { region: 'West', count: 250, percentage: 25 }
      ],
      recentVotes: []
    }
  };
}





