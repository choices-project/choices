# Database Upgrade: SQLite → PostgreSQL

## 🎯 **Why We Upgraded**

Your instinct was absolutely right! SQLite was great for development and prototyping, but for a production polling platform, we needed something much more robust. Here's why PostgreSQL is the perfect choice:

### **SQLite Limitations:**
- ❌ **Single-writer lock** - Only one process can write at a time
- ❌ **No concurrent users** - Poor performance under load
- ❌ **Limited scalability** - File-based, not network-based
- ❌ **No JSON support** - Limited data types
- ❌ **No advanced features** - Missing triggers, views, stored procedures

### **PostgreSQL Benefits:**
- ✅ **ACID compliance** - Full transaction support
- ✅ **Concurrent access** - Multiple users can read/write simultaneously
- ✅ **JSONB support** - Native JSON with indexing
- ✅ **Advanced features** - Triggers, views, stored procedures, full-text search
- ✅ **Scalability** - Can handle millions of records efficiently
- ✅ **Production-ready** - Used by major companies worldwide

## 🚀 **What's New**

### **Enhanced Database Schema:**
```sql
-- IA Service Tables (prefixed with ia_)
ia_users          -- User management
ia_tokens         -- Token issuance
ia_verification_sessions  -- WebAuthn sessions
ia_webauthn_credentials   -- Passkey storage

-- PO Service Tables (prefixed with po_)
po_polls          -- Poll management with JSONB options
po_votes          -- Vote storage with Merkle proofs
po_merkle_trees   -- Commitment tree state

-- Analytics Tables
analytics_events  -- Real-time event tracking
analytics_demographics  -- Anonymized demographic data
```

### **Advanced Features:**
- **JSONB columns** for flexible data storage
- **Automatic triggers** for vote counting
- **Database views** for dashboard analytics
- **Connection pooling** for better performance
- **Redis caching** for session management

### **Sample Data Included:**
- 5 sample users with different verification tiers
- 3 active polls with real options
- 6 sample votes with Merkle proofs
- Analytics events for testing

## 🛠️ **Setup Instructions**

### **1. Quick Setup (Recommended)**
```bash
# Run the automated setup script
./scripts/setup_database.sh
```

### **2. Manual Setup**
```bash
# Start database services
docker-compose up -d postgres redis

# Wait for services to be ready
docker-compose exec postgres pg_isready -U choices_user -d choices

# Check sample data
docker-compose exec postgres psql -U choices_user -d choices -c "SELECT COUNT(*) FROM po_polls;"
```

### **3. Start Services**
```bash
# Terminal 1: IA Service
cd server/ia && go run cmd/ia/main.go

# Terminal 2: PO Service  
cd server/po && go run cmd/po/main.go

# Terminal 3: Web Interface
cd web && npm run dev
```

## 📊 **Performance Improvements**

### **Before (SQLite):**
- Single-threaded writes
- File-based locking
- Limited concurrent users
- No connection pooling

### **After (PostgreSQL):**
- Multi-threaded writes
- Row-level locking
- Hundreds of concurrent users
- Connection pooling (25 max connections)
- Query optimization with indexes

## 🔧 **Database Management**

### **Connection Details:**
```
Host: localhost
Port: 5432
Database: choices
Username: choices_user
Password: choices_password
```

### **Useful Commands:**
```bash
# Connect to database
docker-compose exec postgres psql -U choices_user -d choices

# View logs
docker-compose logs -f postgres

# Backup database
docker-compose exec postgres pg_dump -U choices_user choices > backup.sql

# Restore database
docker-compose exec -T postgres psql -U choices_user choices < backup.sql

# Reset everything
docker-compose down -v && ./scripts/setup_database.sh
```

### **Key Queries:**
```sql
-- View all active polls
SELECT * FROM po_polls WHERE status = 'active';

-- Get vote counts by poll
SELECT poll_id, COUNT(*) as vote_count 
FROM po_votes 
GROUP BY poll_id;

-- Dashboard statistics
SELECT * FROM dashboard_stats;

-- Recent activity
SELECT * FROM analytics_events 
ORDER BY created_at DESC 
LIMIT 10;
```

## 🔄 **Migration Details**

### **What Changed:**
1. **Database Driver**: `github.com/mattn/go-sqlite3` → `github.com/lib/pq`
2. **Connection String**: File path → PostgreSQL URL
3. **Table Names**: Added prefixes (`ia_`, `po_`) for clarity
4. **Data Types**: Enhanced with JSONB, TIMESTAMP WITH TIME ZONE
5. **Indexes**: Optimized for polling queries
6. **Triggers**: Automatic vote counting and timestamp updates

### **Environment Variables:**
```bash
# Database connection
DATABASE_URL=postgres://choices_user:choices_password@localhost:5432/choices?sslmode=disable

# Redis connection (for caching)
REDIS_URL=redis://localhost:6379
```

## 🎉 **Benefits You'll See**

### **Immediate Improvements:**
- **Faster page loads** - Better query performance
- **More responsive UI** - Concurrent database access
- **Better data integrity** - ACID transactions
- **Rich analytics** - JSONB data types

### **Future Scalability:**
- **Handle thousands of users** - No more single-writer locks
- **Complex queries** - Advanced SQL features
- **Real-time analytics** - Efficient aggregation
- **Production deployment** - Industry-standard database

## 🚨 **Important Notes**

### **Development vs Production:**
- **Development**: Uses local PostgreSQL with Docker
- **Production**: Can use managed PostgreSQL (AWS RDS, Google Cloud SQL, etc.)

### **Data Persistence:**
- Database data is stored in Docker volumes
- Use `docker-compose down -v` to completely reset
- Regular backups recommended for production

### **Performance Tuning:**
- Connection pool configured for 25 max connections
- Indexes optimized for common polling queries
- JSONB columns for flexible data storage

## 🎯 **Next Steps**

1. **Test the new setup** - Run the setup script and verify everything works
2. **Explore the data** - Connect to the database and run some queries
3. **Monitor performance** - Check how the new database handles load
4. **Plan production deployment** - Consider managed PostgreSQL services

The upgrade transforms your polling platform from a prototype into a production-ready system that can scale with your user base! 🚀
