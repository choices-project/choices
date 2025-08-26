# Site Messages Testing Guide

**Created:** January 27, 2025  
**Last Updated:** January 27, 2025  
**Status:** ✅ **READY FOR TESTING**

## Overview

This guide provides comprehensive testing procedures for the site-messages system, ensuring all functionality works correctly before deployment.

## 🧪 **Testing Environment Setup**

### Prerequisites
- Development server running (`npm run dev`)
- Admin user with T3 trust tier
- Regular user account for testing
- Database with `site_messages` table

### Test Data Setup
```sql
-- Create test admin user (T3 trust tier)
INSERT INTO user_profiles (user_id, username, trust_tier, is_admin) 
VALUES ('test-admin-id', 'admin', 'T3', true);

-- Create test regular user (T1 trust tier)
INSERT INTO user_profiles (user_id, username, trust_tier, is_admin) 
VALUES ('test-user-id', 'user', 'T1', false);
```

## 📋 **Test Cases**

### 1. Public Site Messages API (`/api/site-messages`)

#### Test 1.1: Fetch Active Messages
**Endpoint:** `GET /api/site-messages`  
**Expected:** Returns only active, non-expired messages

```bash
curl -X GET http://localhost:3000/api/site-messages
```

**Expected Response:**
```json
{
  "messages": [
    {
      "id": "uuid",
      "title": "Welcome Message",
      "message": "Welcome to Choices!",
      "type": "info",
      "priority": "medium",
      "created_at": "2025-01-27T10:00:00Z",
      "updated_at": "2025-01-27T10:00:00Z",
      "expires_at": null
    }
  ],
  "count": 1,
  "timestamp": "2025-01-27T10:30:00Z"
}
```

#### Test 1.2: Include Expired Messages
**Endpoint:** `GET /api/site-messages?includeExpired=true`  
**Expected:** Returns all messages including expired ones

```bash
curl -X GET "http://localhost:3000/api/site-messages?includeExpired=true"
```

### 2. Admin Site Messages API (`/api/admin/site-messages`)

#### Test 2.1: Admin Authentication Required
**Endpoint:** `GET /api/admin/site-messages`  
**Test:** Access without authentication  
**Expected:** 401 Unauthorized

```bash
curl -X GET http://localhost:3000/api/admin/site-messages
```

#### Test 2.2: Non-Admin Access Denied
**Test:** Access with T1 user (non-admin)  
**Expected:** 403 Forbidden

#### Test 2.3: Admin Access Granted
**Test:** Access with T3 user (admin)  
**Expected:** 200 OK with messages list

#### Test 2.4: Create New Message
**Endpoint:** `POST /api/admin/site-messages`  
**Test:** Create message as admin

```bash
curl -X POST http://localhost:3000/api/admin/site-messages \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Message",
    "message": "This is a test message",
    "type": "info",
    "priority": "medium",
    "isActive": true
  }'
```

**Expected Response:**
```json
{
  "id": "uuid",
  "title": "Test Message",
  "message": "This is a test message",
  "type": "info",
  "priority": "medium",
  "is_active": true,
  "created_at": "2025-01-27T10:00:00Z",
  "updated_at": "2025-01-27T10:00:00Z"
}
```

#### Test 2.5: Update Message
**Endpoint:** `PUT /api/admin/site-messages`  
**Test:** Update existing message

```bash
curl -X PUT http://localhost:3000/api/admin/site-messages \
  -H "Content-Type: application/json" \
  -d '{
    "id": "message-id",
    "title": "Updated Message",
    "message": "This message has been updated",
    "type": "warning",
    "priority": "high"
  }'
```

#### Test 2.6: Delete Message
**Endpoint:** `DELETE /api/admin/site-messages?id=message-id`  
**Test:** Delete message

```bash
curl -X DELETE "http://localhost:3000/api/admin/site-messages?id=message-id"
```

**Expected Response:**
```json
{
  "success": true
}
```

### 3. Admin Interface Testing

#### Test 3.1: Admin Dashboard Access
**URL:** `http://localhost:3000/admin/site-messages`  
**Test:** Access as admin user  
**Expected:** Site messages management interface loads

#### Test 3.2: Message List Display
**Test:** Verify messages are displayed correctly  
**Expected:** All messages shown with proper formatting

