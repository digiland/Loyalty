const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

// Polyfill for fetch in Node.js environments
if (!global.fetch) {
    global.fetch = require('node-fetch');
}

class GeminiAssistant {
    constructor(apiKey, backendUrl) {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ 
            model: 'gemini-2.5-flash',
            systemInstruction: this.getSystemPrompt()
        });
        this.backendUrl = backendUrl;
        this.conversationHistory = new Map(); // Store conversation history per session
        this.sessionPhoneNumbers = new Map(); // Store phone numbers per session
    }

    // Tool definitions for the AI assistant
    getTools() {
        return [
            {
                name: 'check_points',
                description: 'Check customer loyalty points balance and recent transactions',
                parameters: {
                    type: 'object',
                    properties: {
                        phone_number: {
                            type: 'string',
                            description: 'Customer phone number in international format (e.g., +1234567890)'
                        }
                    },
                    required: ['phone_number']
                }
            },
            {
                name: 'get_recommendations',
                description: 'Get personalized recommendations for a customer',
                parameters: {
                    type: 'object',
                    properties: {
                        phone_number: {
                            type: 'string',
                            description: 'Customer phone number in international format'
                        },
                        business_id: {
                            type: 'integer',
                            description: 'Optional business ID for business-specific recommendations'
                        }
                    },
                    required: ['phone_number']
                }
            },
            {
                name: 'explain_referrals',
                description: 'Explain how the referral system works',
                parameters: {
                    type: 'object',
                    properties: {}
                }
            },
            {
                name: 'get_business_info',
                description: 'Get information about participating businesses',
                parameters: {
                    type: 'object',
                    properties: {
                        business_id: {
                            type: 'integer',
                            description: 'Optional business ID to get specific business info'
                        }
                    }
                }
            }
        ];
    }

    // System prompt that defines the AI assistant's role and capabilities
    getSystemPrompt() {
        return `You are a helpful and friendly loyalty program assistant for a multi-business loyalty platform. Your name is Loyalty AI Assistant and you help customers with their loyalty rewards.

IMPORTANT: You have access to real-time tools that can check customer data. Always use these tools when customers ask about their points, transactions, or need recommendations.

Your primary functions are:
1. Points Balance: Use the check_points tool to get real customer points data
2. Transaction History: Use the check_points tool to show recent transactions
3. Recommendations: Use the get_recommendations tool to provide personalized suggestions
4. Referral Information: Use the explain_referrals tool to explain how referrals work
5. Business Info: Use the get_business_info tool for business information

How to use tools:
- When a customer asks about points, ALWAYS use the check_points tool with their phone number
- When they ask for recommendations, use the get_recommendations tool
- When they ask about referrals, use the explain_referrals tool
- Extract phone numbers from messages automatically (look for patterns like +1234567890, 1234567890, etc.)

Tool Usage Examples:
- Customer: "How many points do I have?" → You should ask for their phone number first, then use check_points
- Customer: "Check my points for +1234567890" → Use check_points(+1234567890) immediately
- Customer: "Any recommendations?" → Use get_recommendations (ask for phone number if needed)

Guidelines:
- Always use the appropriate tool when customer data is requested
- Be enthusiastic and helpful about the loyalty program
- Use emojis to make conversations engaging
- If you need a phone number, ask for it politely
- Always provide specific data from the tools, not generic responses
- If a tool fails, apologize and suggest alternatives

Remember: You have real access to customer data through tools - use them!`;
    }

    // Execute tool calls
    async executeTool(toolName, parameters) {
        try {
            switch (toolName) {
                case 'check_points':
                    return await this.checkPoints(parameters.phone_number);
                
                case 'get_recommendations':
                    return await this.getRecommendations(parameters.phone_number, parameters.business_id);
                
                case 'explain_referrals':
                    return this.explainReferrals();
                
                case 'get_business_info':
                    return await this.getBusinessInfo(parameters.business_id);
                
                default:
                    return { error: `Unknown tool: ${toolName}` };
            }
        } catch (error) {
            console.error(`Error executing tool ${toolName}:`, error);
            return { error: `Failed to execute ${toolName}: ${error.message}` };
        }
    }

    // Tool implementations
    async checkPoints(phoneNumber) {
        try {
            console.log('Checking points for:', phoneNumber);
            
            // Use MCP server endpoint
            const response = await axios.post(`${this.backendUrl}/mcp/tool`, {
                tool: 'check_points',
                parameters: { phone_number: phoneNumber },
                context: {}
            });
            
            console.log('MCP server response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error in checkPoints:', error);
            
            if (error.response?.status === 404) {
                return {
                    success: false,
                    error: '📋 I couldn\'t find an account with that phone number. This could mean:\n\n• You haven\'t made your first purchase yet\n• The phone number might be entered incorrectly\n• You might be using a different format\n\n💡 To get started, make a purchase at any participating business and mention this phone number!'
                };
            }
            
            return {
                success: false,
                error: `Unable to check points: ${error.message}`
            };
        }
    }

    async getRecommendations(phoneNumber, businessId = null) {
        try {
            // Use MCP server endpoint
            const response = await axios.post(`${this.backendUrl}/mcp/tool`, {
                tool: 'get_recommendations',
                parameters: { 
                    phone_number: phoneNumber,
                    business_id: businessId
                },
                context: {}
            });
            
            return response.data;
        } catch (error) {
            if (error.response?.status === 404) {
                return {
                    success: false,
                    error: '💡 I don\'t have enough information to make personalized recommendations yet. Make a few purchases at our partner businesses and I\'ll have great suggestions for you!'
                };
            }
            throw error;
        }
    }

    explainReferrals() {
        // Use MCP server endpoint for consistency
        return axios.post(`${this.backendUrl}/mcp/tool`, {
            tool: 'explain_referrals',
            parameters: {},
            context: {}
        }).then(response => response.data).catch(() => {
            return {
                success: true,
                data: {
                    how_it_works: [
                        "When you refer a friend, ask them to mention your phone number during their first purchase",
                        "Once they make their first purchase, you both earn bonus points",
                        "The more friends you refer, the more bonus points you earn",
                        "There's no limit to how many friends you can refer"
                    ],
                    benefits: [
                        "You earn bonus points for each successful referral",
                        "Your friends get bonus points on their first purchase",
                        "Help local businesses grow their customer base",
                        "Build a community of loyal customers"
                    ]
                }
            };
        });
    }

    async getBusinessInfo(businessId = null) {
        try {
            // Use MCP server endpoint
            const response = await axios.post(`${this.backendUrl}/mcp/tool`, {
                tool: 'get_business_info',
                parameters: { business_id: businessId },
                context: {}
            });
            
            return response.data;
        } catch (error) {
            return {
                success: true,
                data: {
                    message: "Visit our participating businesses to earn points on every purchase!",
                    note: "Contact support for a complete list of participating businesses in your area."
                }
            };
        }
    }

    // New MCP tool methods
    async getCustomerTransactions(phoneNumber, limit = 20) {
        try {
            const response = await axios.post(`${this.backendUrl}/mcp/tool`, {
                tool: 'get_customer_transactions',
                parameters: { 
                    phone_number: phoneNumber,
                    limit: limit
                },
                context: {}
            });
            
            return response.data;
        } catch (error) {
            return {
                success: false,
                error: 'Unable to fetch transaction history at this time.'
            };
        }
    }

    async getAnalytics(type = 'customer', phoneNumber = null, businessId = null) {
        try {
            const response = await axios.post(`${this.backendUrl}/mcp/tool`, {
                tool: 'get_analytics',
                parameters: { 
                    type: type,
                    phone_number: phoneNumber,
                    business_id: businessId
                },
                context: {}
            });
            
            return response.data;
        } catch (error) {
            return {
                success: false,
                error: 'Analytics data is not available at this time.'
            };
        }
    }

    // Main processing methods
    async processMessageWithTools(message, sessionId) {
        try {
            // Store conversation history
            if (!this.conversationHistory.has(sessionId)) {
                this.conversationHistory.set(sessionId, []);
            }
            
            const history = this.conversationHistory.get(sessionId);
            
            // Extract phone number from message if available
            const phoneNumber = this.extractPhoneNumber(message);
            if (phoneNumber) {
                this.sessionPhoneNumbers.set(sessionId, phoneNumber);
            }
            
            // Build conversation context - convert role names for Gemini API
            const conversationContext = history.map(entry => ({
                role: entry.role === 'assistant' ? 'model' : entry.role,
                parts: [{ text: entry.content }]
            }));
            
            // Start chat with tools
            const chat = this.model.startChat({
                history: conversationContext,
                generationConfig: {
                    maxOutputTokens: 1000,
                    temperature: 0.7,
                },
                tools: [{
                    functionDeclarations: this.getTools()
                }]
            });
            
            // Send message and get response
            const result = await chat.sendMessage(message);
            const response = await result.response;
            
            // Handle tool calls
            if (response.functionCalls && response.functionCalls.length > 0) {
                const toolCall = response.functionCalls[0];
                console.log('Tool call requested:', toolCall.name, toolCall.args);
                
                // Execute the tool
                const toolResult = await this.executeTool(toolCall.name, toolCall.args);
                console.log('Tool result:', toolResult);
                
                // Send tool result back to the model
                const toolResponse = await chat.sendMessage([{
                    functionResponse: {
                        name: toolCall.name,
                        response: toolResult
                    }
                }]);
                
                const finalResponse = await toolResponse.response;
                const finalText = finalResponse.text();
                console.log('Final response from model:', finalText);
                
                // Update conversation history
                history.push({ role: 'user', content: message });
                history.push({ role: 'assistant', content: finalText });
                
                // Limit history to last 20 messages
                if (history.length > 20) {
                    history.splice(0, history.length - 20);
                }
                
                return {
                    success: true,
                    response: finalText,
                    sessionId: sessionId
                };
            } else {
                // No tool calls, just return the response
                const responseText = response.text();
                console.log('Direct response (no tools):', responseText);
                
                // Update conversation history
                history.push({ role: 'user', content: message });
                history.push({ role: 'assistant', content: responseText });
                
                // Limit history to last 20 messages
                if (history.length > 20) {
                    history.splice(0, history.length - 20);
                }
                
                return {
                    success: true,
                    response: responseText,
                    sessionId: sessionId
                };
            }
            
        } catch (error) {
            console.error('Error processing message with tools:', error);
            return {
                success: false,
                error: 'Sorry, I encountered an error processing your request. Please try again.',
                sessionId: sessionId
            };
        }
    }

    async processMessageWithMCP(message, sessionId, context = {}) {
        try {
            // Enhanced MCP processing with context
            const result = await this.processMessageWithTools(message, sessionId);
            
            // Add context handling
            if (context.phone_number) {
                this.sessionPhoneNumbers.set(sessionId, context.phone_number);
            }
            
            // Return enhanced response with context
            return {
                ...result,
                context: {
                    ...context,
                    phone_number: this.sessionPhoneNumbers.get(sessionId) || context.phone_number
                }
            };
            
        } catch (error) {
            console.error('Error processing message with MCP:', error);
            return {
                success: false,
                error: 'Sorry, I encountered an error processing your request. Please try again.',
                sessionId: sessionId,
                context: context
            };
        }
    }

    // Utility method to extract phone numbers from messages
    extractPhoneNumber(message) {
        const phoneRegex = /\+?[1-9]\d{1,14}/g;
        
        const match = message.match(phoneRegex);
        if (match) {
            return match[0];
        }
        
        return null;
    }

    // Enhanced initialization method
    async initialize() {
        try {
            // Initialize the model with system instructions
            const systemInstruction = this.getSystemPrompt();
            
            // Test connection to backend
            const testResponse = await axios.get(`${this.backendUrl}/`);
            console.log('✅ Connected to backend:', testResponse.data.message);
            
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize Gemini Assistant:', error);
            return false;
        }
    }
}

module.exports = GeminiAssistant;
