import { NextRequest, NextResponse } from 'next/server';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.CONGRESS_GOV_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'Congress.gov API key not configured',
        status: 'failed'
      }, { status: 500 });
    }

    // Test Congress.gov API with API key
    const response = await fetch(
      `https://api.congress.gov/v3/member?limit=1&api_key=${apiKey}`,
      {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Choices-Civics-Platform/1.0'
        }
      }
    );

    if (!response.ok) {
      return NextResponse.json({ 
        error: `Congress.gov API request failed: ${response.status}`,
        status: 'failed',
        details: {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        }
      }, { status: response.status });
    }

    const data = await response.json();
    const members = data.members || [];
    
    return NextResponse.json({
      status: 'success',
      api: 'Congress.gov',
      data: {
        totalMembers: members.length,
        sampleMember: members[0] || null,
        apiResponse: {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries())
        }
      }
    });

  } catch (error) {
    return NextResponse.json({ 
      error: `Congress.gov API test failed: ${error}`,
      status: 'failed'
    }, { status: 500 });
  }
}
