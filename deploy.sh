#!/bin/bash

# Choices Voting System - Production Deployment Script
set -e

echo "🚀 Deploying Choices Voting System..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install it and try again."
    exit 1
fi

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p data/ia data/po ssl

# Generate self-signed SSL certificate for development
if [ ! -f ssl/cert.pem ] || [ ! -f ssl/key.pem ]; then
    print_warning "Generating self-signed SSL certificate for development..."
    openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Choices/CN=localhost"
fi

# Build and start services
print_status "Building and starting services..."
docker-compose up --build -d

# Wait for services to be healthy
print_status "Waiting for services to be healthy..."
sleep 10

# Check service health
print_status "Checking service health..."

# Check IA service
if curl -f http://localhost:8081/healthz > /dev/null 2>&1; then
    print_status "✅ IA service is healthy"
else
    print_error "❌ IA service is not responding"
    exit 1
fi

# Check PO service
if curl -f http://localhost:8082/healthz > /dev/null 2>&1; then
    print_status "✅ PO service is healthy"
else
    print_error "❌ PO service is not responding"
    exit 1
fi

# Check Web service
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    print_status "✅ Web service is healthy"
else
    print_error "❌ Web service is not responding"
    exit 1
fi

print_status "🎉 Deployment completed successfully!"
echo ""
echo "📋 Service URLs:"
echo "   Web Interface: http://localhost:3000"
echo "   IA API:        http://localhost:8081"
echo "   PO API:        http://localhost:8082"
echo ""
echo "🔧 Management Commands:"
echo "   View logs:     docker-compose logs -f"
echo "   Stop services: docker-compose down"
echo "   Restart:       docker-compose restart"
echo "   Update:        ./deploy.sh"
echo ""
print_status "The Choices voting system is now running in production mode!"
