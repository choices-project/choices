# Custom JWT System - Removed

*Last Updated: 2025-09-09*

**Removed:** September 9, 2025  
**Reason:** Replaced with Supabase Auth for consistency and security

## 🎯 **What It Touched**

### **Database Tables (Removed)**
- `ia_users` - Custom user management
- `ia_tokens` - JWT token storage
- `ia_refresh_tokens` - Refresh token storage
- `user_sessions` - Custom session management
- `user_sessions_v2` - Updated session management

### **API Routes (Removed)**
- `/api/auth/login` - Custom login endpoint
- `/api/auth/register` - Custom registration endpoint
- `/api/auth/refresh` - Token refresh endpoint
- `/api/auth/logout` - Custom logout endpoint

### **Code Files (Removed)**
- `web/lib/jwt-enhanced.ts` - JWT utilities
- `web/lib/auth-utils.ts` - Authentication utilities
- `web/lib/user-sync.ts` - User synchronization logic

### **Environment Variables (Updated)**
- `JWT_SECRET` - Removed
- `JWT_SECRET_CURRENT` - Removed
- `JWT_SECRET_OLD` - Removed
- `JWT_ISSUER` - Removed
- `JWT_AUDIENCE` - Removed

## 🔄 **Replacement**

**Replaced with:** Supabase Auth
- **User management:** `auth.users` table
- **Authentication:** Supabase Auth endpoints
- **Session management:** Supabase session handling
- **Security:** Built-in Supabase security features

## 📝 **Migration Notes**

- **User data:** Migrated to `user_profiles` table linked to `auth.users`
- **Sessions:** Handled by Supabase Auth
- **Tokens:** Managed by Supabase Auth
- **Security:** Enhanced with Supabase RLS policies

---

**Status:** Completely removed and replaced with Supabase Auth
