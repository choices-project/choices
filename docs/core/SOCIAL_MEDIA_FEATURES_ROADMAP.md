**Last Updated**: 2025-09-17
**Last Updated**: 2025-09-17
# Social Media Features Roadmap
**Last Updated**: 2025-09-17

**Project:** Choices - Democratic Engagement Platform  
**Created:** December 19, 2024  
**Status:** Planning Phase  
**Approach:** Staged MVP with clean interfaces and privacy-first design  

## 🎯 **Executive Summary**

Transform Choices into a social platform that builds trust, context, and activation around democratic engagement. Start with engagement metrics and a clean coordinator, defer complex graph analytics and ML moderation, and maintain strict TypeScript discipline throughout.

**Core Value Proposition:**
- **Context:** Show users how their community engages with candidates
- **Trust:** Transparent engagement metrics and moderation
- **Activation:** Social features that drive democratic participation

---

## 📊 **Impact vs Effort Analysis**

| Feature | Impact | Effort | Priority | Timeline |
|---------|--------|--------|----------|----------|
| **Engagement Metrics** | 🔥 High | 🟡 Low/Med | P0 | Week 1-2 |
| **SocialFeaturesManager** | 🟡 Medium | 🟢 Low | P0 | Week 1 |
| **Basic Moderation** | 🟡 Medium | 🟡 Medium | P1 | Week 2-3 |
| **Social Graph Analytics** | 🔥 High | 🔴 High | P2 | Month 2+ |
| **Automated Moderation** | 🟡 Medium | 🔴 High | P3 | Month 3+ |

---

## 🏗️ **Implementation Phases**

### **Phase 0: Foundations (1-2 days)**
*Clean interfaces, feature flags, RSC hygiene*

#### **Files to Create:**
```
lib/social/
├── engagement-metrics.ts    # Event tracking & aggregation
├── social-graph.ts         # Network analysis (stubbed)
├── content-moderation.ts   # Moderation queue (basic)
├── social-features.ts      # Central coordinator
├── events.ts              # Wire→model transformations
├── ingest.ts              # Event recording
└── aggregations.ts        # Metrics calculation
```

#### **Configuration:**
```typescript
// lib/config/social.ts
export const socialConfig = {
  features: {
    engagementMetrics: process.env.SOCIAL_ENGAGEMENT_ENABLED === 'true',
    socialGraph: process.env.SOCIAL_GRAPH_ENABLED === 'true',
    contentModeration: process.env.SOCIAL_MODERATION_ENABLED === 'true',
    viralDetection: process.env.SOCIAL_VIRAL_ENABLED === 'true'
  },
  limits: {
    maxEngagementsPerUser: 1000,
    maxEngagementsPerHour: 100,
    cacheTimeout: 300 // seconds
  }
} as const;
```

#### **RSC Hygiene:**
- Keep all social logic server-first
- Dynamic import charts/visuals only
- No re-export of icons or heavy dependencies
- Respect split barrels (`@/components/ui` vs `@/components/ui/client`)

---

### **Phase 1: Event Backbone (Week 1)**
*The "one thing" to get right - clean event logging*

#### **Database Schema:**
```sql
-- Raw immutable events (append-only)
CREATE TABLE social_engagements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  poll_id UUID NOT NULL,
  candidate_id UUID,
  action VARCHAR(20) NOT NULL CHECK (action IN ('view', 'vote', 'share', 'discuss')),
  score DECIMAL(3,2) DEFAULT 1.0,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes for performance
  INDEX idx_social_engagements_poll_created (poll_id, created_at),
  INDEX idx_social_engagements_user_created (user_id, created_at),
  INDEX idx_social_engagements_action (action)
);

-- Aggregated metrics (updated by jobs)
CREATE TABLE engagement_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL,
  candidate_id UUID,
  time_window VARCHAR(20) NOT NULL, -- 'hour', 'day', 'week', 'month'
  total_engagements INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,4) DEFAULT 0,
  average_score DECIMAL(3,2) DEFAULT 0,
  top_actions JSONB,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(poll_id, candidate_id, time_window)
);
```

