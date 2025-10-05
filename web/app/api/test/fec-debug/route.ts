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

    // Test FEC API directly
    const response = await fetch(
      `https://api.open.fec.gov/v1/candidates/?name=Joe%20Biden&state=US&api_key=${apiKey}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }
    );

    if (!response.ok) {
      return NextResponse.json({ 
        error: `FEC API request failed: ${response.status}`,
        status: 'failed',
        details: {
          status: response.status,
          statusText: response.statusText
        }
      }, { status: response.status });
    }

    const data = await response.json();
    
    return NextResponse.json({
      status: 'success',
      apiKey: apiKey.substring(0, 8) + '...',
      response: {
        status: response.status,
        results: data.results?.length || 0,
        sample: data.results?.[0] || null
      }
    });

  } catch (error) {
    return NextResponse.json({ 
      error: `FEC debug failed: ${error}`,
      status: 'failed'
    }, { status: 500 });
  }
}
