# 🏛️ Civics System

**Complete Civics Documentation for Choices Platform**

---

## 🎯 **Overview**

The Choices platform features a comprehensive civics system that provides representative lookup, geographic services, and civic engagement tools through a mobile-optimized interface with data from multiple authoritative sources.

**Last Updated**: October 27, 2025  
**Status**: Production Ready  
**Data Sources**: OpenStates + Live APIs

---

## 🏗️ **Core Features**

### **Representative Lookup**
- **Address-Based Discovery**: Find representatives by address
- **Geographic Services**: District mapping and boundaries
- **Enhanced Profiles**: Comprehensive representative information
- **Contact Information**: Direct contact details and social media
- **Voting Records**: Legislative voting history and records

### **Data Sources**
- **OpenStates Database**: 25,000+ representative records
- **Congress.gov API**: Federal representative data
- **Google Civic API**: Additional representative information
- **FEC API**: Campaign finance data
- **Real-Time Updates**: Live data synchronization

### **Civic Engagement**
- **Representative Interaction**: Direct communication tools
- **Issue Tracking**: Track representative positions on issues
- **Voting Reminders**: Election and voting notifications
- **Civic Education**: Educational content about government

---

## 🔧 **Implementation Details**

### **Data Architecture**
```typescript
// Representative Data Structure
interface Representative {
  id: string;
  name: string;
  title: string;
  district?: string;
  state: string;
  party: string;
  contact_info: {
    email?: string;
    phone?: string;
    website?: string;
    social_media?: Record<string, string>;
  };
  voting_records: Array<{
    bill: string;
    title: string;
    vote: 'Yea' | 'Nay' | 'Abstain';
    date: string;
  }>;
  enhanced_data?: {
    photos: string[];
    biography: string;
    committee_memberships: string[];
    sponsored_bills: string[];
    campaign_finance: CampaignFinanceData;
  };
  data_quality: {
    completeness_score: number;
    freshness_score: number;
    accuracy_score: number;
    overall_score: number;
  };
  created_at: string;
  updated_at: string;
  data_source: 'openstates' | 'congress' | 'google_civic' | 'fec';
}
```

### **Representative Lookup Service**
```typescript
// Representative Lookup Service
class RepresentativeService {
  async findByAddress(address: string) {
    // Geocode address
    const geocoded = await this.geocodeAddress(address);
    
    // Find representatives by location
    const representatives = await supabase
      .from('representatives')
      .select('*')
      .eq('state', geocoded.state)
      .eq('district', geocoded.district);
    
    // Enhance with live data
    const enhanced = await this.enhanceRepresentativeData(representatives.data);
    
    return enhanced;
  }
  
  async findByState(state: string) {
    const { data, error } = await supabase
      .from('representatives')
      .select('*')
      .eq('state', state)
      .order('title', { ascending: true });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  }
  
  async enhanceRepresentativeData(representatives: Representative[]) {
    const enhanced = await Promise.all(
      representatives.map(async (rep) => {
        // Get enhanced data from multiple sources
        const [congressData, googleData, fecData] = await Promise.all([
          this.getCongressData(rep.id),
          this.getGoogleCivicData(rep.id),
          this.getFECData(rep.id)
        ]);
        
        return {
          ...rep,
          enhanced_data: {
            photos: congressData.photos || [],
            biography: congressData.biography || '',
            committee_memberships: congressData.committees || [],
            sponsored_bills: congressData.bills || [],
            campaign_finance: fecData,
            social_media: googleData.social_media || {}
          },
          data_quality: this.calculateDataQuality(rep, congressData, googleData, fecData)
        };
      })
    );
    
    return enhanced;
  }
  
  async geocodeAddress(address: string) {
    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.GOOGLE_MAPS_API_KEY}`);
    const data = await response.json();
    
    if (data.results.length === 0) {
      throw new Error('Address not found');
    }
    
    const result = data.results[0];
    const state = this.extractState(result);
    const district = this.extractDistrict(result);
    
    return { state, district, coordinates: result.geometry.location };
  }
}
```

### **Data Quality Assessment**
```typescript
// Data Quality Assessment
class DataQualityService {
  calculateDataQuality(
    baseData: Representative,
    congressData: any,
    googleData: any,
    fecData: any
  ) {
    const scores = {
      completeness: this.calculateCompletenessScore(baseData, congressData, googleData, fecData),
      freshness: this.calculateFreshnessScore(baseData),
      accuracy: this.calculateAccuracyScore(baseData, congressData, googleData, fecData)
    };
    
    const overallScore = (scores.completeness + scores.freshness + scores.accuracy) / 3;
    
    return {
      ...scores,
      overall_score: Math.round(overallScore * 100) / 100
    };
  }
  
