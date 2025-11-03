# Candidate Platform Builder System

**Created:** January 30, 2025  
**Updated:** January 30, 2025  
**Status:** ✅ **IMPLEMENTED** - Database, API, and UI components complete  
**Vision:** Enable users to declare candidacy and build their political platform within the app

---

## 🎯 Vision & Purpose

### **The Big Idea**
Transform Choices from a **voter information platform** into a **participatory democracy platform** where:
- Any eligible user can declare candidacy for office
- Candidates build and manage their platform directly in the app
- Voters discover candidates organically through the civics system
- Creates a **level playing field** for grassroots candidates

### **Why This Makes Sense**

1. **Natural Extension:** Your app already shows alternative candidates - why not let users BE those candidates?
2. **Leverages Existing Infrastructure:**
   - You have user profiles ✅
   - You have poll creation (similar workflow) ✅
   - You have civics/representative database ✅
   - You display alternative candidates ✅
3. **Solves Real Problem:** Lowers barriers for grassroots candidates who can't afford traditional campaign infrastructure
4. **Network Effects:** More candidates → More voters → More engagement → Better democracy

---

## 🏗️ System Architecture

### **High-Level Flow**

```
User Journey:
1. User sees their representative on /civics page
2. Clicks "Run for This Office" button
3. Guided wizard to declare candidacy
4. Build platform (positions, goals, experience)
5. Platform automatically appears in Alternative Candidates section
6. Candidates can manage/update their platform anytime
7. Voters discover and compare candidates
```

### **Integration Points**

#### **1. User Profile System** (Already Exists ✅)
- Users already have profiles (`user_profiles` table)
- Can extend with candidate-specific data
- Links to existing auth system

#### **2. Poll Creation Pattern** (Perfect Template! ✅)
- You already have `CreatePollForm` with wizard workflow
- Similar pattern: multi-step form, validation, submission
- Can reuse form patterns and validation logic

#### **3. Civics/Representative Database** (Ready ✅)
- Know office, district, state for each rep
- Can match candidates to races automatically
- Geographic data already available

#### **4. Alternative Candidates Display** (Ready ✅)
- Component already exists (`CandidateAccountabilityCard`)
- Just needs to pull from database instead of mock data

---

## 📊 Database Schema

### **New Table: `candidate_platforms`**

```sql
CREATE TABLE candidate_platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Office/Race Information
  office TEXT NOT NULL,              -- "U.S. House (CA-15)"
  level TEXT NOT NULL,               -- "federal" | "state" | "local"
  state TEXT NOT NULL,               -- "CA"
  district TEXT,                     -- "CA-15" or null for statewide
  jurisdiction TEXT NOT NULL,        -- Full jurisdiction identifier
  
  -- Candidate Information
  candidate_name TEXT NOT NULL,      -- May differ from user profile name
  party TEXT,                        -- "Independent", "Green Party", etc.
  photo_url TEXT,                    -- Campaign photo
  
  -- Platform Content (The "Platform Builder" part)
  platform_positions JSONB NOT NULL DEFAULT '[]',  -- Array of position objects
  experience TEXT,                   -- Background/qualifications
  endorsements JSONB DEFAULT '[]',   -- Array of endorsement strings
  
  -- Campaign Information
  campaign_funding JSONB DEFAULT '{}',  -- Funding details
  campaign_website TEXT,
  campaign_email TEXT,
  campaign_phone TEXT,
  
  -- Visibility & Status
  visibility TEXT DEFAULT 'medium',  -- "high" | "medium" | "low"
  status TEXT DEFAULT 'active',      -- "active" | "suspended" | "withdrawn"
  verified BOOLEAN DEFAULT false,    -- Admin verification
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_user_office UNIQUE (user_id, office, district)
);
```

### **Platform Positions Structure** (JSONB)
```json
[
  {
    "id": "pos-1",
    "title": "Healthcare",
    "position": "Support Medicare for All",
    "description": "I believe healthcare is a human right...",
    "category": "healthcare",
    "priority": "high",
    "created_at": "2025-01-30T00:00:00Z"
  },
  {
    "id": "pos-2",
    "title": "Climate",
    "position": "Support Green New Deal",
    "description": "Climate change requires immediate action...",
    "category": "environment",
    "priority": "high",
    "created_at": "2025-01-30T00:00:00Z"
  }
]
```

