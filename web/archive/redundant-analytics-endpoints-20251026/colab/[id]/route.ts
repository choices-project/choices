import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

/**
 * CHOICES PLATFORM - COLAB AI ANALYTICS API
 * 
 * Repository: https://github.com/choices-project/choices
 * Live Site: https://choices-platform.vercel.app
 * License: MIT
 * 
 * This endpoint integrates with Google Colab Pro for transparent AI analytics
 * using only open source models (Hugging Face community).
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Await params in Next.js 15
  const { id } = await params;
  
  // Handle health check
  if (id === 'health') {
    try {
      const colabUrl = process.env.COLAB_API_URL;
      
      if (!colabUrl) {
        return NextResponse.json({ 
          error: 'Colab API URL not configured',
          message: 'Please set COLAB_API_URL environment variable'
        }, { status: 500 });
      }
      
      const response = await fetch(`${colabUrl}/health`);
      if (!response.ok) {
        throw new Error('Colab health check failed');
      }
      
      const healthData = await response.json();
      
      return NextResponse.json({
        ...healthData,
        platform: 'choices',
        repository: 'https://github.com/choices-project/choices',
        live_site: 'https://choices-platform.vercel.app'
      });
    } catch (error) {
      console.error('Colab health check error:', error);
      return NextResponse.json({ 
        error: 'Colab health check failed',
        platform: 'choices',
        repository: 'https://github.com/choices-project/choices'
      }, { status: 500 });
    }
  }
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get poll data from Choices platform
    const { data: pollData } = await supabase
      .from('polls')
      .select(`
        id,
        question,
        poll_options!inner(
          id,
          text,
          votes!inner(
            id,
            created_at,
            trust_tier,
            user_id,
            voter_session
          )
        )
      `)
      .eq('id', id)
      .single();

    if (!pollData) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    // Send to Colab for transparent AI analysis
    const colabUrl = process.env.COLAB_API_URL;
    
    if (!colabUrl) {
      return NextResponse.json({ 
        error: 'Colab API URL not configured',
        message: 'Please set COLAB_API_URL environment variable'
      }, { status: 500 });
    }
    
    const colabResponse = await fetch(`${colabUrl}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: pollData.question,
        analysis_type: 'sentiment'
      })
    });

    if (!colabResponse.ok) {
      throw new Error('Colab analysis failed');
    }

    const analysis = await colabResponse.json();

    return NextResponse.json({
      ...analysis,
      platform: 'choices',
      repository: 'https://github.com/choices-project/choices',
      live_site: 'https://choices-platform.vercel.app',
      analysis_method: 'google_colab_pro',
      privacy: 'maximum',
      cost: 'included_in_colab_pro',
      transparency: 'complete',
      corporate_dependencies: 'none'
    });

  } catch (error) {
    console.error('Choices Colab analytics error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      platform: 'choices',
      repository: 'https://github.com/choices-project/choices'
    }, { status: 500 });
  }
}
