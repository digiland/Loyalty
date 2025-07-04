#!/bin/bash

# Customer UI Startup Script
# This script starts the customer UI server with proper configuration

echo "🚀 Starting Customer UI Server..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ Created .env file from .env.example"
        echo "📝 Please edit .env and add your Gemini API key"
    else
        echo "❌ .env.example file not found. Please create a .env file with your API keys."
        exit 1
    fi
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if backend is running
echo "🔍 Checking if backend is running..."
if curl -s http://localhost:8000/ > /dev/null; then
    echo "✅ Backend is running on port 8000"
else
    echo "⚠️  Backend is not running. Please start the FastAPI backend first:"
    echo "   cd backend && python -m uvicorn main:app --reload"
fi

# Start the server
echo "🌐 Starting Customer UI server..."
npm start
