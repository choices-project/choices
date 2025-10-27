# 🗳️ Choices Platform Specifics

**Platform-Specific Guidance for Democratic Engagement Development**

---

## 📋 Overview

This guide provides Choices platform-specific guidance for AI agents working on the democratic engagement platform.

**Last Updated**: October 27, 2025  
**Status**: Production Ready  
**Focus**: Democratic engagement, civic participation, polling

---

## 🎯 Platform Architecture

### **Core Components**
- **Frontend**: Next.js 15 App Router with TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **Civics Backend**: Standalone service for data ingestion
- **AI Integration**: Ollama + Hugging Face for analytics
- **Authentication**: WebAuthn/passkeys + social auth
- **Deployment**: Vercel with automated CI/CD

### **Key Features**
- **Polling System**: Create, vote, share polls with hashtags
- **Civics Integration**: Representative lookup, geographic services
- **Analytics**: AI-powered insights and data visualization
- **Admin Panel**: Content moderation, user management
- **Security**: Trust tiers, RLS policies, anonymous access

---

## 🧪 Testing Strategy

### **Essential Test Commands**
```bash
# Core platform functionality
npm run test:user-journey-complete      # Complete user experience
npm run test:admin-journey-complete     # Admin functionality
npm run test:platform-journey-modern    # Modern platform features
npm run test:real-database-activity     # Database connectivity

# Security and authentication
npm run test:security                   # Security audit
npm run test:auth-security              # Authentication security

# Both journeys together
npm run test:both-journeys-complete     # Complete platform test
```

### **Test Categories**
1. **User Journey**: Poll creation, voting, sharing, hashtags
2. **Admin Journey**: Moderation, analytics, user management
3. **Civics Backend**: Representative lookup, data ingestion
4. **Security**: Authentication, RLS, trust tiers
5. **Database**: Real database activity and connectivity

---

## 🔒 Security Considerations

### **Authentication**
- **WebAuthn/Passkeys**: Primary authentication method
- **Social Auth**: Google, GitHub as fallback
- **Session Management**: Secure session handling
- **Trust Tiers**: Verified, Established, New, Anonymous

### **Data Protection**
- **RLS Policies**: Row-level security for all tables
- **Anonymous Access**: Public polls accessible without auth
- **Privacy Protection**: Differential privacy for analytics
- **Secret Management**: No hardcoded secrets

### **API Security**
- **Rate Limiting**: Prevent abuse
- **Input Validation**: Zod schema validation
- **CORS Configuration**: Proper cross-origin setup
- **Error Handling**: No sensitive data exposure

---

## 🏛️ Civics Backend

### **Data Sources**
- **OpenStates**: State legislative data
- **Google Civic Information**: Representative lookup
- **Congress.gov**: Federal legislative data
- **FEC**: Campaign finance data

### **Key Functions**
- **Representative Lookup**: Find representatives by address
- **Geographic Services**: District mapping, boundaries
- **Data Ingestion**: Automated data pipeline
- **Health Monitoring**: Service health checks

### **Testing Civics**
```bash
# Test civics backend health
npm run test:civics-backend-health

# Test representative lookup
npm run test:representative-lookup

# Test data ingestion
npm run test:data-ingestion
```

---

## 📊 Analytics & AI

### **AI Integration**
- **Ollama**: Local AI for analytics
- **Hugging Face**: Pre-trained models
- **Google Colab Pro**: Execution environment
- **Transparency**: Open-source, auditable AI

### **Analytics Features**
- **Poll Analytics**: Vote patterns, demographics
- **Trust Tier Analytics**: User behavior by trust level
- **Performance Telemetry**: System performance metrics
- **Data Visualization**: Charts, graphs, insights

### **Testing Analytics**
```bash
# Test AI integration
npm run test:ai-integration

# Test analytics endpoints
npm run test:analytics-endpoints

# Test data visualization
npm run test:data-visualization
```

---

## 🗳️ Polling System