  calculateCompletenessScore(baseData: Representative, ...enhancedData: any[]) {
    const requiredFields = ['name', 'title', 'state', 'party'];
    const optionalFields = ['email', 'phone', 'website', 'biography', 'photos'];
    
    let score = 0;
    
    // Check required fields
    requiredFields.forEach(field => {
      if (baseData[field]) score += 1;
    });
    
    // Check optional fields
    optionalFields.forEach(field => {
      if (baseData[field] || enhancedData.some(data => data[field])) {
        score += 0.5;
      }
    });
    
    return score / (requiredFields.length + optionalFields.length * 0.5);
  }
  
  calculateFreshnessScore(data: Representative) {
    const daysSinceUpdate = (Date.now() - new Date(data.updated_at).getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceUpdate < 7) return 1.0;
    if (daysSinceUpdate < 30) return 0.8;
    if (daysSinceUpdate < 90) return 0.6;
    if (daysSinceUpdate < 365) return 0.4;
    return 0.2;
  }
  
  calculateAccuracyScore(baseData: Representative, ...enhancedData: any[]) {
    // Cross-reference data from multiple sources
    const nameMatches = enhancedData.every(data => 
      data.name?.toLowerCase() === baseData.name.toLowerCase()
    );
    
    const titleMatches = enhancedData.every(data => 
      data.title?.toLowerCase() === baseData.title.toLowerCase()
    );
    
    const partyMatches = enhancedData.every(data => 
      data.party?.toLowerCase() === baseData.party.toLowerCase()
    );
    
    const matches = [nameMatches, titleMatches, partyMatches].filter(Boolean).length;
    return matches / 3;
  }
}
```

---

## 📊 **Data Sources Integration**

### **OpenStates Integration**
```typescript
// OpenStates Data Processing
class OpenStatesService {
  async processOpenStatesData() {
    // Load OpenStates YAML files
    const yamlFiles = await this.loadYAMLFiles();
    
    const representatives = [];
    
    for (const file of yamlFiles) {
      const data = yaml.load(file.content);
      
      if (data.type === 'person') {
        const representative = this.transformOpenStatesPerson(data);
        representatives.push(representative);
      }
    }
    
    // Batch insert to database
    await this.batchInsertRepresentatives(representatives);
  }
  
  transformOpenStatesPerson(person: any): Representative {
    return {
      id: person.id,
      name: person.name,
      title: person.current_role?.title || 'Representative',
      district: person.current_role?.district,
      state: person.current_role?.jurisdiction,
      party: person.party?.[0]?.name || 'Unknown',
      contact_info: {
        email: person.email,
        phone: person.phone,
        website: person.links?.find(link => link.note === 'website')?.url
      },
      voting_records: person.votes?.map(vote => ({
        bill: vote.bill.identifier,
        title: vote.bill.title,
        vote: vote.option,
        date: vote.date
      })) || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      data_source: 'openstates'
    };
  }
}
```

### **Congress.gov API Integration**
```typescript
// Congress.gov API Service
class CongressService {
  async getRepresentativeData(bioguideId: string) {
    const response = await fetch(`https://api.congress.gov/v3/member/${bioguideId}?api_key=${process.env.CONGRESS_API_KEY}`);
    const data = await response.json();
    
    return {
      photos: data.member.photos?.map(photo => photo.url) || [],
      biography: data.member.biography || '',
      committees: data.member.committees?.map(committee => committee.name) || [],
      bills: data.member.bills?.map(bill => bill.title) || []
    };
  }
  
  async getVotingRecords(bioguideId: string) {
    const response = await fetch(`https://api.congress.gov/v3/member/${bioguideId}/votes?api_key=${process.env.CONGRESS_API_KEY}`);
    const data = await response.json();
    
    return data.votes?.map(vote => ({
      bill: vote.rollCall,
      title: vote.description,
      vote: vote.position,
      date: vote.date
    })) || [];
  }
}
```

### **Google Civic API Integration**
```typescript
// Google Civic API Service
class GoogleCivicService {
  async getRepresentativeData(address: string) {
    const response = await fetch(`https://www.googleapis.com/civicinfo/v2/representatives?address=${encodeURIComponent(address)}&key=${process.env.GOOGLE_CIVIC_API_KEY}`);
    const data = await response.json();
    
    return {
      representatives: data.officials?.map(official => ({
        name: official.name,
        party: official.party,
        social_media: official.channels?.reduce((acc, channel) => {
          acc[channel.type] = channel.id;
          return acc;
        }, {})
      })) || []
    };
  }
}
```

---

## 🛠️ **API Endpoints**

### **Civics Endpoints**
```typescript
// GET /api/civics/by-address
const findByAddressEndpoint = {
  method: 'GET',
  path: '/api/civics/by-address',
  queryParams: {
    address: string,
    include_voting_records?: boolean
  },
  response: {
    address: string,
    representatives: Representative[]
  }
};

