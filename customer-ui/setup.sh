#!/bin/bash

echo "🚀 Setting up Loyalty Platform Customer UI..."

# Check if Node.js is installed
if command -v node &> /dev/null; then
    echo "✅ Node.js is installed"
    
    # Install dependencies
    echo "📦 Installing dependencies..."
    npm install
    
    if [ $? -eq 0 ]; then
        echo "✅ Dependencies installed successfully"
        
        # Start the server
        echo "🌐 Starting Customer UI server..."
        echo "Server will be available at http://localhost:5500"
        echo "Press Ctrl+C to stop the server"
        npm start
    else
        echo "❌ Failed to install dependencies"
        exit 1
    fi
else
    echo "⚠️  Node.js not found. Using Python server instead..."
    
    # Check if Python is installed
    if command -v python3 &> /dev/null; then
        echo "✅ Python 3 is installed"
        echo "🌐 Starting Customer UI server with Python..."
        python3 serve.py
    elif command -v python &> /dev/null; then
        echo "✅ Python is installed"
        echo "🌐 Starting Customer UI server with Python..."
        python serve.py
    else
        echo "❌ Neither Node.js nor Python is installed"
        echo "Please install Node.js or Python to run the server"
        exit 1
    fi
fi
