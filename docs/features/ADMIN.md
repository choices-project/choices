# 👑 Admin System

**Complete Admin Documentation for Choices Platform**

---

## 🎯 **Overview**

The Choices platform features a comprehensive admin system that provides platform management, user administration, analytics oversight, and system monitoring capabilities for administrators and platform managers.

**Last Updated**: October 27, 2025  
**Status**: Production Ready  
**Access Level**: Verified Users Only

---

## 🏗️ **Core Features**

### **User Management**
- **User Overview**: Complete user database management
- **Trust Tier Management**: Promote and demote user trust tiers
- **User Analytics**: Individual user behavior and engagement metrics
- **Account Actions**: Suspend, activate, or delete user accounts
- **Bulk Operations**: Mass user management operations

### **Platform Analytics**
- **Dashboard Metrics**: Real-time platform performance metrics
- **User Analytics**: User growth, engagement, and retention metrics
- **Poll Analytics**: Poll creation, voting, and engagement analytics
- **System Health**: Platform health and performance monitoring
- **AI Insights**: AI-powered platform insights and recommendations

### **Content Management**
- **Poll Moderation**: Review and moderate user-created polls
- **Content Flagging**: Handle flagged content and user reports
- **Hashtag Management**: Manage hashtags and trending topics
- **Featured Content**: Feature important polls and content
- **Content Policies**: Enforce content policies and guidelines

### **System Administration**
- **Feature Flags**: Enable/disable platform features
- **System Configuration**: Platform settings and configuration
- **Database Management**: Database operations and maintenance
- **Security Monitoring**: Security events and threat monitoring
- **Performance Monitoring**: System performance and optimization

---

## 🔧 **Implementation Details**

### **Admin User Management**
```typescript
// Admin User Interface
interface AdminUser {
  id: string;
  user_id: string;
  role: 'super_admin' | 'admin' | 'moderator';
  permissions: AdminPermissions;
  created_at: string;
  created_by: string;
  last_active: string;
}

interface AdminPermissions {
  user_management: boolean;
  content_moderation: boolean;
  analytics_access: boolean;
  system_configuration: boolean;
  security_monitoring: boolean;
  feature_flags: boolean;
}

// Admin Service
class AdminService {
  async promoteUser(userId: string, newTier: TrustTier, reason: string, adminId: string) {
    // Check admin permissions
    const admin = await this.getAdminUser(adminId);
    if (!admin.permissions.user_management) {
      throw new Error('Insufficient permissions');
    }
    
    // Promote user
    const result = await supabase.rpc('promote_user_trust_tier', {
      user_uuid: userId,
      new_tier: newTier,
      reason,
      promoted_by: adminId
    });
    
    // Log admin action
    await this.logAdminAction(adminId, 'user_promotion', {
      target_user: userId,
      new_tier: newTier,
      reason
    });
    
    return result;
  }
  
  async suspendUser(userId: string, reason: string, adminId: string) {
    const admin = await this.getAdminUser(adminId);
    if (!admin.permissions.user_management) {
      throw new Error('Insufficient permissions');
    }
    
    // Suspend user
    await supabase
      .from('users')
      .update({ 
        status: 'suspended',
        suspension_reason: reason,
        suspended_at: new Date().toISOString(),
        suspended_by: adminId
      })
      .eq('id', userId);
    
    // Log admin action
    await this.logAdminAction(adminId, 'user_suspension', {
      target_user: userId,
      reason
    });
  }
  
  async getPlatformMetrics() {
    const [
      userMetrics,
      pollMetrics,
      voteMetrics,
      systemMetrics
    ] = await Promise.all([
      this.getUserMetrics(),
      this.getPollMetrics(),
      this.getVoteMetrics(),
      this.getSystemMetrics()
    ]);
    
    return {
      users: userMetrics,
      polls: pollMetrics,
      votes: voteMetrics,
      system: systemMetrics,
      generated_at: new Date().toISOString()
    };
  }
  
  async getUserMetrics() {
    const { data: totalUsers } = await supabase
      .from('users')
      .select('count', { count: 'exact' });
    
    const { data: activeUsers } = await supabase
      .from('users')
      .select('count', { count: 'exact' })
      .gte('last_active', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
    
    const { data: trustTierBreakdown } = await supabase
      .from('users')
      .select('trust_tier')
      .then(result => {
        const breakdown = {};
        result.data.forEach(user => {
          breakdown[user.trust_tier] = (breakdown[user.trust_tier] || 0) + 1;
        });
        return breakdown;
      });
    
    return {
      total_users: totalUsers.count,
      active_users_7d: activeUsers.count,
      trust_tier_breakdown: trustTierBreakdown,
      growth_rate: await this.calculateGrowthRate('users')
    };
  }
}
```

