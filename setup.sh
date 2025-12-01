#!/bin/bash

set -e

echo "======================================"
echo "🚀 JN Automation Setup"
echo "======================================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Copy environment files
echo "📋 Setting up environment files..."
if [ ! -f "backend/.env" ]; then
    cp .env.example backend/.env
    echo "✅ Created backend/.env"
else
    echo "⏭️  backend/.env already exists"
fi

if [ ! -f "frontend/.env.local" ]; then
    cp frontend/.env.example frontend/.env.local
    echo "✅ Created frontend/.env.local"
else
    echo "⏭️  frontend/.env.local already exists"
fi

# Build images
echo ""
echo "🔨 Building Docker images..."
docker-compose build

# Start services
echo ""
echo "🚀 Starting services..."
docker-compose up -d

# Wait for services to be ready
echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if MongoDB is ready
echo "🔍 Checking MongoDB..."
docker-compose exec -T mongodb mongosh admin --eval "db.adminCommand('ping')" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ MongoDB is ready"
else
    echo "⚠️  MongoDB is still starting..."
fi

# Seed database
echo ""
echo "🌱 Seeding database..."
docker-compose exec backend npm run seed

# Create CEO user
echo ""
echo "👤 Creating CEO user..."
docker-compose exec backend npm run create-ceo

echo ""
echo "======================================"
echo "✅ Setup completed!"
echo "======================================"
echo ""
echo "📍 Services:"
echo "   Frontend:  http://localhost:3000"
echo "   Backend:   http://localhost:5000"
echo "   MongoDB:   localhost:27017"
echo "   Redis:     localhost:6379"
echo ""
echo "🎯 Demo Credentials:"
echo "   CEO: julius@jn-automation.de / CEO@12345"
echo "   Admin: anna@meinsalon.de / Admin@12345"
echo "   Employee: maria@meinsalon.de / Employee@12345"
echo ""
