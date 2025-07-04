# Gemini AI Integration Guide

## 🤖 AI-Powered Customer Assistant

The customer UI now includes a sophisticated AI assistant powered by Google's Gemini 2.5 Flash model. This assistant can understand natural language queries and provide intelligent responses about the loyalty program.

## 🔧 Setup Instructions

### 1. Get Your Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

### 2. Configure the Environment

1. Copy the environment example file:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file and add your API key:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   BACKEND_API_URL=http://localhost:8000
   PORT=5500
   ```

### 3. Install Dependencies

```bash
npm install
```

### 4. Start the Server

```bash
npm start
```

## 🎯 AI Assistant Capabilities

### Core Features

1. **Natural Language Understanding**: The assistant can understand conversational queries in plain English
2. **Context Awareness**: Maintains conversation context across multiple messages
3. **Tool Integration**: Can access real-time data from the loyalty platform
4. **Personalized Responses**: Provides tailored recommendations based on customer data

### Available Tools

The AI assistant has access to the following tools:

#### 1. Points Checker
- **Function**: `check_points`
- **Description**: Retrieve customer points balance and transaction history
- **Usage**: "How many points do I have for +1234567890?"

#### 2. Recommendations Engine
- **Function**: `get_recommendations`
- **Description**: Get personalized recommendations based on customer behavior
- **Usage**: "What recommendations do you have for me?"

#### 3. Referral System Explainer
- **Function**: `explain_referrals`
- **Description**: Explain how the referral program works
- **Usage**: "How do referrals work?"

#### 4. Business Information
- **Function**: `get_business_info`
- **Description**: Provide information about participating businesses
- **Usage**: "Tell me about participating businesses"

## 💬 Example Conversations

### Points Inquiry
**User**: "How many points do I have for +1234567890?"
**Assistant**: "📊 You have **1,250 points**! 🎉 Great job earning rewards! 

📝 **Recent Activity:**
• Coffee Shop: +50 points (Dec 15, 2024)
• Bookstore: +75 points (Dec 12, 2024)
• Restaurant: -100 points (Dec 10, 2024)"

### Recommendations Request
**User**: "Any recommendations for me?"
**Assistant**: "💡 **Here are some personalized recommendations for you:**

1. You're close to earning a free coffee! Visit Joe's Coffee Shop and earn 50 more points.
2. Try the new bakery downtown - they're offering double points this week.
3. Don't forget to redeem your 100 points for a $5 discount at any participating restaurant."

### Referral Questions
**User**: "How do referrals work?"
**Assistant**: "👥 **How Referrals Work:**

1. When you refer a friend, ask them to mention your phone number during their first purchase
2. Once they make their first purchase, you both earn bonus points
3. The more friends you refer, the more bonus points you earn
4. There's no limit to how many friends you can refer

🎁 **Benefits:**
• You earn bonus points for each successful referral
• Your friends get bonus points on their first purchase
• Help local businesses grow their customer base
• Build a community of loyal customers"

## 🛠️ Technical Implementation

### Architecture

```
Frontend (JavaScript) → Customer UI Server (Express) → Gemini API
                                 ↓
                        Backend API (FastAPI)
```

### API Endpoints

#### Chat Endpoint
- **URL**: `POST /api/chat`
- **Body**: 
  ```json
  {
    "message": "How many points do I have?",
    "sessionId": "session_123"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "response": "AI assistant response",
    "sessionId": "session_123"
  }
  ```

#### Configuration Endpoint
- **URL**: `GET /api/config`
- **Response**:
  ```json
  {
    "geminiEnabled": true,
    "backendUrl": "http://localhost:8000"
  }
  ```

### Session Management

The system maintains conversation context using session IDs:
- Each user gets a unique session ID
- Conversation history is stored per session
- History is limited to last 10 messages for memory efficiency

## 🔒 Security Considerations

1. **API Key Protection**: Never expose your Gemini API key in client-side code
2. **Rate Limiting**: Implement rate limiting for chat requests
3. **Input Validation**: All user inputs are validated before processing
4. **Error Handling**: Graceful degradation when AI services are unavailable

## 🚀 Advanced Features

### Custom Prompts

You can customize the AI's behavior by modifying the system prompt in `gemini-assistant.js`:

```javascript
getSystemPrompt() {
    return `You are a helpful and friendly loyalty program assistant...`;
}
```

### Adding New Tools

To add new tools:

1. Define the tool in `getTools()` method
2. Implement the tool logic in `executeTool()` method
3. Add response formatting in `formatToolResponse()` method

### Example: Adding a Store Locator Tool

```javascript
// In getTools()
{
    name: 'find_stores',
    description: 'Find nearby participating stores',
    parameters: {
        type: 'object',
        properties: {
            location: {
                type: 'string',
                description: 'User location (city, zipcode, etc.)'
            }
        },
        required: ['location']
    }
}

