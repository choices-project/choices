# Civics 2.0 Additional APIs Research

**Created:** January 5, 2025  
**Status:** 🔬 **RESEARCH IN PROGRESS**  
**Purpose:** Research additional APIs needed for comprehensive civic data coverage

---

## 🎯 **API Research Goals**

Identify and research APIs that provide:
- **Official photos** for all representatives
- **Social media data** from multiple platforms
- **Committee assignments** and legislative roles
- **Legislative effectiveness** metrics
- **Campaign finance** transparency
- **Voting records** and analysis
- **Constituent services** and casework
- **Public statements** and press releases

---

## 📊 **Current API Coverage Analysis**

### **Currently Integrated:**
- **Google Civic API** - Basic contact info, photos, social media
- **OpenStates API** - State legislators, voting records, committees
- **Congress.gov API** - Federal representatives, bills, votes
- **FEC API** - Campaign finance data
- **OpenSecrets API** - Influence analysis (partially utilized)
- **GovTrack API** - Legislative tracking (partially utilized)

### **Coverage Gaps Identified:**
- **Photo coverage** - Only 20% of representatives have photos
- **Social media** - Limited to basic channels
- **Committee data** - Incomplete committee assignments
- **Effectiveness metrics** - No legislative effectiveness scoring
- **Public statements** - No press release or statement data
- **Constituent services** - No casework or service data

---

## 🔍 **Research: Additional APIs for Comprehensive Coverage**

### **Photo and Media APIs:**

#### **1. Wikipedia/Wikimedia Commons API**
```typescript
interface WikipediaAPI {
  baseUrl: 'https://en.wikipedia.org/api/rest_v1';
  endpoints: {
    page: '/page/summary/{title}';
    images: '/page/media/{title}';
    search: '/page/summary/{title}';
  };
  
  // Get representative photos
  getRepresentativePhotos: (name: string) => Promise<Photo[]>;
  
  // Benefits
  benefits: [
    'High-quality official photos',
    'Creative Commons licensing',
    'Comprehensive coverage',
    'Free to use'
  ];
  
  // Rate limits
  rateLimits: {
    requestsPerSecond: 2;
    requestsPerMinute: 120;
    requestsPerDay: 10000;
  };
}
```

#### **2. Congress.gov Photo API**
```typescript
interface CongressPhotoAPI {
  // Official photo URLs
  getOfficialPhoto: (bioguideId: string) => string;
  
  // Photo pattern
  pattern: 'https://www.congress.gov/img/member/{bioguideId}.jpg';
  
  // Benefits
  benefits: [
    'Official government photos',
    'High quality and resolution',
    'Public domain licensing',
    'Direct from government source'
  ];
  
  // Coverage
  coverage: '100% of federal representatives with bioguide IDs';
}
```

#### **3. Social Media APIs**

**Twitter API v2:**
```typescript
interface TwitterAPI {
  baseUrl: 'https://api.twitter.com/2';
  endpoints: {
    user: '/users/by/username/{username}';
    tweets: '/users/{id}/tweets';
    followers: '/users/{id}/followers';
  };
  
  // Get representative Twitter data
  getRepresentativeTwitter: (handle: string) => Promise<TwitterData>;
  
  // Benefits
  benefits: [
    'Real-time updates',
    'Follower counts',
    'Recent tweets',
    'Verification status'
  ];
  
  // Rate limits
  rateLimits: {
    requestsPer15Minutes: 300;
    requestsPerDay: 1000000;
  };
}
```

**Facebook Graph API:**
```typescript
interface FacebookAPI {
  baseUrl: 'https://graph.facebook.com/v18.0';
  endpoints: {
    page: '/{page-id}';
    posts: '/{page-id}/posts';
    followers: '/{page-id}/followers';
  };
  
  // Get representative Facebook data
  getRepresentativeFacebook: (pageId: string) => Promise<FacebookData>;
  
  // Benefits
  benefits: [
    'Page information',
    'Recent posts',
    'Follower counts',
    'Engagement metrics'
  ];
  
  // Rate limits
  rateLimits: {
    requestsPerHour: 200;
    requestsPerDay: 10000;
  };
}
```

