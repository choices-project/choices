import { type NextRequest, NextResponse } from 'next/server';
import { 
  EqualPlatformProfileManager, 
  CampaignDashboardManager,
  CandidateVerificationSystem 
} from '@/lib/social/candidate-tools';
import { devLog } from '@/lib/logger';
import { handleError, getUserMessage, getHttpStatus } from '@/lib/error-handler';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const candidateId = searchParams.get('candidateId');
    const search = searchParams.get('search');
    const party = searchParams.get('party');
    const isIndependent = searchParams.get('isIndependent');
    const verified = searchParams.get('verified');
    const limit = parseInt(searchParams.get('limit') || '50');

    devLog('Getting candidates with params:', {
      candidateId,
      search,
      party,
      isIndependent,
      verified,
      limit
    });

    if (candidateId) {
      // Get specific candidate
      const candidate = await EqualPlatformProfileManager.getCandidateProfile(candidateId);
      
      if (!candidate) {
        return NextResponse.json(
          { success: false, error: 'Candidate not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        candidate,
        timestamp: new Date().toISOString()
      });
    } else {
      // Search candidates
      const searchCriteria: any = {};
      
      if (search) searchCriteria.name = search;
      if (party) searchCriteria.party = party;
      if (isIndependent !== null) searchCriteria.isIndependent = isIndependent === 'true';
      if (verified !== null) searchCriteria.verified = verified === 'true';

      const candidates = await EqualPlatformProfileManager.searchCandidates(searchCriteria);
      const limitedCandidates = candidates.slice(0, limit);

      return NextResponse.json({
        success: true,
        candidates: limitedCandidates,
        count: limitedCandidates.length,
        total: candidates.length,
        searchCriteria,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    devLog('Error in candidates GET API:', error);
    const appError = handleError(error as Error);
    const userMessage = getUserMessage(appError);
    const statusCode = getHttpStatus(appError);
    
    return NextResponse.json({ 
      success: false, 
      error: userMessage 
    }, { status: statusCode });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    devLog('Processing candidate action:', action);

    switch (action) {
      case 'create':
        return await handleCreateCandidate(data);
      
      case 'update':
        return await handleUpdateCandidate(data);
      
      case 'verify':
        return await handleVerifyCandidate(data);
      
      case 'dashboard':
        return await handleGetDashboard(data);
      
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    devLog('Error in candidates POST API:', error);
    const appError = handleError(error as Error);
    const userMessage = getUserMessage(appError);
    const statusCode = getHttpStatus(appError);
    
    return NextResponse.json({ 
      success: false, 
      error: userMessage 
    }, { status: statusCode });
  }
}

async function handleCreateCandidate(data: any) {
  const { candidateData } = data;

  if (!candidateData) {
    return NextResponse.json(
      { success: false, error: 'Candidate data is required' },
      { status: 400 }
    );
  }

  const candidate = await EqualPlatformProfileManager.createOrUpdateProfile(candidateData);

  return NextResponse.json({
    success: true,
    candidate,
    action: 'create',
    timestamp: new Date().toISOString()
  });
}

async function handleUpdateCandidate(data: any) {
  const { candidateId, updates } = data;

  if (!candidateId || !updates) {
    return NextResponse.json(
      { success: false, error: 'Candidate ID and updates are required' },
      { status: 400 }
    );
  }

  // Get existing candidate
  const existingCandidate = await EqualPlatformProfileManager.getCandidateProfile(candidateId);
  if (!existingCandidate) {
    return NextResponse.json(
      { success: false, error: 'Candidate not found' },
      { status: 404 }
    );
  }

  // Merge updates
  const updatedCandidate = { ...existingCandidate, ...updates };
  const candidate = await EqualPlatformProfileManager.createOrUpdateProfile(updatedCandidate);

  return NextResponse.json({
    success: true,
    candidate,
    action: 'update',
    timestamp: new Date().toISOString()
  });
}

async function handleVerifyCandidate(data: any) {
  const { candidateId, verificationMethod, verificationData } = data;

  if (!candidateId || !verificationMethod) {
    return NextResponse.json(
      { success: false, error: 'Candidate ID and verification method are required' },
      { status: 400 }
    );
  }

  let verificationResult = false;

  switch (verificationMethod) {
    case 'government-email':
      if (!verificationData?.email) {
        return NextResponse.json(
          { success: false, error: 'Government email is required' },
          { status: 400 }
        );
      }
      verificationResult = await CandidateVerificationSystem.verifyWithGovernmentEmail(
        candidateId,
        verificationData.email
      );
      break;

    case 'campaign-website':
      if (!verificationData?.website) {
        return NextResponse.json(
          { success: false, error: 'Campaign website URL is required' },
          { status: 400 }
        );
      }
      verificationResult = await CandidateVerificationSystem.verifyWithCampaignWebsite(
        candidateId,
        verificationData.website
      );
      break;

    default:
      return NextResponse.json(
        { success: false, error: 'Invalid verification method' },
        { status: 400 }
      );
  }

  return NextResponse.json({
    success: true,
    verificationResult,
    candidateId,
    verificationMethod,
    action: 'verify',
    timestamp: new Date().toISOString()
  });
}

async function handleGetDashboard(data: any) {
  const { candidateId } = data;

  if (!candidateId) {
    return NextResponse.json(
      { success: false, error: 'Candidate ID is required' },
      { status: 400 }
    );
  }

  const dashboardData = await CampaignDashboardManager.getDashboardData(candidateId);

  if (!dashboardData) {
    return NextResponse.json(
      { success: false, error: 'Dashboard data not available' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    dashboardData,
    candidateId,
    action: 'dashboard',
    timestamp: new Date().toISOString()
  });
}
