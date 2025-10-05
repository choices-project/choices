import { NextRequest, NextResponse } from 'next/server';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.FEC_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'FEC API key not configured',
        status: 'failed'
      }, { status: 500 });
    }

    // Test FEC API with API key
    const response = await fetch(
      `https://api.open.fec.gov/v1/candidates/?page=1&per_page=1&api_key=${apiKey}`,
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
        error: `FEC API request failed: ${response.status}`,
        status: 'failed',
        details: {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        }
      }, { status: response.status });
    }

    const data = await response.json();
    const candidates = data.results || [];
    
    return NextResponse.json({
      status: 'success',
      api: 'FEC',
      data: {
        totalCandidates: candidates.length,
        sampleCandidate: candidates[0] || null,
        apiResponse: {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries())
        }
      }
    });

  } catch (error) {
    return NextResponse.json({ 
      error: `FEC API test failed: ${error}`,
      status: 'failed'
    }, { status: 500 });
  }
}