### **Content Moderation**
```typescript
// Content Moderation Service
class ContentModerationService {
  async moderatePoll(pollId: string, action: 'approve' | 'reject' | 'flag', adminId: string, reason?: string) {
    const admin = await this.getAdminUser(adminId);
    if (!admin.permissions.content_moderation) {
      throw new Error('Insufficient permissions');
    }
    
    let status;
    switch (action) {
      case 'approve':
        status = 'active';
        break;
      case 'reject':
        status = 'rejected';
        break;
      case 'flag':
        status = 'flagged';
        break;
    }
    
    // Update poll status
    await supabase
      .from('polls')
      .update({ 
        status,
        moderation_reason: reason,
        moderated_at: new Date().toISOString(),
        moderated_by: adminId
      })
      .eq('id', pollId);
    
    // Log moderation action
    await this.logModerationAction(adminId, 'poll_moderation', {
      poll_id: pollId,
      action,
      reason
    });
  }
  
  async getFlaggedContent() {
    const { data: flaggedPolls } = await supabase
      .from('polls')
      .select('*')
      .eq('status', 'flagged')
      .order('created_at', { ascending: false });
    
    const { data: flaggedUsers } = await supabase
      .from('users')
      .select('*')
      .eq('status', 'flagged')
      .order('created_at', { ascending: false });
    
    return {
      polls: flaggedPolls,
      users: flaggedUsers
    };
  }
  
  async handleUserReport(reportId: string, action: 'dismiss' | 'investigate' | 'take_action', adminId: string) {
    const admin = await this.getAdminUser(adminId);
    if (!admin.permissions.content_moderation) {
      throw new Error('Insufficient permissions');
    }
    
    // Update report status
    await supabase
      .from('user_reports')
      .update({
        status: action,
        handled_at: new Date().toISOString(),
        handled_by: adminId
      })
      .eq('id', reportId);
    
    // Log report handling
    await this.logModerationAction(adminId, 'report_handling', {
      report_id: reportId,
      action
    });
  }
}
```

### **Feature Flag Management**
```typescript
// Feature Flag Service
class FeatureFlagService {
  async getFeatureFlags() {
    const { data, error } = await supabase
      .from('feature_flags')
      .select('*')
      .order('name');
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  }
  
  async updateFeatureFlag(flagId: string, enabled: boolean, adminId: string) {
    const admin = await this.getAdminUser(adminId);
    if (!admin.permissions.feature_flags) {
      throw new Error('Insufficient permissions');
    }
    
    // Update feature flag
    await supabase
      .from('feature_flags')
      .update({
        enabled,
        updated_at: new Date().toISOString(),
        updated_by: adminId
      })
      .eq('id', flagId);
    
    // Log feature flag change
    await this.logAdminAction(adminId, 'feature_flag_update', {
      flag_id: flagId,
      enabled
    });
  }
  
  async createFeatureFlag(name: string, description: string, enabled: boolean, adminId: string) {
    const admin = await this.getAdminUser(adminId);
    if (!admin.permissions.feature_flags) {
      throw new Error('Insufficient permissions');
    }
    
    // Create feature flag
    const { data, error } = await supabase
      .from('feature_flags')
      .insert({
        name,
        description,
        enabled,
        created_by: adminId
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    // Log feature flag creation
    await this.logAdminAction(adminId, 'feature_flag_creation', {
      flag_id: data.id,
      name,
      enabled
    });
    
    return data;
  }
}
```

