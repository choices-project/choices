# Contact Information System - MVP vs CRM Scope

> **Archived (Jan 2026):** This scope document reflects the superseded Contact System MVP. Current plans live in `docs/FEATURE_STATUS.md` and `docs/ROADMAP_SINGLE_SOURCE.md#c2-contact-information-system-p1`.

**Last Updated:** January 2025  
**Status:** Active Development  
**Owner:** Contact System Team

---

## Executive Summary

This document clarifies the scope of the Contact Information System, distinguishing between MVP (Minimum Viable Product) features required for launch and future CRM (Customer Relationship Management) features that can be added post-launch.

---

## MVP Scope (Launch-Critical)

### 1. Contact Data Ingestion ✅

**Status:** ✅ Complete with validation and error handling

**Features:**
- Representative contact data ingestion from OpenStates YAML
- Support for email, phone, fax, and address contact types
- Data validation and normalization
- Error handling and reporting
- Primary contact designation
- Source tracking (openstates_yaml, google_civic, etc.)

**Implementation:**
- `services/civics-backend/src/persist/contacts.ts` - Core ingestion logic
- `services/civics-backend/src/scripts/openstates/sync-contacts.ts` - Sync script
- Validation for email, phone, fax, and address formats
- Comprehensive error reporting with success/failure metrics

**Data Quality:**
- Email format validation
- Phone number normalization (10-15 digits)
- Address length validation (5-500 characters)
- Deduplication of contact entries
- Primary contact designation logic

### 2. Contact Messaging System ✅

**Status:** ✅ Complete

**Features:**
- User-to-representative messaging
- Thread-based conversation management
- Message status tracking (sent, delivered, read, replied)
- Priority levels (low, normal, high, urgent)
- Message delivery logging
- Rate limiting (10 messages per minute per user)

**Implementation:**
- `web/app/api/contact/messages/route.ts` - Message API
- `web/app/api/contact/threads/route.ts` - Thread API
- `web/lib/stores/contactStore.ts` - State management
- `web/features/contact/components/ContactModal.tsx` - UI components

**Database Tables:**
- `contact_threads` - Conversation threads
- `contact_messages` - Individual messages
- `message_delivery_logs` - Delivery tracking

### 3. Notification System ✅

**Status:** ✅ Complete with user preference checks

