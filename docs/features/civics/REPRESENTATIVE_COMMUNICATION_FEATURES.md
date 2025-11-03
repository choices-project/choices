# Representative Communication Features

**Created:** January 26, 2025  
**Last Updated:** January 26, 2025  
**Status:** ✅ **PRODUCTION READY**

---

## Overview

Comprehensive communication system for users to contact their elected representatives. Features include message templates, individual and bulk messaging, communication history tracking, and seamless integration with the representative following system.

---

## Features

### 1. Message Templates ✅

Pre-written templates for common communication scenarios:

- **Support for Legislation** - Express support for bills
- **Opposition to Legislation** - Express opposition to bills
- **General Question** - Ask questions about policy
- **Constituent Service Request** - Request help with government services
- **Thank You Message** - Thank representatives for their work
- **Policy Feedback** - Provide feedback on policies

**Location:** `web/lib/contact/message-templates.ts`

**Features:**
- Placeholder system with validation
- Template filling with user data
- Category organization
- Required field validation

### 2. Individual Contact ✅

Single representative messaging with full template support.

**Components:**
- `ContactModal` - Main contact interface
- Integrated with message templates
- Thread management
- Real-time status updates

**Location:** `web/features/contact/components/ContactModal.tsx`

**Features:**
- Template selector with categories
- Dynamic placeholder forms
- Real-time template filling
- Validation feedback
- Message threading

### 3. Bulk Contact ✅

Send the same message to multiple representatives at once.

**Components:**
- `BulkContactModal` - Bulk messaging interface
- Representative selection
- Template support
- Individual send results tracking

**Location:** `web/features/contact/components/BulkContactModal.tsx`

**Features:**
- Select/deselect representatives
- Template support (same as individual)
- Per-representative success/failure tracking
- Progress indication
- Partial success handling

### 4. Communication History ✅

View all message threads and conversation history.

**Page:** `/contact/history`

**Location:** `web/app/(app)/contact/history/page.tsx`

**Features:**
- Thread listing with representative info
- Filter by status (all/active/closed)
- Sort by date (recent/oldest)
- Message count display
- Last message timestamp
- Priority indicators

### 5. Integration with Following System ✅

Quick contact from "My Representatives" page.

**Integration Points:**
- `RepresentativeCard` - Contact button on each card
- "My Representatives" page - Quick contact buttons
- Bulk contact from followed representatives
- Direct link to message history

**Location:** `web/app/(app)/representatives/my/page.tsx`

---

## API Endpoints

### Messages

- `POST /api/contact/messages` - Send a message
- `GET /api/contact/messages?threadId={id}` - Get messages for a thread

### Threads

- `GET /api/contact/threads` - Get all user threads
- `POST /api/contact/threads` - Create a new thread
- `GET /api/contact/threads/{id}` - Get specific thread

---

## Hooks

### `useMessageTemplates`

Manage message templates and template values.

**Location:** `web/features/contact/hooks/useMessageTemplates.ts`

**Methods:**
- `selectTemplate(templateId)` - Select a template
- `updateTemplateValue(key, value)` - Update placeholder value
- `resetTemplate()` - Clear template selection
- `filledTemplate` - Computed filled template result
- `validation` - Validation state

### `useContactMessages`

Manage contact messages and threads.

**Location:** `web/features/contact/hooks/useContactMessages.ts`

**Methods:**
- `sendMessage(messageData)` - Send a message
- `getMessages(threadId)` - Get messages for thread
- `createThread(threadData)` - Create a new thread

---

## Usage Examples

### Using Templates

```typescript
import { useMessageTemplates } from '@/features/contact/hooks/useMessageTemplates';

const {
  templatesByCategory,
  selectedTemplate,
  selectTemplate,
  updateTemplateValue,
  filledTemplate,
} = useMessageTemplates();

// Select a template
selectTemplate('support-bill');

// Fill in values
updateTemplateValue('billName', 'Climate Action Act');
updateTemplateValue('representativeLastName', 'Smith');

// Use filled template
if (filledTemplate) {
  console.log(filledTemplate.subject);
  console.log(filledTemplate.body);
}
```

### Sending Individual Message

```typescript
import ContactModal from '@/features/contact/components/ContactModal';

<ContactModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  representative={{
    id: 123,
    name: 'John Smith',
    office: 'Representative',
  }}
  userId={user.id}
/>
```

### Bulk Contact

```typescript
import BulkContactModal from '@/features/contact/components/BulkContactModal';

<BulkContactModal
  isOpen={showBulkModal}
  onClose={() => setShowBulkModal(false)}
  representatives={followedRepresentatives}
  userId={user.id}
/>
```

---

## Template Structure

Templates are defined in `MESSAGE_TEMPLATES` array with:

```typescript
{
  id: string;
  title: string;
  description: string;
  category: 'policy' | 'support' | 'opposition' | 'question' | 'general';
  subject: string; // Template string with {{placeholders}}
  body: string; // Template string with {{placeholders}}
  placeholders: Array<{
    key: string;
    label: string;
    example: string;
    required: boolean;
  }>;
  tags: string[];
}
```

### Adding New Templates

Add to `MESSAGE_TEMPLATES` array in `web/lib/contact/message-templates.ts`:

```typescript
{
  id: 'my-new-template',
  title: 'My New Template',
  description: 'Template description',
  category: 'general',
  subject: 'Subject with {{placeholder}}',
  body: 'Body with {{placeholder}}',
  placeholders: [
    {
      key: 'placeholder',
      label: 'Placeholder Label',
      example: 'Example value',
      required: true,
    },
  ],
  tags: ['tag1', 'tag2'],
}
```

---

## Error Handling

### Individual Messages
- Validation errors (missing subject/message)
- Network errors with retry suggestions
- Rate limiting with retry-after information
- Authentication errors with login prompts

### Bulk Messages
- Individual failure tracking
- Partial success reporting
- Network error handling
- Per-representative error messages

---

## Performance Considerations

### Template Filling
- Templates are filled using `useMemo` for performance
- Placeholder replacement is O(n) where n is placeholder count
- No re-renders until values change

### Bulk Sending
- Messages are sent sequentially to avoid rate limits
- Each send is independent (failures don't stop others)
- Progress is tracked per representative

---

## Security

### Authentication
- All endpoints require authentication
- User can only access their own threads
- Representative IDs are validated

### Rate Limiting
- 10 messages per minute per user (configurable)
- Applied at API level
- Clear error messages with retry-after

### Input Validation
- Subject length limit: 200 characters
- Message content length limit: 10,000 characters
- Real-time character counting with visual feedback
- HTML sanitization (if applicable)
- Placeholder validation
- Required field validation with ARIA attributes

---

## Accessibility

### WCAG 2.1 AA Compliance

#### **Modal Dialog**
- Proper `role="dialog"` with `aria-modal="true"`
- `aria-labelledby` and `aria-describedby` for dialog identification
- Keyboard navigation support (Escape key to close)
- Focus management (auto-focus first input on open)

#### **Form Inputs**
- `aria-required="true"` for required fields
- `aria-invalid` for validation states
- `aria-describedby` linking to error messages
- Proper `<label>` associations with `htmlFor`
- Character count feedback
- Max length attributes

#### **Interactive Elements**
- `aria-expanded` for collapsible sections
- `aria-controls` for control relationships
- `aria-busy` for loading states
- `aria-label` for icon-only buttons
- `aria-selected` for selected options
- `role="alert"` and `aria-live="polite"` for status messages

#### **Screen Reader Support**
- `aria-hidden="true"` on decorative icons
- Descriptive button labels
- Clear error messages
- Live regions for dynamic content updates

#### **Keyboard Navigation**
- Escape key closes modals
- Tab order follows logical flow
- Focus indicators visible
- Disabled states properly communicated

---

## Future Enhancements

### Planned
- [ ] Attachment support
- [ ] Message drafts
- [ ] Email notifications
- [ ] Representative response tracking
- [ ] Template customization by users
- [ ] Scheduled messages
- [ ] Message analytics

### Under Consideration
- [ ] SMS notifications
- [ ] Voice message support
- [ ] Video message support
- [ ] AI-assisted message composition
- [ ] Multi-language templates

---

## Testing

### Manual Testing Checklist

- [ ] Select and fill template
- [ ] Send individual message
- [ ] Send bulk message
- [ ] View communication history
- [ ] Filter and sort history
- [ ] Contact from "My Representatives"
- [ ] Error handling (network, auth, validation)
- [ ] Template validation

### Automated Tests

Tests should cover:
- Template filling logic
- API endpoint integration
- Error handling paths
- Validation logic
- Bulk send sequencing

---

## Troubleshooting

### Template Not Filling

**Issue:** Placeholders not replaced

**Solution:**
- Ensure `updateTemplateValue` is called for each placeholder
- Check that placeholder keys match template definition
- Verify `filledTemplate` is being computed (check hook)

### Bulk Send Failures

**Issue:** Some messages fail in bulk send

**Solution:**
- Check individual error messages in results
- Verify representative IDs are valid
- Check rate limiting (may need to reduce batch size)
- Review network connectivity

### History Not Showing

**Issue:** Threads not appearing in history

**Solution:**
- Verify authentication
- Check API response for threads
- Ensure threads are being created on send
- Review filter/sort settings

---

## Related Documentation

- [Message Templates System](../lib/contact/message-templates.ts)
- [Contact API Endpoints](../app/api/contact/)
- [Representative Following System](./REPRESENTATIVE_FOLLOWING.md)

---

**Last Updated:** January 26, 2025

