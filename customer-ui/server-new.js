const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

// Polyfill for fetch in Node.js environments
if (!global.fetch) {
    global.fetch = require('node-fetch');
}

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
    
    // Initialize the assistant
    geminiAssistant.initialize().then((success) => {
        if (success) {
            console.log('✅ Gemini Assistant initialized and connected to backend');
        } else {
            console.log('⚠️  Gemini Assistant initialized but backend connection failed');
        }
    }).catch((error) => {
        console.error('❌ Failed to initialize Gemini Assistant:', error);
    });
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
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }
        
        if (!geminiAssistant) {
            // Fallback response when Gemini is not configured
            return res.json({
                success: true,
                response: getFallbackResponse(message),
                sessionId: sessionId || 'default'
            });
        }
        
        const result = await geminiAssistant.processMessageWithTools(message, sessionId || 'default');
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

// MCP Chat endpoint - acts as MCP server
app.post('/api/mcp-chat', async (req, res) => {
    try {
        const { message, sessionId, context } = req.body;
        
        if (!message) {
            return res.status(400).json({ 
                success: false,
                error: 'Message is required' 
            });
        }
        
        // Initialize response context with received context
        let responseContext = { ...context };
        
        if (!geminiAssistant) {
            // Fallback response when Gemini is not configured
            return res.json({
                success: true,
                response: getFallbackResponse(message),
                sessionId: sessionId || 'default',
                context: responseContext
            });
        }
        
        // Process message with enhanced context handling
        let result;
        try {
            if (geminiAssistant.processMessageWithMCP) {
                result = await geminiAssistant.processMessageWithMCP(message, sessionId || 'default', context);
            } else if (geminiAssistant.processMessageWithTools) {
                // Fallback to regular processMessageWithTools if MCP method doesn't exist
                result = await geminiAssistant.processMessageWithTools(message, sessionId || 'default');
                result.context = context; // Add context to result
            } else {
                // Ultimate fallback
                result = {
                    success: true,
                    response: getFallbackResponse(message),
                    sessionId: sessionId || 'default',
                    context: context
                };
            }
        } catch (toolError) {
            console.error('Tool processing error:', toolError);
            result = {
                success: true,
                response: getFallbackResponse(message),
                sessionId: sessionId || 'default',
                context: context
            };
        }
        
        // Merge any updated context from the assistant
        if (result.context) {
            responseContext = { ...responseContext, ...result.context };
        }
        
        res.json({
            success: result.success,
            response: result.response,
            sessionId: result.sessionId,
            context: responseContext,
            error: result.error
        });
        
    } catch (error) {
        console.error('MCP Chat API error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            sessionId: req.body.sessionId || 'default',
            context: req.body.context || {}
        });
    }
});

// MCP Tool endpoint - direct tool execution
app.post('/api/mcp/tool', async (req, res) => {
    try {
        const { tool, parameters, context } = req.body;
        
        if (!tool || !parameters) {
            return res.status(400).json({
                success: false,
                error: 'Tool and parameters are required'
            });
        }
        
        if (!geminiAssistant) {
            return res.status(503).json({
                success: false,
                error: 'Assistant service not available'
            });
        }
        
        // Execute the tool directly
        const result = await geminiAssistant.executeTool(tool, parameters);
        
        res.json({
            success: result.success !== false,
            data: result.data || result,
            error: result.error,
            context: context || {}
        });
        
    } catch (error) {
        console.error('MCP Tool API error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            context: req.body.context || {}
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
