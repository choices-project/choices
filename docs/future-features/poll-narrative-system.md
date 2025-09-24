# Poll Narrative System

**Created**: December 19, 2024  
**Updated**: December 19, 2024  
**Status**: ⚠️ Feature Flagged (Not MVP Ready)

## Overview

The Poll Narrative System is an advanced AI-powered feature that transforms polls into educational narratives with community-moderated facts. This system creates story-driven polls that provide context, verified information, and educational content to help users make informed decisions.

## Current Implementation Status

### ⚠️ **Feature Flagged for MVP**

**Feature Flag**: `POLL_NARRATIVE_SYSTEM: false`  
**Reason**: Not MVP ready - requires advanced AI integration and community moderation  
**Status**: Disabled by default, requires explicit enablement

### 📁 **Related Files**

#### **Core Implementation**
- **`/web/dev/lib/poll-narrative-system.ts`** - Main service class and business logic
- **`/web/lib/core/feature-flags.ts`** - Feature flag configuration

#### **Database Schema** (Planned)
- **`poll_narratives`** - Main narrative storage
- **`verified_facts`** - Community-verified facts
- **`community_facts`** - User-submitted facts
- **`fact_votes`** - Community voting on facts
- **`narrative_moderation`** - Moderation queue

#### **API Endpoints** (Planned)
- **POST** `/api/poll-narratives` - Create new narrative
- **GET** `/api/poll-narratives/{id}` - Get narrative with facts
- **POST** `/api/poll-narratives/{id}/facts` - Submit community fact
- **POST** `/api/poll-narratives/{id}/vote` - Vote on fact
- **GET** `/api/poll-narratives/{id}/moderation` - Admin moderation

## Features (When Enabled)

### **Core Functionality**

#### **1. Narrative Generation**
- **AI-Powered Storytelling**: Converts polls into educational narratives
- **Context Building**: Provides background information and historical context
- **Educational Content**: Explains complex topics in accessible language
- **Visual Storytelling**: Supports images, videos, and interactive elements

#### **2. Community Fact Verification**
- **User Submissions**: Community can submit facts and sources
- **Voting System**: Democratic verification of fact accuracy
- **Source Validation**: Automatic checking of fact sources
- **Expert Review**: Optional expert verification for critical facts

#### **3. Moderation System**
- **Community Moderation**: User-driven content review
- **AI Pre-screening**: Automatic filtering of inappropriate content
- **Admin Override**: Administrative control for quality assurance
- **Transparency**: Public moderation logs and decisions

#### **4. Educational Integration**
- **Learning Paths**: Structured educational journeys
- **Knowledge Gaps**: Identification of missing information
- **Related Topics**: Cross-referencing with other narratives
- **Progress Tracking**: User learning progress and engagement

### **Technical Architecture**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Poll Input    │───▶│  AI Narrative    │───▶│   Community     │
│                 │    │   Generator      │    │   Moderation    │
│ • Question      │    │                  │    │                 │
│ • Context       │    │ • Story Creation │    │ • Fact Review   │
│ • Background    │    │ • Fact Mining    │    │ • Voting        │
└─────────────────┘    └──────────────────┘    │ • Verification  │
                                │               └─────────────────┘
                                ▼
                       ┌──────────────────┐
                       │   Database       │
                       │                  │
                       │ • Narratives     │
                       │ • Facts          │
                       │ • Votes          │
                       │ • Moderation     │
                       └──────────────────┘