### **Core Features**
- **Poll Creation**: Title, description, options, privacy
- **Voting**: Single choice, multiple choice, ranked
- **Results**: Real-time results with privacy protection
- **Sharing**: Social sharing, hashtag integration
- **Trending**: Popular polls, hashtag trends

### **Privacy Levels**
- **Public**: Visible to all users
- **Authenticated**: Requires login to view
- **Private**: Only creator can view
- **Anonymous**: No user tracking

### **Testing Polls**
```bash
# Test poll creation
npm run test:poll-creation

# Test voting functionality
npm run test:voting-system

# Test results display
npm run test:poll-results

# Test sharing features
npm run test:poll-sharing
```

---

## 👥 User Management

### **Trust Tiers**
- **Verified**: Highest trust, verified identity
- **Established**: Good standing, regular user
- **New**: Recently registered user
- **Anonymous**: No account, limited access

### **Admin Functions**
- **User Management**: Promote/demote trust tiers
- **Content Moderation**: Review and moderate content
- **Analytics Dashboard**: Platform insights
- **System Status**: Monitor platform health

### **Testing User Management**
```bash
# Test trust tier system
npm run test:trust-tiers

# Test admin functionality
npm run test:admin-management

# Test user promotion
npm run test:user-promotion
```

---

## 🔧 Development Patterns

### **Component Structure**
```typescript
// Feature-based organization
features/
├── auth/           # Authentication
├── polls/          # Polling system
├── analytics/      # Analytics and AI
├── civics/         # Civic engagement
└── admin/          # Admin functionality
```

### **API Patterns**
```typescript
// Consistent API structure
app/api/
├── auth/           # Authentication endpoints
├── polls/          # Polling endpoints
├── analytics/      # Analytics endpoints
├── civics/         # Civics endpoints
└── admin/          # Admin endpoints
```

### **Database Patterns**
```sql
-- RLS policies for all tables
CREATE POLICY "policy_name" ON table_name
FOR operation TO role
USING (condition);

-- Trust tier integration
ALTER TABLE table_name 
ADD COLUMN trust_tier TEXT DEFAULT 'new';
```

---

## 🚨 Common Issues

### **Authentication Issues**
- **WebAuthn not working**: Check HTTPS, browser support
- **Session expiration**: Implement proper session refresh
- **Trust tier problems**: Verify RLS policies

### **Civics Backend Issues**
- **API rate limits**: Implement proper rate limiting
- **Data freshness**: Check data ingestion pipeline
- **Representative lookup**: Verify address formatting

### **Polling Issues**
- **Vote counting**: Check privacy protection
- **Real-time updates**: Verify WebSocket connections
- **Sharing problems**: Check social media integration

### **Database Issues**
- **RLS policies**: Verify policy conditions
- **Connection errors**: Check Supabase configuration
- **Performance**: Optimize queries, add indexes

---

## 🎯 Best Practices

### **Code Quality**
- Use TypeScript strict mode
- Write comprehensive tests
- Follow established patterns
- Document complex logic
- Handle errors gracefully

### **Security**
- Never hardcode secrets
- Use proper authentication
- Implement RLS policies
- Validate all inputs
- Protect user privacy

### **Performance**
- Optimize database queries
- Use proper caching
- Implement pagination
- Monitor performance metrics
- Test under load

### **User Experience**
- Focus on accessibility
- Implement responsive design
- Provide clear feedback
- Handle edge cases
- Optimize for mobile

---

## 📚 Resources

### **Documentation**
- **API Documentation**: `/docs/API.md`
- **Database Schema**: `/docs/DATABASE.md`
- **Security Guide**: `/docs/SECURITY.md`
- **Testing Guide**: `/docs/TESTING.md`

### **External Resources**
- **Supabase**: [Documentation](https://supabase.com/docs)
- **Next.js**: [Documentation](https://nextjs.org/docs)
- **WebAuthn**: [Specification](https://www.w3.org/TR/webauthn-2/)
- **OpenStates**: [API Documentation](https://openstates.org/api/)

---

**Remember**: The Choices platform is about democratic engagement. Every feature should enhance civic participation and make democracy more accessible!
