# Privacy-First User Profile System

## 🎯 **Overview**

A comprehensive user profile system designed with privacy as the core principle, featuring anonymous-by-default design, bot resistance, and GDPR compliance.

## 🔒 **Core Principles**

### **1. Data Minimization**
- **Anonymous by Default**: Users start at Tier 0 (anonymous) with no personal data required
- **Optional Data**: All personal information is opt-in and user-controlled
- **Broad Categories**: Exact data (age, location, income) is converted to broad ranges

### **2. Pseudonymity**
- **No Email Required**: Users can participate without providing email addresses
- **Pseudonym Support**: Optional pseudonyms for user identification
- **Stable IDs**: Internal stable identifiers that don't reveal personal information

### **3. Granular Privacy Controls**
- **Profile Visibility**: Anonymous, Pseudonymous, or Public
- **Data Sharing Levels**: Minimal, Demographic, or Full
- **User Control**: Users decide what data to share and with whom

### **4. Bot Resistance**
- **Trust Tiers**: Progressive verification system (T0-T3)
- **Verification Challenges**: CAPTCHA, behavior analysis, social verification
- **Suspicious Activity Detection**: Pattern analysis and rate limiting

## 🏗️ **Architecture**

### **Database Schema**

#### **Core Tables**
```sql
-- Enhanced Users Table
ia_users (
    stable_id TEXT UNIQUE,
    pseudonym_hash TEXT UNIQUE, -- Optional
    trust_tier trust_tier DEFAULT 'T0',
    verification_score INTEGER DEFAULT 0,
    is_suspicious BOOLEAN DEFAULT FALSE
)

-- Optional Profile Data
user_profiles (
    user_stable_id TEXT REFERENCES ia_users(stable_id),
    profile_visibility profile_visibility DEFAULT 'anonymous',
    data_sharing_level data_sharing_level DEFAULT 'minimal',
    age_range TEXT, -- '18-24', '25-34', etc.
    education_level TEXT, -- 'high_school', 'college', etc.
    income_bracket TEXT, -- 'low', 'middle', 'high'
    region_code TEXT, -- Broad region only
    interests_encrypted TEXT -- Encrypted interests
)
```

#### **Bot Resistance Tables**
```sql
-- Device Fingerprinting
device_fingerprints (
    user_stable_id TEXT,
    fingerprint_hash TEXT,
    ip_hash TEXT, -- Hashed IP for rate limiting
    is_suspicious BOOLEAN
)

-- Verification Challenges
verification_challenges (
    user_stable_id TEXT,
    challenge_type TEXT, -- 'captcha', 'behavior', 'social'
    challenge_data JSONB,
    completed BOOLEAN,
    score INTEGER
)

-- Rate Limiting
rate_limits (
    identifier TEXT, -- ip_hash or user_stable_id
    action_type TEXT, -- 'vote', 'login', 'profile_update'
    count INTEGER,
    is_blocked BOOLEAN
)
```

### **Trust Tiers**

#### **Tier 0: Anonymous (Default)**
- **Access**: Basic polls, view results
- **Verification**: WebAuthn device only
- **Data**: Minimal pseudonym, no personal info
- **Bot Resistance**: Rate limiting, device fingerprinting

#### **Tier 1: Verified Human**
- **Access**: All polls, demographic insights
- **Verification**: WebAuthn + CAPTCHA + behavior analysis
- **Data**: Optional broad demographics (age range, region)
- **Bot Resistance**: CAPTCHA, behavior patterns, time-based challenges

#### **Tier 2: Trusted Participant**
- **Access**: Premium polls, detailed analytics
- **Verification**: Tier 1 + social proof + consistency checks
- **Data**: Optional detailed demographics (encrypted)
- **Bot Resistance**: Social verification, voting consistency, reputation system

#### **Tier 3: Validator**
- **Access**: Poll creation, moderation tools
- **Verification**: Tier 2 + identity verification (optional)
- **Data**: Required minimal identity (encrypted)
- **Bot Resistance**: Multi-factor verification, community trust

## 🔧 **Implementation**

### **Privacy Service**

The `PrivacyService` handles data anonymization and privacy controls:

```go
type PrivacyService struct {
    encryptionKey []byte
}

// Key Methods:
- HashPseudonym(pseudonym, salt) string
- AnonymizeLocation(location) string
- AnonymizeAge(age) string
- EncryptData(data) string
- CreatePublicProfile(user, profile, reputation) *PublicUserProfile
```

### **Bot Resistance Service**

The `BotResistanceService` handles verification and suspicious activity detection:

```go
type BotResistanceService struct {
    privacyService *PrivacyService
}

// Key Methods:
- CreateCaptchaChallenge(userID) *VerificationChallenge
- CreateBehaviorChallenge(userID) *VerificationChallenge
- DetectSuspiciousActivity(userID, logs) (bool, float64, error)
- CalculateTrustScore(user, challenges, verifications) int
```

### **Verification Challenges**

#### **CAPTCHA Challenges**
- Simple math problems
- 10-minute expiry
- 10 points for completion

#### **Behavior Challenges**
- Mouse movement analysis
- Keyboard pattern detection
- Timing analysis
- 5-minute expiry
- 7+ points to pass

#### **Social Challenges**
- User endorsements
- Invitation verification
- 24-hour expiry
- 20 points for verification

## 🛡️ **Security Features**

### **Data Protection**
- **Encryption**: Sensitive data encrypted at rest
- **Hashing**: IP addresses and pseudonyms hashed
- **Anonymization**: Personal data converted to broad categories
- **Retention Policies**: Automatic data cleanup

### **Bot Detection**
- **Rate Limiting**: Per-action and per-user limits
- **Device Fingerprinting**: Track suspicious device patterns
- **Behavior Analysis**: Detect non-human patterns
- **Suspicious Activity Scoring**: Multi-factor analysis

### **Privacy Controls**
- **Data Deletion**: Complete user data removal
- **Partial Deletion**: Selective data removal
- **Privacy Settings**: Granular control over data sharing
- **Audit Logs**: Track data access and changes

## 📊 **Data Flow**

### **User Registration**
1. **WebAuthn Authentication**: Device-based authentication
2. **Optional Pseudonym**: User can choose a pseudonym
3. **Device Fingerprinting**: Collect device info for bot detection
4. **Tier 0 Assignment**: Start as anonymous user

### **Profile Creation**
1. **Privacy Settings**: User chooses visibility and sharing levels
2. **Optional Demographics**: User can provide broad demographic info
3. **Data Anonymization**: Exact data converted to ranges
4. **Encryption**: Sensitive data encrypted before storage

### **Tier Upgrades**
1. **Verification Challenges**: Complete required challenges
2. **Trust Score Calculation**: Based on challenges and consistency
3. **Tier Assignment**: Automatic tier assignment based on score
4. **Access Grant**: New features unlocked based on tier

## 🔄 **API Endpoints**

### **User Management**
```
POST /api/users - Create new user
GET /api/users/{id} - Get user profile
PUT /api/users/{id} - Update user profile
DELETE /api/users/{id} - Delete user data
```

### **Verification**
```
POST /api/verification/challenges - Create verification challenge
PUT /api/verification/challenges/{id} - Complete challenge
GET /api/verification/status - Get verification status
```

### **Privacy**
```
POST /api/privacy/deletion-request - Request data deletion
GET /api/privacy/settings - Get privacy settings
PUT /api/privacy/settings - Update privacy settings
```

## 🚀 **Next Steps**

### **Phase 1: Core Implementation**
- [ ] Complete Go service implementation
- [ ] Add API endpoints
- [ ] Implement database migrations
- [ ] Add unit tests

### **Phase 2: Frontend Integration**
- [ ] Create profile management UI
- [ ] Implement verification challenge UI
- [ ] Add privacy controls interface
- [ ] Create tier upgrade flow

### **Phase 3: Advanced Features**
- [ ] Implement differential privacy
- [ ] Add zero-knowledge proofs
- [ ] Create federated learning system
- [ ] Add advanced bot detection

## 📋 **Compliance**

### **GDPR Compliance**
- **Right to Deletion**: Complete data removal capability
- **Data Portability**: Export user data in standard format
- **Consent Management**: Granular consent controls
- **Audit Trails**: Track all data processing activities

### **Privacy by Design**
- **Default Privacy**: Anonymous by default
- **Minimal Collection**: Only collect necessary data
- **User Control**: Users control their data
- **Transparency**: Clear privacy policies and practices

## 🔍 **Monitoring & Analytics**

### **Privacy Metrics**
- **Data Minimization**: Track data collection levels
- **User Privacy Settings**: Monitor privacy preference distribution
- **Deletion Requests**: Track data deletion frequency
- **Compliance**: Monitor GDPR compliance

### **Security Metrics**
- **Bot Detection**: Track suspicious activity rates
- **Verification Success**: Monitor challenge completion rates
- **Trust Score Distribution**: Track user trust levels
- **Rate Limiting**: Monitor abuse prevention effectiveness

---

**This system provides a robust foundation for privacy-first user profiles while maintaining strong bot resistance and compliance with privacy regulations.**
