# Civics 2.0 Free APIs Blueprint

**Created:** January 5, 2025  
**Status:** 🎯 **FREE APIS FIRST - COST-EFFECTIVE FOUNDATION**  
**Purpose:** Sensible foundation using only FREE APIs for Civics + Candidates + User Feed

---

## 🎯 **Free APIs Strategy**

### **Phase 1 Foundation (Free APIs Only):**
1. **Rich Civics Data** - 200+ data points per representative
2. **Beautiful Candidate Cards** - Visual, engaging, informative
3. **Social User Feed** - Instagram-like civic content feed

### **Future Growth (Paid APIs When Revenue):**
4. **Premium APIs** - When we have revenue to justify costs
5. **Advanced Features** - All the research we did
6. **Community Features** - User-generated content

---

## 🆓 **FREE APIs We Can Use**

### **1. Google Civic Information API (FREE)**
```typescript
interface GoogleCivicAPI {
  // FREE tier: 25,000 requests/day
  rateLimit: '25,000 requests/day';
  cost: 'FREE';
  
  // What we get
  data: {
    basicInfo: 'Name, party, office, district';
    contactInfo: 'Phone, email, website';
    photos: 'Official photos';
    socialMedia: 'Twitter, Facebook, Instagram';
    channels: 'YouTube, LinkedIn';
  };
  
  // Usage strategy
  strategy: {
    batchRequests: 'Process multiple representatives at once';
    cacheResults: 'Cache for 24 hours';
    prioritizeUpdates: 'Focus on active representatives';
  };
}
```

### **2. OpenStates API (FREE)**
```typescript
interface OpenStatesAPI {
  // FREE tier: 10,000 requests/day
  rateLimit: '10,000 requests/day';
  cost: 'FREE';
  
  // What we get
  data: {
    stateLegislators: 'All state representatives';
    committees: 'Committee assignments';
    votingRecords: 'Voting history';
    bills: 'Bill sponsorships';
    photos: 'Official photos';
    contactInfo: 'Multiple contact methods';
  };
  
  // Usage strategy
  strategy: {
    stateByState: 'Process one state at a time';
    cacheResults: 'Cache for 7 days';
    incrementalUpdates: 'Only new data';
  };
}
```

### **3. Congress.gov API (FREE)**
```typescript
interface CongressGovAPI {
  // FREE tier: 5,000 requests/day
  rateLimit: '5,000 requests/day';
  cost: 'FREE';
  
  // What we get
  data: {
    federalRepresentatives: 'All federal representatives';
    bioguideIds: 'Official identifiers';
    photos: 'Official photos via bioguide ID';
    votingRecords: 'Congressional voting records';
    bills: 'Bill sponsorships';
    committees: 'Committee assignments';
  };
  
  // Usage strategy
  strategy: {
    bioguidePhotos: 'Use bioguide ID for official photos';
    batchProcessing: 'Process by state/chamber';
    cacheResults: 'Cache for 30 days';
  };
}
```

### **4. FEC API (FREE)**
```typescript
interface FECAPI {
  // FREE tier: 1,000 requests/day
  rateLimit: '1,000 requests/day';
  cost: 'FREE';
  
  // What we get
  data: {
    campaignFinance: 'Campaign finance data';
    candidates: 'Candidate information';
    committees: 'Committee data';
    contributions: 'Contribution records';
  };
  
  // Usage strategy
  strategy: {
    electionCycles: 'Focus on current election cycle';
    batchRequests: 'Process multiple candidates';
    cacheResults: 'Cache for 7 days';
  };
}
```

### **5. Wikipedia/Wikimedia Commons (FREE)**
```typescript
interface WikipediaAPI {
  // Completely FREE
  rateLimit: 'No official limit';
  cost: 'FREE';
  
  // What we get
  data: {
    photos: 'High-quality representative photos';
    biographies: 'Representative biographies';
    sources: 'Additional source information';
  };
  
  // Usage strategy
  strategy: {
    photoFallback: 'Use when official photos unavailable';
    batchProcessing: 'Process multiple representatives';
    cacheResults: 'Cache for 30 days';
  };
}
```

