#!/bin/bash

# Quick Start Script for Loyalty Platform
# This script helps users get both backend and customer UI running quickly

echo "🚀 Loyalty Platform Quick Start"
echo "==============================="

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
port_in_use() {
    lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1
}

# Function to start backend
start_backend() {
    echo "🔧 Starting Backend Server..."
    
    if [ ! -d "backend" ]; then
        echo "❌ Backend directory not found. Run this script from the project root."
        exit 1
    fi
    
    cd backend
    
    # Check if virtual environment exists
    if [ ! -d "venv" ] && [ ! -d "../venv" ]; then
        echo "📦 Creating virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    if [ -d "venv" ]; then
        source venv/bin/activate
    elif [ -d "../venv" ]; then
        source ../venv/bin/activate
    fi
    
    # Install dependencies
    echo "📦 Installing backend dependencies..."
    pip install -r requirements.txt
    
    # Start the server in background
    echo "🌐 Starting FastAPI server on port 8000..."
    uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
    BACKEND_PID=$!
    
    # Wait a moment for the server to start
    sleep 3
    
    # Check if backend is running
    if port_in_use 8000; then
        echo "✅ Backend server started successfully (PID: $BACKEND_PID)"
        echo "   API available at: http://localhost:8000"
        echo "   API docs at: http://localhost:8000/docs"
    else
        echo "❌ Failed to start backend server"
        exit 1
    fi
    
    cd ..
}

# Function to start customer UI
start_customer_ui() {
    echo "🎨 Starting Customer UI..."
    
    if [ ! -d "customer-ui" ]; then
        echo "❌ Customer UI directory not found."
        exit 1
    fi
    
    cd customer-ui
    
    # Check if Node.js is available
    if command_exists node && command_exists npm; then
        echo "✅ Node.js found, using npm server"
        
        # Install dependencies if node_modules doesn't exist
        if [ ! -d "node_modules" ]; then
            echo "📦 Installing Node.js dependencies..."
            npm install
        fi
        
        # Start the server in background
        echo "🌐 Starting Customer UI server on port 5500..."
        npm start &
        FRONTEND_PID=$!
        
    elif command_exists python3; then
        echo "✅ Using Python server"
        echo "🌐 Starting Customer UI server on port 5500..."
        python3 serve.py &
        FRONTEND_PID=$!
        
    elif command_exists python; then
        echo "✅ Using Python server"
        echo "🌐 Starting Customer UI server on port 5500..."
        python serve.py &
        FRONTEND_PID=$!
        
    else
        echo "❌ Neither Node.js nor Python found. Cannot start customer UI."
        exit 1
    fi
    
    # Wait a moment for the server to start
    sleep 3
    
    # Check if customer UI is running
    if port_in_use 5500; then
        echo "✅ Customer UI started successfully (PID: $FRONTEND_PID)"
        echo "   Customer UI available at: http://localhost:5500"
    else
        echo "❌ Failed to start customer UI server"
        exit 1
    fi
    
    cd ..
}

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🔄 Shutting down servers..."
    
    # Kill backend server
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        echo "   Backend server stopped"
    fi
    
    # Kill frontend server
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo "   Customer UI server stopped"
    fi
    
    # Kill any remaining processes on the ports
    pkill -f "uvicorn main:app" 2>/dev/null
    pkill -f "node server.js" 2>/dev/null
    pkill -f "python.*serve.py" 2>/dev/null
    
    echo "✅ All servers stopped"
    exit 0
}

# Set up signal handlers for graceful shutdown
trap cleanup SIGINT SIGTERM

# Main execution
echo "🔍 Checking prerequisites..."

# Check if we're in the right directory
if [ ! -f "README.md" ] || [ ! -d "backend" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Check for Python
if ! command_exists python3 && ! command_exists python; then
    echo "❌ Python is required but not installed"
    exit 1
fi

# Check if ports are available
if port_in_use 8000; then
    echo "⚠️  Port 8000 is already in use. Please stop any running services on this port."
    exit 1
fi

if port_in_use 5500; then
    echo "⚠️  Port 5500 is already in use. Please stop any running services on this port."
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Start services
start_backend
start_customer_ui

echo ""
echo "🎉 Loyalty Platform is now running!"
echo "=================================="
echo "🌐 Customer UI: http://localhost:5500"
echo "🔗 Backend API: http://localhost:8000"
echo "📚 API Documentation: http://localhost:8000/docs"
echo ""
echo "💡 Try these features:"
echo "   • Enter a phone number to check points"
echo "   • Click the chat icon to test the AI assistant"
echo "   • Ask questions like 'How many points do I have?'"
echo "   • Test referral queries: 'How do referrals work?'"
echo ""
echo "⚠️  Note: You may need to create some demo data through the admin interface"
echo "   or use the API documentation to add test customers and transactions."
echo ""
echo "Press Ctrl+C to stop all servers"

# Keep the script running
while true; do
    sleep 1
done
