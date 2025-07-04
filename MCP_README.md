# MCP (Model Context Protocol) Implementation

## Overview

This loyalty platform now implements the Model Context Protocol (MCP), providing a robust architecture where:

- **Chat UI** acts as an **MCP Client** 
- **Backend Services** act as **MCP Servers**
- **Context** is maintained across all interactions

## Architecture

```
┌─────────────────┐    MCP Protocol     ┌─────────────────┐
│   Chat Client   │ ←─────────────────→ │   MCP Server    │
│   (Frontend)    │                     │   (Backend)     │
└─────────────────┘                     └─────────────────┘
         │                                       │
         │                                       │
    ┌─────────┐                              ┌─────────┐
    │ Session │                              │  Tools  │
    │ Context │                              │ & Data  │
    └─────────┘                              └─────────┘
```

## Key Features

### 1. **MCP Client** (`customer-ui/app.js`)
- Sends context-rich requests to MCP server
- Maintains session state and phone numbers
- Updates context from server responses
- Handles errors and fallbacks gracefully

### 2. **MCP Server** (`backend/routers/mcp_server.py`)
- Processes tool requests with context
- Executes business logic (points, recommendations, referrals)
- Returns structured responses with updated context
- Validates inputs and handles errors

### 3. **Context Management**
- **Session ID**: Maintains conversation continuity
- **Phone Number**: Stored per session for quick access
- **User State**: Preserves user preferences and history
- **Tool Results**: Cached for efficiency

## Available Tools

### Core Tools
1. **check_points** - Get customer points and transactions
2. **get_recommendations** - Personalized recommendations
3. **explain_referrals** - Referral system information
4. **get_business_info** - Business details and listings

### Extended Tools
5. **get_customer_transactions** - Detailed transaction history
6. **get_analytics** - Customer analytics and insights

## API Endpoints

### MCP Chat Endpoint
```
POST /api/mcp-chat
{
  "message": "How many points do I have?",
  "sessionId": "session_123",
  "context": {
    "phone_number": "+1234567890"
  }
}
```

### MCP Tool Endpoint
```
POST /mcp/tool
{
  "tool": "check_points",
  "parameters": {
    "phone_number": "+1234567890"
  },
  "context": {}
}
```

## Usage Examples

### Check Points
```javascript
// Client automatically sends context
await fetch('/api/mcp-chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "Check my points for +1234567890",
    sessionId: "session_123",
    context: {}
  })
});
```

### Get Recommendations
```javascript
// Context includes phone number from previous interactions
await fetch('/api/mcp-chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "Any recommendations for me?",
    sessionId: "session_123",
    context: {
      phone_number: "+1234567890"
    }
  })
});
```

## Running the System

### 1. Start Backend (MCP Server)
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Start Frontend (MCP Client)
```bash
cd customer-ui
npm install
node server-new.js
```

### 3. Test MCP Implementation
```bash
python test_mcp_server.py
```

## Benefits of MCP Implementation

### 1. **Robustness**
- Standardized request/response format
- Consistent error handling
- Context validation and preservation

### 2. **Scalability**
- Tools can be added/removed without client changes
- Context can be extended with new fields
- Multiple clients can use the same MCP server

### 3. **Maintainability**
- Clear separation of concerns
- Centralized business logic in MCP server
- Easy to debug and monitor

### 4. **Flexibility**
- Context can include user preferences, history, etc.
- Tools can be composed and chained
- Supports both direct tool calls and AI-assisted conversations

## Context Schema

```json
{
  "sessionId": "string",
  "context": {
    "phone_number": "string",
    "user_preferences": {},
    "conversation_history": [],
    "business_context": {},
    "analytics_preferences": {}
  }
}
```

## Error Handling

The MCP implementation includes comprehensive error handling:

1. **Network Errors**: Graceful degradation with fallback responses
2. **Validation Errors**: Clear error messages for invalid inputs
3. **Business Logic Errors**: Contextual error messages (e.g., "Customer not found")
4. **Server Errors**: Generic error messages to protect system details

## Testing

Run the test suite to verify MCP functionality:

```bash
# Test all MCP endpoints
python test_mcp_server.py

# Test specific tools
curl -X POST http://localhost:8000/mcp/tool \
  -H "Content-Type: application/json" \
  -d '{"tool": "check_points", "parameters": {"phone_number": "+1234567890"}, "context": {}}'
```

## Future Enhancements

1. **Authentication Context**: Add user authentication to context
2. **Caching**: Implement context-aware caching
3. **Analytics**: Track MCP usage and performance
4. **Multi-language**: Support for multiple languages in context
5. **Real-time Updates**: WebSocket support for real-time context updates

## Troubleshooting

### Common Issues

1. **Context Not Preserved**: Check that sessionId is consistent across requests
2. **Tool Not Found**: Verify tool name matches exactly (case-sensitive)
3. **Missing Phone Number**: Ensure phone number is passed in context or extracted from message
4. **Network Errors**: Check that both backend (8000) and frontend (5500) are running

### Debug Mode

Enable debug logging by setting environment variable:
```bash
export DEBUG=1
node server-new.js
```

This will log all MCP requests and responses for debugging.
