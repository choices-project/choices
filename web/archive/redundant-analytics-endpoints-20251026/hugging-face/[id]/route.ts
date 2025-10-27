import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { HuggingFaceService } from '@/lib/ai/hugging-face-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get poll data
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
      .eq('id', params.id)
      .single();

    if (!pollData) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    // Use Hugging Face for analysis with your token
    const hfService = new HuggingFaceService({
      apiKey: process.env.HUGGINGFACE_API_KEY || '',
      baseUrl: 'https://api-inference.huggingface.co',
      timeout: 30000
    });
    
    // Analyze poll content
    const contentAnalysis = await hfService.analyzePollContent(pollData.question);
    
    // Analyze voting patterns
    const votes = pollData.poll_options.flatMap((opt: any) => opt.votes);
    const votingAnalysis = await hfService.analyzeVotingPatterns(votes);
    
    // Detect manipulation signals
    const manipulationAnalysis = await hfService.detectManipulationSignals(pollData);

    return NextResponse.json({
      poll_id: params.id,
      content_analysis: contentAnalysis,
      voting_analysis: votingAnalysis,
      manipulation_analysis: manipulationAnalysis,
      analysis_timestamp: new Date().toISOString(),
      analysis_method: 'hugging_face_local',
      privacy: 'maximum',
      token_used: !!process.env.HUGGING_FACE_TOKEN
    });

  } catch (error) {
    console.error('Hugging Face analytics error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