// GET /api/civics/by-state/{state}
const findByStateEndpoint = {
  method: 'GET',
  path: '/api/civics/by-state/{state}',
  response: {
    state: string,
    representatives: Representative[],
    senators: Representative[]
  }
};

// GET /api/civics/representative/{id}
const getRepresentativeEndpoint = {
  method: 'GET',
  path: '/api/civics/representative/{id}',
  response: {
    representative: Representative
  }
};
```

---

## 📱 **Mobile Optimization**

### **Mobile-First Design**
```typescript
// Mobile-Optimized Representative Card
const MobileRepresentativeCard = ({ representative }: { representative: Representative }) => {
  return (
    <div className="mobile-representative-card">
      <div className="representative-header">
        <img 
          src={representative.enhanced_data?.photos[0] || '/default-avatar.png'} 
          alt={representative.name}
          className="representative-photo"
        />
        <div className="representative-info">
          <h3 className="representative-name">{representative.name}</h3>
          <p className="representative-title">{representative.title}</p>
          <p className="representative-party">{representative.party}</p>
        </div>
      </div>
      
      <div className="representative-actions">
        <button className="contact-button">
          <PhoneIcon />
          Contact
        </button>
        <button className="vote-button">
          <VoteIcon />
          Vote Record
        </button>
        <button className="share-button">
          <ShareIcon />
          Share
        </button>
      </div>
      
      <div className="data-quality-indicator">
        <span className="quality-score">
          Data Quality: {Math.round(representative.data_quality.overall_score * 100)}%
        </span>
      </div>
    </div>
  );
};
```

### **Touch Interactions**
```typescript
// Touch-Optimized Interactions
const TouchOptimizedCard = ({ representative }: { representative: Representative }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleTouch = useCallback((e: TouchEvent) => {
    e.preventDefault();
    setIsExpanded(!isExpanded);
  }, [isExpanded]);
  
  return (
    <div 
      className={`touch-card ${isExpanded ? 'expanded' : ''}`}
      onTouchEnd={handleTouch}
    >
      <div className="card-content">
        {/* Card content */}
      </div>
      
      {isExpanded && (
        <div className="expanded-content">
          {/* Expanded content */}
        </div>
      )}
    </div>
  );
};
```

---

## 🔍 **Testing**

### **Civics Tests**
```typescript
describe('Civics System', () => {
  it('should find representatives by address', async () => {
    const response = await request(app)
      .get('/api/civics/by-address')
      .query({ address: '123 Main St, San Francisco, CA' })
      .expect(200);
      
    expect(response.body.representatives).toBeDefined();
    expect(response.body.representatives.length).toBeGreaterThan(0);
  });
  
  it('should enhance representative data', async () => {
    const representative = await createTestRepresentative();
    
    const response = await request(app)
      .get(`/api/civics/representative/${representative.id}`)
      .expect(200);
      
    expect(response.body.representative.enhanced_data).toBeDefined();
    expect(response.body.representative.data_quality).toBeDefined();
  });
});
```

---

## 🎯 **Best Practices**

### **Data Quality**
- **Source Verification**: Verify data from multiple sources
- **Regular Updates**: Keep data fresh and current
- **Quality Scoring**: Provide data quality indicators
- **Error Handling**: Graceful handling of data errors

### **User Experience**
- **Mobile-First**: Optimize for mobile devices
- **Fast Loading**: Optimize data loading performance
- **Clear Information**: Present information clearly
- **Easy Navigation**: Intuitive navigation and interaction

### **Data Privacy**
- **Minimal Collection**: Collect only necessary data
- **Secure Storage**: Secure storage of user data
- **Transparent Use**: Be transparent about data use
- **User Control**: Give users control over their data

---

**Civics Documentation Version**: 1.0.0  
**Last Updated**: October 27, 2025  
**Status**: ✅ Production Ready

---

*This civics documentation provides complete coverage of the Choices platform civics system.*