---

## 📊 **Admin Dashboard**

### **Dashboard Components**
```typescript
// Admin Dashboard Component
const AdminDashboard = () => {
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/admin/dashboard');
        const data = await response.json();
        setMetrics(data);
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);
  
  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }
  
  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <div className="last-updated">
          Last updated: {new Date(metrics?.generated_at).toLocaleString()}
        </div>
      </div>
      
      <div className="metrics-grid">
        <MetricCard
          title="Total Users"
          value={metrics?.users.total_users}
          trend={metrics?.users.growth_rate}
          icon={<UsersIcon />}
        />
        <MetricCard
          title="Active Polls"
          value={metrics?.polls.active_polls}
          trend={metrics?.polls.poll_creation_rate}
          icon={<PollIcon />}
        />
        <MetricCard
          title="Total Votes"
          value={metrics?.votes.total_votes}
          trend={metrics?.votes.vote_participation_rate}
          icon={<VoteIcon />}
        />
        <MetricCard
          title="System Health"
          value={`${metrics?.system.uptime_percentage}%`}
          trend={metrics?.system.performance_score}
          icon={<HealthIcon />}
        />
      </div>
      
      <div className="dashboard-sections">
        <UserManagementSection />
        <ContentModerationSection />
        <SystemHealthSection />
        <AnalyticsSection />
      </div>
    </div>
  );
};
```

### **User Management Interface**
```typescript
// User Management Component
const UserManagementSection = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  const handleBulkAction = async (action: string) => {
    if (selectedUsers.length === 0) return;
    
    try {
      await fetch('/api/admin/users/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_ids: selectedUsers,
          action
        })
      });
      
      // Refresh user list
      await fetchUsers();
      setSelectedUsers([]);
    } catch (error) {
      console.error('Bulk action failed:', error);
    }
  };
  
  const promoteUser = async (userId: string, newTier: TrustTier) => {
    try {
      await fetch(`/api/admin/users/${userId}/promote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          new_tier: newTier,
          reason: 'Admin promotion'
        })
      });
      
      await fetchUsers();
    } catch (error) {
      console.error('Promotion failed:', error);
    }
  };
  
  return (
    <div className="user-management-section">
      <div className="section-header">
        <h2>User Management</h2>
        <div className="bulk-actions">
          <button onClick={() => handleBulkAction('suspend')}>
            Suspend Selected
          </button>
          <button onClick={() => handleBulkAction('activate')}>
            Activate Selected
          </button>
        </div>
      </div>
      
      <div className="user-table">
        <table>
          <thead>
            <tr>
              <th>
                <input 
                  type="checkbox" 
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedUsers(users.map(u => u.id));
                    } else {
                      setSelectedUsers([]);
                    }
                  }}
                />
              </th>
              <th>Name</th>
              <th>Email</th>
              <th>Trust Tier</th>
              <th>Status</th>
              <th>Last Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>
                  <input 
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers([...selectedUsers, user.id]);
                      } else {
                        setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                      }
                    }}
                  />
                </td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <select 
                    value={user.trust_tier}
                    onChange={(e) => promoteUser(user.id, e.target.value as TrustTier)}
                  >
                    <option value="anonymous">Anonymous</option>
                    <option value="new">New</option>
                    <option value="established">Established</option>
                    <option value="verified">Verified</option>
                  </select>
                </td>
                <td>{user.status}</td>
                <td>{new Date(user.last_active).toLocaleDateString()}</td>
                <td>
                  <button onClick={() => handleUserAction(user.id, 'suspend')}>
                    Suspend
                  </button>
                  <button onClick={() => handleUserAction(user.id, 'activate')}>
                    Activate
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
```

---

## 🛠️ **API Endpoints**

### **Admin Endpoints**
```typescript
// GET /api/admin/dashboard
const adminDashboardEndpoint = {
  method: 'GET',
  path: '/api/admin/dashboard',
  response: {
    metrics: PlatformMetrics,
    recent_activity: Array<AdminActivity>,
    system_health: SystemHealth
  }
};