// In executeTool()
case 'find_stores':
    return await this.findStores(parameters.location);
```

## 📊 Monitoring and Analytics

### Chat Analytics
- Track conversation patterns
- Monitor tool usage
- Analyze user satisfaction
- Identify common queries

### Performance Metrics
- Response time
- API usage
- Error rates
- User engagement

## 🔧 Troubleshooting

### Common Issues

1. **"AI not using tools to get real data"**
   - Check server logs for tool usage messages (look for "Using check_points tool...")
   - Ensure phone numbers are in the correct format (+1234567890)
   - Verify the backend API is running and accessible
   - Test with: "How many points do I have for +1234567890?"

2. **"Gemini API key not found"**
   - Check your `.env` file has `GEMINI_API_KEY=your_key_here`
   - Ensure the API key is valid (test at Google AI Studio)
   - Restart the server after adding the key

3. **"Headers is not defined" error**
   - Ensure node-fetch is installed: `npm install node-fetch`
   - Check that the polyfills are loaded in server.js
   - Update to a compatible Node.js version if needed

4. **"Chat not working"**
   - Check browser console for errors
   - Verify backend API is running on port 8000
   - Check network connectivity

### Debugging Tips

1. **Enable detailed logging** - Check server console for:
   ```
   📥 Chat request: "How many points do I have?"
   Using check_points tool for phone: +1234567890
   📤 Chat response: Success
   ```

2. **Test AI assistant directly**:
   ```bash
   node test-ai.js
   ```

3. **Test API endpoints manually**:
   ```bash
   curl -X POST http://localhost:5500/api/chat \
     -H "Content-Type: application/json" \
     -d '{"message": "How many points do I have for +1234567890?", "sessionId": "test"}'
   ```

4. **Verify tool responses**:
   - Check if backend API responds: `curl http://localhost:8000/customers/points/+1234567890`
   - Look for tool usage in server logs
   - Ensure phone number format is recognized

### Tool Usage Verification

To verify tools are working:

1. **Points Check**: Send "How many points do I have for +1234567890?"
   - Should see: "Using check_points tool for phone: +1234567890" in logs
   - Response should include real data like "📊 You have **X points**!"

2. **Recommendations**: Send "Any recommendations for +1234567890?"
   - Should see: "Using get_recommendations tool for phone: +1234567890" in logs
   - Response should include personalized suggestions

3. **Referrals**: Send "How do referrals work?"
   - Should see: "Using explain_referrals tool" in logs
   - Response should include detailed referral information

## 🎨 Customization

### UI Customization
- Modify chat widget styles in `index.html`
- Update colors and themes
- Add custom animations

### Response Formatting
- Customize message formatting in `formatToolResponse()`
- Add emoji and styling
- Implement markdown support

## 🚢 Deployment

### Environment Variables
```
GEMINI_API_KEY=your_api_key
BACKEND_API_URL=https://your-backend.com
PORT=5500
NODE_ENV=production
```

### Production Considerations
- Use environment-specific configuration
- Implement proper logging
- Add monitoring and alerting
- Configure HTTPS
- Set up load balancing

## 📈 Future Enhancements

1. **Voice Integration**: Add speech-to-text and text-to-speech
2. **Multi-language Support**: Support multiple languages
3. **Advanced Analytics**: Detailed conversation analytics
4. **Custom Training**: Fine-tune responses for specific business needs
5. **Integration APIs**: Connect with CRM and marketing tools

## 🆘 Support

For issues or questions:
1. Check the troubleshooting section
2. Review the API documentation
3. Check the backend logs
4. Test with minimal examples
