# Test Helpers Documentation

## Overview
This directory contains the comprehensive Supabase mock factory and testing utilities for unit tests, integration tests, and E2E tests. The testing philosophy is to guide how the system should work, not just conform to current state.

## Files
- `supabase-mock.ts` - Main mock factory with chaining support
- `supabase-when.ts` - when() DSL for 1-line test arrangements
- `arrange-helpers.ts` - Domain-specific helpers for common patterns
- `reset-mocks.ts` - Reset utilities for clean test isolation

## New Test Implementations

### Location Capture Testing
- **Unit Tests**: `tests/unit/location-resolver.test.ts` - Comprehensive location resolution testing
- **Database Tests**: `tests/unit/location-database.test.ts` - Database integration for location data
- **Privacy Tests**: `tests/unit/privacy-features.test.ts` - Privacy-first feature testing
- **Component Tests**: `tests/components/LocationSetupStep.test.tsx` - Location setup component testing
- **E2E Tests**: `tests/e2e/browser-location-capture.spec.ts` - Complete user journey testing

### Test Coverage Areas
- **Privacy Enforcement**: Coordinate quantization, HMAC hashing, k-anonymity
- **User Experience**: Error handling, fallback mechanisms, mobile compatibility
- **Data Integrity**: Database operations, consent tracking, data retention
- **Security**: Input validation, rate limiting, audit trails
- **Performance**: Network handling, database efficiency, user interactions

## Quick Start

```typescript
import { getMS } from '../setup';
import { arrangeFindById } from './arrange-helpers';
import { when, expectQueryState } from './supabase-when';

const { client, handles, getMetrics } = getMS();

// 1-line arrangement
arrangeFindById(handles, 'polls', 'poll-123', { id: 'poll-123', title: 'Test' });

// Execute code under test
const result = await client.from('polls').select('*').eq('id', 'poll-123').single();

// Assert
expect(result.data?.id).toBe('poll-123');
```

## When to Use single/maybeSingle/list

- **single()** - When you expect exactly one row (throws if 0 or >1)
- **maybeSingle()** - When you expect 0 or 1 row (returns null if 0)
- **list()** - When you expect 0 or more rows (always returns array)

## How to Assert with Metrics

```typescript
const m = getMetrics();
expect(m.byTable.polls?.single ?? 0).toBe(1);
expect(m.byTable.votes?.mutate ?? 0).toBe(1);
expect(m.counts.single).toBe(1);
```

## RPC Examples

```typescript
// Arrange
when(handles).rpc('count_votes', { poll_id: 'poll-123' }).returns({ total: 5 });

// Execute
const result = await client.rpc('count_votes', { poll_id: 'poll-123' });

// Assert
expect(result.data?.total).toBe(5);
```

## Reset Policy

- **Automatic**: `resetAllMocks()` and `resetMetrics()` run after each test
- **Manual**: Call `resetAllMocks(handles)` and `resetMetrics()` if needed
- **Global**: Keep `jest.clearAllMocks()` for other mocks (timers, fetch, etc.)

## Common Patterns

### Load by ID
```typescript
arrangeFindById(handles, 'polls', id, row);
await client.from('polls').select('*').eq('id', id).single();
```

### Insert
```typescript
when(handles).table('votes').op('insert').returnsList([{ id: 'v-1' }]);
await client.from('votes').insert(payload).list();
```

### Update with Filter
```typescript
when(handles).table('polls').op('update').eq('id', id).returnsList([{ id, total_votes: 1 }]);
await client.from('polls').update({ total_votes: 1 }).eq('id', id).list();
```

### Pagination/Sort
```typescript
when(handles).table('polls').select('*').order('created_at', { ascending: false }).range(0, 19).returnsList(rows);
await client.from('polls').select('*').order('created_at', { ascending: false }).range(0,19).list();
```

### Error Path
```typescript
when(handles).table('polls').select('*').eq('id', id).returnsError('not found','404');
await expect(
  client.from('polls').select('*').eq('id', id).throwOnError().single()
).rejects.toThrow(/not found/);
```

### No DB Calls (Rate Limiting)
```typescript
import { expectNoDBCalls } from './supabase-when';

// Code that should use cache only
expectNoDBCalls(handles);
```

### Only Specific Tables
```typescript
import { expectOnlyTablesCalled } from './supabase-when';

expectOnlyTablesCalled(handles, ['polls','votes']);
```

## Troubleshooting

### "single is not a function"
- Check for old mock leaks in the spec
- Ensure imports point to `@/tests/helpers/supabase-mock`
- Delete any local `from()` stubs

### Assertion didn't match
- DSL is first-in, first-matched
- Add multiple `when(...).returns...` entries for multiple calls
- Or use generic fallback: `handles.single.mockResolvedValue(okSingle(x))`

### Forgot terminal
- Code must call `.single()`, `.maybeSingle()`, or `.list()`
- Add terminal in prod code or adapt SUT abstraction

### RPC args mismatch
- DSL compares JSON strings
- Pass same normalized shape in both places