```

## Implementation Details

### **Service Class Structure**

```typescript
export class PollNarrativeService {
  private supabase;
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = FEATURE_FLAGS.POLL_NARRATIVE_SYSTEM;
    if (!this.isEnabled) {
      devLog('PollNarrativeService: Feature disabled for MVP - not production ready');
      return;
    }
    this.supabase = getSupabaseServerClient();
  }

  // Main methods with feature flag checks
  async createNarrative(narrative: PollNarrative): Promise<PollNarrative | null>
  async addVerifiedFact(fact: VerifiedFact): Promise<VerifiedFact | null>
  async submitCommunityFact(fact: CommunityFact): Promise<CommunityFact | null>
  async voteOnFact(factId: string, voteType: 'helpful' | 'misleading'): Promise<boolean>
  async moderateNarrative(narrativeId: string, action: ModerationAction): Promise<boolean>
}
```

### **Data Models**

#### **PollNarrative**
```typescript
export type PollNarrative = {
  id: string;
  pollId: string;
  title: string;
  content: string;
  educationalValue: number;
  factCount: number;
  communityRating: number;
  moderation: {
    status: 'draft' | 'pending' | 'approved' | 'rejected';
    reviewedBy?: string;
    reviewedAt?: Date;
    notes?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  lastModeratedAt?: Date;
};
```

#### **VerifiedFact**
```typescript
export type VerifiedFact = {
  id: string;
  narrativeId: string;
  content: string;
  source: string;
  sourceUrl: string;
  verificationLevel: 'community' | 'expert' | 'peer-reviewed';
  votes: {
    helpful: number;
    misleading: number;
  };
  lastVerified: Date;
  verifiedBy?: string;
};
```

#### **CommunityFact**
```typescript
export type CommunityFact = {
  id: string;
  narrativeId: string;
  content: string;
  source: string;
  sourceUrl: string;
  submittedBy: string;
  submittedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  votes: {
    helpful: number;
    misleading: number;
  };
  moderationNotes?: string;
};
```

### **Feature Flag Integration**

```typescript
// Feature flag check in all public methods
if (!this.isEnabled) {
  devLog('Poll narrative system is disabled - feature not MVP ready');
  return null;
}
```

## Security & Privacy

### **Content Moderation**
- **Community Voting**: Democratic fact verification
- **AI Pre-screening**: Automatic content filtering
- **Admin Review**: Human oversight for quality control
- **Transparency**: Public moderation logs

### **Data Privacy**
- **User Attribution**: Optional anonymous submissions
- **Source Verification**: Validated fact sources only
- **Content Ownership**: Clear attribution and licensing
- **Audit Trail**: Complete moderation history

## Performance Considerations

### **AI Processing**
- **Async Processing**: Non-blocking narrative generation
- **Caching**: Pre-generated narratives for popular polls
- **Rate Limiting**: Prevents AI service abuse
- **Fallback**: Manual narrative creation when AI fails

### **Community Features**
- **Real-time Updates**: Live voting and fact updates
- **Notification System**: Alerts for fact verification
- **Search & Discovery**: Find narratives by topic
- **Recommendation Engine**: Suggest related narratives

## Future Development

### **Phase 1: Core System**
- [ ] Basic narrative generation
- [ ] Community fact submission
- [ ] Simple voting system
- [ ] Admin moderation tools

### **Phase 2: Advanced Features**
- [ ] AI-powered fact verification
- [ ] Expert review system
- [ ] Advanced search and filtering
- [ ] Mobile-optimized interface

### **Phase 3: Educational Integration**
- [ ] Learning path creation
- [ ] Progress tracking
- [ ] Gamification elements
- [ ] Integration with educational platforms

## Testing & Validation

### **Unit Tests**
- Service method functionality
- Feature flag behavior
- Data validation
- Error handling

### **Integration Tests**
- Database operations
- AI service integration
- Community moderation flow
- Performance under load

### **User Acceptance Tests**
- Narrative quality assessment
- Community engagement metrics
- Educational effectiveness
- Moderation efficiency

## Deployment Considerations

### **Prerequisites**
- AI service integration (OpenAI, Anthropic, etc.)
- Community moderation tools
- Database schema migration
- Admin training and documentation

### **Rollout Strategy**
- **Phase 1**: Admin-only testing
- **Phase 2**: Limited community beta
- **Phase 3**: Full public release
- **Phase 4**: Advanced features

## Current Status

### **✅ Completed**
- Service class structure
- Feature flag integration
- Basic data models
- Database schema design

### **⚠️ In Progress**
- AI service integration
- Community moderation system
- Admin interface development
- Testing and validation

### **❌ Not Started**
- Production deployment
- User documentation
- Community guidelines
- Performance optimization

---

## Summary

The Poll Narrative System is a sophisticated feature that transforms simple polls into rich, educational experiences. While the core architecture is implemented, it requires significant additional development before it's ready for production use.

**Key Requirements for MVP:**
- ❌ **AI Service Integration**: Requires external AI service setup
- ❌ **Community Moderation**: Needs user interface and workflow
- ❌ **Database Schema**: Requires migration and data setup
- ❌ **Admin Tools**: Needs moderation interface development

**Recommendation**: Keep feature-flagged for MVP, enable in future releases when AI integration and community moderation systems are fully developed.

The system is well-architected and ready for future development, but is appropriately disabled for the current MVP release.
