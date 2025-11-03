# Contact Information System

**Created:** January 21, 2025  
**Status:** 🔄 **PARTIALLY IMPLEMENTED (50%)**  
**Feature Flag:** `CONTACT_INFORMATION_SYSTEM: false`  
**Purpose:** Comprehensive contact information system for representatives

---

## 🎯 **Overview**

The Contact Information System provides comprehensive contact information for elected representatives, including contact methods, social media, and communication tracking.

### **Component Location**
- **Contact API**: `web/app/api/civics/contact/[id]/route.ts`
- **Contact Types**: `web/lib/types/electoral.ts`
- **Contact Utils**: `web/lib/integrations/unified-orchestrator.ts`

---

## 🔧 **Implementation Details**

### **Core Features**
- **Contact Information Retrieval** - Get representative contact information
- **Communication Logging** - Track communication attempts
- **Quick Actions** - Generate quick contact actions
- **Social Media Integration** - Social media contact information
- **Data Quality Scoring** - Contact data quality assessment

### **API Endpoints**
```typescript
// Contact Information API
GET /api/civics/contact/[id]     // Get contact information
POST /api/civics/contact/[id]    // Log communication attempt
```

---

## 🎨 **UI Components**

### **Contact Information Display**
- **Contact Methods** - Email, phone, website, address
- **Social Media** - Social media profiles and followers
- **Quick Actions** - Direct contact actions
- **Data Quality** - Contact data quality indicators

### **Communication Tracking**
- **Communication Log** - Track communication attempts
- **Status Tracking** - Communication status tracking
- **Response Tracking** - Track responses from representatives

---

## 📊 **Contact Features**

### **Contact Information**
- **Basic Contact** - Email, phone, website, address
- **Social Media** - Twitter, Facebook, LinkedIn, etc.
- **Office Information** - Office locations and hours
- **Staff Information** - Staff contact information

### **Communication Features**
- **Communication Logging** - Log all communication attempts
- **Status Tracking** - Track communication status
- **Response Tracking** - Track responses from representatives
- **Follow-up Management** - Manage follow-up communications

---

## 🚀 **Usage Example**

```typescript
import { useContactInfo } from '@/hooks/useContactInfo';

export default function RepresentativeContact({ representativeId }) {
  const { contactInfo, loading, error } = useContactInfo(representativeId);

  if (loading) return <div>Loading contact information...</div>;
  if (error) return <div>Error loading contact information</div>;

  return (
    <div>
      <h2>Contact Information</h2>
      
      <div className="contact-methods">
        {contactInfo.contact_methods.email && (
          <a href={`mailto:${contactInfo.contact_methods.email.value}`}>
            📧 Email
          </a>
        )}
        
        {contactInfo.contact_methods.phone && (
          <a href={`tel:${contactInfo.contact_methods.phone.value}`}>
            📞 Phone
          </a>
        )}
        
        {contactInfo.contact_methods.website && (
          <a href={contactInfo.contact_methods.website.value} target="_blank">
            🌐 Website
          </a>
        )}
      </div>
      
      <div className="social-media">
        {contactInfo.social_media.map(sm => (
          <a key={sm.platform} href={sm.url} target="_blank">
            {sm.platform} ({sm.followers_count} followers)
          </a>
        ))}
      </div>
    </div>
  );
}
```

---

## 📊 **Implementation Status**

### **✅ Implemented Features**
- **Contact API** - Complete API endpoint for contact information
- **Communication Logging** - POST endpoint for logging communications
- **Quick Actions** - Generated quick contact actions
- **Data Quality Scoring** - Contact data quality assessment
- **Social Media Integration** - Social media contact information

### **❌ Missing Features**
- **UI Components** - No React components for contact interface
- **Contact Management** - No contact management interface
- **Communication Tracking** - No user-facing communication tracking
- **Contact Forms** - No contact form components

### **🔧 Technical Details**
- **API Integration** - Complete API endpoints
- **Data Processing** - Contact data processing and validation
- **Quality Assessment** - Contact data quality scoring
- **Social Media Integration** - Social media data integration

---

## 🔧 **Contact Data Structure**

### **Contact Methods**
```typescript
interface ContactMethods {
  email?: ContactMethod;
  phone?: ContactMethod;
  website?: ContactMethod;
  address?: Address;
}
```

### **Social Media**
```typescript
interface SocialMedia {
  platform: string;
  url: string;
  followers_count: number;
  verified: boolean;
}
```

### **Data Quality**
```typescript
interface DataQuality {
  overall_score: number;
  completeness: number;
  accuracy: number;
  recency: number;
  verification_status: string;
}
```

---

## 📱 **Contact Interface**

### **Contact Information Display**
- **Contact Methods** - Email, phone, website, address
- **Social Media** - Social media profiles
- **Quick Actions** - Direct contact actions
- **Data Quality** - Quality indicators

### **Communication Features**
- **Communication Log** - Track communications
- **Status Tracking** - Communication status
- **Response Tracking** - Track responses
- **Follow-up Management** - Manage follow-ups

---

**Last Updated:** January 21, 2025  
**Version:** 1.0.0  
**Status:** 🔄 **PARTIALLY IMPLEMENTED - CONTACT INFORMATION SYSTEM**