#### **Event Model (Wire → Model):**
```typescript
// lib/social/events.ts
export type EngagementEventWire = {
  userId?: string | null;
  pollId?: string | null;
  candidateId?: string | null;
  action?: 'view' | 'vote' | 'share' | 'discuss' | null;
  score?: number | null;
  metadata?: Record<string, unknown> | null;
};

export type EngagementEvent = {
  userId: string;
  pollId: string;
  action: 'view' | 'vote' | 'share' | 'discuss';
  candidateId?: string;
  score?: number;
  metadata?: Record<string, unknown>;
};

import { withOptional } from '@/lib/util/objects';
import { assertPresent } from '@/lib/util/guards';

export function toEngagementEvent(w: EngagementEventWire): EngagementEvent {
  assertPresent(w?.userId, 'userId');
  assertPresent(w?.pollId, 'pollId');
  assertPresent(w?.action, 'action');
  
  return withOptional(
    { userId: w.userId!, pollId: w.pollId!, action: w.action! },
    { 
      candidateId: w.candidateId ?? null, 
      score: w.score ?? null, 
      metadata: w.metadata ?? null 
    }
  ) as EngagementEvent;
}
```

#### **Event Recording:**
```typescript
// lib/social/ingest.ts
import { createClient } from '@/lib/db/supabase';
import { toEngagementEvent } from './events';

export async function recordEngagement(wire: EngagementEventWire): Promise<void> {
  const ev = toEngagementEvent(wire);
  const supabase = createClient();
  
  const { error } = await supabase
    .from('social_engagements')
    .insert(ev);
    
  if (error) throw error;
}

// Rate limiting wrapper
export async function recordEngagementWithLimit(
  wire: EngagementEventWire,
  userId: string
): Promise<void> {
  // Check rate limits
  const recentCount = await getRecentEngagements(userId, '1 hour');
  if (recentCount >= socialConfig.limits.maxEngagementsPerHour) {
    throw new Error('Rate limit exceeded');
  }
  
  await recordEngagement(wire);
}
```

---

### **Phase 2: Metrics + Insights (Week 2)**
*Server jobs first, UI later*

#### **Aggregation Jobs:**
```typescript
// lib/social/aggregations.ts
export async function updatePollAggregates(pollId: string): Promise<void> {
  const supabase = createClient();
  
  // Get raw events for this poll
  const { data: events } = await supabase
    .from('social_engagements')
    .select('*')
    .eq('poll_id', pollId)
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
    
  if (!events) return;
  
  // Calculate metrics
  const totalEngagements = events.length;
  const engagementRate = await calculateEngagementRate(pollId);
  const averageScore = events.reduce((sum, e) => sum + (e.score || 1), 0) / totalEngagements;
  const topActions = getTopActions(events);
  
  // Upsert aggregated metrics
  const { error } = await supabase
    .from('engagement_metrics')
    .upsert({
      poll_id: pollId,
      time_window: 'day',
      total_engagements: totalEngagements,
      engagement_rate: engagementRate,
      average_score: averageScore,
      top_actions: topActions,
      calculated_at: new Date().toISOString()
    });
    
  if (error) throw error;
}
```

#### **UI Integration:**
```typescript
// app/polls/[id]/social-insights/page.tsx
import { EngagementMetricsCalculator } from '@/lib/social/engagement-metrics';
import { SocialInsightsCard } from '@/components/social/social-insights-card';

export default async function SocialInsightsPage({ params }: { params: { id: string } }) {
  const insights = await EngagementMetricsCalculator.getPollInsights(params.id);
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Social Insights</h1>
      <SocialInsightsCard insights={insights} />
    </div>
  );
}
```

---

### **Phase 3: Basic Moderation (Week 2-3)**
*Human-first, automated heuristics later*

#### **Moderation Queue:**
```typescript
// lib/social/content-moderation.ts
export class ContentModerator {
  static async flagContent(
    contentId: string, 
    contentType: 'discussion' | 'comment' | 'poll',
    reason: string,
    userId: string
  ): Promise<void> {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('moderation_queue')
      .insert({
        content_id: contentId,
        content_type: contentType,
        reason,
        flagged_by: userId,
        priority: this.calculatePriority(reason),
        created_at: new Date().toISOString()
      });
      
    if (error) throw error;
  }
  
  static async getModerationQueue(): Promise<ModerationQueueItem[]> {
    const supabase = createClient();
    
    const { data } = await supabase
      .from('moderation_queue')
      .select('*')
      .eq('status', 'pending')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true });
      
    return data || [];
  }
}
```