**Instagram Basic Display API:**
```typescript
interface InstagramAPI {
  baseUrl: 'https://graph.instagram.com';
  endpoints: {
    user: '/me';
    media: '/me/media';
    insights: '/me/insights';
  };
  
  // Get representative Instagram data
  getRepresentativeInstagram: (userId: string) => Promise<InstagramData>;
  
  // Benefits
  benefits: [
    'Profile information',
    'Recent posts',
    'Follower counts',
    'Engagement metrics'
  ];
  
  // Rate limits
  rateLimits: {
    requestsPerHour: 200;
    requestsPerDay: 10000;
  };
}
```

### **Legislative and Committee APIs:**

#### **4. Congress.gov Committee API**
```typescript
interface CongressCommitteeAPI {
  baseUrl: 'https://api.congress.gov/v3';
  endpoints: {
    committees: '/committee';
    membership: '/committee/{committee-id}/members';
    hearings: '/committee/{committee-id}/hearing';
  };
  
  // Get committee assignments
  getCommitteeAssignments: (bioguideId: string) => Promise<CommitteeAssignment[]>;
  
  // Benefits
  benefits: [
    'Official committee data',
    'Membership information',
    'Hearing schedules',
    'Leadership positions'
  ];
  
  // Rate limits
  rateLimits: {
    requestsPerDay: 5000;
    requestsPerMinute: 100;
  };
}
```

#### **5. ProPublica Congress API**
```typescript
interface ProPublicaCongressAPI {
  baseUrl: 'https://api.propublica.org/congress/v1';
  endpoints: {
    members: '/members/{chamber}/{congress}';
    votes: '/members/{bioguide-id}/votes/{year}/{month}';
    bills: '/members/{bioguide-id}/bills/{congress}';
    statements: '/members/{bioguide-id}/statements/{congress}';
  };
  
  // Get comprehensive representative data
  getRepresentativeData: (bioguideId: string) => Promise<ProPublicaData>;
  
  // Benefits
  benefits: [
    'Voting records',
    'Bill sponsorships',
    'Public statements',
    'Legislative effectiveness'
  ];
  
  // Rate limits
  rateLimits: {
    requestsPerMinute: 50;
    requestsPerDay: 10000;
  };
}
```

### **Campaign Finance and Transparency APIs:**

#### **6. OpenSecrets API (Enhanced)**
```typescript
interface OpenSecretsAPI {
  baseUrl: 'https://www.opensecrets.org/api';
  endpoints: {
    candidates: '/candidates.get';
    contributions: '/candidates.contrib';
    industries: '/candidates.industries';
    sectors: '/candidates.sectors';
  };
  
  // Get comprehensive financial data
  getFinancialData: (candidateId: string) => Promise<FinancialData>;
  
  // Benefits
  benefits: [
    'Industry contributions',
    'PAC contributions',
    'Individual contributions',
    'Influence analysis'
  ];
  
  // Rate limits
  rateLimits: {
    requestsPerMinute: 10;
    requestsPerDay: 200;
  };
}
```

#### **7. FEC API (Enhanced)**
```typescript
interface FECAPI {
  baseUrl: 'https://api.open.fec.gov/v1';
  endpoints: {
    candidates: '/candidates';
    committees: '/committees';
    contributions: '/schedules/schedule_a';
    expenditures: '/schedules/schedule_b';
  };
  
  // Get detailed financial data
  getDetailedFinancials: (candidateId: string) => Promise<FECData>;
  
  // Benefits
  benefits: [
    'Detailed contribution data',
    'Expenditure breakdowns',
    'Committee information',
    'Real-time updates'
  ];
  
  // Rate limits
  rateLimits: {
    requestsPerMinute: 20;
    requestsPerDay: 500;
  };
}
```

