import { NextRequest, NextResponse } from 'next/server';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_CIVIC_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'Google Civic API key not configured',
        status: 'failed'
      }, { status: 500 });
    }

    // Test Google Civic Elections API
    const response = await fetch(
      `https://www.googleapis.com/civicinfo/v2/elections?key=${apiKey}`,
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
        error: `Google Civic API request failed: ${response.status}`,
        status: 'failed',
        details: {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        }
      }, { status: response.status });
    }

    const data = await response.json();
    const elections = data.elections || [];
    
    return NextResponse.json({
      status: 'success',
      api: 'Google Civic Elections',
      data: {
        totalElections: elections.length,
        sampleElection: elections[0] || null,
        apiResponse: {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries())
        }
      }
    });

  } catch (error) {
    return NextResponse.json({ 
      error: `Google Civic API test failed: ${error}`,
      status: 'failed'
    }, { status: 500 });
  }
}