### **6. Social Media APIs (FREE)**
```typescript
interface SocialMediaAPIs {
  // Twitter API v2 (FREE tier)
  twitter: {
    rateLimit: '1,500 requests/15 minutes';
    cost: 'FREE';
    data: 'Profile info, recent tweets, follower counts';
  };
  
  // Facebook Graph API (FREE tier)
  facebook: {
    rateLimit: '200 requests/hour';
    cost: 'FREE';
    data: 'Page info, recent posts, follower counts';
  };
  
  // Instagram Basic Display API (FREE)
  instagram: {
    rateLimit: '200 requests/hour';
    cost: 'FREE';
    data: 'Profile info, recent posts, follower counts';
  };
}
```

---

## 🏗️ **Free APIs Architecture**

### **Data Ingestion Strategy**
```typescript
class FreeAPIDataIngestion {
  async processRepresentative(rep: Representative): Promise<EnrichedRepresentative> {
    // 1. Get basic info from Google Civic (FREE)
    const basicInfo = await this.getGoogleCivicData(rep);
    
    // 2. Get state data from OpenStates (FREE)
    const stateData = await this.getOpenStatesData(rep);
    
    // 3. Get federal data from Congress.gov (FREE)
    const federalData = await this.getCongressGovData(rep);
    
    // 4. Get photos from multiple sources (FREE)
    const photos = await this.getPhotosFromMultipleSources(rep);
    
    // 5. Get social media (FREE)
    const socialMedia = await this.getSocialMediaData(rep);
    
    // 6. Get campaign finance (FREE)
    const finance = await this.getFECData(rep);
    
    return this.mergeAndValidateData(basicInfo, stateData, federalData, photos, socialMedia, finance);
  }
}
```

### **Photo Management (FREE Sources)**
```typescript
class FreePhotoManagement {
  async getRepresentativePhotos(rep: Representative): Promise<Photo[]> {
    const photos = [];
    
    // 1. Congress.gov official photos (FREE)
    if (rep.bioguideId) {
      const congressPhoto = await this.getCongressPhoto(rep.bioguideId);
      if (congressPhoto) photos.push(congressPhoto);
    }
    
    // 2. Wikipedia photos (FREE)
    const wikipediaPhotos = await this.getWikipediaPhotos(rep.name);
    photos.push(...wikipediaPhotos);
    
    // 3. Google Civic photos (FREE)
    const googlePhotos = await this.getGoogleCivicPhotos(rep);
    photos.push(...googlePhotos);
    
    // 4. OpenStates photos (FREE)
    const openStatesPhotos = await this.getOpenStatesPhotos(rep);
    photos.push(...openStatesPhotos);
    
    // 5. Generate initials if no photos (FREE)
    if (photos.length === 0) {
      photos.push(this.generateInitialsPhoto(rep.name));
    }
    
    return this.rankPhotos(photos);
  }
}
```

### **Social Media Integration (FREE)**
```typescript
class FreeSocialMediaIntegration {
  async getSocialMediaPresence(rep: Representative): Promise<SocialMedia[]> {
    const socialMedia = [];
    
    // 1. Google Civic channels (FREE)
    if (rep.channels) {
      for (const channel of rep.channels) {
        const social = await this.processChannel(channel);
        if (social) socialMedia.push(social);
      }
    }
    
    // 2. OpenStates sources (FREE)
    if (rep.sources) {
      for (const source of rep.sources) {
        const social = await this.extractFromSource(source);
        if (social) socialMedia.push(social);
      }
    }
    
    // 3. Search for additional social media (FREE)
    const additional = await this.searchSocialMedia(rep.name);
    socialMedia.push(...additional);
    
    return this.deduplicateAndRank(socialMedia);
  }
}
```

---

## 📊 **Expected Free APIs Coverage**

### **Data Coverage:**
- **Representatives:** 100% coverage (all levels)
- **Photos:** 90%+ coverage (Congress.gov + Wikipedia + Google Civic)
- **Social Media:** 80%+ coverage (Google Civic + OpenStates + search)
- **Contact Info:** 95%+ coverage (Google Civic + OpenStates + Congress.gov)
- **Voting Records:** 100% coverage (Congress.gov + OpenStates)

### **Cost Analysis:**
- **Google Civic:** FREE (25,000 requests/day)
- **OpenStates:** FREE (10,000 requests/day)
- **Congress.gov:** FREE (5,000 requests/day)
- **FEC:** FREE (1,000 requests/day)
- **Wikipedia:** FREE (unlimited)
- **Social Media:** FREE (basic tiers)
- **Total Cost:** $0/month

### **Performance:**
- **Query speed:** <100ms for representative lookups
- **Photo loading:** <200ms for photo display
- **Feed generation:** <300ms for personalized feeds
- **Data freshness:** <24 hours for most data

