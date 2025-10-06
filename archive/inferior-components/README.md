# Inferior Components Archive

**Created:** October 6, 2025  
**Status:** 📦 **ARCHIVED - REPLACED BY SENSIBLE BLUEPRINT**  
**Purpose:** Inferior implementations replaced by Sensible Blueprint components

---

## 📦 **ARCHIVED FILES**

### **Basic Representative Card**
- **File:** `RepresentativeCard.tsx`
- **Issues:**
  - Basic HTML structure, no mobile-first design
  - No touch interactions or gestures
  - No progressive disclosure
  - Limited visual hierarchy
  - No photo management
  - No social media integration
- **Replaced By:** Mobile-first `CandidateCard.tsx` (Sensible Blueprint)

### **Basic Civics Page**
- **File:** `page.tsx` (from `/app/(app)/civics/`)
- **Issues:**
  - Basic representative display
  - No mobile-first design
  - No touch interactions
  - Limited functionality
- **Replaced By:** Enhanced civics page with mobile-first design (Sensible Blueprint)

### **Interest-Based Poll Feed**
- **File:** `InterestBasedPollFeed.tsx`
- **Issues:**
  - Poll-focused, not representative-focused
  - No Instagram-like experience
  - Limited engagement features
  - No mobile-first design
- **Replaced By:** Instagram-like social feed (Sensible Blueprint)

### **Interest-Based Feed API**
- **File:** `route.ts` (from `/api/feeds/interest-based/`)
- **Issues:**
  - Poll-focused, not representative-focused
  - Limited functionality
  - No Instagram-like experience
- **Replaced By:** Enhanced feed API with personalization (Sensible Blueprint)

---

## 🎯 **ARCHIVE RATIONALE**

### **WHY ARCHIVED:**
1. **Inferior Implementation** - Basic functionality, no mobile-first design
2. **Limited Features** - Missing touch interactions, progressive disclosure
3. **Wrong Focus** - Poll-focused instead of representative-focused
4. **Replaced by Sensible Blueprint** - Superior mobile-first implementations

### **SENSIBLE BLUEPRINT REPLACEMENTS:**
- **Basic RepresentativeCard** → **Mobile-first CandidateCard**
- **Basic Civics Page** → **Enhanced mobile-first civics page**
- **Limited Feed** → **Instagram-like social feed**
- **Basic API** → **Enhanced feed API with personalization**

---

## 🚀 **CURRENT IMPLEMENTATION**

### **SENSIBLE BLUEPRINT COMPONENTS:**
```
web/components/civics-2-0/
├── CandidateCard.tsx                    # Mobile-first candidate cards
├── SocialFeed.tsx                       # Instagram-like social feed
├── ProgressiveDisclosure.tsx            # Progressive disclosure system
├── TouchInteractions.tsx               # Touch gesture handling
└── InfiniteScroll.tsx                  # Infinite scroll functionality
```

### **ENHANCED FEATURES:**
- **Mobile-First Design** - Touch-optimized interactions
- **Progressive Disclosure** - Essential information first
- **Instagram-Like Experience** - Social media feed for civic content
- **Real-Time Updates** - Live data streaming
- **Personalization** - User preferences and interests

---

**Status:** 📦 **ARCHIVED - REPLACED BY SENSIBLE BLUEPRINT**
