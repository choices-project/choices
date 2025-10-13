// NextRequest import removed - not used
import { NextResponse } from 'next/server';

// Removed mock data import - using real data only
import { devLog } from '@/lib/utils/logger';
import { getSupabaseServerClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

// Helper function to calculate demographics from user profiles
function calculateDemographics(users: any[]) {
  const ageGroups = [
    { range: '18-24', count: 0, percentage: 0 },
    { range: '25-34', count: 0, percentage: 0 },
    { range: '35-44', count: 0, percentage: 0 },
    { range: '45-54', count: 0, percentage: 0 },
    { range: '55+', count: 0, percentage: 0 }
  ];

  const genderDistribution = [
    { gender: 'Male', count: 0, percentage: 0 },
    { gender: 'Female', count: 0, percentage: 0 },
    { gender: 'Other', count: 0, percentage: 0 },
    { gender: 'Prefer not to say', count: 0, percentage: 0 }
  ];

  const educationLevels = [
    { level: 'High School', count: 0, percentage: 0 },
    { level: 'Bachelor\'s', count: 0, percentage: 0 },
    { level: 'Master\'s', count: 0, percentage: 0 },
    { level: 'PhD', count: 0, percentage: 0 },
    { level: 'Other', count: 0, percentage: 0 }
  ];

  const incomeRanges = [
    { range: '$0-30k', count: 0, percentage: 0 },
    { range: '$30k-60k', count: 0, percentage: 0 },
    { range: '$60k-100k', count: 0, percentage: 0 },
    { range: '$100k+', count: 0, percentage: 0 },
    { range: 'Prefer not to say', count: 0, percentage: 0 }
  ];

  const geographicDistribution = [
    { region: 'Northeast', count: 0, percentage: 0 },
    { region: 'Southeast', count: 0, percentage: 0 },
    { region: 'Midwest', count: 0, percentage: 0 },
    { region: 'West', count: 0, percentage: 0 },
    { region: 'International', count: 0, percentage: 0 }
  ];

  // Process each user's demographics
  users.forEach(user => {
    const demographics = user.demographics || {};
    const location = user.location_data || {};

    // Age groups
    if (demographics?.age) {
      const age = parseInt(demographics.age);
      if (age >= 18 && age <= 24) ageGroups[0]!.count++;
      else if (age >= 25 && age <= 34) ageGroups[1]!.count++;
      else if (age >= 35 && age <= 44) ageGroups[2]!.count++;
      else if (age >= 45 && age <= 54) ageGroups[3]!.count++;
      else if (age >= 55) ageGroups[4]!.count++;
    }

    // Gender distribution
    if (demographics?.gender) {
      const gender = demographics.gender.toLowerCase();
      if (gender === 'male') genderDistribution[0]!.count++;
      else if (gender === 'female') genderDistribution[1]!.count++;
      else if (gender === 'other') genderDistribution[2]!.count++;
      else genderDistribution[3]!.count++;
    }

    // Education levels
    if (demographics?.education) {
      const education = demographics.education.toLowerCase();
      if (education.includes('high school')) educationLevels[0]!.count++;
      else if (education.includes('bachelor')) educationLevels[1]!.count++;
      else if (education.includes('master')) educationLevels[2]!.count++;
      else if (education.includes('phd') || education.includes('doctorate')) educationLevels[3]!.count++;
      else educationLevels[4]!.count++;
    }

    // Income ranges
    if (demographics?.income) {
      const income = parseInt(demographics.income);
      if (income < 30000) incomeRanges[0]!.count++;
      else if (income < 60000) incomeRanges[1]!.count++;
      else if (income < 100000) incomeRanges[2]!.count++;
      else if (income >= 100000) incomeRanges[3]!.count++;
      else incomeRanges[4]!.count++;
    }

    // Geographic distribution
    if (location?.region) {
      const region = location.region.toLowerCase();
      if (region.includes('northeast')) geographicDistribution[0]!.count++;
      else if (region.includes('southeast')) geographicDistribution[1]!.count++;
      else if (region.includes('midwest')) geographicDistribution[2]!.count++;
      else if (region.includes('west')) geographicDistribution[3]!.count++;
      else geographicDistribution[4]!.count++;
    }
  });

  // Calculate percentages
  const totalUsers = users.length;
  if (totalUsers > 0) {
    [ageGroups, genderDistribution, educationLevels, incomeRanges, geographicDistribution].forEach(category => {
      category.forEach(item => {
        item.percentage = Math.round((item.count / totalUsers) * 100);
      });
    });
  }

  return {
    ageGroups,
    genderDistribution,
    educationLevels,
    incomeRanges,
    geographicDistribution
  };
}

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Get total users with demographics data
    const { data: users, error: usersError } = await supabase
        .from('user_profiles')
        .select('id, user_id, username, email, trust_tier, created_at, updated_at, avatar_url, bio, is_active, demographics, location_data')
        .eq('is_active', true);

      if (usersError) throw usersError;

      const totalUsers = users.length || 0;

      // Get recent polls
      const { data: polls, error: pollsError } = await supabase
        .from('polls')
        .select('id, title, total_votes, created_at')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(5);

      if (pollsError) throw pollsError;

      // Get recent votes
      const { data: votes, error: votesError } = await supabase
        .from('votes')
        .select('poll_id, created_at')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      if (votesError) throw votesError;

      // Calculate demographics from user profiles
      const demographics = calculateDemographics(users || []);

      // Generate real demographics data
      const response = {
        demographics: {
          ageGroups: demographics.ageGroups,
          genderDistribution: demographics.genderDistribution,
          educationLevels: demographics.educationLevels,
          incomeRanges: demographics.incomeRanges,
          geographicDistribution: demographics.geographicDistribution,
          recentVotes: []
        },
        totalUsers,
        recentPolls: (polls || []).map(poll => ({
          id: poll.id,
          question: poll.title,
          options: [],
          createdAt: poll.created_at,
          votes: poll.total_votes
        })),
        recentVotes: (votes || []) as any[]
      };

      return NextResponse.json(response);
    } catch (error) {
      devLog('Error in demographics API:', error);
      // Return empty demographics data structure
      return NextResponse.json({
        demographics: {
          ageGroups: [
            { range: '18-24', count: 0, percentage: 0 },
            { range: '25-34', count: 0, percentage: 0 },
            { range: '35-44', count: 0, percentage: 0 },
            { range: '45-54', count: 0, percentage: 0 },
            { range: '55+', count: 0, percentage: 0 }
          ],
          genderDistribution: [
            { gender: 'Male', count: 0, percentage: 0 },
            { gender: 'Female', count: 0, percentage: 0 },
            { gender: 'Other', count: 0, percentage: 0 },
            { gender: 'Prefer not to say', count: 0, percentage: 0 }
          ],
          educationLevels: [
            { level: 'High School', count: 0, percentage: 0 },
            { level: 'Bachelor\'s', count: 0, percentage: 0 },
            { level: 'Master\'s', count: 0, percentage: 0 },
            { level: 'PhD', count: 0, percentage: 0 },
            { level: 'Other', count: 0, percentage: 0 }
          ],
          incomeRanges: [
            { range: '$0-30k', count: 0, percentage: 0 },
            { range: '$30k-60k', count: 0, percentage: 0 },
            { range: '$60k-100k', count: 0, percentage: 0 },
            { range: '$100k+', count: 0, percentage: 0 },
            { range: 'Prefer not to say', count: 0, percentage: 0 }
          ],
          geographicDistribution: [
            { region: 'Northeast', count: 0, percentage: 0 },
            { region: 'Southeast', count: 0, percentage: 0 },
            { region: 'Midwest', count: 0, percentage: 0 },
            { region: 'West', count: 0, percentage: 0 },
            { region: 'International', count: 0, percentage: 0 }
          ],
          recentVotes: []
        },
        totalUsers: 0,
        recentPolls: [],
        recentVotes: []
      });
    }
}
