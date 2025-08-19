#!/usr/bin/env node

const fs = require('fs');

// Function to fix specific files with exact patterns
function fixSpecificFiles() {
  const fixes = [
    // Fix admin breaking news route - add missing destructuring
    {
      file: 'web/app/api/admin/breaking-news/[id]/poll-context/route.ts',
      search: 'const { data: userProfile } = await supabase',
      replace: 'const { data: userProfile, error: profileError } = await supabase'
    },
    {
      file: 'web/app/api/admin/breaking-news/[id]/poll-context/route.ts',
      search: 'const { data: contextData } = await supabase',
      replace: 'const { data: contextData, error: contextError } = await supabase'
    },
    // Fix admin generated polls route
    {
      file: 'web/app/api/admin/generated-polls/[id]/approve/route.ts',
      search: 'const { data: userProfile } = await supabase',
      replace: 'const { data: userProfile, error: profileError } = await supabase'
    },
    {
      file: 'web/app/api/admin/generated-polls/[id]/approve/route.ts',
      search: 'const { data: mainPoll } = await supabase',
      replace: 'const { data: mainPoll, error: mainPollError } = await supabase'
    },
    // Fix admin trending topics route
    {
      file: 'web/app/api/admin/trending-topics/analyze/route.ts',
      search: 'const { data: userProfile } = await supabase',
      replace: 'const { data: userProfile, error: profileError } = await supabase'
    },
    // Fix auth routes
    {
      file: 'web/app/api/auth/change-password/route.ts',
      search: 'const { data: iaUser } = await supabase',
      replace: 'const { data: iaUser, error: iaError } = await supabase'
    },
    {
      file: 'web/app/api/auth/change-password/route.ts',
      search: 'const { data: updatedUser } = await supabase',
      replace: 'const { data: updatedUser, error: updateError } = await supabase'
    },
    {
      file: 'web/app/api/auth/change-password/route.ts',
      search: 'const { data: authUser } = await supabase',
      replace: 'const { data: authUser, error: authUpdateError } = await supabase'
    },
    {
      file: 'web/app/api/auth/delete-account/route.ts',
      search: 'const { data: iaUser } = await supabase',
      replace: 'const { data: iaUser, error: iaError } = await supabase'
    },
    {
      file: 'web/app/api/auth/delete-account/route.ts',
      search: 'const { data: deletedUser } = await supabase',
      replace: 'const { data: deletedUser, error: deleteError } = await supabase'
    },
    {
      file: 'web/app/api/auth/delete-account/route.ts',
      search: 'const { data: authDeletedUser } = await supabase',
      replace: 'const { data: authDeletedUser, error: authDeleteError } = await supabase'
    },
    {
      file: 'web/app/api/auth/forgot-password/route.ts',
      search: 'const { data: user } = await supabase',
      replace: 'const { data: user, error: userError } = await supabase'
    },
    {
      file: 'web/app/api/auth/register/route.ts',
      search: 'const { data: user } = await supabase',
      replace: 'const { data: user, error: createError } = await supabase'
    },
    {
      file: 'web/app/api/auth/sync-user/route.ts',
      search: 'const { data: existingUser } = await supabase',
      replace: 'const { data: existingUser, error: existingError } = await supabase'
    },
    {
      file: 'web/app/api/auth/sync-user/route.ts',
      search: 'const { data: newUser } = await supabase',
      replace: 'const { data: newUser, error: createError } = await supabase'
    },
    // Fix dashboard route
    {
      file: 'web/app/api/dashboard/route.ts',
      search: 'const { data: activePolls } = await supabase',
      replace: 'const { data: activePolls, error: activePollsError } = await supabase'
    },
    {
      file: 'web/app/api/dashboard/route.ts',
      search: 'const { data: userVotes } = await supabase',
      replace: 'const { data: userVotes, error: userVotesError } = await supabase'
    },
    {
      file: 'web/app/api/dashboard/route.ts',
      search: 'const { data: createdPolls } = await supabase',
      replace: 'const { data: createdPolls, error: createdPollsError } = await supabase'
    },
    {
      file: 'web/app/api/dashboard/route.ts',
      search: 'const { data: totalPolls } = await supabase',
      replace: 'const { data: totalPolls, error: totalPollsError } = await supabase'
    },
    {
      file: 'web/app/api/dashboard/route.ts',
      search: 'const { data: totalVotes } = await supabase',
      replace: 'const { data: totalVotes, error: totalVotesError } = await supabase'
    },
    {
      file: 'web/app/api/dashboard/route.ts',
      search: 'const { data: totalUsers } = await supabase',
      replace: 'const { data: totalUsers, error: totalUsersError } = await supabase'
    },
    {
      file: 'web/app/api/dashboard/route.ts',
      search: 'const { data: recentVotes } = await supabase',
      replace: 'const { data: recentVotes, error: recentVotesError } = await supabase'
    },
    {
      file: 'web/app/api/dashboard/route.ts',
      search: 'const { data: recentPolls } = await supabase',
      replace: 'const { data: recentPolls, error: recentPollsError } = await supabase'
    },
    {
      file: 'web/app/api/dashboard/route.ts',
      search: 'const { data: polls } = await supabase',
      replace: 'const { data: polls, error: pollsError } = await supabase'
    },
    // Fix polls routes
    {
      file: 'web/app/api/polls/route.ts',
      search: 'const { data: directPoll } = await supabase',
      replace: 'const { data: directPoll, error: directError } = await supabase'
    },
    {
      file: 'web/app/api/polls/route.ts',
      search: 'const { data: poll } = await supabase',
      replace: 'const { data: poll, error: pollError } = await supabase'
    },
    {
      file: 'web/app/api/polls/[id]/results/route.ts',
      search: 'const { data: poll } = await supabase',
      replace: 'const { data: poll, error: pollError } = await supabase'
    },
    {
      file: 'web/app/api/polls/[id]/vote/route.ts',
      search: 'const { data: userProfile } = await supabase',
      replace: 'const { data: userProfile, error: profileError } = await supabase'
    },
    {
      file: 'web/app/api/polls/[id]/vote/route.ts',
      search: 'const { data: existingVote } = await supabase',
      replace: 'const { data: existingVote, error: voteError } = await supabase'
    },
    // Fix user routes
    {
      file: 'web/app/api/user/get-id/route.ts',
      search: 'const { data: userProfile } = await supabase',
      replace: 'const { data: userProfile, error: profileError } = await supabase'
    },
    {
      file: 'web/app/api/user/get-id-public/route.ts',
      search: 'const { data: userProfile } = await supabase',
      replace: 'const { data: userProfile, error: profileError } = await supabase'
    }
  ];

  fixes.forEach(fix => {
    try {
      if (fs.existsSync(fix.file)) {
        let content = fs.readFileSync(fix.file, 'utf8');
        if (content.includes(fix.search)) {
          const newContent = content.replace(fix.search, fix.replace);
          fs.writeFileSync(fix.file, newContent, 'utf8');
          console.log(`✅ Fixed: ${fix.file}`);
        } else {
          console.log(`⚠️  Pattern not found: ${fix.file}`);
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
    // Fix user components - add missing destructuring
    {
      file: 'web/app/polls/create/page.tsx',
      search: 'const { loading } = useAuth()',
      replace: 'const { user, loading } = useAuth()'
    },
    {
      file: 'web/app/polls/test-ranked-choice/page.tsx',
      search: 'const { loading } = useAuth()',
      replace: 'const { user, loading } = useAuth()'
    },
    {
      file: 'web/app/polls/test-single-choice/page.tsx',
      search: 'const { loading } = useAuth()',
      replace: 'const { user, loading } = useAuth()'
    },
    {
      file: 'web/app/profile/edit/page.tsx',
      search: 'const { loading } = useAuth()',
      replace: 'const { user, loading } = useAuth()'
    }
  ];

  componentFixes.forEach(fix => {
    try {
      if (fs.existsSync(fix.file)) {
        let content = fs.readFileSync(fix.file, 'utf8');
        if (content.includes(fix.search)) {
          const newContent = content.replace(fix.search, fix.replace);
          fs.writeFileSync(fix.file, newContent, 'utf8');
          console.log(`✅ Fixed: ${fix.file}`);
        } else {
          console.log(`⚠️  Pattern not found: ${fix.file}`);
        }
      }
    } catch (error) {
      console.log(`❌ Error fixing ${fix.file}:`, error.message);
    }
  });
}

console.log('🔧 Fixing remaining TypeScript errors with targeted approach...');
fixSpecificFiles();
fixReactComponents();
console.log('✅ Targeted TypeScript error fixes completed!');
