import { NextRequest, NextResponse } from 'next/server';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.OPEN_STATES_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'OpenStates API key not configured',
        status: 'failed'
      }, { status: 500 });
    }

    // Test OpenStates API v3
    const response = await fetch(
      'https://v3.openstates.org/people?jurisdiction=California',
      {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Choices-Civics-Platform/1.0',
          'X-API-KEY': apiKey
        }
      }
    );

    if (!response.ok) {
      return NextResponse.json({ 
        error: `OpenStates API request failed: ${response.status}`,
        status: 'failed',
        details: {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        }
      }, { status: response.status });
    }

    const data = await response.json();
    const legislators = data.results || [];
    
    return NextResponse.json({
      status: 'success',
      api: 'OpenStates v3',
      data: {
        totalLegislators: legislators.length,
        sampleLegislator: legislators[0] || null,
        apiResponse: {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries())
        }
      }
    });

  } catch (error) {
    return NextResponse.json({ 
      error: `OpenStates API test failed: ${error}`,
      status: 'failed'
    }, { status: 500 });
  }
}
