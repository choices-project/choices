# Redundant Analytics Endpoints Archive

**Archived:** January 27, 2025  
**Reason:** Replaced by unified analytics endpoint  
**Migration Target:** `/api/analytics/unified/[id]`

## Archived Endpoints

The following 12 redundant analytics endpoints have been archived and replaced by the unified analytics API:

### Individual Analytics Methods
- `comprehensive/[id]/route.ts` → `methods=comprehensive`
- `bot-detection/[id]/route.ts` → `methods=bot-detection`
- `sentiment/[id]/route.ts` → `methods=sentiment`
- `trust-tier-results/[id]/route.ts` → `methods=trust-tier`

### AI Provider Endpoints
- `hugging-face/[id]/route.ts` → `ai-provider=hugging-face`
- `colab/[id]/route.ts` → `ai-provider=colab`
- `local-ai/[id]/route.ts` → `ai-provider=local-ai`
- `ai-powered/[id]/route.ts` → `ai-provider=colab` (default)

### Specialized Endpoints
- `real-time/[id]/route.ts` → `analysis-window=1 hour`
- `sophisticated/[id]/route.ts` → `methods=comprehensive&ai-provider=colab`
- `events/route.ts` → Use unified endpoint with specific methods

### General Analytics
- `route.ts` → Use unified endpoint with `methods=comprehensive`

## Migration Guide

### Before (Old Endpoints)
```typescript
// Multiple separate calls
const sentiment = await fetch('/api/analytics/sentiment/poll-123');
const botDetection = await fetch('/api/analytics/bot-detection/poll-123');
const comprehensive = await fetch('/api/analytics/comprehensive/poll-123');
```

### After (Unified Endpoint)
```typescript
// Single unified call
const analytics = await fetch('/api/analytics/unified/poll-123?methods=sentiment,bot-detection,comprehensive&ai-provider=colab');
```

## Unified Analytics API Features

### Method Selection
- `methods=sentiment` - Sentiment analysis
- `methods=bot-detection` - Bot detection
- `methods=temporal` - Temporal analysis
- `methods=trust-tier` - Trust tier analysis
- `methods=geographic` - Geographic insights
- `methods=comprehensive` - All methods combined

### AI Provider Selection
- `ai-provider=colab` - Google Colab Pro (default)
- `ai-provider=hugging-face` - Hugging Face API
- `ai-provider=local-ai` - Local AI processing
- `ai-provider=rule-based` - Rule-based fallback

### Additional Parameters
- `trust-tiers=1,2,3` - Filter by trust tiers
- `analysis-window=24 hours` - Time window for analysis
- `cache=true` - Enable caching (default: true)

## Benefits of Unified Approach

1. **Single Endpoint**: One API for all analytics needs
2. **Intelligent Fallbacks**: Automatic fallback between AI providers
3. **Performance Optimization**: Built-in caching and query optimization
4. **Comprehensive Error Handling**: Detailed error reporting and recovery
5. **Rich Metadata**: Performance metrics and analysis details
6. **Flexible Configuration**: Method and provider selection
7. **Future-Proof**: Easy to add new methods and providers

## Example Usage

```typescript
// Get comprehensive analytics with Colab AI
const response = await fetch('/api/analytics/unified/poll-123?methods=comprehensive&ai-provider=colab');

// Get sentiment analysis with Hugging Face
const response = await fetch('/api/analytics/unified/poll-123?methods=sentiment&ai-provider=hugging-face');

// Get temporal analysis for specific trust tiers
const response = await fetch('/api/analytics/unified/poll-123?methods=temporal&trust-tiers=2,3');

// Get all analytics with custom time window
const response = await fetch('/api/analytics/unified/poll-123?methods=sentiment,bot-detection,temporal,trust-tier,geographic&analysis-window=7 days');
```

## Response Format

The unified endpoint returns a comprehensive response with:

```typescript
{
  success: boolean,
  poll_id: string,
  poll_question: string,
  analytics: {
    sentiment: { /* sentiment analysis results */ },
    bot_detection: { /* bot detection results */ },
    temporal: { /* temporal analysis results */ },
    // ... other methods
  },
  methods_requested: string[],
  methods_successful: string[],
  methods_failed: string[],
  errors?: { [method: string]: string },
  ai_provider: string,
  trust_tiers: number[],
  analysis_window: string,
  performance: {
    total_time_ms: number,
    method_times: { [method: string]: number },
    cache_enabled: boolean,
    cache_hits: number,
    query_optimization: boolean
  },
  metadata: {
    platform: 'choices',
    repository: 'https://github.com/choices-project/choices',
    live_site: 'https://choices-platform.vercel.app',
    api_version: '1.0.0',
    analysis_method: 'unified_comprehensive',
    timestamp: string
  }
}
```

## Notes

- All archived endpoints were functional but redundant
- The unified endpoint provides better performance and maintainability
- Migration should be straightforward with the examples above
- The unified endpoint includes all functionality from the archived endpoints
- Future analytics features should be added to the unified endpoint

