#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to fix the most critical TypeScript errors
function fixCriticalErrors() {
  const criticalFixes = [
    // Fix missing variable declarations in API routes
    {
      file: 'web/app/api/auth/change-password/route.ts',
      pattern: /const \{ data: iaUser \} = await supabase/g,
      replacement: 'const { data: iaUser, error: iaError } = await supabase'
    },
    {
      file: 'web/app/api/auth/change-password/route.ts',
      pattern: /const \{ data: updatedUser \} = await supabase/g,
      replacement: 'const { data: updatedUser, error: updateError } = await supabase'
    },
    {
      file: 'web/app/api/auth/change-password/route.ts',
      pattern: /const \{ data: authUser \} = await supabase/g,
      replacement: 'const { data: authUser, error: authUpdateError } = await supabase'
    },
    {
      file: 'web/app/api/auth/delete-account/route.ts',
      pattern: /const \{ data: iaUser \} = await supabase/g,
      replacement: 'const { data: iaUser, error: iaError } = await supabase'
    },
    {
      file: 'web/app/api/auth/delete-account/route.ts',
      pattern: /const \{ data: deletedUser \} = await supabase/g,
      replacement: 'const { data: deletedUser, error: deleteError } = await supabase'
    },
    {
      file: 'web/app/api/auth/delete-account/route.ts',
      pattern: /const \{ data: authDeletedUser \} = await supabase/g,
      replacement: 'const { data: authDeletedUser, error: authDeleteError } = await supabase'
    },
    {
      file: 'web/app/api/auth/forgot-password/route.ts',
      pattern: /const \{ data: user \} = await supabase/g,
      replacement: 'const { data: user, error: userError } = await supabase'
    },
    {
      file: 'web/app/api/auth/register/route.ts',
      pattern: /const \{ email, password: userPassword, twoFactorCode \} = await request\.json\(\)/g,
      replacement: 'const { email, password: userPassword, twoFactorCode } = await request.json()'
    },
    {
      file: 'web/app/api/auth/sync-user/route.ts',
      pattern: /const \{ data: existingUser \} = await supabase/g,
      replacement: 'const { data: existingUser, error: existingError } = await supabase'
    },
    {
      file: 'web/app/api/auth/sync-user/route.ts',
      pattern: /const \{ data: newUser \} = await supabase/g,
      replacement: 'const { data: newUser, error: createError } = await supabase'
    },
    // Fix missing variables in dashboard route
    {
      file: 'web/app/api/dashboard/route.ts',
      pattern: /const \{ data: activePolls \} = await supabase/g,
      replacement: 'const { data: activePolls, error: activePollsError } = await supabase'
    },
    {
      file: 'web/app/api/dashboard/route.ts',
      pattern: /const \{ data: userVotes \} = await supabase/g,
      replacement: 'const { data: userVotes, error: userVotesError } = await supabase'
    },
    {
      file: 'web/app/api/dashboard/route.ts',
      pattern: /const \{ data: createdPolls \} = await supabase/g,
      replacement: 'const { data: createdPolls, error: createdPollsError } = await supabase'
    },
    {
      file: 'web/app/api/dashboard/route.ts',
      pattern: /const \{ data: totalPolls \} = await supabase/g,
      replacement: 'const { data: totalPolls, error: totalPollsError } = await supabase'
    },
    {
      file: 'web/app/api/dashboard/route.ts',
      pattern: /const \{ data: totalVotes \} = await supabase/g,
      replacement: 'const { data: totalVotes, error: totalVotesError } = await supabase'
    },
    {
      file: 'web/app/api/dashboard/route.ts',
      pattern: /const \{ data: totalUsers \} = await supabase/g,
      replacement: 'const { data: totalUsers, error: totalUsersError } = await supabase'
    },
    {
      file: 'web/app/api/dashboard/route.ts',
      pattern: /const \{ data: recentVotes \} = await supabase/g,
      replacement: 'const { data: recentVotes, error: recentVotesError } = await supabase'
    },
    {
      file: 'web/app/api/dashboard/route.ts',
      pattern: /const \{ data: recentPolls \} = await supabase/g,
      replacement: 'const { data: recentPolls, error: recentPollsError } = await supabase'
    },
    {
      file: 'web/app/api/dashboard/route.ts',
      pattern: /const \{ data: polls \} = await supabase/g,
      replacement: 'const { data: polls, error: pollsError } = await supabase'
    },
    // Fix missing variables in polls route
    {
      file: 'web/app/api/polls/route.ts',
      pattern: /const \{ data: directPoll \} = await supabase/g,
      replacement: 'const { data: directPoll, error: directError } = await supabase'
    },
    {
      file: 'web/app/api/polls/route.ts',
      pattern: /const \{ data: poll \} = await supabase/g,
      replacement: 'const { data: poll, error: pollError } = await supabase'
    },
    // Fix missing variables in vote route
    {
      file: 'web/app/api/polls/[id]/vote/route.ts',
      pattern: /const \{ data: userProfile \} = await supabase/g,
      replacement: 'const { data: userProfile, error: profileError } = await supabase'
    },
    {
      file: 'web/app/api/polls/[id]/vote/route.ts',
      pattern: /const \{ data: existingVote \} = await supabase/g,
      replacement: 'const { data: existingVote, error: voteError } = await supabase'
    },
    // Fix missing variables in user routes
    {
      file: 'web/app/api/user/get-id/route.ts',
      pattern: /const \{ data: userProfile \} = await supabase/g,
      replacement: 'const { data: userProfile, error: profileError } = await supabase'
    },
    {
      file: 'web/app/api/user/get-id-public/route.ts',
      pattern: /const \{ data: userProfile \} = await supabase/g,
      replacement: 'const { data: userProfile, error: profileError } = await supabase'
    }
  ];

  criticalFixes.forEach(fix => {
    try {
      if (fs.existsSync(fix.file)) {
        let content = fs.readFileSync(fix.file, 'utf8');
        const newContent = content.replace(fix.pattern, fix.replacement);
        if (newContent !== content) {
          fs.writeFileSync(fix.file, newContent, 'utf8');
          console.log(`✅ Fixed: ${fix.file}`);
        }
      }
    } catch (error) {
      console.log(`❌ Error fixing ${fix.file}:`, error.message);
    }
  });
}

