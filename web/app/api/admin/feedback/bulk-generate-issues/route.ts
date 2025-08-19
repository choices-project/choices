import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { devLog } from '@/lib/logger';
import { GitHubIssueIntegration } from '@/lib/github-issue-integration';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
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

    // Get request body
    const body = await request.json();
    const { feedbackIds, filters } = body;

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

    // Initialize GitHub integration
    const githubIntegration = new GitHubIssueIntegration({
      token: githubToken,
      owner: githubOwner,
      repo: githubRepo
    });

    // Fetch feedback items
    let query = supabase
      .from('feedback')
      .select('id, email, verification_tier, created_at, updated_at, display_name, avatar_url, bio, stable_id, is_active')
      .order('created_at', { ascending: false });

    if (feedbackIds && feedbackIds.length > 0) {
      // Generate issues for specific feedback IDs
      query = query.in('id', feedbackIds);
    } else if (filters) {
      // Apply filters
      if (filters.type) query = query.eq('type', filters.type);
      if (filters.sentiment) query = query.eq('sentiment', filters.sentiment);
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.priority) query = query.eq('priority', filters.priority);
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
    } else {
      // Default: generate issues for all open feedback without GitHub issues
      query = query.eq('status', 'open');
    }

    const { data: feedbackItems, error: fetchError } = await query;

    if (fetchError) {
      return NextResponse.json(
        { error: 'Failed to fetch feedback' },
        { status: 500 }
      );
    }

    if (!feedbackItems || feedbackItems.length === 0) {
      return NextResponse.json(
        { error: 'No feedback items found' },
        { status: 404 }
      );
    }

    // Filter out feedback that already has GitHub issues
    const feedbackToProcess = feedbackItems.filter(
      (item: any) => !item.metadata?.githubIssue
    );

    if (feedbackToProcess.length === 0) {
      return NextResponse.json(
        { error: 'All selected feedback already has GitHub issues' },
        { status: 400 }
      );
    }

    // Process feedback items
    const results = {
      total: feedbackToProcess.length,
      successful: 0,
      failed: 0,
      issues: [] as any[]
    };

    for (const feedback of feedbackToProcess) {
      try {
        // Analyze feedback
        const analysis = await githubIntegration.analyzeFeedback(feedback);
        
        // Generate GitHub issue
        const issue = await githubIntegration.generateIssue(feedback, analysis);
        
        // Create the issue on GitHub
        const result = await githubIntegration.createGitHubIssue(issue);
        
        // Link feedback to GitHub issue
        await githubIntegration.linkFeedbackToIssue(feedback.id, result.number, result.url);
        
        // Update feedback with GitHub issue information
        await supabase
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
          .eq('id', feedback.id);

        results.successful++;
        results.issues.push({
          feedbackId: feedback.id,
          issueNumber: result.number,
          issueUrl: result.url,
          title: issue.title,
          analysis: analysis
        });

        devLog(`Created GitHub issue #${result.number} for feedback ${feedback.id}`);
      } catch (error) {
        results.failed++;
        devLog(`Failed to create GitHub issue for feedback ${feedback.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Bulk issue generation completed: ${results.successful} successful, ${results.failed} failed`,
      data: results
    });

  } catch (error) {
    devLog('Error in bulk issue generation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
