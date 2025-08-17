# Admin Access Security & Tier System

## 🔐 **Current Verification Tier System**

### **Tier Breakdown**

| Tier | Name | Description | Permissions | Access Level |
|------|------|-------------|-------------|--------------|
| **T0** | Anonymous | Basic human presence verification | `read` only | Public polls, basic features |
| **T1** | Verified Human | Account + WebAuthn/Passkey | `read`, `write` | Can vote, create basic content |
| **T2** | Trusted Participant | Personhood verification (liveness + ID) | `read`, `write`, `create_polls` | Can create polls, access admin features |
| **T3** | Validator | Citizenship/Residency verification | `read`, `write`, `admin`, `create_polls`, `manage_users` | Full admin access |

### **Current Permission Matrix**

```typescript
// From web/lib/api.ts
private getPermissionsForTier(tier: string): string[] {
  switch (tier) {
    case 'T3':
      return ['read', 'write', 'admin', 'create_polls', 'manage_users']
    case 'T2':
      return ['read', 'write', 'create_polls']
    case 'T1':
      return ['read', 'write']
    case 'T0':
      return ['read']
    default:
      return ['read']
  }
}
```

### **Admin Access Requirements**

**BEFORE**: T2 and T3 users could access admin features
**AFTER**: Only the owner (you) can access admin features

## 🛡️ **Securing Admin Access to Owner Only**

### **What Was Changed**

All admin API endpoints now use **hardcoded user ID checks** instead of tier-based permissions:

```typescript
// OLD: Tier-based access
if (!userProfile || !['T2', 'T3'].includes(userProfile.verification_tier)) {
  return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
}

// NEW: Owner-only access
const OWNER_USER_ID = 'your-user-id-here'; // TODO: Replace with your actual user ID
if (!userProfile || user.id !== OWNER_USER_ID) {
  return NextResponse.json({ error: 'Admin access restricted to owner only' }, { status: 403 });
}
```

### **Files Modified**

1. `web/app/api/admin/trending-topics/analyze/route.ts`
2. `web/app/api/admin/trending-topics/route.ts`
3. `web/app/api/admin/generated-polls/route.ts`
4. `web/app/api/admin/generated-polls/[id]/approve/route.ts`

## 🔧 **How to Set Up Owner-Only Access**

### **Step 1: Get Your User ID**

1. **Log into the application** at `http://localhost:3000`
2. **Run the user ID script**:
   ```bash
   cd web
   node ../scripts/get-user-id.js
   ```
3. **Copy your User ID** from the output

### **Step 2: Update Admin Routes**

Replace `'your-user-id-here'` with your actual user ID in these files:

```typescript
// Example: If your user ID is 'abc123-def456-ghi789'
const OWNER_USER_ID = 'abc123-def456-ghi789';
```

**Files to update:**
- `web/app/api/admin/trending-topics/analyze/route.ts`
- `web/app/api/admin/trending-topics/route.ts`
- `web/app/api/admin/generated-polls/route.ts`
- `web/app/api/admin/generated-polls/[id]/approve/route.ts`

### **Step 3: Restart Development Server**

```bash
# Stop the current server (Ctrl+C)
# Then restart
cd web && npm run dev
```

### **Step 4: Test Admin Access**

1. Navigate to `http://localhost:3000/admin/automated-polls`
2. You should now have access (if you're the owner)
3. Other users will get "Admin access restricted to owner only" error

## 🔒 **Security Benefits**

### **Before (Tier-Based)**
- ❌ Any T2/T3 user could access admin features
- ❌ Multiple people could have admin access
- ❌ Risk of unauthorized admin actions

### **After (Owner-Only)**
- ✅ Only you can access admin features
- ✅ No risk of unauthorized access
- ✅ Complete control over automated polls system
- ✅ Hardcoded user ID prevents privilege escalation

## 🚨 **Important Security Notes**

### **1. Keep Your User ID Private**
- Don't commit your actual user ID to version control
- Consider using environment variables for production

### **2. Backup Your User ID**
- Store your user ID securely
- You'll need it if you need to update the admin routes

### **3. Environment Variable Option**
For production, you can use environment variables:

```typescript
const OWNER_USER_ID = process.env.ADMIN_USER_ID || 'your-user-id-here';
```

Then set in your `.env.local`:
```bash
ADMIN_USER_ID=your-actual-user-id
```

## 🎯 **Testing the Security**

### **Test 1: Owner Access**
1. Log in as the owner
2. Navigate to `/admin/automated-polls`
3. Should work normally

### **Test 2: Non-Owner Access**
1. Log in as a different user
2. Navigate to `/admin/automated-polls`
3. Should get "Admin access restricted to owner only" error

### **Test 3: API Endpoints**
1. Try accessing admin API endpoints directly
2. Should get 403 error unless you're the owner

## 🔄 **Reverting Changes (If Needed)**

If you want to go back to tier-based access:

```typescript
// Replace the owner check with tier check
if (!userProfile || !['T2', 'T3'].includes(userProfile.verification_tier)) {
  return NextResponse.json(
    { error: 'Insufficient permissions' },
    { status: 403 }
  );
}
```

## 📋 **Current Tier System Summary**

### **T0 - Anonymous**
- **Purpose**: Basic human verification
- **Permissions**: Read-only access
- **Use Case**: Public poll viewing

### **T1 - Verified Human**
- **Purpose**: Account + WebAuthn verification
- **Permissions**: Read, write
- **Use Case**: Voting, basic content creation

### **T2 - Trusted Participant**
- **Purpose**: Personhood verification (liveness + ID)
- **Permissions**: Read, write, create polls
- **Use Case**: Poll creation, trusted content

### **T3 - Validator**
- **Purpose**: Citizenship/Residency verification
- **Permissions**: Read, write, admin, create polls, manage users
- **Use Case**: Full system access (now restricted to owner only)

---

**Status**: ✅ Admin access secured to owner only  
**Last Updated**: January 2025  
**Security Level**: Maximum (Owner-only access)
