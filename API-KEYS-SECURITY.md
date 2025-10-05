# API Keys Security Guide

## 🚨 **NEVER COMMIT API KEYS**

### **Environment Variables (.env.local)**
All API keys should be stored in `.env.local` and **NEVER committed to git**.

```bash
# Required API Keys
OPEN_STATES_API_KEY=your_openstates_key_here
GOOGLE_CIVIC_API_KEY=your_google_civic_key_here
CONGRESS_GOV_API_KEY=your_congress_gov_key_here
FEC_API_KEY=your_fec_key_here
LEGISCAN_API_KEY=your_legiscan_key_here

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 🔐 **Security Best Practices**

### **✅ DO**
- Store all API keys in `.env.local`
- Use `process.env.API_KEY_NAME` in code
- Add `.env.local` to `.gitignore`
- Use environment variables in production
- Rotate API keys regularly

### **❌ DON'T**
- Hardcode API keys in source code
- Commit `.env.local` to git
- Share API keys in chat/email
- Use the same key across environments
- Leave API keys in comments

## 📋 **Current API Keys Status**

### **✅ Configured**
- **OpenStates API** - Working
- **Google Civic API** - Working  
- **Congress.gov API** - Working
- **FEC API** - Working
- **LegiScan API** - Working (added to .env.local)

### **🔑 API Key Sources**
- **OpenStates**: https://openstates.org/api/register/
- **Google Civic**: https://developers.google.com/civic-information
- **Congress.gov**: https://api.congress.gov/
- **FEC**: https://api.open.fec.gov/
- **LegiScan**: https://legiscan.com/legiscan/ (free tier)

## 🚀 **Usage Guidelines**

### **Rate Limits**
- **OpenStates**: 1,000 requests/day
- **Google Civic**: 25,000 requests/day
- **Congress.gov**: 5,000 requests/day
- **FEC**: 1,200 requests/hour
- **LegiScan**: 30,000 requests/month (free tier)

### **Respectful Usage**
- Add delays between API calls
- Check rate limits before making requests
- Cache results to avoid duplicate calls
- Use conservative batch sizes
- Monitor usage regularly

## 🔍 **Code Examples**

### **✅ Correct Usage**
```typescript
const apiKey = process.env.LEGISCAN_API_KEY;
if (!apiKey) {
  devLog('LegiScan API key not configured');
  return {};
}
```

### **❌ Incorrect Usage**
```typescript
// NEVER DO THIS
const apiKey = 'your_actual_api_key_here';
```

## 🛡️ **Security Checklist**

- [ ] All API keys in `.env.local`
- [ ] `.env.local` in `.gitignore`
- [ ] No hardcoded keys in source code
- [ ] Environment variables used in production
- [ ] API keys rotated regularly
- [ ] Usage monitoring enabled
- [ ] Rate limiting implemented
- [ ] Error handling for missing keys

## 🚨 **If API Key is Compromised**

1. **Immediately rotate the key**
2. **Check usage logs for abuse**
3. **Update all environments**
4. **Notify team members**
5. **Review access logs**
6. **Implement additional monitoring**

## 📞 **Support**

If you need help with API key management:
- Check the API provider's documentation
- Contact the API provider's support
- Review our internal security guidelines
- Ask the development team for assistance
