# Social Sharing for Polls Feature Documentation

**Created**: January 23, 2025  
**Updated**: January 23, 2025  
**Status**: ✅ **PRODUCTION READY**  
**Feature Flag**: `SOCIAL_SHARING_POLLS` (enabled)  
**Integration**: ✅ **FULLY INTEGRATED** with UnifiedFeed and PollShare components  

## 🎯 **OVERVIEW**

The Social Sharing for Polls feature provides comprehensive social media sharing capabilities across the Choices platform. It enables users to share polls and feed content on major social platforms including Twitter, Facebook, LinkedIn, Reddit, WhatsApp, Telegram, Email, and SMS, with native sharing support for mobile devices.

### **Key Features**
- **Multi-Platform Sharing**: Support for 8 major social platforms
- **Native Sharing**: Mobile device native sharing API integration
- **Analytics Tracking**: Comprehensive share event tracking and analytics
- **Unified Experience**: Consistent sharing across PollShare and UnifiedFeed components
- **Feature Flag Control**: Properly controlled by `SOCIAL_SHARING_POLLS` flag
- **Performance Optimized**: Efficient sharing with minimal impact on load times

## 🏗️ **ARCHITECTURE**

### **Core Components**

```
Social Sharing Architecture
├── useSocialSharing Hook
│   ├── Platform-specific URL generation
│   ├── Native sharing integration
│   ├── Analytics tracking
│   └── Error handling
├── UnifiedFeed Integration
│   ├── Enhanced handleShare function
│   ├── Content type detection
│   └── Fallback mechanisms
├── PollShare Component
│   ├── Comprehensive sharing UI
│   ├── QR code generation
│   └── Platform selection
└── Share API (/api/share)
    ├── Event tracking
    ├── Analytics collection
    └── Performance monitoring
```

### **Data Flow**

```
User Action → useSocialSharing Hook → Platform URL Generation → Share API → Analytics
     ↓
Native Sharing (if available) → Fallback to Platform-specific Sharing
```

## 🔌 **API ENDPOINTS**

### **POST /api/share**
Track social sharing events for analytics and optimization.

#### **Request Body:**
```typescript
{
  platform: 'twitter' | 'facebook' | 'linkedin' | 'reddit' | 'whatsapp' | 'telegram' | 'email' | 'sms';
  poll_id: string;
  placement?: string;
  content_type?: 'poll' | 'representative' | 'feed';
}
```

#### **Response:**
```typescript
{
  success: boolean;
  message: string;
}
```

#### **Example Request:**
```bash
curl -X POST /api/share \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "twitter",
    "poll_id": "poll-123",
    "placement": "feed",
    "content_type": "poll"
  }'
```

### **GET /api/share**
Retrieve share analytics data with filtering options.

#### **Query Parameters:**
- `poll_id` (optional): Filter by specific poll
- `platform` (optional): Filter by platform
- `days` (optional): Number of days to analyze (default: 7)

#### **Response:**
```typescript
{
  total_shares: number;
  platform_breakdown: Record<string, number>;
  top_polls: Array<{
    poll_id: string;
    shares: number;
    title: string;
  }>;
  conversion_rate: number;
  period_days: number;
  generated_at: string;
}
```

## 🎨 **COMPONENT INTEGRATION**

### **UnifiedFeed Integration**

The UnifiedFeed component now includes comprehensive social sharing:

```typescript
// Enhanced handleShare function
const handleShare = useCallback(async (itemId: string) => {
  const item = feeds.find((item: any) => item.id === itemId);
  
  const sharingOptions = {
    title: item.title,
    description: item.description || item.summary || '',
    url: shareUrl,
    pollId: item.type === 'poll' ? itemId : undefined,
    contentType: contentType as 'poll' | 'representative' | 'feed',
    placement: 'feed'
  };

  // Try native sharing first
  if (typeof navigator !== 'undefined' && 'share' in navigator) {
    const result = await shareNative(sharingOptions);
    if (result.success) return;
  }

  // Fallback to platform-specific sharing
  if (socialSharingEnabled) {
    const result = await shareToPlatform('twitter', sharingOptions);
  }
}, [/* dependencies */]);
```