### **Indexes**
```sql
CREATE INDEX idx_candidate_platforms_office ON candidate_platforms(office, district);
CREATE INDEX idx_candidate_platforms_state ON candidate_platforms(state, level);
CREATE INDEX idx_candidate_platforms_status ON candidate_platforms(status, verified);
CREATE INDEX idx_candidate_platforms_user ON candidate_platforms(user_id);
```

---

## 🎨 User Interface Components

### **1. "Run for Office" Button**

**Location:** `CandidateAccountabilityCard` component, next to representative info

```tsx
{isAuthenticated && !isCurrentUserCandidate && (
  <Button 
    onClick={() => router.push('/candidate/declare')}
    variant="outline"
    className="mt-4"
  >
    🏛️ Run for This Office
  </Button>
)}
```

### **2. Candidate Declaration Wizard**

**Similar to your poll creation wizard!** Use the same pattern.

**File:** `web/app/(app)/candidate/declare/page.tsx`

**Steps:**
1. **Select Office** - Show available offices in user's area
2. **Basic Info** - Name, party, photo
3. **Build Platform** - Add positions (like poll options!)
4. **Experience** - Background and qualifications
5. **Contact Info** - Campaign email, phone, website
6. **Review & Submit** - Preview before going live

### **3. Platform Builder Component**

**File:** `web/components/candidate/PlatformBuilder.tsx`

**Features:**
- Add/remove platform positions
- Categorize positions (Healthcare, Education, Economy, etc.)
- Set priority levels
- Rich text descriptions
- Similar to how poll options work!

```tsx
type PlatformPosition = {
  id: string;
  title: string;
  position: string;        // Short summary
  description: string;     // Full explanation
  category: string;        // "healthcare" | "education" | "economy" | etc.
  priority: 'high' | 'medium' | 'low';
};

function PlatformBuilder() {
  const [positions, setPositions] = useState<PlatformPosition[]>([]);
  
  const addPosition = () => {
    setPositions([...positions, {
      id: generateId(),
      title: '',
      position: '',
      description: '',
      category: 'general',
      priority: 'medium'
    }]);
  };
  
  // Similar pattern to your poll options builder!
}
```

### **4. Candidate Dashboard**

**File:** `web/app/(app)/candidate/dashboard/page.tsx`

**Features:**
- View/edit platform
- See how many views/engagement
- Manage campaign info
- See where you appear (which representative pages)

---

## 🔌 API Endpoints

### **1. Declare Candidacy**
```
POST /api/candidate/declare
```

**Request:**
```json
{
  "office": "U.S. House (CA-15)",
  "level": "federal",
  "state": "CA",
  "district": "CA-15",
  "candidateName": "John Doe",
  "party": "Independent"
}
```

**Response:**
```json
{
  "success": true,
  "candidatePlatformId": "uuid",
  "message": "Candidacy declared successfully"
}
```

### **2. Get Candidate Platform**
```
GET /api/candidate/platform/:id
```

Returns full platform data for display.

### **3. Update Platform**
```
PUT /api/candidate/platform/:id
```

Update positions, experience, endorsements, etc.

### **4. Get Candidates for Office**
```
GET /api/civics/representative/:repId/alternatives
```

**This is the key integration!** Returns real candidates from your database.

**Response:**
```json
{
  "ok": true,
  "data": {
    "representative_id": "123",
    "office": "U.S. House (CA-15)",
    "alternatives": [
      {
        "id": "platform-uuid",
        "name": "John Doe",
        "party": "Independent",
        "platform": [
          {
            "title": "Healthcare",
            "position": "Support Medicare for All"
          }
        ],
        "experience": "Community organizer...",
        "endorsements": ["Progressive Coalition"],
        "funding": {
          "total": 0,
          "sources": ["Self-funded"]
        },
        "visibility": "medium"
      }
    ]
  }
}
```

---

## ✅ Implementation Complete

All core functionality has been implemented and integrated into the ecosystem:

1. **Database** - `candidate_platforms` table with proper indexes and RLS
2. **API Endpoints** - Full CRUD operations for candidate platforms
3. **User Interface** - Declaration wizard, dashboard, and integration points
4. **Ecosystem Integration** - Connected to civics pages and alternative candidates display

## 🛠️ Original Implementation Roadmap (Completed)

#### **Step 1: Database Setup**
```sql
-- Create table (see schema above)
-- Create indexes
-- Set up Row Level Security (RLS) policies
```

**RLS Policies:**
```sql
-- Users can only edit their own candidate platform
CREATE POLICY "Users can manage their own platform"
  ON candidate_platforms
  FOR ALL
  USING (auth.uid() = user_id);

-- Anyone can read active, verified platforms
CREATE POLICY "Public can view active platforms"
  ON candidate_platforms
  FOR SELECT
  USING (status = 'active' AND verified = true);
```

#### **Step 2: Basic API Endpoints** ✅
- ✅ `POST` via server action `declareCandidacy` - Declare candidacy
- ✅ `GET /api/candidate/platform` - Get user's platforms
- ✅ `PUT /api/candidate/platform` - Update platform
- ✅ `GET /api/civics/representative/:id/alternatives` - Fetch alternatives for office

**Files:**
- `web/app/actions/declare-candidacy.ts` - Server action
- `web/app/api/candidate/platform/route.ts` - REST API
- `web/app/api/civics/representative/[id]/alternatives/route.ts` - Integration endpoint

#### **Step 3: Declaration Wizard** ✅
- ✅ Multi-step form (copied poll creation pattern)
- ✅ Comprehensive validation
- ✅ Platform positions builder
- ✅ Save to database
- ✅ File: `web/app/(app)/candidate/declare/page.tsx`

### **Phase 2: Platform Builder** ✅ COMPLETED

#### **Step 4: Platform Positions Component**
- Add/remove positions (like poll options)
- Categories (Healthcare, Education, etc.)
- Priority levels
- Rich descriptions

#### **Step 5: Candidate Dashboard**
- View current platform
- Edit positions
- Update campaign info
- See engagement stats

### **Phase 3: Integration** ✅ COMPLETED

#### **Step 6: Connect to Alternative Candidates**
- Update `CandidateAccountabilityCard` to fetch real data
- Query `candidate_platforms` table
- Transform to `AlternativeCandidate` format
- Display in UI

**Update:** `web/components/civics/CandidateAccountabilityCard.tsx`

```typescript
// Instead of mock data:
const displayAlternatives = alternativeCandidates.length > 0 ? alternativeCandidates : mockAlternatives;

// Fetch from API:
const { data: alternatives } = await fetch(
  `/api/civics/representative/${representative.id}/alternatives`
).then(r => r.json());
```

#### **Step 7: "Run for Office" Button**
- Add to `CandidateAccountabilityCard`
- Check if user already declared candidacy
- Route to declaration wizard

### **Phase 4: Polish (Week 6)**

#### **Step 8: Verification System**
- Admin verification workflow
- Verified badge for candidates
- Moderation queue

#### **Step 9: Discovery Features**
- Candidate search
- Filter by office, party, issues
- Trending candidates

---

## 💡 Code Examples for New Developers

### **Pattern 1: Multi-Step Form (Copy from Poll Creation!)**

Your poll creation wizard is **perfect** template:

**Reference:** `web/app/(app)/polls/create/page.tsx`

**Adapt it:**
```tsx
// Instead of:
const [pollData, setPollData] = useState({...});

// Use:
const [candidateData, setCandidateData] = useState({
  office: '',
  platformPositions: [],
  experience: '',
  // ...
});

// Steps are similar:
// 1. Basic Info (like poll title/description)
// 2. Add Items (like poll options - but for positions!)
// 3. Settings (like poll settings)
// 4. Review & Submit
```

### **Pattern 2: Dynamic List Builder**

Your poll options builder is exactly what you need:

**Reference:** `web/features/polls/components/CreatePollForm.tsx`

