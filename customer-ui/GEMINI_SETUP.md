# Gemini AI Assistant Setup Guide

## Overview
The customer UI now includes a powerful AI assistant powered by Google's Gemini 2.5 Flash model. This assistant can:

- 🔍 **Check customer points** using natural language queries
- 📊 **Analyze transaction history** and provide insights
- 💡 **Generate personalized recommendations** based on customer behavior
- 👥 **Explain referral programs** and help customers understand benefits
- 🛠️ **Access real-time data** through integrated API tools
- 💬 **Maintain conversation context** for natural dialogue

## Setup Instructions

### 1. Get Your Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

### 2. Configure the Environment

1. Open the `.env` file in the customer-ui directory
2. Add your Gemini API key:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```
3. Save the file

### 3. Install Dependencies

```bash
cd customer-ui
npm install
```

### 4. Start the Server

```bash
npm start
```

Or use the setup script:
```bash
./setup.sh
```

## AI Assistant Features

### 🤖 Natural Language Processing
The assistant understands natural language queries like:
- "How many points do I have?"
- "What are my recent transactions?"
- "Any recommendations for me?"
- "How do referrals work?"
- "Check my balance for +1234567890"

### 🛠️ Tool Integration
The assistant has access to these tools:
- **check_points**: Get customer points and transaction history
- **get_recommendations**: Generate personalized suggestions
- **explain_referrals**: Provide referral program information
- **get_business_info**: Share information about participating businesses

### 💡 Context Awareness
- Maintains conversation history per session
- Understands customer context from previous interactions
- Provides personalized responses based on customer data
- Remembers phone numbers and preferences during chat sessions

### 🔧 Fallback Mode
If Gemini API is not configured:
- Basic rule-based responses are provided
- Core functionality still works
- Clear instructions to enable AI features

## Example Conversations

### Points Balance Query
**User:** "Hi, can you check my points for +1234567890?"

**AI:** "📊 You have **1,250 points**! 🎉 Great job earning rewards! 

📝 **Recent Activity:**
• Coffee Shop A: +25 points (Dec 15)
• Restaurant B: +100 points (Dec 10)
• Bakery C: -50 points (Dec 8)

Would you like to see what rewards you can redeem with your points?"

### Recommendation Request
**User:** "Any suggestions for me?"

**AI:** "💡 **Here are some personalized recommendations for you:**

1. You're close to earning a free coffee! Visit Coffee Shop A for just one more purchase.
2. Try Restaurant B's new menu - you'll earn double points this week.
3. Refer a friend to Bakery C and you'll both get 50 bonus points!

These suggestions are based on your recent activity and preferences. 😊"

### Referral Information
**User:** "How do referrals work?"

**AI:** "👥 **How Referrals Work:**

1. Ask friends to mention your phone number during their first purchase
2. Once they make their first purchase, you both earn bonus points
3. The more friends you refer, the more bonus points you earn
4. There's no limit to how many friends you can refer

🎁 **Benefits:**
• You earn bonus points for each successful referral
• Your friends get bonus points on their first purchase
• Help local businesses grow their customer base
• Build a community of loyal customers

Start referring friends today! 🎉"

## API Endpoints

### Chat Endpoint
```
POST /api/chat
Content-Type: application/json

{
  "message": "How many points do I have?",
  "sessionId": "session_abc123"
}
```

### Configuration Endpoint
```
GET /api/config

Response:
{
  "geminiEnabled": true,
  "backendUrl": "http://localhost:8000"
}
```

## Security Considerations

1. **API Key Protection**: Never expose your Gemini API key in client-side code
2. **Session Management**: Sessions are isolated per user
3. **Data Privacy**: Customer data is only accessed through authorized API calls
4. **Rate Limiting**: Consider implementing rate limiting for production use

## Troubleshooting

### Common Issues

**1. "Gemini API not configured"**
- Check that GEMINI_API_KEY is set in .env
- Verify the API key is valid
- Restart the server after adding the key

**2. "Network connection issues"**
- Ensure the backend API is running on port 8000
- Check BACKEND_API_URL in .env
- Verify internet connection for Gemini API calls

**3. "Assistant responses are basic"**
- This indicates fallback mode is active
- Check server logs for errors
- Verify Gemini API key is correctly configured

### Debug Mode
Enable debug logging by adding to .env:
```
DEBUG=true
```

## Performance Optimization

### Response Caching
- Consider caching frequent queries
- Implement session-based caching for recommendations
- Cache business information and referral explanations

### Rate Limiting
- Implement rate limiting to prevent API abuse
- Consider user-based rate limiting
- Monitor API usage and costs

## Future Enhancements

- [ ] Voice input support
- [ ] Multi-language support
- [ ] Advanced analytics integration
- [ ] Proactive recommendations
- [ ] Integration with other AI models
- [ ] Custom business-specific training

## Cost Considerations

- Gemini 2.5 Flash is designed to be cost-effective
- Monitor API usage through Google Cloud Console
- Consider implementing usage limits for production
- Optimize prompts to reduce token usage

## Support

For issues with the AI assistant:
1. Check the server logs
2. Verify API key configuration
3. Test with fallback responses
4. Contact support with specific error messages

---

🚀 **Ready to enhance your customer experience with AI-powered assistance!**