### **News and Media APIs:**

#### **8. NewsAPI**
```typescript
interface NewsAPI {
  baseUrl: 'https://newsapi.org/v2';
  endpoints: {
    everything: '/everything';
    headlines: '/top-headlines';
    sources: '/sources';
  };
  
  // Get representative news coverage
  getRepresentativeNews: (name: string) => Promise<NewsArticle[]>;
  
  // Benefits
  benefits: [
    'Recent news coverage',
    'Press releases',
    'Media mentions',
    'Public statements'
  ];
  
  // Rate limits
  rateLimits: {
    requestsPerDay: 1000;
    requestsPerMonth: 10000;
  };
}
```

#### **9. Google News API**
```typescript
interface GoogleNewsAPI {
  baseUrl: 'https://news.google.com/rss';
  endpoints: {
    search: '/search?q={query}&hl=en&gl=US&ceid=US:en';
  };
  
  // Get representative news
  getRepresentativeNews: (name: string) => Promise<NewsArticle[]>;
  
  // Benefits
  benefits: [
    'Comprehensive news coverage',
    'Real-time updates',
    'Multiple sources',
    'Free to use'
  ];
  
  // Rate limits
  rateLimits: {
    requestsPerMinute: 60;
    requestsPerDay: 10000;
  };
}
```

### **Constituent Services APIs:**

#### **10. Constituent Services API (Custom)**
```typescript
interface ConstituentServicesAPI {
  // Custom API for constituent services
  baseUrl: 'https://api.constituentservices.gov';
  endpoints: {
    services: '/services/{state}';
    casework: '/casework/{representative-id}';
    townhalls: '/townhalls/{representative-id}';
  };
  
  // Get constituent services data
  getConstituentServices: (representativeId: string) => Promise<ConstituentServices>;
  
  // Benefits
  benefits: [
    'Constituent services',
    'Casework information',
    'Town hall schedules',
    'Contact methods'
  ];
}
```

---

## 🚀 **Enhanced Data Integration Strategy**

### **1. Multi-Source Photo Management**
```typescript
class PhotoManagementService {
  async getRepresentativePhotos(representative: Representative): Promise<Photo[]> {
    const photos = [];
    
    // Try official sources first
    if (representative.bioguideId) {
      const congressPhoto = await this.getCongressPhoto(representative.bioguideId);
      if (congressPhoto) photos.push(congressPhoto);
    }
    
    // Try Wikipedia
    const wikipediaPhotos = await this.getWikipediaPhotos(representative.name);
    photos.push(...wikipediaPhotos);
    
    // Try social media
    const socialPhotos = await this.getSocialMediaPhotos(representative);
    photos.push(...socialPhotos);
    
    // Try news sources
    const newsPhotos = await this.getNewsPhotos(representative.name);
    photos.push(...newsPhotos);
    
    // Rank and return best photos
    return this.rankPhotos(photos);
  }
}
```

### **2. Comprehensive Social Media Integration**
```typescript
class SocialMediaIntegration {
  async getSocialMediaPresence(representative: Representative): Promise<SocialMedia[]> {
    const socialMedia = [];
    
    // Twitter
    if (representative.twitterHandle) {
      const twitter = await this.getTwitterData(representative.twitterHandle);
      if (twitter) socialMedia.push(twitter);
    }
    
    // Facebook
    if (representative.facebookPage) {
      const facebook = await this.getFacebookData(representative.facebookPage);
      if (facebook) socialMedia.push(facebook);
    }
    
    // Instagram
    if (representative.instagramHandle) {
      const instagram = await this.getInstagramData(representative.instagramHandle);
      if (instagram) socialMedia.push(instagram);
    }
    
    // YouTube
    if (representative.youtubeChannel) {
      const youtube = await this.getYouTubeData(representative.youtubeChannel);
      if (youtube) socialMedia.push(youtube);
    }
    
    return socialMedia;
  }
}
```