### **PollShare Component**

The existing PollShare component has been updated to use the correct feature flag:

```typescript
// Updated feature flag check
const socialSharingEnabled = isFeatureEnabled('SOCIAL_SHARING_POLLS')
```

## 🎣 **HOOKS**

### **useSocialSharing Hook**

A comprehensive hook that provides unified social sharing functionality:

```typescript
interface SocialSharingOptions {
  title: string;
  description?: string;
  url: string;
  pollId?: string;
  contentType?: 'poll' | 'representative' | 'feed';
  placement?: string;
}

const {
  isSharing,
  shareError,
  socialSharingEnabled,
  shareToPlatform,
  shareNative,
  copyToClipboard,
  clearError
} = useSocialSharing();
```

#### **Methods:**
- `shareToPlatform(platform, options)` - Share to specific platform
- `shareNative(options)` - Use native sharing API
- `copyToClipboard(options)` - Copy to clipboard
- `clearError()` - Clear any sharing errors

## 📊 **SUPPORTED PLATFORMS**

### **Social Media Platforms**
- **Twitter/X**: `https://twitter.com/intent/tweet`
- **Facebook**: `https://www.facebook.com/sharer/sharer.php`
- **LinkedIn**: `https://www.linkedin.com/sharing/share-offsite`
- **Reddit**: `https://www.reddit.com/submit`

### **Messaging Platforms**
- **WhatsApp**: `https://api.whatsapp.com/send`
- **Telegram**: `https://t.me/share/url`

### **Communication Platforms**
- **Email**: `mailto:` protocol
- **SMS**: `sms:` protocol

### **Native Sharing**
- **Mobile Devices**: Native sharing API when available
- **Desktop**: Platform-specific URLs

## 🔧 **CONFIGURATION**

### **Feature Flag**
```typescript
// web/lib/core/feature-flags.ts
SOCIAL_SHARING_POLLS: true,  // Enable poll sharing
```

### **Dependencies**
```typescript
// Feature flag dependencies
SOCIAL_SHARING_POLLS: ['SOCIAL_SHARING']  // Requires master social sharing flag
```

### **Environment Variables**
```bash
# Required for Supabase integration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 🧪 **TESTING**

### **Unit Tests**
```typescript
// Test social sharing hook
describe('useSocialSharing', () => {
  it('should share to platform', async () => {
    const { shareToPlatform } = useSocialSharing();
    const result = await shareToPlatform('twitter', {
      title: 'Test Poll',
      url: 'https://example.com/poll/123'
    });
    expect(result.success).toBe(true);
  });
});
```

### **Integration Tests**
```typescript
// Test UnifiedFeed integration
describe('UnifiedFeed Social Sharing', () => {
  it('should handle share events', async () => {
    const { getByTestId } = render(<UnifiedFeed />);
    const shareButton = getByTestId('share-button');
    await user.click(shareButton);
    // Verify sharing behavior
  });
});
```

### **E2E Tests**
```typescript
// Test complete sharing flow
test('should share poll to social media', async ({ page }) => {
  await page.goto('/polls/test-poll');
  await page.click('[data-testid="share-button"]');
  await page.click('[data-testid="twitter-share"]');
  // Verify Twitter window opens
});
```

## 📈 **ANALYTICS**

### **Share Event Tracking**
- **Platform Analytics**: Track shares by platform
- **Content Performance**: Monitor poll sharing success
- **User Behavior**: Understand sharing patterns
- **Conversion Tracking**: Share-to-vote conversion rates

### **Metrics Collected**
- Total shares per poll
- Platform breakdown
- Share timing and frequency
- User engagement patterns
- Content performance metrics

## 🔒 **SECURITY & PRIVACY**

### **Data Protection**
- **No Personal Data**: Only essential sharing metrics collected
- **IP Anonymization**: IP addresses are hashed for privacy
- **User Agent Sanitization**: Cleaned user agent strings
- **Minimal Data**: Only necessary analytics data stored

### **Rate Limiting**
- **API Rate Limits**: 60 requests per minute per IP
- **Feature Flag Protection**: Disabled when feature flag is off
- **Error Handling**: Graceful degradation on failures

## 🚀 **USAGE EXAMPLES**

### **Basic Sharing**
```typescript
import { useSocialSharing } from '@/hooks/useSocialSharing';