**Adapt it for platform positions:**
```tsx
const [positions, setPositions] = useState<PlatformPosition[]>([]);

const addPosition = () => {
  setPositions([...positions, {
    id: generateId(),
    title: '',
    position: '',
    description: '',
    category: 'general',
    priority: 'medium'
  }]);
};

const removePosition = (id: string) => {
  setPositions(positions.filter(p => p.id !== id));
};

const updatePosition = (id: string, updates: Partial<PlatformPosition>) => {
  setPositions(positions.map(p => 
    p.id === id ? { ...p, ...updates } : p
  ));
};
```

### **Pattern 3: Server Action (Copy from Poll Creation!)**

**Reference:** `web/app/actions/create-poll.ts`

**Adapt it:**
```typescript
// web/app/actions/declare-candidacy.ts
export const declareCandidacy = createSecureServerAction(
  async (formData: FormData, context: ServerActionContext) => {
    const user = await getAuthenticatedUser(context);
    const supabase = await getSupabaseServerClient();
    
    // Validate
    const office = formData.get('office');
    const candidateName = formData.get('candidateName');
    // ... validate fields
    
    // Insert
    const { data, error } = await supabase
      .from('candidate_platforms')
      .insert({
        user_id: user.userId,
        office,
        candidate_name: candidateName,
        platform_positions: [],
        status: 'active',
        verified: false
      })
      .select()
      .single();
    
    if (error) throw new Error('Failed to declare candidacy');
    return { success: true, platformId: data.id };
  }
);
```

---

## 🔗 Integration Checklist

### **Existing Systems to Leverage:**

- [x] **User Profiles** - Already have user accounts
- [x] **Poll Creation Wizard** - Perfect template for platform builder
- [x] **Form Validation** - Reuse validation patterns
- [x] **Server Actions** - Same security model
- [x] **Civics Database** - Office/district data already available
- [x] **Alternative Candidates Display** - Component ready, just needs data

### **New Things to Build:**

- [ ] Database table (`candidate_platforms`)
- [ ] API endpoints (declare, get, update)
- [ ] Declaration wizard page
- [ ] Platform builder component
- [ ] Candidate dashboard
- [ ] Connect alternative candidates to real data
- [ ] "Run for Office" button

---

## 🎯 Success Metrics

### **User Goals:**
- ✅ Users can declare candidacy in < 10 minutes
- ✅ Platform builder is intuitive (similar to poll creation)
- ✅ Candidates appear automatically in civics pages
- ✅ Voters can discover and compare candidates easily

### **Technical Goals:**
- ✅ Reuse existing patterns (poll creation, forms, validation)
- ✅ Leverage existing infrastructure (auth, database, civics)
- ✅ Secure (same security model as polls)
- ✅ Scalable (works for all office levels)

---

## 🚀 Getting Started (For New Developers)

### **Step 1: Study Existing Code**
1. **Read:** `web/app/(app)/polls/create/page.tsx` - This is your template!
2. **Read:** `web/app/actions/create-poll.ts` - Server action pattern
3. **Read:** `web/components/civics/CandidateAccountabilityCard.tsx` - Where candidates will appear

### **Step 2: Start Small**
1. **Create database table** (copy structure above)
2. **Create one API endpoint** (`POST /api/candidate/declare`)
3. **Create simple form** (just office selection first)

### **Step 3: Iterate**
1. Add platform positions (copy from poll options)
2. Add candidate dashboard
3. Connect to alternative candidates display

### **Step 4: Test & Refine**
1. Test with real users
2. Get feedback
3. Improve UX based on usage

---

## 💬 Why This Makes Sense

1. **You already built most of it!** Poll creation = Platform builder pattern
2. **Natural fit** - Your civics system already shows alternatives
3. **Lowers barriers** - Makes running for office accessible
4. **Network effects** - More candidates = more engaged voters
5. **Differentiation** - No other platform does this!

---

## 📝 Next Steps

1. **Review this design** with your team
2. **Start with Phase 1** (database + basic API)
3. **Reuse poll creation patterns** (don't reinvent!)
4. **Iterate quickly** (get basic version working first)

---

**Remember:** You're not building from scratch. You're extending patterns you already have! 🚀

**Last Updated:** January 30, 2025