---

## 🚀 **Implementation Plan (Free APIs)**

### **Week 1: Free APIs Foundation**
```typescript
// 1. Set up free API clients
const googleCivic = new GoogleCivicClient();
const openStates = new OpenStatesClient();
const congressGov = new CongressGovClient();
const fec = new FECClient();
const wikipedia = new WikipediaClient();

// 2. Create data ingestion pipeline
class FreeAPIPipeline {
  async ingestRepresentatives(): Promise<void> {
    // Process federal representatives (Congress.gov)
    await this.processFederalRepresentatives();
    
    // Process state representatives (OpenStates)
    await this.processStateRepresentatives();
    
    // Enrich with Google Civic data
    await this.enrichWithGoogleCivic();
    
    // Add photos from multiple sources
    await this.addPhotosFromMultipleSources();
    
    // Add social media data
    await this.addSocialMediaData();
  }
}
```

### **Week 2: Photo Management (FREE)**
```typescript
// 1. Congress.gov photo URLs
const getCongressPhoto = (bioguideId: string) => 
  `https://www.congress.gov/img/member/${bioguideId}.jpg`;

// 2. Wikipedia photo search
const searchWikipediaPhotos = async (name: string) => {
  // Search Wikipedia for representative
  // Extract photos from Wikimedia Commons
  // Return high-quality photos
};

// 3. Google Civic photos
const getGoogleCivicPhotos = async (rep: Representative) => {
  // Extract photos from Google Civic response
  // Return official photos
};
```

### **Week 3: Social Media Integration (FREE)**
```typescript
// 1. Google Civic social media
const extractSocialMedia = (channels: Channel[]) => {
  // Extract Twitter, Facebook, Instagram, YouTube
  // Return social media presence
};

// 2. OpenStates social media
const extractOpenStatesSocial = (sources: Source[]) => {
  // Extract social media from sources
  // Return social media data
};

// 3. Social media search
const searchSocialMedia = async (name: string) => {
  // Search for social media accounts
  // Return social media presence
};
```

### **Week 4: Feed Generation (FREE)**
```typescript
// 1. Activity aggregation
const aggregateActivity = async (representatives: Representative[]) => {
  // Get recent votes from Congress.gov
  // Get recent bills from OpenStates
  // Get social media updates
  // Return combined activity feed
};

// 2. Personalization
const personalizeFeed = (userId: string, preferences: UserPreferences) => {
  // Get user's representatives
  // Filter by interests
  // Rank by relevance
  // Return personalized feed
};
```

---

## 🎯 **Free APIs Benefits**

### **Cost Benefits:**
- **Zero API costs** - All APIs are free
- **Scalable** - Can handle growth without cost increases
- **Predictable** - No surprise API bills
- **Sustainable** - Can build without revenue pressure

### **Technical Benefits:**
- **Rich data** - Still get 200+ data points per representative
- **High quality** - Official government sources
- **Reliable** - Government APIs are stable
- **Comprehensive** - Cover all levels of government

### **User Benefits:**
- **Beautiful photos** - High-quality official photos
- **Complete profiles** - Rich representative information
- **Social integration** - Social media presence
- **Real-time updates** - Fresh data from multiple sources

---

## 🚀 **Future Growth Path**

### **When We Have Revenue:**
1. **Premium APIs** - Add paid APIs for enhanced data
2. **Advanced Features** - Implement all research features
3. **Community Features** - User-generated content
4. **Gamification** - Points, badges, engagement
5. **Expert Oversight** - Trusted user verification

### **Free APIs Foundation:**
- **Solid foundation** - Rich data without costs
- **Scalable architecture** - Built to handle growth
- **User engagement** - Beautiful, functional platform
- **Revenue potential** - Can monetize without API costs

---

## 🎉 **Ready to Build with FREE APIs!**

This **free APIs foundation** gives us:
- **Rich civics data** with 200+ data points per representative
- **Beautiful candidate cards** with high-quality photos
- **Social user feed** with real-time updates
- **Zero API costs** - Sustainable and scalable
- **Government sources** - Reliable and official data

**We can build an incredible platform using only FREE APIs, then add premium features when we have revenue!** 🚀

---

**This free APIs blueprint gives us everything we need to build an amazing civics platform without any API costs. We get rich data, beautiful visuals, and social features - all for FREE!** 🎯

