# Frontend Best Practices Guide 🎨

**Version:** 1.0  
**Date:** November 6, 2025  
**Status:** ✅ PRODUCTION READY

---

## 📚 Table of Contents

1. [Quick Start](#quick-start)
2. [React Query Hooks](#react-query-hooks)
3. [Type-Safe API Calls](#type-safe-api-calls)
4. [Error Handling](#error-handling)
5. [Loading States](#loading-states)
6. [Form Handling](#form-handling)
7. [Caching Strategy](#caching-strategy)
8. [Examples](#examples)
9. [Common Patterns](#common-patterns)
10. [Anti-Patterns](#anti-patterns)

---

## Quick Start

### Installation

The API utilities and hooks are already installed. Just import and use!

### Basic Usage

```typescript
import { useProfile, useUpdateProfile } from '@/lib/hooks/useApi';

function MyComponent() {
  const { data: profile, isLoading, error } = useProfile();
  const updateProfile = useUpdateProfile();
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return <div>{profile.display_name}</div>;
}
```

That's it! No more manual fetch calls, loading states, or error handling.

---

## React Query Hooks

### Available Hooks

**Profile:**
```typescript
useProfile()                      // Get profile
useUpdateProfile()                // Update profile
useDeleteProfile()                // Delete profile
```

**Dashboard:**
```typescript
useDashboard()                    // Get dashboard data
```

**Polls:**
```typescript
usePolls(filters)                 // List polls
usePoll(id)                       // Get single poll
useVote()                         // Vote on poll
```

**Trending:**
```typescript
useTrendingPolls(limit)           // Trending polls
useTrendingHashtags(limit)        // Trending hashtags
```

**Feedback:**
```typescript
useSubmitFeedback()               // Submit feedback
useFeedbackList(filters)          // List feedback (admin)
```

**Health (Admin):**
```typescript
useHealth(type)                   // System health
```

**Utilities:**
```typescript
usePrefetch()                     // Prefetch data
useInvalidateQueries()            // Invalidate cache
```

### Hook Features

All hooks provide:
- ✅ **Automatic caching** - No duplicate requests
- ✅ **Loading states** - `isLoading`, `isPending`
- ✅ **Error handling** - `error` object
- ✅ **Type safety** - Full TypeScript support
- ✅ **Auto-refetch** - Configurable refetch on focus/interval
- ✅ **Cache invalidation** - Automatic updates

---

## Type-Safe API Calls

### With React Query (Recommended)

```typescript
import { useProfile } from '@/lib/hooks/useApi';

const { data: profile, isLoading, error } = useProfile();
// profile is typed as UserProfile!
```

### Without React Query

```typescript
import { get, post, patch, del, type Poll } from '@/lib/api';

// Type-safe GET
const polls = await get<Poll[]>('/api/polls');

// Type-safe POST
const newPoll = await post<Poll>('/api/polls', {
  title: 'New Poll',
  options: ['Yes', 'No']
});

// Type-safe PATCH
const updated = await patch<Poll>(`/api/polls/${id}`, {
  title: 'Updated'
});

// Type-safe DELETE
await del(`/api/polls/${id}`);
```

### Specialized Clients

```typescript
import { profileApi, dashboardApi, feedbackApi } from '@/lib/api';

// Profile
const profile = await profileApi.get();
await profileApi.update({ display_name: 'John' });
await profileApi.delete();

// Dashboard
const dashboard = await dashboardApi.get();
const dashboardNoCache = await dashboardApi.get(false);

// Feedback
await feedbackApi.submit({ type: 'bug', title: '...', ... });
const feedback = await feedbackApi.list({ status: 'open' });
```

---

## Error Handling

### With React Query

```typescript
const { data, error } = useProfile();

if (error instanceof ApiError) {
  if (error.isAuthError()) {
    // Redirect to login
  } else if (error.isValidationError()) {
    // Show validation errors
  } else if (error.isNotFoundError()) {
    // Show not found
  }
}
```

### With Mutations

```typescript
const updateProfile = useUpdateProfile({
  onSuccess: () => {
    toast.success('Profile updated!');
  },
  onError: (error) => {
    if (error.isAuthError()) {
      router.push('/login');
    } else {
      toast.error(error.message);
    }
  }
});
```

### With Direct API Calls

```typescript
import { get, ApiError } from '@/lib/api';

try {
  const data = await get('/api/resource');
} catch (error) {
  if (error instanceof ApiError) {
    // Type-safe error handling
    console.log(error.status);    // 404, 500, etc.
    console.log(error.code);       // 'NOT_FOUND', 'SERVER_ERROR', etc.
    console.log(error.details);    // Additional error details
    
    // Check error type
    if (error.isAuthError()) { /* 401 */ }
    if (error.isForbiddenError()) { /* 403 */ }
    if (error.isNotFoundError()) { /* 404 */ }
    if (error.isValidationError()) { /* 400 + VALIDATION_ERROR */ }
    if (error.isRateLimitError()) { /* 429 */ }
    if (error.isServerError()) { /* 500+ */ }
  }
}
```

---

## Loading States

### Queries (useQuery)

```typescript
const { data, isLoading, isFetching, isError } = useProfile();

// isLoading: First load (no cached data)
// isFetching: Any fetch (including background refetch)
// isError: Query failed

if (isLoading) return <Skeleton />;
if (isError) return <Error />;
return <Content data={data} />;
```

### Mutations (useMutation)

```typescript
const updateProfile = useUpdateProfile();

// isPending: Mutation in progress
// isSuccess: Mutation succeeded
// isError: Mutation failed

<button disabled={updateProfile.isPending}>
  {updateProfile.isPending ? 'Saving...' : 'Save'}
</button>
```

### Loading Skeletons

```typescript
if (isLoading) {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
    </div>
  );
}
```

---

## Form Handling

### Simple Form

```typescript
function ProfileForm() {
  const [name, setName] = useState('');
  const updateProfile = useUpdateProfile();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile.mutateAsync({ display_name: name });
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <button disabled={updateProfile.isPending}>
        {updateProfile.isPending ? 'Saving...' : 'Save'}
      </button>
    </form>
  );
}
```

### Complex Form with Validation

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  display_name: z.string().min(2).max(100),
  bio: z.string().max(500),
});

type FormData = z.infer<typeof schema>;

function ProfileForm() {
  const updateProfile = useUpdateProfile();
  
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema)
  });
  
  const onSubmit = async (data: FormData) => {
    try {
      await updateProfile.mutateAsync(data);
      toast.success('Profile updated!');
    } catch (error) {
      // Error handled by mutation's onError
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('display_name')} />
      {errors.display_name && <span>{errors.display_name.message}</span>}
      
      <textarea {...register('bio')} />
      {errors.bio && <span>{errors.bio.message}</span>}
      
      <button type="submit" disabled={updateProfile.isPending}>
        Save
      </button>
    </form>
  );
}
```

---

## Caching Strategy

### Default Cache Times

```typescript
// Profile: 5 minutes
useProfile() // staleTime: 5 * 60 * 1000

// Dashboard: 5 minutes
useDashboard() // staleTime: 5 * 60 * 1000

// Polls: Default (immediate refetch on mount)
usePolls()

// Health monitoring: Auto-refresh every 30s
useHealth('database') // refetchInterval: 30000
```

### Custom Cache Configuration

```typescript
// Longer cache time
const { data } = useProfile({
  staleTime: 15 * 60 * 1000, // 15 minutes
});

// Disable cache
const { data } = useProfile({
  staleTime: 0,
  cacheTime: 0,
});

// Background refetch
const { data } = usePolls({
  refetchInterval: 60000, // Refetch every 60s
  refetchOnWindowFocus: true, // Refetch when tab regains focus
});
```

### Manual Cache Invalidation

```typescript
import { useInvalidateQueries } from '@/lib/hooks/useApi';

const { invalidateProfile, invalidateDashboard, invalidateAll } = useInvalidateQueries();

// Invalidate specific query
invalidateProfile();

// Invalidate all queries
invalidateAll();
```

### Prefetching for Better UX

```typescript
import { usePrefetch } from '@/lib/hooks/useApi';

const prefetch = usePrefetch();

// Prefetch on hover for instant navigation
<Link 
  href="/profile"
  onMouseEnter={() => prefetch.profile()}
>
  Profile
</Link>
```

---

## Examples

### Example 1: Profile Page

See: `/lib/examples/ProfileExample.tsx`

Features:
- Get profile with automatic caching
- Update profile with cache update
- Delete profile with cache cleanup
- Error handling with auth redirect
- Loading states

### Example 2: Polls Page

See: `/lib/examples/PollsExample.tsx`

Features:
- List polls with filters
- Get single poll conditionally
- Vote with automatic refetch
- Filter changes trigger new queries
- Loading skeletons

### Example 3: Admin Dashboard

See: `/lib/examples/AdminExample.tsx`

Features:
- Multiple parallel queries
- Auto-refresh health every 30s
- Background refetching
- Loading skeletons
- Combined loading/error states

---

## Common Patterns

### Pattern 1: List with Filters

```typescript
function PollsList() {
  const [status, setStatus] = useState<'active' | 'all'>('active');
  
  const { data: polls = [] } = usePolls({
    status: status === 'active' ? 'active' : undefined,
    limit: 20
  });
  
  return (
    <>
      <FilterButtons onChange={setStatus} />
      <PollsList polls={polls} />
    </>
  );
}
```

### Pattern 2: Optimistic Updates

```typescript
const updateProfile = useUpdateProfile({
  // Update UI immediately (optimistic)
  onMutate: async (newData) => {
    await queryClient.cancelQueries({ queryKey: queryKeys.profile });
    const previousData = queryClient.getQueryData(queryKeys.profile);
    queryClient.setQueryData(queryKeys.profile, newData);
    return { previousData };
  },
  // Rollback on error
  onError: (err, newData, context) => {
    queryClient.setQueryData(queryKeys.profile, context?.previousData);
  },
  // Refetch after success
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.profile });
  },
});
```

### Pattern 3: Dependent Queries

```typescript
// Get user profile first
const { data: profile } = useProfile();

// Then get user's polls (only when we have userId)
const { data: polls } = usePolls(
  { userId: profile?.user_id },
  { enabled: !!profile?.user_id } // Only run when profile exists
);
```

### Pattern 4: Infinite Scroll

```typescript
import { useInfiniteQuery } from '@tanstack/react-query';

const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = useInfiniteQuery({
  queryKey: ['polls', 'infinite'],
  queryFn: async ({ pageParam = 0 }) => {
    return await get(`/api/polls?offset=${pageParam}&limit=20`);
  },
  getNextPageParam: (lastPage, pages) => {
    return lastPage.hasMore ? pages.length * 20 : undefined;
  },
});

// Render
{data?.pages.map((page) =>
  page.data.map((poll) => <PollCard key={poll.id} poll={poll} />)
)}

{hasNextPage && (
  <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
    {isFetchingNextPage ? 'Loading...' : 'Load More'}
  </button>
)}
```

### Pattern 5: Prefetching on Hover

```typescript
import { usePrefetch } from '@/lib/hooks/useApi';

function Navigation() {
  const prefetch = usePrefetch();
  
  return (
    <nav>
      <Link 
        href="/profile" 
        onMouseEnter={() => prefetch.profile()}
      >
        Profile
      </Link>
      <Link 
        href="/dashboard" 
        onMouseEnter={() => prefetch.dashboard()}
      >
        Dashboard
      </Link>
    </nav>
  );
}
```

---

## Anti-Patterns

### ❌ DON'T: Manual Fetch Calls

```typescript
// ❌ BAD
const [data, setData] = useState(null);
const [loading, setLoading] = useState(false);

useEffect(() => {
  setLoading(true);
  fetch('/api/profile')
    .then(res => res.json())
    .then(data => setData(data))
    .finally(() => setLoading(false));
}, []);
```

```typescript
// ✅ GOOD
const { data, isLoading } = useProfile();
```

### ❌ DON'T: Ignore Error Types

```typescript
// ❌ BAD
catch (error) {
  alert('Error occurred');
}
```

```typescript
// ✅ GOOD
catch (error) {
  if (error instanceof ApiError) {
    if (error.isAuthError()) {
      router.push('/login');
    } else {
      alert(error.message);
    }
  }
}
```

### ❌ DON'T: Manual Cache Management

```typescript
// ❌ BAD
const [profile, setProfile] = useState(null);

await updateProfile();
const newProfile = await fetch('/api/profile');
setProfile(newProfile);
```

```typescript
// ✅ GOOD
const updateProfile = useUpdateProfile();
// Cache automatically updated after mutation
await updateProfile.mutateAsync(data);
```

### ❌ DON'T: Fetch Same Data Multiple Times

```typescript
// ❌ BAD
function Component1() {
  const [data, setData] = useState(null);
  useEffect(() => { fetch('/api/profile')... }, []);
}

function Component2() {
  const [data, setData] = useState(null);
  useEffect(() => { fetch('/api/profile')... }, []);
}
```

```typescript
// ✅ GOOD - React Query shares cache!
function Component1() {
  const { data } = useProfile();
}

function Component2() {
  const { data } = useProfile(); // Uses same cached data!
}
```

---

## Quick Reference Card

### Imports

```typescript
// Hooks (recommended)
import { 
  useProfile, 
  useUpdateProfile, 
  usePolls,
  useVote,
  useDashboard 
} from '@/lib/hooks/useApi';

// Direct API calls (when needed)
import { get, post, patch, del, ApiError } from '@/lib/api';

// Types
import type { UserProfile, Poll, Feedback } from '@/lib/api';
```

### Basic Pattern

```typescript
// Query (GET)
const { data, isLoading, error, refetch } = useResource();

// Mutation (POST/PUT/PATCH/DELETE)
const mutate = useMutateResource({
  onSuccess: () => { /* ... */ },
  onError: (error) => { /* ... */ }
});

await mutate.mutateAsync(data);
```

### Error Checking

```typescript
if (error instanceof ApiError) {
  error.status              // HTTP status code
  error.message             // Error message
  error.code                // Error code (e.g., 'VALIDATION_ERROR')
  error.details             // Additional details
  
  error.isAuthError()       // 401
  error.isForbiddenError()  // 403
  error.isNotFoundError()   // 404
  error.isValidationError() // 400 + VALIDATION_ERROR
  error.isRateLimitError()  // 429
  error.isServerError()     // 500+
}
```

---

## Performance Tips

### 1. Use Prefetching

```typescript
// Prefetch on hover
<Link onMouseEnter={() => prefetch.profile()}>

// Prefetch on page load
useEffect(() => {
  prefetch.dashboard();
}, []);
```

### 2. Optimize Render

```typescript
// Only re-render when specific fields change
const { data: profile } = useProfile({
  select: (data) => ({
    name: data.profile.display_name,
    email: data.profile.email
  })
});
```

### 3. Disable Unnecessary Fetches

```typescript
const { data } = usePolls(undefined, {
  enabled: isTabActive, // Only fetch when tab is active
});
```

### 4. Batch Updates

```typescript
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();

// Update multiple caches at once
queryClient.setQueriesData({ queryKey: ['polls'] }, (old) => {
  // Update logic
});
```

---

## Testing

### Testing Components with React Query

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';

test('renders profile', async () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });
  
  render(
    <QueryClientProvider client={queryClient}>
      <ProfileComponent />
    </QueryClientProvider>
  );
  
  await waitFor(() => {
    expect(screen.getByText(/John Doe/)).toBeInTheDocument();
  });
});
```

### Mocking API Responses

```typescript
import { get } from '@/lib/api';

jest.mock('@/lib/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

test('handles error', async () => {
  (get as jest.Mock).mockRejectedValue(
    new ApiError('Not found', 404, 'NOT_FOUND')
  );
  
  render(<Component />);
  
  await waitFor(() => {
    expect(screen.getByText(/Error: Not found/)).toBeInTheDocument();
  });
});
```

---

## Checklist for New Components

When creating a new component:

- [ ] Import hooks from `@/lib/hooks/useApi` instead of using fetch
- [ ] Import types from `@/lib/api`
- [ ] Handle loading state with `isLoading`
- [ ] Handle error state with `error`
- [ ] Use ApiError type guards for error handling
- [ ] Add loading skeleton for better UX
- [ ] Configure appropriate staleTime for caching
- [ ] Add prefetching for critical paths
- [ ] Test with React Query wrapper

---

## Migration Checklist

Converting old components:

- [ ] Replace `useState` + `useEffect` + `fetch` with hooks
- [ ] Remove manual loading state management
- [ ] Remove manual error handling
- [ ] Add types from `@/lib/api`
- [ ] Use ApiError for error checking
- [ ] Remove manual cache updates
- [ ] Test the component
- [ ] Remove old code

---

## Resources

**Documentation:**
- `/lib/hooks/useApi.ts` - All hooks
- `/lib/api/client.ts` - API client
- `/lib/api/types.ts` - TypeScript types
- `API_STANDARDS.md` - API standards

**Examples:**
- `/lib/examples/ProfileExample.tsx` - Profile management
- `/lib/examples/PollsExample.tsx` - Polls and voting
- `/lib/examples/AdminExample.tsx` - Admin dashboard
- `/lib/examples/FeedbackExample.tsx` - Feedback widget

**External:**
- [React Query Docs](https://tanstack.com/query/latest/docs/react/overview)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## Support

**Need help?**

1. Check this guide first
2. Look at example components
3. Check React Query docs
4. Ask the team

**Found a bug?**

1. Check if API endpoint is working
2. Check React Query DevTools
3. Check browser console
4. File a bug report

---

**Last Updated:** November 6, 2025  
**Maintained By:** Development Team  
**Version:** 1.0

**Happy coding!** 🎉

