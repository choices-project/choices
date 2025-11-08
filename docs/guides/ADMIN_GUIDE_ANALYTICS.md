# Admin Guide: Analytics Dashboard

**Last Updated**: November 5, 2025  
**For**: Platform Administrators  
**Access**: Admin-only (cost considerations)

---

## 🎯 Overview

The Analytics Dashboard provides comprehensive insights into platform engagement, user behavior, and poll performance. Access is restricted to administrators due to query costs and data sensitivity.

---

## 🔐 Getting Access

### Verify Admin Status

1. **Check Your User Metadata** (Supabase Dashboard)
   - Navigate to: Authentication → Users
   - Find your user
   - Click "Edit"
   - Add to `app_metadata`:
     ```json
     {
       "role": "admin"
     }
     ```

2. **Alternative: Admin Email Domain**
   - Use email ending in `@choices-admin.com`
   - Automatically granted admin access

3. **Test Access**
   - Visit: `/admin/analytics`
   - Should see analytics dashboard
   - If blocked: Check metadata above

---

## 📊 Available Visualizations

### 1. District Engagement Heatmap 🗺️

**Purpose**: See which congressional districts are most engaged

**Features**:
- Color-coded engagement (green → yellow → red)
- State filter
- Level filter (federal/state/local)
- Min count slider (k-anonymity protection)
- Top 5 most engaged districts
- CSV export

**How to Use**:
1. Select state from dropdown (or "All States")
2. Choose level (federal/state/local)
3. Adjust min count (default: 5 users minimum)
4. Click "Refresh" to update
5. Click "Export CSV" to download data

**Insights**:
- Identify high-engagement areas
- Plan district-specific campaigns
- Understand geographic reach

---

### 2. Poll Engagement Heatmap 🔥

**Purpose**: See which polls are "hot" right now

**Features**:
- Engagement intensity (❄️ cool → 🚀 on fire)
- Category filter
- Top 5 most engaged polls
- Active/closed status
- CSV export

**How to Use**:
1. Select category (Politics, Environment, etc.)
2. Choose number of polls to show (10/20/50)
3. Click "Refresh" to update
4. Click "Export CSV" to download

**Insights**:
- Identify trending topics
- See what resonates with users
- Spot viral polls early

**Emoji Guide**:
- ❄️ Cool (<25% of max) - Low engagement
- 🌤️ Warming (25-50%) - Growing interest
- 🔥 Hot (50-75%) - High engagement
- 🚀 On Fire (>75%) - Viral!

---

### 3. Activity Trends Chart 📈

**Purpose**: Historical trends over time

**Features**:
- Line or Area chart
- Date ranges (7d/30d/90d)
- Metrics: Votes, Participation %, Velocity
- Trend indicators (↑ / ↓)
- CSV export

**How to Use**:
1. Select date range
2. Choose chart type (line/area)
3. Click "Refresh" to update
4. Hover for details
5. Export to analyze in Excel

**Insights**:
- Growth trends
- Seasonal patterns
- Engagement velocity
- Forecast future activity

---

### 4. Demographics Breakdown 👥

**Purpose**: Understand your user base

**Features**:
- 4 tabs: Trust Tiers, Age, Districts, Education
- Pie and Bar charts
- Privacy protected (k-anonymity)
- Shows opt-out count
- CSV export

**How to Use**:
1. Click tabs to switch views
2. Review distribution charts
3. Check opt-out numbers
4. Export for reporting

**Privacy Note**:
- Only shows users who opted in
- Categories <5 users are hidden
- Individual users cannot be identified

**Insights**:
- User demographics makeup
- Trust tier distribution
- Age group targeting
- District concentration

---

### 5. Temporal Analysis ⏰

**Purpose**: When are users most active?

**Features**:
- 24-hour activity pattern
- Day-of-week breakdown
- Engagement velocity
- Peak time identification

**How to Use**:
1. Switch tabs: Hourly / Daily / Velocity
2. Observe color-coded heatmap
3. Note peak times
4. Plan content timing accordingly

**Insights**:
- Best times to post polls
- User timezone patterns
- Weekend vs weekday engagement
- Activity velocity trends

---

### 6. Trust Tier Comparison 🏆

**Purpose**: Compare behavior across trust tiers

**Features**:
- Participation by tier
- Engagement scores
- Bot likelihood indicators
- Radar overview
- Key insights

**How to Use**:
1. Review participation rates
2. Check engagement scores
3. Monitor bot risk
4. Read automated insights

**Insights**:
- T3 users drive quality engagement
- Bot detection effectiveness
- Tier progression patterns
- Platform trust health

---

## 💡 Best Practices

### Daily Review (5 minutes)
1. Check overview metrics
2. Look at poll heatmap (spot trending topics)
3. Review trust tier distribution
4. Note any unusual patterns