**Features:**
- In-app notifications for message delivery confirmation
- User preference checking (privacy_settings, notification_preferences)
- Notification logging to `notification_log` table
- Graceful error handling (doesn't fail message creation)

**Implementation:**
- `web/app/api/contact/messages/route.ts` - `sendRepresentativeNotification()` function
- Checks `user_profiles.privacy_settings.contact_messages`
- Checks `user_profiles.notification_preferences.contact_messages`
- Creates notifications in `notification_log` table

**Notification Types:**
- `contact_message_sent` - Confirmation when message is sent

### 4. Contact Store (State Management) ✅

**Status:** ✅ Complete and modernized

**Features:**
- Zustand store with creator pattern
- Thread and message management
- Optimistic updates
- Error handling
- Loading states
- Selector helpers

**Implementation:**
- `web/lib/stores/contactStore.ts` - Complete implementation
- Follows 2025 store modernization standards

---

## Future CRM Features (Post-Launch)

### 1. Advanced Contact Management

**Planned Features:**
- Contact history and relationship tracking
- Contact tagging and categorization
- Custom contact fields
- Contact import/export
- Bulk contact operations
- Contact merge/deduplication tools

**Not in MVP:** These features require significant additional development and are not critical for initial launch.

### 2. Representative Account Integration

**Planned Features:**
- Representative user accounts
- Representative inbox for messages
- Representative response tracking
- Representative notification preferences
- Representative analytics dashboard

**Not in MVP:** Representatives typically don't have user accounts in the system. This would require significant architectural changes.

### 3. Advanced Messaging Features

**Planned Features:**
- Email forwarding to representative email addresses
- SMS notifications
- Message templates
- Scheduled messages
- Message campaigns
- A/B testing for messages
- Message analytics and reporting

**Not in MVP:** These features add complexity and are not required for basic constituent-to-representative communication.

### 4. CRM Analytics

**Planned Features:**
- Contact engagement metrics
- Message response rates
- Representative responsiveness tracking
- Constituent communication history
- Trend analysis
- Export capabilities

**Not in MVP:** Analytics can be added post-launch once core functionality is proven.

### 5. Integration Features

**Planned Features:**
- Integration with external CRM systems
- API for third-party integrations
- Webhook support for message events
- Calendar integration
- Meeting scheduling

**Not in MVP:** These require significant infrastructure and are not critical for launch.

### 6. Advanced Notification Features

**Planned Features:**
- Email notifications (beyond in-app)
- SMS notifications
- Push notifications for mobile apps
- Notification digests
- Custom notification rules
- Notification scheduling

**Not in MVP:** In-app notifications are sufficient for MVP. Additional channels can be added post-launch.

---

## Data Model

### MVP Tables

**representative_contacts**
- Stores contact information for representatives
- Fields: `representative_id`, `contact_type`, `value`, `is_primary`, `is_verified`, `source`
- Contact types: `email`, `phone`, `fax`, `address`

**contact_threads**
- Conversation threads between users and representatives
- Fields: `id`, `user_id`, `representative_id`, `subject`, `status`, `priority`, `created_at`, `updated_at`

**contact_messages**
- Individual messages in threads
- Fields: `id`, `thread_id`, `user_id`, `representative_id`, `message`, `subject`, `status`, `priority`, `created_at`

**message_delivery_logs**
- Delivery tracking for messages
- Fields: `message_id`, `delivery_status`, `delivery_timestamp`, `retry_count`

**notification_log**
- In-app notifications
- Fields: `user_id`, `type`, `title`, `body`, `payload`, `status`, `created_at`

### Future CRM Tables (Not in MVP)

- `contact_tags` - Tagging system
- `contact_history` - Historical tracking
- `message_templates` - Template management
- `campaign_messages` - Campaign tracking
- `representative_accounts` - Representative user accounts

---

## API Endpoints

### MVP Endpoints ✅

**Contact Messages:**
- `POST /api/contact/messages` - Create new message
- `GET /api/contact/messages` - Retrieve user messages

**Contact Threads:**
- `POST /api/contact/threads` - Create new thread
- `GET /api/contact/threads` - Retrieve user threads
- `PUT /api/contact/threads` - Update thread status

### Future CRM Endpoints (Not in MVP)

- `GET /api/contact/analytics` - Analytics endpoints
- `POST /api/contact/templates` - Message templates
- `GET /api/contact/campaigns` - Campaign management
- `POST /api/contact/export` - Data export
- `GET /api/contact/history` - Contact history

---

## User Preferences

### MVP Preferences ✅

**Privacy Settings:**
- `privacy_settings.contact_messages` - Enable/disable contact message notifications (default: true)

**Notification Preferences:**
- `notification_preferences.contact_messages` - Enable/disable push notifications for contact messages (default: true)

### Future CRM Preferences (Not in MVP)

- Email notification preferences
- SMS notification preferences
- Notification frequency settings
- Digest preferences
- Custom notification rules

---

## Testing Requirements

### MVP Testing ✅

**Unit Tests:**
- Contact ingestion validation
- Message creation and retrieval
- Thread management
- Notification delivery

**Integration Tests:**
- End-to-end message flow
- Notification preference checking
- Error handling

**Contract Tests:**
- API contract validation
- Data format validation

### Future CRM Testing (Not in MVP)

- Analytics accuracy
- Campaign delivery
- Template rendering
- Export functionality
- Integration testing

---

## Performance Considerations

### MVP Performance ✅

- Rate limiting: 10 messages per minute per user
- Message pagination: 50 messages per page
- Thread pagination: 50 threads per page
- Optimistic updates in UI
- Efficient database queries with proper indexing

### Future CRM Performance (Not in MVP)

- Bulk operation optimization
- Campaign delivery optimization
- Analytics query optimization
- Caching strategies
- CDN for static assets

---

## Security Considerations

### MVP Security ✅

- Authentication required for all endpoints
- Input validation and sanitization
- Rate limiting
- User authorization checks
- SQL injection prevention
- XSS prevention

### Future CRM Security (Not in MVP)

- Advanced rate limiting
- IP-based restrictions
- Content moderation
- Spam detection
- Abuse reporting
- Compliance features (GDPR, CAN-SPAM, etc.)

---

## Migration Path

### MVP to CRM

1. **Phase 1 (MVP):** Core messaging and notifications ✅
2. **Phase 2:** Email notifications and templates
3. **Phase 3:** Representative accounts and responses
4. **Phase 4:** Analytics and reporting
5. **Phase 5:** Advanced CRM features

---

## Related Documentation

- `docs/ROADMAP.md` - Main roadmap (Section C.2)
- `services/civics-backend/ROADMAP.md` - Backend ingestion roadmap
- `web/lib/stores/contactStore.ts` - Store implementation
- `web/app/api/contact/messages/route.ts` - API implementation

---

## Questions & Decisions

### Q: Should representatives have user accounts?
**A:** Not in MVP. Representatives are public officials and typically don't need user accounts. Future enhancement.

### Q: Should we send email notifications?
**A:** Not in MVP. In-app notifications are sufficient. Email can be added post-launch.

### Q: Should we support message templates?
**A:** Not in MVP. Users can compose messages freely. Templates can be added post-launch.

### Q: Should we track message delivery to representative email?
**A:** Not in MVP. We track delivery to our system. External delivery tracking is future enhancement.

### Q: Should we support bulk messaging?
**A:** Not in MVP. Users can contact multiple representatives individually. Bulk features are future enhancement.

---

**Last Review:** January 2025  
**Next Review:** After MVP launch or when CRM features are prioritized

