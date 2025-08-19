#!/bin/bash

# Choices Database Setup Script
# This script sets up PostgreSQL and Redis for the Choices polling platform

set -e

echo "🚀 Setting up Choices Database Infrastructure..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install it and try again."
    exit 1
fi

# Create database directory if it doesn't exist
mkdir -p database

echo "📦 Starting PostgreSQL and Redis containers..."

# Start the database services
docker-compose up -d postgres redis

echo "⏳ Waiting for PostgreSQL to be ready..."

# Wait for PostgreSQL to be ready
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if docker-compose exec -T postgres pg_isready -U choices_user -d choices > /dev/null 2>&1; then
        echo "✅ PostgreSQL is ready!"
        break
    fi
    
    echo "⏳ Attempt $attempt/$max_attempts: PostgreSQL is starting..."
    sleep 2
    attempt=$((attempt + 1))
done

if [ $attempt -gt $max_attempts ]; then
    echo "❌ PostgreSQL failed to start within the expected time."
    exit 1
fi

echo "⏳ Waiting for Redis to be ready..."

# Wait for Redis to be ready
max_attempts=15
attempt=1

while [ $attempt -le $max_attempts ]; do
    if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
        echo "✅ Redis is ready!"
        break
    fi
    
    echo "⏳ Attempt $attempt/$max_attempts: Redis is starting..."
    sleep 1
    attempt=$((attempt + 1))
done

if [ $attempt -gt $max_attempts ]; then
    echo "❌ Redis failed to start within the expected time."
    exit 1
fi

echo "🔧 Initializing database schema..."

# The schema will be automatically initialized by the init.sql script
# when the PostgreSQL container starts for the first time

echo "📊 Checking database tables..."

# Check if tables exist
table_count=$(docker-compose exec -T postgres psql -U choices_user -d choices -t -c "
    SELECT COUNT(*) 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND (table_name LIKE 'ia_%' OR table_name LIKE 'po_%' OR table_name LIKE 'analytics_%');
" | tr -d ' ')

if [ "$table_count" -gt 0 ]; then
    echo "✅ Database schema is initialized with $table_count tables"
else
    echo "⚠️  No tables found. The schema may not have been initialized properly."
fi

echo "📈 Checking sample data..."

# Check sample data
poll_count=$(docker-compose exec -T postgres psql -U choices_user -d choices -t -c "
    SELECT COUNT(*) FROM po_polls;
" | tr -d ' ')

user_count=$(docker-compose exec -T postgres psql -U choices_user -d choices -t -c "
    SELECT COUNT(*) FROM ia_users;
" | tr -d ' ')

vote_count=$(docker-compose exec -T postgres psql -U choices_user -d choices -t -c "
    SELECT COUNT(*) FROM po_votes;
" | tr -d ' ')

echo "📊 Sample data summary:"
echo "   - Polls: $poll_count"
echo "   - Users: $user_count"
echo "   - Votes: $vote_count"

echo ""
echo "🎉 Database setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Start the IA service: cd server/ia && go run cmd/ia/main.go"
echo "   2. Start the PO service: cd server/po && go run cmd/po/main.go"
echo "   3. Start the web interface: cd web && npm run dev"
echo ""
echo "🔗 Database connection details:"
echo "   - PostgreSQL: localhost:5432"
echo "   - Database: choices"
echo "   - Username: choices_user"
echo "   - Password: choices_password"
echo "   - Redis: localhost:6379"
echo ""
echo "🛠️  Useful commands:"
echo "   - View logs: docker-compose logs -f postgres"
echo "   - Connect to database: docker-compose exec postgres psql -U choices_user -d choices"
echo "   - Stop services: docker-compose down"
echo "   - Reset database: docker-compose down -v && ./scripts/setup_database.sh"