#### Test 3.3: Create Message Form
**Test:** Fill out and submit create message form  
**Expected:** Message created and appears in list

#### Test 3.4: Edit Message
**Test:** Click edit on existing message  
**Expected:** Form populated with message data

#### Test 3.5: Delete Message
**Test:** Click delete on message  
**Expected:** Confirmation dialog, message removed after confirmation

#### Test 3.6: Mobile Responsiveness
**Test:** View on mobile device or resize browser  
**Expected:** Interface adapts properly to smaller screens

### 4. Public Message Display Testing

#### Test 4.1: SiteMessages Component
**URL:** `http://localhost:3000`  
**Test:** Check if messages appear on main page  
**Expected:** Active messages displayed in SiteMessages component

#### Test 4.2: Message Dismissal
**Test:** Click dismiss on message  
**Expected:** Message disappears and stays dismissed

#### Test 4.3: Auto-refresh
**Test:** Create new message as admin  
**Expected:** Message appears on public page within 30 seconds

#### Test 4.4: Message Types
**Test:** Create messages of different types (info, warning, success, error, feedback)  
**Expected:** Each type displays with appropriate styling

#### Test 4.5: Priority Ordering
**Test:** Create messages with different priorities  
**Expected:** Messages display in priority order (critical > high > medium > low)

### 5. Error Handling Testing

#### Test 5.1: Invalid Message Data
**Test:** Submit form with missing required fields  
**Expected:** Validation error displayed

#### Test 5.2: Database Connection Issues
**Test:** Simulate database connection failure  
**Expected:** Graceful error handling with user-friendly message

#### Test 5.3: Authentication Failures
**Test:** Access admin interface without proper authentication  
**Expected:** Redirected to login page

## 🔧 **Manual Testing Checklist**

### Admin Interface
- [ ] Can access `/admin/site-messages` as admin user
- [ ] Cannot access as non-admin user
- [ ] Message list displays correctly
- [ ] Create message form works
- [ ] Edit message form works
- [ ] Delete message works with confirmation
- [ ] Mobile interface is responsive
- [ ] Real-time updates work

### Public Interface
- [ ] Messages display on main page
- [ ] Messages can be dismissed
- [ ] Auto-refresh works (30-second intervals)
- [ ] Different message types display correctly
- [ ] Priority ordering works
- [ ] Expired messages don't show
- [ ] Mobile display is responsive

### API Endpoints
- [ ] Public API returns active messages only
- [ ] Public API with `includeExpired=true` returns all messages
- [ ] Admin API requires authentication
- [ ] Admin API requires T3 trust tier
- [ ] CRUD operations work correctly
- [ ] Error handling works properly

## 🚀 **Deployment Readiness Checklist**

### Technical Requirements
- [ ] All TypeScript errors resolved
- [ ] Build completes successfully
- [ ] All API endpoints tested
- [ ] Authentication working correctly
- [ ] Database migrations applied
- [ ] Environment variables configured

### Functional Requirements
- [ ] Admin can create messages
- [ ] Admin can edit messages
- [ ] Admin can delete messages
- [ ] Messages display publicly
- [ ] Messages auto-refresh
- [ ] Mobile responsiveness confirmed
- [ ] Error handling verified

### Security Requirements
- [ ] Admin access properly restricted
- [ ] Authentication middleware working
- [ ] Input validation implemented
- [ ] SQL injection protection verified
- [ ] XSS protection confirmed

## 📊 **Performance Testing**

### Load Testing
- [ ] API response times < 200ms
- [ ] Admin interface loads < 2 seconds
- [ ] Message refresh doesn't impact performance
- [ ] Database queries optimized

### Stress Testing
- [ ] Handle 100+ concurrent users
- [ ] Handle 1000+ messages
- [ ] Memory usage remains stable
- [ ] No memory leaks detected

## 🐛 **Known Issues & Workarounds**

### Current Limitations
- Messages are stored in database (not Redis cache)
- Auto-refresh interval is fixed at 30 seconds
- No message scheduling (only immediate or expiration)

### Future Enhancements
- Redis caching for better performance
- Message scheduling capabilities
- Rich text editor for messages
- Message templates
- Analytics on message engagement

---

**Note:** This testing guide should be executed before any production deployment to ensure the site-messages system is fully functional and secure.