#### **Simple Heuristics:**
```typescript
// lib/social/heuristics.ts
export class ModerationHeuristics {
  static async shouldFlagContent(content: string, userId: string): Promise<boolean> {
    // Simple rules for now
    const bannedTerms = ['spam', 'scam', 'fake'];
    const hasBannedTerms = bannedTerms.some(term => 
      content.toLowerCase().includes(term)
    );
    
    if (hasBannedTerms) return true;
    
    // Check for rapid posting
    const recentPosts = await getRecentPostsByUser(userId, '1 hour');
    if (recentPosts.length > 10) return true;
    
    return false;
  }
}
```

---

### **Phase 4: Social Graph (Month 2+)**
*Defer heavy math, start bipartite*

#### **Bipartite Graph Approach:**
```typescript
// lib/social/social-graph.ts
export class SocialGraphBuilder {
  static async buildUserSimilarity(userId: string): Promise<UserSimilarity[]> {
    // Use Jaccard similarity on poll/candidate sets
    const userEngagements = await getUserEngagements(userId);
    const allUsers = await getAllUsers();
    
    const similarities = allUsers
      .filter(u => u.id !== userId)
      .map(otherUser => ({
        userId: otherUser.id,
        similarity: this.calculateJaccardSimilarity(
          userEngagements, 
          otherUser.engagements
        )
      }))
      .filter(s => s.similarity > 0.1)
      .sort((a, b) => b.similarity - a.similarity);
      
    return similarities;
  }
  
  private static calculateJaccardSimilarity(
    set1: string[], 
    set2: string[]
  ): number {
    const intersection = set1.filter(x => set2.includes(x)).length;
    const union = new Set([...set1, ...set2]).size;
    return intersection / union;
  }
}
```

---

### **Phase 5: Coordinator (Week 3)**
*Wire everything behind one facade*

```typescript
// lib/social/social-features.ts
export class SocialFeaturesManager {
  static async getSocialInsights(pollId: string): Promise<SocialInsights> {
    const [engagement, discussions, viralSignals] = await Promise.all([
      EngagementMetricsCalculator.getPollEngagement(pollId),
      SocialDiscoveryEngine.getPollDiscussions(pollId),
      ViralMomentDetector.detectViralMoments(pollId)
    ]);
    
    return {
      pollId,
      engagement,
      discussions,
      viralSignals,
      generatedAt: new Date()
    };
  }
  
  static async getSocialRecommendations(userId: string): Promise<SocialRecommendations> {
    // Combine engagement patterns, similar users, and trending content
    const [similarUsers, trendingPolls, userEngagements] = await Promise.all([
      SocialGraphBuilder.buildUserSimilarity(userId),
      ViralMomentDetector.getTrendingPolls(),
      EngagementMetricsCalculator.getUserEngagementProfile(userId)
    ]);
    
    return {
      userId,
      similarUsers: similarUsers.slice(0, 5),
      trendingPolls: trendingPolls.slice(0, 3),
      personalizedCandidates: this.getPersonalizedCandidates(userEngagements),
      generatedAt: new Date()
    };
  }
}
```

---

## 🔒 **Privacy, Safety & Policy**

### **Row Level Security (RLS):**
```sql
-- Social engagements table
ALTER TABLE social_engagements ENABLE ROW LEVEL SECURITY;

-- Users can only see their own engagements
CREATE POLICY "Users can view own engagements" ON social_engagements
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can see all engagements
CREATE POLICY "Admins can view all engagements" ON social_engagements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Engagement metrics are readable by all (aggregated data)
CREATE POLICY "Engagement metrics are public" ON engagement_metrics
  FOR SELECT USING (true);
```

### **PII Minimization:**
- Store only engagement IDs, not raw content
- Hash user identifiers for analytics
- Keep detailed logs for admins only
- Implement data retention policies

