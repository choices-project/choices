# 🧪 Choices System Testing Guide

This guide provides comprehensive testing instructions for the Choices voting system, including sample data population and feature verification.

## 🚀 Quick Start

### 1. Start the Services
```bash
# Kill any existing processes
lsof -i :8081 | awk 'NR!=1 {print $2}' | xargs kill -9
lsof -i :8082 | awk 'NR!=1 {print $2}' | xargs kill -9

# Start IA service
cd server/ia && go run ./cmd/ia &

# Start PO service  
cd ../po && go run ./cmd/po &

# Verify services are running
curl http://localhost:8081/healthz
curl http://localhost:8082/healthz
```

### 2. Populate Sample Data
```bash
# Make scripts executable
chmod +x scripts/populate_sample_data.sh
chmod +x scripts/test_system.sh

# Populate with sample data
./scripts/populate_sample_data.sh
```

### 3. Test the System
```bash
# Run comprehensive tests
./scripts/test_system.sh
```

## 📊 Sample Data Overview

The system is populated with realistic sample data including:

### **Sample Polls**
1. **Climate Action Priorities 2024** (1,200 votes)
   - Renewable Energy Investment
   - Carbon Tax Implementation  
   - Public Transportation
   - Green Building Standards

2. **Technology Development Priorities** (980 votes)
   - Artificial Intelligence
   - Quantum Computing
   - Cybersecurity
   - Blockchain Technology

3. **Community Budget Allocation** (750 votes)
   - Education & Schools
   - Public Safety
   - Parks & Recreation
   - Infrastructure

4. **Healthcare Access Improvement** (1,100 votes)
   - Telemedicine Expansion
   - Mental Health Services
   - Preventive Care
   - Emergency Services

### **Analytics Data**
- **Geographic Distribution**: 6 regions, 5 countries
- **Demographics**: Age groups, gender, education, income
- **Engagement Metrics**: Active users, session duration, bounce rate
- **Voting Trends**: 7-day historical data
- **Real-time Activity**: Live voting events

## 🧪 Testing Checklist

### **Backend API Testing**

#### ✅ Health Checks
```bash
curl http://localhost:8081/healthz  # Should return "ok"
curl http://localhost:8082/healthz  # Should return "ok"
```

#### ✅ Poll Management
```bash
# List all polls
curl http://localhost:8082/api/v1/polls/list

# Get specific poll
curl "http://localhost:8082/api/v1/polls/get?id=climate-action-2024"

# Create new poll
curl -X POST http://localhost:8082/api/v1/polls \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Poll",
    "description": "A test poll",
    "options": ["Option 1", "Option 2"],
    "start_time": "2024-01-01T00:00:00Z",
    "end_time": "2024-12-31T23:59:59Z",
    "sponsors": ["Test Sponsor"]
  }'
```

#### ✅ Dashboard Analytics
```bash
# Main dashboard data
curl http://localhost:8082/api/v1/dashboard

# Poll-specific metrics
curl "http://localhost:8082/api/v1/dashboard/metrics?poll_id=climate-action-2024"

# Geographic data
curl http://localhost:8082/api/v1/dashboard/geographic

# Demographics
curl http://localhost:8082/api/v1/dashboard/demographics

# Engagement metrics
curl http://localhost:8082/api/v1/dashboard/engagement

# Voting trends
curl "http://localhost:8082/api/v1/dashboard/trends?days=7"
```

#### ✅ Voting System
```bash
# Get voting token (from IA service)
curl -X POST http://localhost:8081/api/v1/tokens \
  -H "Content-Type: application/json" \
  -d '{
    "user_stable_id": "test-user-123",
    "poll_id": "climate-action-2024",
    "tier": "T1",
    "scope": "poll:climate-action-2024"
  }'

# Submit vote (to PO service)
curl -X POST "http://localhost:8082/api/v1/votes?poll_id=climate-action-2024" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "mock-token",
    "tag": "mock-tag",
    "choice": 0
  }'

# Get vote tally
curl "http://localhost:8082/api/v1/tally?poll_id=climate-action-2024"
```