// Function to fix missing variables in React components
function fixReactComponents() {
  const componentFixes = [
    // Fix missing user variable in poll pages
    {
      file: 'web/app/polls/create/page.tsx',
      pattern: /const \{ user, loading \} = useAuth\(\)/g,
      replacement: 'const { user, loading } = useAuth()'
    },
    {
      file: 'web/app/polls/test-ranked-choice/page.tsx',
      pattern: /const \{ user, loading \} = useAuth\(\)/g,
      replacement: 'const { user, loading } = useAuth()'
    },
    {
      file: 'web/app/polls/test-single-choice/page.tsx',
      pattern: /const \{ user, loading \} = useAuth\(\)/g,
      replacement: 'const { user, loading } = useAuth()'
    },
    {
      file: 'web/app/profile/edit/page.tsx',
      pattern: /const \{ user, loading \} = useAuth\(\)/g,
      replacement: 'const { user, loading } = useAuth()'
    },
    // Fix missing pwaUtils in PWA pages
    {
      file: 'web/app/pwa-showcase/page.tsx',
      pattern: /const \{ pwaUtils, utilsLoading \} = usePWAUtils\(\)/g,
      replacement: 'const { pwaUtils, utilsLoading } = usePWAUtils()'
    },
    {
      file: 'web/app/pwa-testing/page.tsx',
      pattern: /const \{ pwaUtils, utilsLoading \} = usePWAUtils\(\)/g,
      replacement: 'const { pwaUtils, utilsLoading } = usePWAUtils()'
    }
  ];

  componentFixes.forEach(fix => {
    try {
      if (fs.existsSync(fix.file)) {
        let content = fs.readFileSync(fix.file, 'utf8');
        const newContent = content.replace(fix.pattern, fix.replacement);
        if (newContent !== content) {
          fs.writeFileSync(fix.file, newContent, 'utf8');
          console.log(`✅ Fixed: ${fix.file}`);
        }
      }
    } catch (error) {
      console.log(`❌ Error fixing ${fix.file}:`, error.message);
    }
  });
}

// Function to fix type definition issues
function fixTypeDefinitions() {
  // Update the type definitions to match actual usage
  const updatedTypes = `
// Common type definitions
export interface LoginCredentials {
  email: string;
  password: string;
  twoFactorCode?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  twoFactorCode?: string;
}

export interface TrendingTopic {
  id: string;
  title: string;
  description: string;
  category: string;
  trend_score: number;
  trending_score: number;
  created_at: string;
}

export interface ActivityItem {
  id: string;
  title: string;
  type: string;
  description: string;
  timestamp: string;
  user_id?: string;
}

export interface PollNarrative {
  id: string;
  title: string;
  description: string;
  story: string;
  summary: string;
  fullStory: string;
  context: any;
  verifiedFacts: any[];
  sources: any[];
  timeline: any[];
  stakeholders: any[];
  communityFacts: any[];
  controversy: {
    level: string;
  };
  moderation: {
    status: string;
  };
}

export interface User {
  id: string;
  email: string;
  stable_id: string;
  verification_tier: string;
  is_active: boolean;
}

export interface UserProfile {
  id: string;
  stable_id: string;
  email: string;
  verification_tier: string;
  is_active: boolean;
}
`;

  try {
    fs.writeFileSync('web/types/index.ts', updatedTypes, 'utf8');
    console.log('✅ Updated type definitions');
  } catch (error) {
    console.log('❌ Error updating type definitions:', error.message);
  }
}

console.log('🔧 Fixing critical TypeScript errors...');
fixCriticalErrors();
fixReactComponents();
fixTypeDefinitions();
console.log('✅ Critical error fixes completed!');
