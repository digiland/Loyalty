const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
require('dotenv').config();

// Make fetch and Headers available globally for the Google Generative AI library
global.fetch = fetch;
global.Headers = fetch.Headers;
global.Request = fetch.Request;
global.Response = fetch.Response;

const GeminiAssistant = require('./gemini-assistant');

const app = express();
const port = process.env.PORT || 5500;

// Initialize Gemini Assistant
let geminiAssistant = null;
if (process.env.GEMINI_API_KEY) {
    geminiAssistant = new GeminiAssistant(
        process.env.GEMINI_API_KEY,
        process.env.BACKEND_API_URL || 'http://localhost:8000'
    );
    console.log('✅ Gemini Assistant initialized');
} else {
    console.log('⚠️  GEMINI_API_KEY not found. Chat will use fallback responses.');
}

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// Chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { message, sessionId } = req.body;
        
        console.log(`📥 Chat request: "${message}" (Session: ${sessionId || 'default'})`);
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }
        
        if (!geminiAssistant) {
            // Fallback response when Gemini is not configured
            console.log('⚠️ Using fallback response (Gemini not configured)');
            return res.json({
                success: true,
                response: getFallbackResponse(message),
                sessionId: sessionId || 'default'
            });
        }
        
        const result = await geminiAssistant.processMessageWithTools(message, sessionId || 'default');
        console.log(`📤 Chat response: ${result.success ? 'Success' : 'Error'}`);
        console.log(`📝 Response preview: ${result.response ? result.response.substring(0, 100) + '...' : 'No response'}`);
        
        res.json(result);
        
    } catch (error) {
        console.error('Chat API error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            sessionId: req.body.sessionId || 'default'
        });
    }
});

// Configuration endpoint
app.get('/api/config', (req, res) => {
    res.json({
        geminiEnabled: !!geminiAssistant,
        backendUrl: process.env.BACKEND_API_URL || 'http://localhost:8000'
    });
});

// Fallback responses when Gemini is not configured
function getFallbackResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('points') || lowerMessage.includes('balance')) {
        return '📊 To check your points, please provide your phone number or use the form above to look up your balance. \n\n💡 Tip: Set up your Gemini API key for more intelligent responses!';
    }
    
    if (lowerMessage.includes('recommend') || lowerMessage.includes('suggest')) {
        return '💡 For personalized recommendations, please first check your points using your phone number. \n\n🤖 Note: Enable Gemini AI for smarter recommendations!';
    }
    
    if (lowerMessage.includes('referral') || lowerMessage.includes('refer')) {
        return '👥 **Referral Program:** \n1. Ask friends to mention your phone number when they first shop\n2. You both earn bonus points!\n3. No limit on referrals\n\n🎁 Start referring friends today!';
    }
    
    if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
        return '🤖 **I can help you with:**\n• Check points balance\n• View transaction history\n• Get recommendations\n• Learn about referrals\n• General loyalty program info\n\n💡 For smarter AI responses, configure your Gemini API key!';
    }
    
    return '🤖 Hello! I can help you with loyalty points, recommendations, and referrals. \n\n⚙️ For enhanced AI responses, please configure your Gemini API key in the .env file.';
}

// Handle all routes by serving the index.html file
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`🌐 Customer UI server running at http://localhost:${port}`);
    console.log(`🔗 Backend API URL: ${process.env.BACKEND_API_URL || 'http://localhost:8000'}`);
    console.log('Make sure your FastAPI backend is running');
    
    if (!process.env.GEMINI_API_KEY) {
        console.log('');
        console.log('🔑 To enable Gemini AI assistant:');
        console.log('   1. Copy .env.example to .env');
        console.log('   2. Add your Gemini API key to .env');
        console.log('   3. Restart the server');
    }
});
