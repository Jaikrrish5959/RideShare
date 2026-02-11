#!/bin/bash

# ShareRides Local Development Startup Script
# This script starts both the backend and frontend servers

set -e  # Exit on error

echo "================================================"
echo "ShareRides - Local Development Startup"
echo "================================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check if PostgreSQL is running
if ! pg_isready &> /dev/null; then
    echo "⚠️  PostgreSQL is not running. Attempting to start..."
    if command -v brew &> /dev/null; then
        brew services start postgresql
    elif command -v systemctl &> /dev/null; then
        sudo systemctl start postgresql
    elif command -v service &> /dev/null; then
        sudo service postgresql start
    else
        echo "❌ Could not start PostgreSQL automatically"
        echo "Please start PostgreSQL manually and run this script again"
        exit 1
    fi
    sleep 2
fi

if pg_isready &> /dev/null; then
    echo "✅ PostgreSQL is running"
else
    echo "❌ PostgreSQL is not running. Please start it manually."
    exit 1
fi

# Check if .env files exist
if [ ! -f "carpooling-backend/.env" ]; then
    echo "⚠️  Backend .env file not found"
    echo "Creating default .env file..."
    
    # Generate a cryptographically secure JWT secret
    if command -v openssl &> /dev/null; then
        JWT_SECRET=$(openssl rand -hex 32)
    else
        # Fallback to /dev/urandom if openssl is not available
        JWT_SECRET=$(head -c 32 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | head -c 64)
    fi
    
    cat > carpooling-backend/.env << EOF
PORT=5000
DB_NAME=carpooling_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
JWT_SECRET=$JWT_SECRET
EMAIL_USER=test@example.com
EMAIL_PASS=test_password
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
EOF
    echo "✅ Created carpooling-backend/.env with secure JWT secret"
    echo "⚠️  Please update EMAIL_USER and EMAIL_PASS in .env for email functionality"
fi

if [ ! -f "carpooling-frontend/.env" ]; then
    echo "⚠️  Frontend .env file not found"
    echo "Creating default .env file..."
    cat > carpooling-frontend/.env << EOF
REACT_APP_API_URL=http://localhost:5000
EOF
    echo "✅ Created carpooling-frontend/.env"
fi

# Check if dependencies are installed
if [ ! -d "carpooling-backend/node_modules" ]; then
    echo "⚠️  Backend dependencies not installed"
    echo "Installing backend dependencies..."
    cd carpooling-backend
    npm install
    cd ..
    echo "✅ Backend dependencies installed"
fi

if [ ! -d "carpooling-frontend/node_modules" ]; then
    echo "⚠️  Frontend dependencies not installed"
    echo "Installing frontend dependencies..."
    cd carpooling-frontend
    npm install
    cd ..
    echo "✅ Frontend dependencies installed"
fi

# Create logs directory if it doesn't exist
mkdir -p carpooling-backend/logs

echo ""
echo "================================================"
echo "Starting servers..."
echo "================================================"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "================================================"
    echo "Shutting down servers..."
    echo "================================================"
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
        echo "✅ Backend server stopped"
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
        echo "✅ Frontend server stopped"
    fi
    exit 0
}

# Set up trap to catch Ctrl+C
trap cleanup SIGINT SIGTERM

# Start backend server
echo "Starting backend server on port 5000..."
cd carpooling-backend
node server.js > logs/server.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 5

# Check if backend is running
if kill -0 $BACKEND_PID 2>/dev/null; then
    if curl -s http://localhost:5000/api/health > /dev/null; then
        echo "✅ Backend server is running (PID: $BACKEND_PID)"
        echo "   URL: http://localhost:5000"
        echo "   Health: http://localhost:5000/api/health"
    else
        echo "⚠️  Backend started but health check failed"
        echo "   Check logs: tail -f carpooling-backend/logs/server.log"
    fi
else
    echo "❌ Backend server failed to start"
    echo "Check logs: cat carpooling-backend/logs/server.log"
    exit 1
fi

echo ""
echo "Starting frontend server on port 3000..."
cd carpooling-frontend
npm start > /dev/null 2>&1 &
FRONTEND_PID=$!
cd ..

echo "⏳ Waiting for frontend to compile..."
sleep 15

# Check if frontend is running
if kill -0 $FRONTEND_PID 2>/dev/null; then
    echo "✅ Frontend server is running (PID: $FRONTEND_PID)"
    echo "   URL: http://localhost:3000"
else
    echo "⚠️  Frontend server may have issues"
fi

echo ""
echo "================================================"
echo "ShareRides is now running!"
echo "================================================"
echo ""
echo "📱 Frontend:  http://localhost:3000"
echo "🔧 Backend:   http://localhost:5000"
echo "❤️  Health:    http://localhost:5000/api/health"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""
echo "Logs:"
echo "  Backend:  tail -f carpooling-backend/logs/server.log"
echo "  Combined: tail -f carpooling-backend/logs/combined.log"
echo ""

# Wait indefinitely until Ctrl+C
wait
