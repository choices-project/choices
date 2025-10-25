# Role-Based Access Control (RBAC) System

**Created:** October 24, 2025  
**Updated:** October 24, 2025  
**Status:** ACTIVE  
**Purpose:** Professional multi-role admin management system for collaborative development

## 🎯 **System Overview**

The Choices platform implements a comprehensive Role-Based Access Control (RBAC) system designed for professional collaboration and scalable admin management. This system replaces the simple `is_admin` boolean with a sophisticated, hierarchical permission system.

## 🏗️ **Architecture**

### **Core Components**
1. **Roles** - Hierarchical user roles with different permission levels
2. **Permissions** - Granular actions on specific resources
3. **Role-Permission Mapping** - Many-to-many relationship between roles and permissions
4. **User-Role Assignment** - Dynamic role assignment with expiration support

### **Database Schema**
- `roles` - Role definitions with hierarchy levels
- `permissions` - Granular permission definitions
- `role_permissions` - Role-to-permission mappings
- `user_roles` - User role assignments with expiration

## 👥 **Role Hierarchy**

### **1. Super Administrator (Level 100)**
- **Full system access** with all permissions
- **System configuration** and monitoring
- **User role management** and assignment
- **Cannot be deleted** (system role)

### **2. Administrator (Level 80)**
- **User management** (create, read, update, delete)
- **Content moderation** and management
- **Analytics access** and reporting
- **No system configuration** access

### **3. Moderator (Level 60)**
- **Content moderation** (polls, comments, etc.)
- **User support** and basic management
- **Analytics viewing** (limited)
- **No user deletion** or system access

### **4. Support Agent (Level 40)**
- **User support** and assistance
- **Basic user management** (read, update)
- **Limited analytics** access
- **No content moderation** or deletion

### **5. Regular User (Level 20)**
- **Standard user permissions**
- **Create and manage** own content
- **No admin access**

## 🔐 **Permission System**

### **Resource-Based Permissions**
- **Users**: `create`, `read`, `update`, `delete`, `manage_roles`
- **Polls**: `create`, `read`, `update`, `delete`, `moderate`
- **Analytics**: `view`, `export`
- **System**: `configure`, `monitor`
- **Content**: `moderate`, `delete`

### **Permission Examples**
```sql
-- Check if user can create users
SELECT has_permission('user-id', 'users.create');

-- Check if user can moderate content
SELECT has_permission('user-id', 'content.moderate');

-- Get all user permissions
SELECT * FROM get_user_permissions('user-id');
```

## 🛠️ **RBAC Functions**

### **Core Functions**
- `has_role(user_id, role_name)` - Check if user has specific role
- `has_permission(user_id, permission_name)` - Check if user has specific permission
- `get_user_roles(user_id)` - Get all user roles with levels
- `get_user_permissions(user_id)` - Get all user permissions
- `is_admin(user_id)` - Check if user has any admin role

### **Usage Examples**
```sql
-- Check if user is admin
SELECT is_admin('user-id');

-- Check if user has moderator role
SELECT has_role('user-id', 'moderator');

-- Get user's role hierarchy
SELECT * FROM get_user_roles('user-id');
```

## 🚀 **Implementation Benefits**

### **Professional Collaboration**
- **Clear role separation** for different team members
- **Granular permissions** for fine-grained access control
- **Role expiration** for temporary access
- **Audit trail** with assignment tracking

### **Scalability**
- **Easy role creation** for new team members
- **Flexible permission system** for custom access patterns
- **Hierarchical structure** for clear organization
- **Performance optimized** with proper indexing

### **Security**
- **Row Level Security (RLS)** on all RBAC tables
- **Secure functions** with proper permissions
- **Role-based access** to admin functions
- **Audit capabilities** for compliance

## 📋 **Usage Guidelines**

### **Role Assignment**
```sql
-- Assign admin role to user
INSERT INTO user_roles (user_id, role_id, assigned_by)
SELECT 'user-id', r.id, 'assigner-id'
FROM roles r WHERE r.name = 'admin';

-- Assign role with expiration
INSERT INTO user_roles (user_id, role_id, expires_at)
SELECT 'user-id', r.id, NOW() + INTERVAL '30 days'
FROM roles r WHERE r.name = 'moderator';
```

### **Permission Checking**
```typescript
// In application code
const canCreateUsers = await supabase.rpc('has_permission', {
  user_id: userId,
  permission_name: 'users.create'
});

const isAdmin = await supabase.rpc('is_admin', {
  user_id: userId
});
```

## 🔄 **Migration from Simple Admin**

### **Before (Simple Boolean)**
```sql
-- Old system
SELECT is_admin FROM user_profiles WHERE user_id = 'user-id';
```

### **After (RBAC System)**
```sql
-- New system
SELECT is_admin('user-id');
SELECT has_role('user-id', 'admin');
SELECT has_permission('user-id', 'users.create');
```

## 🎯 **Next Steps**

1. **Apply RBAC Migration** - Deploy the database schema
2. **Update Application Code** - Replace `is_admin` checks with RBAC functions
3. **Create Admin Interface** - Build role management UI
4. **E2E Testing** - Test all role scenarios
5. **Documentation** - Update API documentation with RBAC

## 📊 **Performance Considerations**

- **Indexed queries** for fast role/permission lookups
- **Cached results** for frequently checked permissions
- **Efficient joins** with proper foreign key relationships
- **RLS policies** optimized for security and performance

This RBAC system transforms the Choices platform into a professional, collaborative-ready application with enterprise-grade access control.

