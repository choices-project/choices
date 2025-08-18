#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to fix all remaining TypeScript errors
function fixAllErrors() {
  const fixes = [
    // Fix missing variable declarations in API routes
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
      pattern: /const shouldRender = anyEnabled \? anyEnabledResult : allEnabledResult;/g,
      replacement: 'const shouldRender = anyEnabled ? anyEnabledResult : allEnabled;'
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

// Function to fix lib files
function fixLibFiles() {
  const libFixes = [
    {
      file: 'web/lib/hybrid-privacy.ts',
      pattern: /const text = `\$\{pollTitle\} \$\{pollDescription\} \$\{pollCategory\}`\.toLowerCase\(\);/g,
      replacement: 'const text = `${title} ${description} ${category}`.toLowerCase();'
    },
    {
      file: 'web/lib/hybrid-voting-service.ts',
      pattern: /const \{ data: pollSettings \} = await supabase/g,
      replacement: 'const { data: pollSettings, error: pollError } = await supabase'
    },
    {
      file: 'web/lib/hybrid-voting-service.ts',
      pattern: /const \{ data: vote \} = await supabase/g,
      replacement: 'const { data: vote, error: voteError } = await supabase'
    },
    {
      file: 'web/lib/hybrid-voting-service.ts',
      pattern: /const \{ data: existingVote \} = await supabase/g,
      replacement: 'const { data: existingVote, error: existingVoteError } = await supabase'
    }
  ];

  libFixes.forEach(fix => {
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

// Function to fix mock data
function fixMockData() {
  const mockDataContent = `export const mockTrendingTopics: TrendingTopic[] = [
  {
    id: '1',
    title: 'Gavin Newsom vs Donald Trump',
    description: 'California Governor Challenges Former President',
    category: 'politics',
    trend_score: 95,
    trending_score: 95,
    status: 'active',
    source: 'Twitter Trends',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '2',
    title: 'AI Regulation Debate',
    description: 'Should AI development be regulated by governments?',
    category: 'technology',
    trend_score: 87,
    trending_score: 87,
    status: 'active',
    source: 'Reddit',
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '3',
    title: 'Climate Change Summit',
    description: 'Global Leaders Meet in Paris',
    category: 'environment',
    trend_score: 82,
    trending_score: 82,
    status: 'active',
    source: 'News API',
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
  },
  {
    id: '4',
    title: 'Space Exploration',
    description: 'NASA Announces New Mars Mission',
    category: 'science',
    trend_score: 78,
    trending_score: 78,
    status: 'active',
    source: 'NASA',
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString()
  },
  {
    id: '5',
    title: 'World Cup Final',
    description: 'Championship Match Draws Global Attention',
    category: 'sports',
    trend_score: 75,
    trending_score: 75,
    status: 'active',
    source: 'Sports News',
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString()
  }
];

export const mockGeneratedPolls: GeneratedPoll[] = [
  {
    id: '1',
    title: 'Who do you think would win in a debate between Gavin Newsom and Donald Trump?',
    options: ['Gavin Newsom', 'Donald Trump', 'Too close to call', 'Neither'],
    source_topic_id: '1',
    status: 'pending',
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    metrics: {
      total_votes: 0,
      engagement_rate: 0
    }
  },
  {
    id: '2',
    title: 'Should AI development be regulated by governments?',
    options: ['Yes, strict regulation', 'Yes, moderate regulation', 'No, let market decide', 'Not sure'],
    source_topic_id: '2',
    status: 'approved',
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    metrics: {
      total_votes: 847,
      engagement_rate: 67.8
    }
  },
  {
    id: '3',
    title: 'What is the most important issue facing the world today?',
    options: ['Climate Change', 'Economic Inequality', 'Global Health', 'Political Polarization'],
    source_topic_id: '3',
    status: 'pending',
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    metrics: {
      total_votes: 0,
      engagement_rate: 0
    }
  }
];

export const mockActivityFeed: ActivityItem[] = [
  {
    id: '1',
    title: 'Topic Created',
    type: 'topic_created',
    description: '"Gavin Newsom vs Donald Trump: California Governor Challenges Former President" was detected as trending',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    severity: 'info'
  },
  {
    id: '2',
    title: 'Poll Generated',
    type: 'poll_generated',
    description: '"Who do you think would win in a debate between Gavin Newsom and Donald Trump?" was generated from trending topic',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    severity: 'info'
  },
  {
    id: '3',
    title: 'Poll Approved',
    type: 'poll_approved',
    description: '"Should AI development be regulated by governments?" has been approved and is now live',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString()
  },
  {
    id: '4',
    title: 'System Alert',
    type: 'system_alert',
    description: 'All systems are operating normally. Database performance is optimal.',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString()
  },
  {
    id: '5',
    title: 'Topic Created',
    type: 'topic_created',
    description: '"Climate Change Summit: Global Leaders Meet in Paris" was detected as trending',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
  }
];

// Mock chart data
export const mockChartData = {
  recentActivity: [
    { name: 'Mon', value: 12 },
    { name: 'Tue', value: 19 },
    { name: 'Wed', value: 15 },
    { name: 'Thu', value: 25 },
    { name: 'Fri', value: 22 },
    { name: 'Sat', value: 18 },
    { name: 'Sun', value: 24 },
  ],
  topicCategories: [
    { name: 'Politics', value: 35 },
    { name: 'Technology', value: 25 },
    { name: 'Entertainment', value: 20 },
    { name: 'Sports', value: 15 },
    { name: 'Other', value: 5 },
  ],
  pollPerformance: [
    { name: 'Jan', value: 65 },
    { name: 'Feb', value: 78 },
    { name: 'Mar', value: 82 },
    { name: 'Apr', value: 75 },
    { name: 'May', value: 88 },
    { name: 'Jun', value: 92 },
  ]
};

// Mock demographics response
export const getMockDemographicsResponse = () => ({
  totalUsers: 1250,
  recentPolls: [
    {
      poll_id: '1',
      total_votes: 847,
      participation_rate: 67.8,
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      poll_id: '2',
      total_votes: 1247,
      participation_rate: 85.2,
      created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
    }
  ],
  recentVotes: [
    {
      poll_id: '1',
      voted_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
    },
    {
      poll_id: '2',
      voted_at: new Date(Date.now() - 45 * 60 * 1000).toISOString()
    }
  ],
  demographics: {
    ageGroups: [
      { name: '18-24', value: 25 },
      { name: '25-34', value: 35 },
      { name: '35-44', value: 20 },
      { name: '45-54', value: 15 },
      { name: '55+', value: 5 }
    ],
    locations: [
      { name: 'United States', value: 45 },
      { name: 'Europe', value: 25 },
      { name: 'Asia', value: 20 },
      { name: 'Other', value: 10 }
    ],
    interests: [
      { name: 'Politics', value: 30 },
      { name: 'Technology', value: 25 },
      { name: 'Environment', value: 20 },
      { name: 'Sports', value: 15 },
      { name: 'Other', value: 10 }
    ]
  }
});
`;

  try {
    fs.writeFileSync('web/lib/mock-data.ts', mockDataContent, 'utf8');
    console.log('✅ Fixed mock data');
  } catch (error) {
    console.log('❌ Error fixing mock data:', error.message);
  }
}

console.log('🔧 Fixing all TypeScript errors for deployment...');
fixAllErrors();
fixReactComponents();
fixLibFiles();
fixMockData();
console.log('✅ All TypeScript error fixes completed for deployment!');
