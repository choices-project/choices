# ID Handling Quick Reference

**Created:** January 27, 2025  
**Purpose:** Quick reference for ID type handling in the Choices platform

---

## 🚨 **THE CONFUSING PART EXPLAINED**

### Why We Need `parseInt()` in Contact Messaging

```typescript
// 1. Civics API returns integer
const representative = { id: 12345 };  // number

// 2. Frontend component receives integer
<ContactRepresentativeForm representativeId={12345} />  // number

// 3. JSON serialization converts to string
JSON.stringify({ representativeId: 12345 });  // '{"representativeId":"12345"}'

// 4. API receives string from JSON.parse()
const { representativeId } = await request.json();  // "12345" (string)

// 5. Database needs integer
await supabase.from('contact_threads').insert({
  representative_id: parseInt(representativeId)  // 12345 (number)
});
```

**This is NOT a bug - it's how HTTP/JSON works!**

---

## Quick Reference

### ✅ **CORRECT Patterns**

```typescript
// Frontend components
interface ContactFormProps {
  representativeId: number;  // ← Integer from civics API
}

// Service layer
async sendMessage(data: { representativeId: number }) {
  // JSON.stringify() handles conversion
}

// API routes
const { representativeId } = await request.json();  // string from JSON
const dbId = parseInt(representativeId);  // convert to integer
```

### ❌ **WRONG Patterns**

```typescript
// Don't try to avoid parseInt() - it's necessary!
const dbId = representativeId;  // ❌ Type error: string vs number

// Don't use string IDs in database
representative_id: "12345"  // ❌ Database expects integer
```

---

## Common Questions

### Q: "Why does the API receive strings?"
**A:** Because `JSON.parse()` always returns strings for numbers. This is how HTTP works.

### Q: "Why not use string IDs everywhere?"
**A:** Database foreign keys are integers. Using strings would break referential integrity.

### Q: "Is this a design flaw?"
**A:** No! This is standard practice for HTTP APIs. Every API does this.

### Q: "Can we avoid parseInt()?"
**A:** No! JSON serialization is a fundamental HTTP limitation.

---

## Files to Check

- **Frontend**: `/components/contact/ContactRepresentativeForm.tsx`
- **Service**: `/lib/contact/real-time-messaging.ts`
- **API**: `/app/api/contact/messages/route.ts`
- **API**: `/app/api/contact/threads/route.ts`
- **Types**: `/types/database.ts`

---

## The Bottom Line

**parseInt() is necessary and correct. Don't try to "fix" it - it's not broken!**