### **Frontend Testing**

#### ✅ Web Interface
1. **Start the web app**:
   ```bash
   cd web && npm run dev
   ```
2. **Navigate to**: `http://localhost:3000`
3. **Test features**:
   - Home page with features overview
   - Dashboard with real-time analytics
   - Polls list and voting
   - Results display
   - Theme switching (light/dark)

#### ✅ Mobile App
1. **Start Expo**:
   ```bash
   cd mobile && npx expo start --port 8083
   ```
2. **Test on device**:
   - Scan QR code with Expo Go app
   - Test all screens and navigation
   - Verify API connectivity
   - Test voting flow

### **Feature Testing**

#### ✅ Real-time Dashboard
- [ ] Live vote counts updating
- [ ] Geographic heatmap
- [ ] Demographic breakdowns
- [ ] Engagement metrics
- [ ] Recent activity feed

#### ✅ Voting System
- [ ] Token acquisition from IA
- [ ] Vote submission to PO
- [ ] Vote verification
- [ ] Tally generation
- [ ] Merkle commitment verification

#### ✅ Analytics & Reporting
- [ ] Poll-specific metrics
- [ ] Geographic distribution
- [ ] Demographic analysis
- [ ] Trend visualization
- [ ] Export functionality

#### ✅ Security Features
- [ ] Rate limiting
- [ ] Token verification
- [ ] Audit logging
- [ ] Privacy protection

## 🔧 Troubleshooting

### **Common Issues**

#### Service Won't Start
```bash
# Check if ports are in use
lsof -i :8081
lsof -i :8082

# Kill processes and restart
lsof -i :8081 | awk 'NR!=1 {print $2}' | xargs kill -9
lsof -i :8082 | awk 'NR!=1 {print $2}' | xargs kill -9
```

#### API Errors
```bash
# Check service logs
# IA service should show: "IA listening on :8081"
# PO service should show: "PO listening on :8082"

# Test endpoints individually
curl -v http://localhost:8081/healthz
curl -v http://localhost:8082/healthz
```

#### Mobile App Issues
```bash
# Clear Expo cache
cd mobile && npx expo start --clear

# Check network configuration
# Ensure phone and computer are on same WiFi
# Verify IP address in mobile/src/services/api.ts
```

### **Performance Testing**

#### Load Testing
```bash
# Test with multiple concurrent requests
for i in {1..10}; do
  curl http://localhost:8082/api/v1/dashboard &
done
wait
```

#### Memory Usage
```bash
# Monitor service memory usage
ps aux | grep -E "(ia|po)" | grep -v grep
```

## 📈 Expected Results

### **Dashboard Metrics**
- **Total Polls**: 5
- **Active Polls**: 4  
- **Total Votes**: ~5,530
- **Total Users**: ~3,200
- **Average Participation**: ~79.4%

### **Geographic Distribution**
- **North America**: ~32.5%
- **Europe**: ~21.7%
- **Asia**: ~16.3%
- **Oceania**: ~10.8%
- **South America**: ~9.0%
- **Africa**: ~9.6%

### **Demographics**
- **Age Groups**: 18-25 (26%), 26-35 (44%), 36-45 (37%), 46-55 (28%), 55+ (18%)
- **Gender**: Male (57%), Female (50%), Other (9%)
- **Education**: High School (34%), Bachelors (69%), Masters (28%), PhD (10%)

## 🎯 Next Steps

After successful testing:

1. **Commit changes** to version control
2. **Document any issues** found
3. **Plan improvements** based on testing results
4. **Move to Phase 10**: Advanced Analytics & Predictive Modeling

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review service logs for error messages
3. Verify all dependencies are installed
4. Ensure network connectivity for mobile testing

---

**Happy Testing! 🎉**