### Weekly Analysis (30 minutes)
1. Export all charts to CSV
2. Analyze trends over 7 days
3. Compare to previous week
4. Identify improvement areas

### Monthly Reporting (2 hours)
1. Generate all exports
2. Create summary report
3. Share insights with team
4. Plan next month's strategy

---

## 📥 Export Guide

### CSV Export
- **Best for**: Data analysis in Excel/Sheets
- **How**: Click "Export" on any chart
- **Format**: Comma-separated values
- **Use**: Pivot tables, custom charts

### Batch Export
- **Coming Soon**: Export all charts at once
- **Format**: ZIP file with multiple CSVs
- **Schedule**: Daily/weekly automated exports

### Privacy Note
All exports respect k-anonymity and exclude opted-out users.

---

## 🔒 Privacy & Security

### K-Anonymity Protection
- **What**: Minimum 5 users per group
- **Why**: Prevents individual identification
- **Example**: Won't show "1 user in CA-12"

### Opt-Out Respect
- Users who disabled analytics are excluded
- Count shown in demographics chart
- Transparency about privacy choices

### Access Logging
- All analytics access is logged
- Audit trail for compliance
- Review in audit logs section

### Data Retention
- Analytics data cached for 5 minutes
- Raw data stored according to privacy policy
- User can request deletion anytime

---

## ⚠️ Cost Considerations

### Why Admin-Only?
- Analytics queries are expensive at scale
- Complex aggregations use database resources
- Want to keep platform free for users
- Admins understand cost/benefit

### Future Access
- **T3 (Elite) users**: May get limited analytics
- **T2 users**: May get basic metrics
- **Decision pending**: Based on costs and value

---

## 🎯 Using Analytics for Action

### Scenario 1: Low Engagement Poll
1. Check poll heatmap
2. Find polls with low engagement (❄️ cool)
3. Review topic and timing
4. Consider:
   - Is topic too niche?
   - Posted at wrong time? (check temporal)
   - Wrong district? (check district heatmap)

### Scenario 2: Suspicious Activity
1. Check trust tier comparison
2. Look for unusual bot likelihood spikes
3. Review temporal patterns (bots are often 24/7)
4. Investigate specific accounts if needed

### Scenario 3: Planning New Campaign
1. Check district heatmap (where are users?)
2. Check temporal analysis (when are they active?)
3. Check demographics (who are they?)
4. Target content accordingly

---

## 🚀 Advanced Features (Coming Soon)

### Custom Dashboards
- Drag-and-drop widgets
- Save custom layouts
- Share with other admins

### Query Builder
- Build custom SQL queries
- Visual interface
- Save frequent queries

### Scheduled Reports
- Daily/weekly email reports
- Automated exports
- Alert notifications

### Real-Time Updates
- Live charts (WebSocket)
- Instant notifications
- Event-driven alerts

---

## 📚 Related Documentation

- **Privacy Policy**: `/docs/PRIVACY_POLICY.md`
- **Database Schema**: `/docs/DATABASE_SCHEMA.md`
- **Analytics Architecture**: `/docs/ANALYTICS_ARCHITECTURE.md`
- **Developer Guide**: `/DEVELOPER_GUIDANCE.md`

---

## 🆘 Troubleshooting

### Problem: "Access Denied"
**Solutions**:
1. Check admin role in Supabase
2. Verify email domain
3. Contact system administrator
4. Check browser console for errors

### Problem: "Charts Not Loading"
**Solutions**:
1. Check internet connection
2. Refresh page (Ctrl+R / Cmd+R)
3. Clear browser cache
4. Try different browser
5. Check if API endpoints are running

### Problem: "No Data Displayed"
**Solutions**:
1. May be too early (not enough data yet)
2. Check filters (too restrictive?)
3. Adjust min count slider
4. Verify database has data

### Problem: "Export Not Working"
**Solutions**:
1. Check popup blocker
2. Allow downloads in browser
3. Check disk space
4. Try different export format

---

## 💬 Feedback

### Using the Enhanced Feedback Console
- View the **Console Logs** section inside each feedback detail to audit browser messages captured at submit time (capped at 100 entries with timestamps and severity).
- Look for **red badges** on realtime notifications—these indicate high-severity console activity or error bursts.
- Filter by sentiment/priority to triage urgent issues first; console entries help reproduce the exact user journey.

Have suggestions for new analytics features?
- Use the feedback widget
- Tag as "Analytics"
- We read all feedback!

Want new chart types?
- Let us know what you need
- We can add custom visualizations
- Community-driven development

---

**Happy Analyzing!** 📊

Your insights help make Choices Platform better for everyone. 🎉


