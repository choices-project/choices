import { NextRequest, NextResponse } from 'next/server';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.LEGISCAN_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'LegiScan API key not configured',
        status: 'failed'
      }, { status: 500 });
    }

    // Test LegiScan API
    const response = await fetch(
      `https://api.legiscan.com/?key=${apiKey}&op=getSessionList&state=CA`,
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
        error: `LegiScan API request failed: ${response.status}`,
        status: 'failed',
        details: {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        }
      }, { status: response.status });
    }

    const data = await response.json();
    const sessions = data.sessionlist || [];
    
    return NextResponse.json({
      status: 'success',
      api: 'LegiScan',
      data: {
        totalSessions: sessions.length,
        sampleSession: sessions[0] || null,
        apiResponse: {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries())
        }
      }
    });

  } catch (error) {
    return NextResponse.json({ 
      error: `LegiScan API test failed: ${error}`,
      status: 'failed'
    }, { status: 500 });
  }
}