// GET /api/admin/users
const adminUsersEndpoint = {
  method: 'GET',
  path: '/api/admin/users',
  queryParams: {
    page?: number,
    limit?: number,
    trust_tier?: string,
    status?: string
  },
  response: {
    users: User[],
    pagination: {
      page: number,
      limit: number,
      total: number,
      pages: number
    }
  }
};

// POST /api/admin/users/{id}/promote
const promoteUserEndpoint = {
  method: 'POST',
  path: '/api/admin/users/{id}/promote',
  body: {
    new_tier: TrustTier,
    reason: string
  },
  response: {
    success: boolean,
    user: User
  }
};

// GET /api/admin/content/flagged
const flaggedContentEndpoint = {
  method: 'GET',
  path: '/api/admin/content/flagged',
  response: {
    polls: Poll[],
    users: User[],
    reports: UserReport[]
  }
};

// POST /api/admin/feature-flags
const featureFlagsEndpoint = {
  method: 'POST',
  path: '/api/admin/feature-flags',
  body: {
    name: string,
    description: string,
    enabled: boolean
  },
  response: {
    feature_flag: FeatureFlag
  }
};
```

---

## 🔐 **Security & Permissions**

### **Admin Authentication**
```typescript
// Admin Authentication Middleware
const requireAdmin = async (request: Request) => {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    throw new Error('Authentication required');
  }
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    throw new Error('Invalid token');
  }
  
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('*')
    .eq('user_id', user.id)
    .single();
  
  if (!adminUser) {
    throw new Error('Admin access required');
  }
  
  return { user, adminUser };
};

// Permission Checking
const checkAdminPermission = (adminUser: AdminUser, permission: keyof AdminPermissions) => {
  if (!adminUser.permissions[permission]) {
    throw new Error(`Permission required: ${permission}`);
  }
};
```

### **Audit Logging**
```typescript
// Admin Action Logging
const logAdminAction = async (adminId: string, action: string, details: any) => {
  await supabase
    .from('admin_audit_log')
    .insert({
      admin_id: adminId,
      action,
      details,
      timestamp: new Date().toISOString(),
      ip_address: getClientIP(),
      user_agent: getUserAgent()
    });
};
```

---

## 🔍 **Testing**

### **Admin Tests**
```typescript
describe('Admin System', () => {
  it('should require admin authentication', async () => {
    const response = await request(app)
      .get('/api/admin/dashboard')
      .expect(401);
      
    expect(response.body.error).toBe('Authentication required');
  });
  
  it('should promote user trust tier', async () => {
    const admin = await createTestAdmin();
    const user = await createTestUser();
    
    const response = await request(app)
      .post(`/api/admin/users/${user.id}/promote`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        new_tier: 'verified',
        reason: 'Test promotion'
      })
      .expect(200);
      
    expect(response.body.user.trust_tier).toBe('verified');
  });
});
```

---

## 🎯 **Best Practices**

### **Admin Operations**
- **Audit Everything**: Log all admin actions
- **Permission Checks**: Verify permissions for all operations
- **Bulk Operations**: Support efficient bulk operations
- **Error Handling**: Graceful error handling and recovery

### **User Management**
- **Transparent Actions**: Be transparent about admin actions
- **Reversible Actions**: Make actions reversible where possible
- **User Notification**: Notify users of admin actions
- **Appeal Process**: Provide appeal process for admin actions

### **Security**
- **Least Privilege**: Grant minimum necessary permissions
- **Regular Audits**: Regular security audits and reviews
- **Access Monitoring**: Monitor admin access and activities
- **Incident Response**: Prepared incident response procedures

---

**Admin Documentation Version**: 1.0.0  
**Last Updated**: October 27, 2025  
**Status**: ✅ Production Ready

---

*This admin documentation provides complete coverage of the Choices platform admin system.*
