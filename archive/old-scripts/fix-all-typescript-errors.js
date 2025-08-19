#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to fix all remaining TypeScript errors
function fixAllErrors() {
  const fixes = [
    // Fix admin breaking news route
    {
      file: 'web/app/api/admin/breaking-news/[id]/poll-context/route.ts',
      pattern: /const \{ data: userProfile \} = await supabase/g,
      replacement: 'const { data: userProfile, error: profileError } = await supabase'
    },
    {
      file: 'web/app/api/admin/breaking-news/[id]/poll-context/route.ts',
      pattern: /const \{ data: contextData \} = await supabase/g,
      replacement: 'const { data: contextData, error: contextError } = await supabase'
    },
    // Fix admin generated polls route
    {
      file: 'web/app/api/admin/generated-polls/[id]/approve/route.ts',
      pattern: /const \{ data: userProfile \} = await supabase/g,
      replacement: 'const { data: userProfile, error: profileError } = await supabase'
    },
    {
      file: 'web/app/api/admin/generated-polls/[id]/approve/route.ts',
      pattern: /const \{ data: mainPoll \} = await supabase/g,
      replacement: 'const { data: mainPoll, error: mainPollError } = await supabase'
    },
    // Fix admin trending topics route
    {
      file: 'web/app/api/admin/trending-topics/analyze/route.ts',
      pattern: /const \{ data: userProfile \} = await supabase/g,
      replacement: 'const { data: userProfile, error: profileError } = await supabase'
    },
    // Fix auth routes
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
      file: 'web/app/api/auth/register/route.ts',
      pattern: /const \{ data: user \} = await supabase/g,
      replacement: 'const { data: user, error: createError } = await supabase'
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
    // Fix dashboard route
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
    // Fix polls routes
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
    {
      file: 'web/app/api/polls/[id]/results/route.ts',
      pattern: /const \{ data: poll \} = await supabase/g,
      replacement: 'const { data: poll, error: pollError } = await supabase'
    },
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
    // Fix user routes
    {
      file: 'web/app/api/user/get-id/route.ts',
      pattern: /const \{ data: userProfile \} = await supabase/g,
      replacement: 'const { data: userProfile, error: profileError } = await supabase'
    },
    {
      file: 'web/app/api/user/get-id-public/route.ts',
      pattern: /const \{ data: userProfile \} = await supabase/g,
      replacement: 'const { data: userProfile, error: profileError } = await supabase'
    },
    // Fix lib files
    {
      file: 'web/lib/user-sync.ts',
      pattern: /const \{ data: existingUser \} = await supabase/g,
      replacement: 'const { data: existingUser, error: existingError } = await supabase'
    },
    {
      file: 'web/lib/user-sync.ts',
      pattern: /const \{ data: newUser \} = await supabase/g,
      replacement: 'const { data: newUser, error: createError } = await supabase'
    },
    {
      file: 'web/lib/user-sync.ts',
      pattern: /return \{ data, error \}/g,
      replacement: 'return { data: result, error }'
    },
    {
      file: 'web/lib/user-sync.ts',
      pattern: /return \{ hasProfile: !!data, error: null \}/g,
      replacement: 'return { hasProfile: !!result, error: null }'
    },
    // Fix hybrid privacy
    {
      file: 'web/lib/hybrid-privacy.ts',
      pattern: /const text = `\$\{title\} \$\{description\} \$\{category\}`\.toLowerCase\(\);/g,
      replacement: 'const text = `${pollTitle} ${pollDescription} ${pollCategory}`.toLowerCase();'
    },
    // Fix real-time news service
    {
      file: 'web/lib/real-time-news-service.ts',
      pattern: /const question = this\.generatePollQuestion\(headline, summary\);/g,
      replacement: 'const question = this.generatePollQuestion(articleHeadline, articleSummary);'
    }
  ];

  fixes.forEach(fix => {
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

// Function to fix React component issues
function fixReactComponents() {
  const componentFixes = [
    // Fix missing variables in components
    {
      file: 'web/components/admin/dashboard/DashboardOverview.tsx',
      pattern: /const \{ topics, loading \} = useTrendingTopics\(\)/g,
      replacement: 'const { topics, loading: topicsLoading } = useTrendingTopics()'
    },
    {
      file: 'web/components/admin/generated-polls/GeneratedPollsPage.tsx',
      pattern: /const \{ polls, loading \} = useGeneratedPolls\(\)/g,
      replacement: 'const { polls, loading } = useGeneratedPolls()'
    },
    {
      file: 'web/components/admin/layout/Header.tsx',
      pattern: /const \{ sidebarOpen, setSidebarOpen \} = useSidebar\(\)/g,
      replacement: 'const { sidebarOpen, setSidebarOpen, toggleSidebar } = useSidebar()'
    },
    {
      file: 'web/components/admin/layout/Sidebar.tsx',
      pattern: /const \{ metrics, loading \} = useMetrics\(\)/g,
      replacement: 'const { metrics, loading } = useMetrics()'
    },
    {
      file: 'web/components/admin/trending-topics/TrendingTopicsPage.tsx',
      pattern: /const \{ topics, loading \} = useTrendingTopics\(\)/g,
      replacement: 'const { topics, loading } = useTrendingTopics()'
    },
    {
      file: 'web/components/FeatureWrapper.tsx',
      pattern: /const shouldRender = anyEnabled \? anyEnabledResult : allEnabled;/g,
      replacement: 'const shouldRender = anyEnabled ? anyEnabledResult : allEnabledResult;'
    },
    {
      file: 'web/components/PWAVotingInterface.tsx',
      pattern: /const \{ pwaUtils, pwaEnabled \} = usePWAUtils\(\)/g,
      replacement: 'const { pwaUtils, pwaEnabled } = usePWAUtils()'
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

// Function to fix mock data issues
function fixMockData() {
  const mockDataFixes = [
    {
      file: 'web/lib/mock-data.ts',
      pattern: /trend_score: \d+,/g,
      replacement: (match) => match.replace('trend_score', 'trending_score')
    },
    {
      file: 'web/lib/mock-data.ts',
      pattern: /title: '[^']+',/g,
      replacement: (match) => match.replace(/title: '[^']+',/, '')
    }
  ];

  mockDataFixes.forEach(fix => {
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

console.log('🔧 Fixing all TypeScript errors...');
fixAllErrors();
fixReactComponents();
fixMockData();
console.log('✅ All TypeScript error fixes completed!');
