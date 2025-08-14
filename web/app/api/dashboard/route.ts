import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // For now, return the same data structure as the PO service
    // TODO: Fix the PO service header issues
    const dashboardData = {
      polls: [
        {
          id: "poll-1",
          title: "Sample Poll",
          status: "active",
          total_votes: 1250,
          participation: 85.5,
          created_at: new Date().toISOString(),
          ends_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          choices: [
            { id: "choice-1", text: "Option A", votes: 650 },
            { id: "choice-2", text: "Option B", votes: 600 }
          ]
        },
        {
          id: "poll-2",
          title: "Community Feedback",
          status: "active",
          total_votes: 890,
          participation: 72.3,
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          ends_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          choices: [
            { id: "choice-3", text: "Excellent", votes: 450 },
            { id: "choice-4", text: "Good", votes: 320 },
            { id: "choice-5", text: "Needs Improvement", votes: 120 }
          ]
        }
      ],
      overall_metrics: {
        total_polls: 5,
        active_polls: 3,
        total_votes: 2140,
        total_users: 850,
        average_participation: 78.2
      },
      trends: [
        {
          date: new Date().toISOString(),
          votes: 2140,
          users: 850,
          polls: 5
        }
      ],
      geographic_map: {
        regions: [
          {
            name: "North America",
            vote_count: 450,
            population: 1000000,
            percentage: 36,
            latitude: 40.7128,
            longitude: -74.006
          }
        ],
        countries: [
          {
            code: "US",
            name: "United States",
            vote_count: 450,
            population: 1000000,
            percentage: 36
          }
        ],
        heatmap: [
          {
            latitude: 40.7128,
            longitude: -74.006,
            intensity: 0.8
          }
        ]
      },
      demographics: {
        age_groups: {
          "18-25": 200,
          "26-35": 350,
          "36-45": 300,
          "46-55": 250,
          "55+": 150
        },
        genders: {
          female: 550,
          male: 600,
          other: 100
        },
        education: {
          bachelor: 500,
          high_school: 200,
          master: 300,
          phd: 250
        },
        income: {
          high: 450,
          low: 300,
          medium: 500
        },
        verification_tiers: {
          T0: 100,
          T1: 300,
          T2: 400,
          T3: 450
        }
      },
      engagement: {
        active_users: 850,
        new_users: 150,
        returning_users: 700,
        session_duration: 8.5,
        bounce_rate: 15.2
      }
    };
    
    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
