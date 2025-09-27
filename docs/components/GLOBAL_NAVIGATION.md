# 🧭 Global Navigation Component

**Created:** January 21, 2025  
**Status:** ✅ Production Ready  
**Purpose:** Navigation component for the Choices platform

---

## 📋 **Component Overview**

The GlobalNavigation component provides the main navigation for the Choices platform, including mobile menu, user authentication, and navigation links.

### **Component Location**
- **File**: `web/components/GlobalNavigation.tsx`
- **Usage**: Used in main app layout

---

## 🔧 **Implementation Details**

### **Component Props**
```typescript
// No props - uses context for user state
export default function GlobalNavigation() {
  const { user, signOut } = useSupabaseAuth()
  // Component implementation
}
```

### **Key Features**
- **Mobile Menu** - Responsive mobile navigation
- **User Authentication** - Login/logout functionality
- **Navigation Links** - Home, Polls, Dashboard
- **User Menu** - User profile and logout

---

## 🎨 **UI Components**

### **Desktop Navigation**
- **Logo** - Choices platform logo
- **Navigation Links** - Home, Polls, Dashboard
- **User Menu** - User profile and logout

### **Mobile Navigation**
- **Hamburger Menu** - Mobile menu toggle
- **Mobile Menu** - Collapsible navigation
- **User Actions** - Mobile user menu

---

## 🚀 **Usage Example**

```typescript
import GlobalNavigation from '@/components/GlobalNavigation';

export default function AppLayout({ children }) {
  return (
    <div>
      <GlobalNavigation />
      {children}
    </div>
  );
}
```

---

**Last Updated:** January 21, 2025  
**Version:** 1.0.0  
**Status:** ✅ **PRODUCTION READY - GLOBAL NAVIGATION COMPONENT**
