#!/bin/bash

# MCP Loyalty Platform Startup Script
# This script starts both the MCP server (backend) and MCP client (frontend)

set -e

echo "🚀 Starting MCP Loyalty Platform..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to start backend
start_backend() {
    echo -e "${BLUE}📊 Starting MCP Server (Backend)...${NC}"
    
    if check_port 8000; then
        echo -e "${YELLOW}⚠️  Port 8000 is already in use. Backend might already be running.${NC}"
        return 0
    fi
    
    cd backend
    
    # Check if virtual environment exists
    if [ ! -d "venv" ]; then
        echo -e "${YELLOW}📦 Creating Python virtual environment...${NC}"
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Install requirements
    echo -e "${YELLOW}📦 Installing Python dependencies...${NC}"
    pip install -r requirements.txt > /dev/null 2>&1
    
    # Start FastAPI server in background
    echo -e "${GREEN}✅ Starting FastAPI server on port 8000...${NC}"
    uvicorn main:app --reload --host 0.0.0.0 --port 8000 > ../logs/backend.log 2>&1 &
    BACKEND_PID=$!
    
    # Wait for server to start
    sleep 3
    
    if check_port 8000; then
        echo -e "${GREEN}✅ MCP Server started successfully!${NC}"
        echo $BACKEND_PID > ../backend.pid
        return 0
    else
        echo -e "${RED}❌ Failed to start MCP Server${NC}"
        return 1
    fi
}

# Function to start frontend
start_frontend() {
    echo -e "${BLUE}🎨 Starting MCP Client (Frontend)...${NC}"
    
    if check_port 5500; then
        echo -e "${YELLOW}⚠️  Port 5500 is already in use. Frontend might already be running.${NC}"
        return 0
    fi
    
    cd customer-ui
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}📦 Installing Node.js dependencies...${NC}"
        npm install > /dev/null 2>&1
    fi
    
    # Start Node.js server in background
    echo -e "${GREEN}✅ Starting Node.js server on port 5500...${NC}"
    node server-new.js > ../logs/frontend.log 2>&1 &
    FRONTEND_PID=$!
    
    # Wait for server to start
    sleep 2
    
    if check_port 5500; then
        echo -e "${GREEN}✅ MCP Client started successfully!${NC}"
        echo $FRONTEND_PID > ../frontend.pid
        return 0
    else
        echo -e "${RED}❌ Failed to start MCP Client${NC}"
        return 1
    fi
}

# Function to test MCP endpoints
test_mcp() {
    echo -e "${BLUE}🧪 Testing MCP Implementation...${NC}"
    
    # Wait for services to be fully ready
    sleep 3
    
    # Test backend health
    if curl -s http://localhost:8000/ > /dev/null; then
        echo -e "${GREEN}✅ Backend health check passed${NC}"
    else
        echo -e "${RED}❌ Backend health check failed${NC}"
        return 1
    fi
    
    # Test frontend health
    if curl -s http://localhost:5500/ > /dev/null; then
        echo -e "${GREEN}✅ Frontend health check passed${NC}"
    else
        echo -e "${RED}❌ Frontend health check failed${NC}"
        return 1
    fi
    
    # Run MCP test suite
    if python3 test_mcp_server.py > /dev/null 2>&1; then
        echo -e "${GREEN}✅ MCP test suite passed${NC}"
    else
        echo -e "${YELLOW}⚠️  MCP test suite had some issues (check logs)${NC}"
    fi
}

# Function to show status
show_status() {
    echo -e "${BLUE}📋 MCP Platform Status${NC}"
    echo "====================="
    
    if check_port 8000; then
        echo -e "${GREEN}✅ MCP Server (Backend): Running on http://localhost:8000${NC}"
    else
        echo -e "${RED}❌ MCP Server (Backend): Not running${NC}"
    fi
    
    if check_port 5500; then
        echo -e "${GREEN}✅ MCP Client (Frontend): Running on http://localhost:5500${NC}"
    else
        echo -e "${RED}❌ MCP Client (Frontend): Not running${NC}"
    fi
    
    echo ""
    echo -e "${BLUE}📖 Available URLs:${NC}"
    echo "   • Customer UI: http://localhost:5500"
    echo "   • API Docs: http://localhost:8000/docs"
    echo "   • MCP Tools: http://localhost:8000/mcp/tool"
    echo ""
}

# Function to stop services
stop_services() {
    echo -e "${YELLOW}🛑 Stopping MCP Platform...${NC}"
    
    # Kill backend
    if [ -f "backend.pid" ]; then
        kill $(cat backend.pid) 2>/dev/null || true
        rm -f backend.pid
    fi
    
    # Kill frontend
    if [ -f "frontend.pid" ]; then
        kill $(cat frontend.pid) 2>/dev/null || true
        rm -f frontend.pid
    fi
    
    # Kill any remaining processes on our ports
    lsof -ti:8000 | xargs kill -9 2>/dev/null || true
    lsof -ti:5500 | xargs kill -9 2>/dev/null || true
    
    echo -e "${GREEN}✅ MCP Platform stopped${NC}"
}

# Create logs directory
mkdir -p logs

# Handle command line arguments
case "$1" in
    "start")
        start_backend
        cd ..
        start_frontend
        cd ..
        test_mcp
        show_status
        ;;
    "stop")
        stop_services
        ;;
    "restart")
        stop_services
        sleep 2
        start_backend
        cd ..
        start_frontend
        cd ..
        test_mcp
        show_status
        ;;
    "status")
        show_status
        ;;
    "test")
        test_mcp
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|test}"
        echo ""
        echo "Commands:"
        echo "  start   - Start both MCP server and client"
        echo "  stop    - Stop all services"
        echo "  restart - Stop and start all services"
        echo "  status  - Show current status"
        echo "  test    - Run MCP test suite"
        echo ""
        echo "Example: ./start_mcp.sh start"
        exit 1
        ;;
esac