### **Consent & Transparency:**
```typescript
// components/social/consent-notice.tsx
export function SocialConsentNotice() {
  return (
    <div className="bg-blue-50 p-4 rounded-lg">
      <p className="text-sm text-blue-800">
        We track anonymous engagement to improve recommendations and show community insights. 
        <Link href="/privacy" className="underline">Learn more</Link>
      </p>
    </div>
  );
}
```

### **Rate Limiting:**
```typescript
// lib/social/rate-limits.ts
export class RateLimiter {
  static async checkEngagementLimit(userId: string): Promise<boolean> {
    const recent = await getRecentEngagements(userId, '1 hour');
    return recent.length < socialConfig.limits.maxEngagementsPerHour;
  }
  
  static async checkPostingLimit(userId: string): Promise<boolean> {
    const recent = await getRecentPosts(userId, '1 hour');
    return recent.length < 5; // Max 5 posts per hour
  }
}
```

---

## ⚡ **Performance & Cost**

### **Caching Strategy:**
```typescript
// lib/social/cache.ts
export class SocialCache {
  static async getPollInsights(pollId: string): Promise<SocialInsights | null> {
    const cacheKey = `poll-insights:${pollId}`;
    const cached = await redis.get(cacheKey);
    return cached ? JSON.parse(cached) : null;
  }
  
  static async setPollInsights(pollId: string, insights: SocialInsights): Promise<void> {
    const cacheKey = `poll-insights:${pollId}`;
    await redis.setex(cacheKey, 300, JSON.stringify(insights)); // 5 min cache
  }
}
```

### **Database Optimization:**
```sql
-- Indexes for performance
CREATE INDEX CONCURRENTLY idx_social_engagements_poll_created 
  ON social_engagements (poll_id, created_at DESC);

CREATE INDEX CONCURRENTLY idx_social_engagements_user_created 
  ON social_engagements (user_id, created_at DESC);

CREATE INDEX CONCURRENTLY idx_engagement_metrics_poll_window 
  ON engagement_metrics (poll_id, time_window);

-- Materialized view for real-time insights
CREATE MATERIALIZED VIEW poll_engagement_summary AS
SELECT 
  poll_id,
  COUNT(*) as total_engagements,
  COUNT(DISTINCT user_id) as unique_users,
  AVG(score) as average_score,
  DATE_TRUNC('hour', created_at) as hour_bucket
FROM social_engagements
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY poll_id, hour_bucket;

-- Refresh every hour
CREATE OR REPLACE FUNCTION refresh_engagement_summary()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY poll_engagement_summary;
END;
$$ LANGUAGE plpgsql;
```

### **Bundle Size Management:**
```typescript
// Dynamic imports for heavy components
const SocialInsightsChart = dynamic(
  () => import('@/components/social/social-insights-chart'),
  { ssr: false }
);

const ModerationQueue = dynamic(
  () => import('@/components/admin/moderation-queue'),
  { ssr: false }
);
```

---

## 🧪 **Testing Strategy**

### **Unit Tests:**
```typescript
// lib/social/__tests__/events.test.ts
describe('toEngagementEvent', () => {
  test('should transform wire to model correctly', () => {
    const wire: EngagementEventWire = {
      userId: 'user-123',
      pollId: 'poll-456',
      action: 'vote',
      candidateId: 'candidate-789',
      score: 1.5
    };
    
    const event = toEngagementEvent(wire);
    
    expect(event).toEqual({
      userId: 'user-123',
      pollId: 'poll-456',
      action: 'vote',
      candidateId: 'candidate-789',
      score: 1.5
    });
  });
  
  test('should handle null optional fields', () => {
    const wire: EngagementEventWire = {
      userId: 'user-123',
      pollId: 'poll-456',
      action: 'view',
      candidateId: null,
      score: null
    };
    
    const event = toEngagementEvent(wire);
    
    expect(event.candidateId).toBeUndefined();
    expect(event.score).toBeUndefined();
  });
});
```

### **Integration Tests:**
```typescript
// lib/social/__tests__/social-features.test.ts
describe('SocialFeaturesManager', () => {
  test('should return stable contract with empty data', async () => {
    const insights = await SocialFeaturesManager.getSocialInsights('empty-poll');
    
    expect(insights).toMatchObject({
      pollId: 'empty-poll',
      engagement: expect.any(Object),
      discussions: expect.any(Array),
      viralSignals: expect.any(Array),
      generatedAt: expect.any(Date)
    });
  });
});
```

