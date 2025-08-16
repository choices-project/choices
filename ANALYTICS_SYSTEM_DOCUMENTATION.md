# Analytics System Documentation

## Overview

The Analytics System for the Choices platform provides comprehensive data visualization, insights, and reporting capabilities. It integrates seamlessly with the feature flags system and provides privacy-first analytics with minimal data collection.

## Architecture

### Core Components

1. **Analytics Page** (`web/app/analytics/page.tsx`)
   - Main analytics dashboard interface
   - Tabbed navigation for different analytics views
   - Real-time data visualization

2. **Analytics API** (`web/app/api/analytics/route.ts`)
   - RESTful API endpoints for analytics data
   - Feature flag integration
   - Data aggregation and processing

3. **Analytics Hook** (`web/hooks/useAnalytics.ts`)
   - Custom React hook for analytics functionality
   - Auto-refresh capabilities
   - Data export and reporting features

4. **Analytics Component** (`web/components/AnalyticsDashboard.tsx`)
   - Reusable analytics dashboard component
   - Configurable props for different use cases
   - Integration with feature flags

5. **PWA Analytics** (`web/lib/pwa-analytics.ts`)
   - Privacy-first analytics collection
   - Performance monitoring
   - Offline data collection

## Feature Flag Integration

The analytics system is controlled by the following feature flags:

- `analytics`: Enables/disables the entire analytics system
- `aiFeatures`: Enables advanced AI-powered analytics features

### Environment Variables

```bash
ENABLE_ANALYTICS=true
ENABLE_AI_FEATURES=true
```

## Analytics Views

### 1. Overview
- Key performance indicators
- Platform metrics summary
- Quick actions and insights

### 2. Trends
- Temporal analysis of voting patterns
- User activity trends
- Growth metrics

### 3. Demographics
- Age distribution analysis
- Geographic data visualization
- Device type breakdown
- Verification tier distribution

### 4. Performance
- Page load times
- API error rates
- User experience metrics
- Performance recommendations

### 5. Privacy
- Data collection metrics
- Privacy compliance status
- User consent tracking
- Anonymization levels

### 6. Engagement
- User engagement metrics
- Feature usage statistics
- Session duration analysis
- Retention rates

### 7. Advanced Analytics
- Predictive modeling (requires AI features)
- Statistical analysis
- AI-powered insights
- Advanced recommendations

## API Endpoints

### GET /api/analytics
Fetches analytics data based on query parameters.

**Query Parameters:**
- `type`: Analytics type (overview, trends, demographics, performance, privacy, engagement, advanced)
- `dateRange`: Date range filter (e.g., "30d", "7d", "1y")
- `pollId`: Specific poll filter
- `userType`: User type filter
- `deviceType`: Device type filter

**Response:**
```json
{
  "success": true,
  "data": {
    // Analytics data based on type
  },
  "featureEnabled": true,
  "timestamp": "2024-12-19T10:00:00Z"
}
```

### POST /api/analytics
Fetches analytics data with filters in request body.

**Request Body:**
```json
{
  "type": "overview",
  "filters": {
    "dateRange": "30d",
    "pollId": "all",
    "userType": "all",
    "deviceType": "all"
  }
}
```

## Usage Examples

### Basic Analytics Hook Usage

```typescript
import { useAnalytics } from '../hooks/useAnalytics';

function MyComponent() {
  const {
    data,
    loading,
    error,
    analyticsEnabled,
    fetchData,
    exportData
  } = useAnalytics({
    autoRefresh: true,
    refreshInterval: 30000
  });

  // Use analytics data
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      <h1>Analytics Dashboard</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
```

### Analytics Dashboard Component Usage

```typescript
import AnalyticsDashboard from '../components/AnalyticsDashboard';

function AnalyticsPage() {
  return (
    <AnalyticsDashboard
      title="Custom Analytics"
      subtitle="Custom analytics dashboard"
      showHeader={true}
      showNavigation={true}
      defaultView="overview"
      autoRefresh={true}
      refreshInterval={30000}
      onDataUpdate={(data) => console.log('Data updated:', data)}
      onError={(error) => console.error('Analytics error:', error)}
    />
  );
}
```

### Specialized Analytics Hooks

```typescript
import { 
  useOverviewAnalytics,
  useTrendsAnalytics,
  useDemographicsAnalytics,
  usePerformanceAnalytics,
  usePrivacyAnalytics,
  useEngagementAnalytics,
  useAdvancedAnalytics
} from '../hooks/useAnalytics';

// Use specialized hooks for specific analytics types
const overviewAnalytics = useOverviewAnalytics();
const trendsAnalytics = useTrendsAnalytics();
const demographicsAnalytics = useDemographicsAnalytics();
```

## Data Export

The analytics system supports data export in multiple formats:

### JSON Export
```typescript
const { exportData } = useAnalytics();
exportData('json'); // Downloads analytics-YYYY-MM-DD.json
```

### CSV Export
```typescript
const { exportData } = useAnalytics();
exportData('csv'); // Downloads analytics-YYYY-MM-DD.csv
```

### Report Generation
```typescript
const { generateReport } = useAnalytics();
generateReport('overview'); // Downloads analytics-report-overview-YYYY-MM-DD.json
```

## Privacy Features

### Data Minimization
- Only collects necessary analytics data
- Anonymizes user data
- Implements differential privacy techniques

### User Control
- Granular consent management
- Data export capabilities
- Data deletion options

### Security
- Encryption at rest and in transit
- Access controls
- Audit logging

## Performance Monitoring

### PWA Analytics Integration
- Real-time performance metrics
- User experience monitoring
- Offline data collection
- Background sync capabilities

### Metrics Collected
- Page load times
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Cumulative Layout Shift (CLS)
- Session duration
- Feature usage patterns

## Testing

### Test Page
Visit `/analytics-test` to test the analytics system functionality.

### Test Features
- Feature flag status display
- Individual analytics type testing
- Data export testing
- Error handling verification

## Integration Points

### Dashboard Integration
The analytics system integrates with the main dashboard to provide insights and metrics.

### Feature Flags Integration
All analytics features are controlled by the feature flags system for easy enablement/disablement.

### PWA Integration
Analytics data is collected through the PWA analytics system for privacy-first data collection.

## Configuration

### Environment Variables
```bash
# Enable analytics system
ENABLE_ANALYTICS=true

# Enable AI features for advanced analytics
ENABLE_AI_FEATURES=true

# Analytics refresh interval (milliseconds)
ANALYTICS_REFRESH_INTERVAL=30000

# Auto-refresh enabled by default
ANALYTICS_AUTO_REFRESH=true
```

### Feature Flag Configuration
```typescript
// In feature flags configuration
{
  id: 'analytics',
  name: 'Analytics System',
  description: 'Data visualization, analytics dashboard, and insights',
  enabled: process.env.ENABLE_ANALYTICS === 'true',
  category: 'optional'
}
```

## Error Handling

### Common Errors
1. **Analytics Disabled**: Feature flag not enabled
2. **API Errors**: Network or server issues
3. **Data Fetch Errors**: Invalid parameters or missing data
4. **Export Errors**: File generation issues

### Error Recovery
- Automatic retry mechanisms
- Graceful degradation
- User-friendly error messages
- Fallback data sources

## Future Enhancements

### Planned Features
1. **Real-time Charts**: Interactive chart visualizations
2. **Custom Dashboards**: User-configurable dashboards
3. **Advanced Filtering**: More granular data filtering
4. **Scheduled Reports**: Automated report generation
5. **API Rate Limiting**: Enhanced API protection
6. **Data Caching**: Improved performance through caching

### AI Features
1. **Predictive Analytics**: Vote prediction models
2. **Anomaly Detection**: Unusual pattern detection
3. **Recommendation Engine**: AI-powered insights
4. **Natural Language Queries**: Conversational analytics

## Troubleshooting

### Common Issues

1. **Analytics Not Loading**
   - Check if `ENABLE_ANALYTICS=true` is set
   - Verify feature flags are properly configured
   - Check browser console for errors

2. **Data Not Updating**
   - Verify auto-refresh is enabled
   - Check network connectivity
   - Review API endpoint status

3. **Export Not Working**
   - Ensure data is available
   - Check browser download settings
   - Verify file permissions

### Debug Mode
Enable debug logging by setting:
```bash
NODE_ENV=development
DEBUG=analytics:*
```

## Security Considerations

### Data Protection
- All analytics data is anonymized
- No personally identifiable information is collected
- Data is encrypted in transit and at rest

### Access Control
- Analytics access is controlled by feature flags
- API endpoints require proper authentication
- Rate limiting prevents abuse

### Compliance
- GDPR compliance through data minimization
- CCPA compliance with user rights
- COPPA compliance for underage users

## Performance Considerations

### Optimization
- Lazy loading of analytics components
- Efficient data fetching with caching
- Minimal bundle size impact
- Progressive enhancement

### Monitoring
- Real-time performance monitoring
- Error tracking and reporting
- Usage analytics for the analytics system itself

## Support

For issues or questions about the analytics system:

1. Check the test page at `/analytics-test`
2. Review the browser console for errors
3. Verify feature flag configuration
4. Check environment variables
5. Review API endpoint status

## Contributing

When contributing to the analytics system:

1. Follow the existing code patterns
2. Add proper TypeScript types
3. Include error handling
4. Add tests for new features
5. Update documentation
6. Ensure feature flag integration
7. Maintain privacy-first approach