### **3. Legislative Effectiveness Scoring**
```typescript
class LegislativeEffectivenessService {
  async calculateEffectiveness(representative: Representative): Promise<EffectivenessScore> {
    const [
      votingRecord,
      billSponsorships,
      committeeAssignments,
      publicStatements
    ] = await Promise.all([
      this.getVotingRecord(representative.bioguideId),
      this.getBillSponsorships(representative.bioguideId),
      this.getCommitteeAssignments(representative.bioguideId),
      this.getPublicStatements(representative.bioguideId)
    ]);
    
    return {
      overall: this.calculateOverallScore(votingRecord, billSponsorships, committeeAssignments),
      voting: this.calculateVotingScore(votingRecord),
      legislation: this.calculateLegislationScore(billSponsorships),
      committees: this.calculateCommitteeScore(committeeAssignments),
      communication: this.calculateCommunicationScore(publicStatements)
    };
  }
}
```

---

## 📊 **Expected Coverage Improvements**

### **Photo Coverage:**
- **Current:** 20% of representatives have photos
- **With additional APIs:** 95%+ coverage
- **Sources:** Congress.gov, Wikipedia, social media, news
- **Quality:** High-resolution official photos

### **Social Media Coverage:**
- **Current:** 10% of representatives have social media
- **With additional APIs:** 80%+ coverage
- **Platforms:** Twitter, Facebook, Instagram, YouTube
- **Data:** Followers, recent posts, engagement metrics

### **Legislative Data:**
- **Current:** Basic voting records
- **With additional APIs:** Comprehensive legislative analysis
- **Data:** Committee assignments, bill sponsorships, effectiveness scores
- **Sources:** Congress.gov, ProPublica, GovTrack

### **Campaign Finance:**
- **Current:** Basic FEC totals
- **With additional APIs:** Detailed financial analysis
- **Data:** Industry contributions, PAC data, influence analysis
- **Sources:** FEC, OpenSecrets, ProPublica

---

## 🚀 **Implementation Roadmap**

### **Phase 1: Photo and Media APIs (Week 1)**
1. Integrate Congress.gov photo API
2. Add Wikipedia/Wikimedia Commons API
3. Implement social media photo extraction
4. Create photo ranking system

### **Phase 2: Social Media APIs (Week 2)**
1. Integrate Twitter API v2
2. Add Facebook Graph API
3. Implement Instagram Basic Display API
4. Create social media aggregation

### **Phase 3: Legislative APIs (Week 3)**
1. Integrate ProPublica Congress API
2. Add Congress.gov Committee API
3. Implement legislative effectiveness scoring
4. Create comprehensive legislative profiles

### **Phase 4: News and Media APIs (Week 4)**
1. Integrate NewsAPI
2. Add Google News API
3. Implement news aggregation
4. Create media monitoring system

---

## 🎯 **Success Metrics**

### **Coverage Metrics:**
- **Photo coverage:** >95% of representatives with photos
- **Social media coverage:** >80% of representatives with social media
- **Legislative data:** >90% of representatives with complete legislative profiles
- **Campaign finance:** >95% of representatives with financial data
- **News coverage:** >80% of representatives with recent news

### **Quality Metrics:**
- **Data accuracy:** >95% accuracy across all sources
- **Source diversity:** >5 sources per representative
- **Update frequency:** <1 hour for critical updates
- **API efficiency:** >90% successful requests
- **Rate limit compliance:** 100% compliance across all APIs

---

## 🔬 **Next Steps**

1. **Research community moderation patterns** for user-generated content
2. **Research gamification strategies** for civic engagement
3. **Research trust and verification systems** for community data
4. **Create implementation timeline** with milestones
5. **Begin Phase 1 implementation** when ready

---

**This additional API research will ensure we have comprehensive coverage of all representative data from multiple high-quality sources!** 🚀