---

## 🚀 **Deployment Strategy**

### **Feature Flags:**
```typescript
// lib/config/feature-flags.ts
export const featureFlags = {
  socialEngagement: process.env.FEATURE_SOCIAL_ENGAGEMENT === 'true',
  socialGraph: process.env.FEATURE_SOCIAL_GRAPH === 'true',
  contentModeration: process.env.FEATURE_CONTENT_MODERATION === 'true',
  viralDetection: process.env.FEATURE_VIRAL_DETECTION === 'true'
} as const;
```

### **Gradual Rollout:**
1. **Week 1:** Deploy with feature flags disabled
2. **Week 2:** Enable for 10% of users
3. **Week 3:** Enable for 50% of users
4. **Week 4:** Full rollout

### **Monitoring:**
```typescript
// lib/social/monitoring.ts
export class SocialMonitoring {
  static async trackEngagementEvent(event: EngagementEvent): Promise<void> {
    // Send to analytics
    await analytics.track('social_engagement', {
      action: event.action,
      pollId: event.pollId,
      userId: event.userId
    });
  }
  
  static async trackModerationAction(action: ModerationAction): Promise<void> {
    await analytics.track('moderation_action', {
      action: action.action,
      contentType: action.contentType,
      moderatorId: action.moderatorId
    });
  }
}
```

---

## ❓ **Questions for AI Assessment**

### **Technical Questions:**
1. **Database Design:** Should we use Supabase's real-time features for live engagement updates, or stick with polling/caching?

2. **Graph Analytics:** For the bipartite graph approach, should we use a dedicated graph database (Neo4j) or stick with Postgres with proper indexing?

3. **ML Integration:** When we get to automated moderation, should we build our own models or integrate with existing services (OpenAI, Perspective API)?

4. **Caching Strategy:** Should we use Redis, Supabase KV, or in-memory caching for engagement metrics?

### **Product Questions:**
1. **Engagement Scoring:** How should we weight different engagement types? (vote=1.0, share=0.8, view=0.3, discuss=0.6)

2. **Privacy Boundaries:** What level of user similarity should we expose? Should users see "People like you also voted for X"?

3. **Moderation Scope:** Should we moderate all content or just user-generated content (discussions, comments)?

4. **Viral Detection:** What constitutes "viral" in a civic context? High engagement rate? Rapid growth? Cross-demographic appeal?

### **Business Questions:**
1. **Monetization:** Should social features be free for all users or premium for advanced insights?

2. **Data Export:** Should users be able to export their engagement data for transparency?

3. **Third-party Integration:** Should we integrate with external social platforms (Twitter, Facebook) for cross-platform insights?

4. **Analytics Dashboard:** Should we provide analytics dashboards for candidates/campaigns?

---

## 📋 **Success Metrics**

### **Technical Metrics:**
- **Performance:** < 200ms response time for social insights
- **Reliability:** 99.9% uptime for engagement tracking
- **Scalability:** Support 10,000+ concurrent users
- **Bundle Size:** < 50KB additional bundle size

### **Product Metrics:**
- **Engagement:** 20% increase in poll participation
- **Retention:** 15% improvement in user retention
- **Quality:** < 1% of content flagged for moderation
- **Satisfaction:** > 4.0/5.0 user satisfaction with social features

### **Business Metrics:**
- **Growth:** 25% increase in new user signups
- **Revenue:** 10% increase in premium subscriptions
- **Trust:** 90% of users comfortable with data usage
- **Impact:** 30% increase in civic engagement

---

## 🎯 **Next Steps**

1. **Review & Approve:** Get stakeholder approval on this roadmap
2. **Technical Spike:** Build a proof-of-concept for engagement tracking
3. **Database Setup:** Create the initial schema and RLS policies
4. **Feature Flags:** Implement the configuration system
5. **Phase 0:** Create the foundation files and interfaces
6. **Phase 1:** Implement event backbone and basic tracking
7. **Iterate:** Build, test, and refine based on user feedback

---

**Ready for implementation?** This roadmap provides a clear path from MVP to full social platform while maintaining code quality, performance, and user trust. Let's build something amazing! 🚀
