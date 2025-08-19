import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { devLog } from '@/lib/logger';
import { GitHubIssueIntegration } from '@/lib/github-issue-integration';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase client not available' },
        { status: 500 }
      );
    }

    // Check authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check admin permissions
    const { data: userProfile, error: profileError } = await supabase
      .from('ia_users')
      .select('verification_tier')
      .eq('stable_id', user.id)
      .single();

    if (!userProfile || !['T2', 'T3'].includes(userProfile.verification_tier)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const feedbackId = params.id;
    if (!feedbackId) {
      return NextResponse.json(
        { error: 'Feedback ID is required' },
        { status: 400 }
      );
    }

    // Get GitHub configuration from environment
    const githubToken = process.env.GITHUB_TOKEN;
    const githubOwner = process.env.GITHUB_OWNER;
    const githubRepo = process.env.GITHUB_REPO;

    if (!githubToken || !githubOwner || !githubRepo) {
      return NextResponse.json(
        { error: 'GitHub configuration not available' },
        { status: 500 }
      );
    }

    // Fetch the feedback
    const { data: feedback, error: fetchError } = await supabase
      .from('feedback')
      .select('id, email, verification_tier, created_at, updated_at, display_name, avatar_url, bio, stable_id, is_active')
      .eq('id', feedbackId)
      .single();

    if (fetchError || !feedback) {
      return NextResponse.json(
        { error: 'Feedback not found' },
        { status: 404 }
      );
    }

    // Initialize GitHub integration
    const githubIntegration = new GitHubIssueIntegration({
      token: githubToken,
      owner: githubOwner,
      repo: githubRepo
    });

    // Analyze feedback
    const analysis = await githubIntegration.analyzeFeedback(feedback);
    devLog('Feedback analysis completed:', analysis);

    // Generate GitHub issue
    const issue = await githubIntegration.generateIssue(feedback, analysis);
    devLog('GitHub issue generated:', issue);

    // Create the issue on GitHub
    const result = await githubIntegration.createGitHubIssue(issue);
    devLog('GitHub issue created:', result);

    // Link feedback to GitHub issue
    await githubIntegration.linkFeedbackToIssue(feedbackId, result.number, result.url);

    // Update feedback with GitHub issue information
    const { error: updateError } = await supabase
      .from('feedback')
      .update({
        metadata: {
          ...feedback.metadata,
          githubIssue: {
            number: result.number,
            url: result.url,
            analysis: analysis,
            createdAt: new Date().toISOString()
          }
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', feedbackId);

    if (updateError) {
      devLog('Error updating feedback with GitHub issue info:', updateError);
    }

    return NextResponse.json({
      success: true,
      message: 'GitHub issue created successfully',
      data: {
        issueNumber: result.number,
        issueUrl: result.url,
        analysis: analysis,
        generatedIssue: issue
      }
    });

  } catch (error) {
    devLog('Error generating GitHub issue:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
