# Contact Feature

**Last Updated**: November 3, 2025  
**Status**: ✅ Operational  
**Location**: `/web/features/contact`

---

## Implementation

### Components (5 files)
- Contact representative features

### Services
- `features/contact/hooks/useMessageTemplates.ts`

---

## Database

### Tables
- **contact_messages** (9 columns)
  - `id`, `user_id`, `representative_id`
  - `subject`, `message`, `status`
  
- **contact_threads** (9 columns)
  - Message threading

---

## API Endpoints

### `POST /api/contact/messages`
Send message to representative
- Auth: Required
- Creates contact_message record

---

_Representative contact system_

