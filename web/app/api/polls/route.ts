import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check if we're in a build environment or if the external API is available
    const isBuildTime = process.env.NODE_ENV === 'production' && !process.env.VERCEL_URL;
    
    if (isBuildTime) {
      // Return mock data during build time
      return NextResponse.json({
        polls: [
          {
            id: '1',
            question: 'What is the most important issue facing our community?',
            options: ['Healthcare', 'Education', 'Environment', 'Economy'],
            totalVotes: 1247,
            results: { 0: 456, 1: 234, 2: 345, 3: 212 },
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            category: 'Community',
            isActive: true
          },
          {
            id: '2',
            question: 'How should we prioritize local infrastructure projects?',
            options: ['Roads & Bridges', 'Public Transit', 'Parks & Recreation', 'Utilities'],
            totalVotes: 892,
            results: { 0: 234, 1: 345, 2: 178, 3: 135 },
            expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
            category: 'Infrastructure',
            isActive: true
          }
        ]
      });
    }

    const response = await fetch('http://localhost:8082/api/v1/polls/list', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching polls:', error);
    // Return mock data as fallback
    return NextResponse.json({
      polls: [
        {
          id: '1',
          question: 'What is the most important issue facing our community?',
          options: ['Healthcare', 'Education', 'Environment', 'Economy'],
          totalVotes: 1247,
          results: { 0: 456, 1: 234, 2: 345, 3: 212 },
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          category: 'Community',
          isActive: true
        }
      ]
    });
  }
}