function ShareButton({ pollId, pollTitle }) {
  const { shareToPlatform, shareNative } = useSocialSharing();
  
  const handleShare = async (platform) => {
    const result = await shareToPlatform(platform, {
      title: pollTitle,
      url: `https://choices.app/polls/${pollId}`,
      pollId,
      contentType: 'poll'
    });
    
    if (result.success) {
      console.log('Shared successfully!');
    }
  };
  
  return (
    <button onClick={() => handleShare('twitter')}>
      Share on Twitter
    </button>
  );
}
```

### **Native Sharing**
```typescript
const { shareNative } = useSocialSharing();

const handleNativeShare = async () => {
  const result = await shareNative({
    title: 'Check out this poll!',
    description: 'Vote on this important question',
    url: 'https://choices.app/polls/123'
  });
  
  if (result.success) {
    console.log('Native sharing successful!');
  }
};
```

### **Analytics Integration**
```typescript
// Track share events
const trackShare = async (platform: string, pollId: string) => {
  try {
    const response = await fetch('/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform,
        poll_id: pollId,
        placement: 'poll_card',
        content_type: 'poll'
      })
    });
    
    if (response.ok) {
      console.log('Share tracked successfully');
    }
  } catch (error) {
    console.error('Failed to track share:', error);
  }
};
```

## 🎯 **FUTURE ENHANCEMENTS**

### **Planned Features**
1. **Share Modal**: Interactive platform selection modal
2. **Custom Messages**: Personalized sharing messages
3. **Share Scheduling**: Schedule shares for optimal timing
4. **Advanced Analytics**: Machine learning insights
5. **Share Templates**: Pre-built sharing templates

### **Integration Opportunities**
1. **Open Graph**: Dynamic social media previews
2. **Visual Content**: Instagram/TikTok optimized sharing
3. **Real-time Updates**: WebSocket-based live analytics
4. **A/B Testing**: Share button optimization

## 📋 **TROUBLESHOOTING**

### **Common Issues**

#### **Feature Flag Not Working**
```typescript
// Check if feature flag is enabled
const socialSharingEnabled = isFeatureEnabled('SOCIAL_SHARING_POLLS');
console.log('Social sharing enabled:', socialSharingEnabled);
```

#### **Native Sharing Not Available**
```typescript
// Check for native sharing support
if ('share' in navigator) {
  // Native sharing available
} else {
  // Fallback to platform-specific URLs
}
```

#### **Analytics Not Tracking**
```typescript
// Check API endpoint
const response = await fetch('/api/share', {
  method: 'POST',
  body: JSON.stringify({ platform: 'twitter', poll_id: '123' })
});
console.log('Analytics response:', response);
```

### **Debug Mode**
```typescript
// Enable debug logging
const { devLog } = await import('@/lib/utils/logger');
devLog('Social sharing debug:', { platform, pollId, options });
```

## 📚 **RELATED DOCUMENTATION**

- [Share API Documentation](./SHARE_API.md)
- [Feature Flags Documentation](../core/FEATURE_FLAGS_COMPREHENSIVE.md)
- [UnifiedFeed Documentation](./FEEDS.md)
- [Analytics Documentation](./ANALYTICS.md)
- [Testing Best Practices](../TESTING_BEST_PRACTICES.md)

---

*This feature provides comprehensive social sharing capabilities across the Choices platform, enabling users to share polls and content on major social platforms with proper analytics tracking and performance optimization.*

