#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to fix specific files with known issues
function fixSpecificFiles() {
  const fixes = [
    {
      file: 'web/app/api/auth/register/route.ts',
      pattern: /const \{ email, twoFactorCode \} = await request\.json\(\)/g,
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
    {
      file: 'web/app/api/dashboard/route.ts',
      pattern: /const \{ data: activePolls \} = await supabase/g,
      replacement: 'const { data: activePolls, error: pollsError } = await supabase'
    },
    {
      file: 'web/app/api/dashboard/route.ts',
      pattern: /const \{ data: userVotes \} = await supabase/g,
      replacement: 'const { data: userVotes, error: votesError } = await supabase'
    },
    {
      file: 'web/app/api/dashboard/route.ts',
      pattern: /const \{ data: createdPolls \} = await supabase/g,
      replacement: 'const { data: createdPolls, error: createdError } = await supabase'
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
    {
      file: 'web/app/api/demographics/route.ts',
      pattern: /const \{ data: users \} = await supabase/g,
      replacement: 'const { data: users, error: usersError } = await supabase'
    },
    {
      file: 'web/app/api/demographics/route.ts',
      pattern: /const \{ data: polls \} = await supabase/g,
      replacement: 'const { data: polls, error: pollsError } = await supabase'
    },
    {
      file: 'web/app/api/demographics/route.ts',
      pattern: /const \{ data: votes \} = await supabase/g,
      replacement: 'const { data: votes, error: votesError } = await supabase'
    },
    {
      file: 'web/app/api/polls/route.ts',
      pattern: /const \{ description, options, privacyLevel, endDate, allowMultipleVotes, requireAuthentication, usesBlindedTokens \} = body/g,
      replacement: 'const { description, options, privacyLevel, endDate, allowMultipleVotes, requireAuthentication, usesBlindedTokens } = body'
    },
    {
      file: 'web/app/api/polls/route.ts',
      pattern: /const \{ data: poll \} = await supabase/g,
      replacement: 'const { data: poll, error: pollError } = await supabase'
    },
    {
      file: 'web/app/api/polls/route.ts',
      pattern: /const \{ data: directPoll \} = await supabase/g,
      replacement: 'const { data: directPoll, error: directError } = await supabase'
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

// Function to add missing type definitions
function addTypeDefinitions() {
  const typeFile = 'web/types/index.ts';
  const typeDefinitions = `
// Common type definitions
export interface LoginCredentials {
  email: string;
  password: string;
  twoFactorCode?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  twoFactorCode?: string;
}

export interface TrendingTopic {
  id: string;
  title: string;
  description: string;
  category: string;
  trending_score: number;
  created_at: string;
}

export interface ActivityItem {
  id: string;
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
  context: any;
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
    // Create types directory if it doesn't exist
    const typesDir = path.dirname(typeFile);
    if (!fs.existsSync(typesDir)) {
      fs.mkdirSync(typesDir, { recursive: true });
    }

    // Write type definitions
    fs.writeFileSync(typeFile, typeDefinitions, 'utf8');
    console.log(`✅ Created: ${typeFile}`);
  } catch (error) {
    console.log(`❌ Error creating type definitions:`, error.message);
  }
}

// Function to fix missing imports in specific files
function fixMissingImports() {
  const importFixes = [
    {
      file: 'web/hooks/useAuth.ts',
      add: "import { LoginCredentials, RegisterData } from '@/types';"
    },
    {
      file: 'web/lib/mock-data.ts',
      add: "import { TrendingTopic, ActivityItem } from '@/types';"
    },
    {
      file: 'web/components/polls/PollNarrativeView.tsx',
      add: "import { PollNarrative } from '@/types';"
    },
    {
      file: 'web/src/app/page.tsx',
      add: "import { Shield, Users } from 'lucide-react';"
    }
  ];

  importFixes.forEach(fix => {
    try {
      if (fs.existsSync(fix.file)) {
        let content = fs.readFileSync(fix.file, 'utf8');
        if (!content.includes(fix.add.split(' from ')[0])) {
          // Add import after existing imports
          const importMatch = content.match(/import.*from.*['"];?\n/);
          if (importMatch) {
            const newContent = content.replace(
              importMatch[0],
              importMatch[0] + fix.add + '\n'
            );
            fs.writeFileSync(fix.file, newContent, 'utf8');
            console.log(`✅ Added import to: ${fix.file}`);
          }
        }
      }
    } catch (error) {
      console.log(`❌ Error fixing imports in ${fix.file}:`, error.message);
    }
  });
}

console.log('🔧 Fixing remaining TypeScript errors...');
fixSpecificFiles();
addTypeDefinitions();
fixMissingImports();
console.log('✅ Remaining error fixes completed!');
