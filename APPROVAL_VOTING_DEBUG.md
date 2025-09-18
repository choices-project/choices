# Approval Voting E2E Test Debugging Issue

## Problem Summary
The approval voting E2E test is failing with a `net::ERR_ABORTED` error when navigating to the poll page after creating an approval voting poll. The test successfully creates the poll but fails when trying to navigate to `/polls/{pollId}`.

## Test Details
- **Test File**: `/Users/alaughingkitsune/src/Choices/web/tests/e2e/poll-creation-voting.spec.ts`
- **Test Name**: "should create approval voting poll and vote"
- **Failing Line**: `await page.goto(\`/polls/${approvalPollId}\`);`
- **Error**: `page.goto: net::ERR_ABORTED at http://127.0.0.1:3000/polls/7b677d5f-dfc0-4bf9-ab2e-7ffa83d5d935`

## What We've Tried

### 1. Fixed Time Input Format Issues
- Updated E2E tests to use `HH:MM` format for time inputs instead of `YYYY-MM-DDTHH:MM`
- Fixed in multiple test files: `poll-creation-voting.spec.ts`, `poll-creation.spec.ts`, `vote-finalization.spec.ts`

### 2. Fixed beforeAll Fixture Issues
- Replaced `beforeAll` with `createTestPoll` helper function in `voting-flow.spec.ts`
- Ensured proper test isolation

### 3. Added Missing Test IDs
- Added `data-testid="poll-details"` to poll page
- Added `data-testid="voting-method"` to voting method display
- Added `data-testid="voting-form"` to voting interface
- Added `data-testid="start-voting-button"` to all voting components
- Added `data-testid="vote-confirmation"` and `data-testid="selected-options"` to approval voting

### 4. Implemented Vote API Endpoint
- Added `HEAD` method to `/api/polls/[id]/vote` to check if user has voted
- Modified `POST` method to handle approval voting with `approvals` array
- Added logic to store approval votes in `vote_data` JSONB field

### 5. Fixed Poll Creation Integration
- Connected poll creation form to real `/api/polls` POST endpoint
- Updated success page to display actual poll ID from API response
- Fixed redirection to use real poll ID

### 6. Fixed Vote Submission Logic
- Updated `VotingInterface` to handle approval voting correctly
- Modified poll page `handleVote` function to not duplicate API calls
- Fixed approval voting to send `{ approvals: string[] }` instead of `{ choice: number }`

### 7. Fixed Database Function Issues
- Updated `is_admin` RPC function parameter from `p_user` to `input_user_id`
- Fixed all references to use correct parameter name
- Resolved "more than one row returned" error

## Current State

### What's Working
- Poll creation succeeds and returns valid UUID
- Test can extract poll ID from success page
- Dev server is running and accessible
- Other API endpoints work (e.g., `/api/polls` GET)

### What's Failing
- Navigation to `/polls/{pollId}` results in `net::ERR_ABORTED`
- This suggests the poll page is crashing or returning an error

## Key Files Modified

### API Endpoints
- `/Users/alaughingkitsune/src/Choices/web/app/api/polls/[id]/vote/route.ts`
  - Added approval voting logic
  - Fixed linter errors with undefined `response` variable
  - Added E2E bypass authentication

### Components
- `/Users/alaughingkitsune/src/Choices/web/features/voting/components/VotingInterface.tsx`
  - Added `handleApprovalVote` function
  - Fixed approval voting callback

- `/Users/alaughingkitsune/src/Choices/web/features/voting/components/ApprovalVoting.tsx`
  - Added test IDs for vote confirmation and selected options

- `/Users/alaughingkitsune/src/Choices/web/app/(app)/polls/[id]/page.tsx`
  - Added test IDs
  - Modified `handleVote` to not duplicate API calls

- `/Users/alaughingkitsune/src/Choices/web/app/(app)/polls/create/page.tsx`
  - Connected to real API endpoint
  - Fixed poll ID display and redirection

### Authentication
- `/Users/alaughingkitsune/src/Choices/web/lib/core/auth/require-user.ts`
  - Fixed `is_admin` RPC call parameter name

## Error Analysis

### The `net::ERR_ABORTED` Error
This error typically indicates:
1. The server is returning an error response (4xx/5xx)
2. The request is being aborted due to a timeout
3. There's a network connectivity issue
4. The page is crashing during server-side rendering

### Server Logs
- Dev server is running on port 3000
- Other endpoints work fine
- No visible error logs in terminal output

### Poll Page Investigation
The poll page (`/app/(app)/polls/[id]/page.tsx`) might be:
1. Crashing during server-side rendering
2. Having issues with data fetching
3. Encountering authentication problems
4. Having database connection issues

## Debugging Attempts

### 1. API Testing
- Tested vote API directly with curl - returns 500 error with "An unknown error occurred"
- Fixed linter errors that were causing compilation issues
- Restarted dev server multiple times

### 2. Error Handling
- Added comprehensive error handling to vote API
- Fixed generic error handler that was masking real errors
- Removed debugging code that might interfere

### 3. Authentication
- Fixed `is_admin` function parameter naming conflicts
- Ensured E2E bypass authentication works correctly

## Next Steps for Investigation

### 1. Check Poll Page Server-Side Rendering
- Add error boundaries to poll page
- Check if poll data fetching is working
- Verify database queries in poll page

### 2. Check Network Requests
- Use browser dev tools to see actual network requests
- Check if poll page is making failing API calls
- Verify authentication headers

### 3. Check Database State
- Verify the created poll exists in database
- Check if poll has correct structure
- Verify user permissions for poll access

### 4. Check Server Logs
- Look for server-side errors during poll page rendering
- Check for database connection issues
- Verify Supabase client configuration

## Environment Details
- **OS**: macOS 24.6.0
- **Node**: Latest
- **Next.js**: Latest
- **Supabase**: Local instance
- **Database**: PostgreSQL via Supabase
- **Test Framework**: Playwright

## Test Configuration
- **Base URL**: http://127.0.0.1:3000
- **Test ID Attribute**: `data-testid`
- **Storage State**: Pre-authenticated admin user
- **E2E Bypass**: Enabled with `x-e2e-bypass: 1` header

## Key Questions for Investigation
1. Why does the poll page return `net::ERR_ABORTED`?
2. Is the poll page crashing during server-side rendering?
3. Are there database connection issues?
4. Is the poll data being fetched correctly?
5. Are there authentication issues on the poll page?
6. Is the Supabase client configured correctly for the poll page?

## Files to Examine
1. `/Users/alaughingkitsune/src/Choices/web/app/(app)/polls/[id]/page.tsx` - Main poll page
2. `/Users/alaughingkitsune/src/Choices/web/app/api/polls/[id]/route.ts` - Poll data API
3. Server logs during test execution
4. Browser network tab during test execution
5. Database state after poll creation

This issue appears to be related to server-side rendering or data fetching on the poll page, rather than the approval voting logic itself.
