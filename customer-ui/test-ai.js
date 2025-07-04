#!/usr/bin/env node

/**
 * Test script for the Gemini AI Assistant
 * Tests various scenarios to ensure tools are being used properly
 */

const axios = require('axios');

const API_URL = 'http://localhost:5500';
const TEST_PHONE = '+263775123123';

async function testChatAPI() {
    console.log('🧪 Testing Gemini AI Assistant...\n');
    
    const testCases = [
        {
            name: 'Points balance query with phone number',
            message: `How many points do I have for ${TEST_PHONE}?`,
            expectedTool: 'check_points'
        },
        {
            name: 'Points balance query without phone number',
            message: 'How many points do I have?',
            expectedBehavior: 'should ask for phone number'
        },
        {
            name: 'Recommendations request',
            message: `Any recommendations for me? My number is ${TEST_PHONE}`,
            expectedTool: 'get_recommendations'
        },
        {
            name: 'Referral inquiry',
            message: 'How do referrals work?',
            expectedTool: 'explain_referrals'
        },
        {
            name: 'Transaction history',
            message: `Show me my recent transactions for ${TEST_PHONE}`,
            expectedTool: 'check_points'
        }
    ];
    
    for (const testCase of testCases) {
        console.log(`📝 Test: ${testCase.name}`);
        console.log(`💬 Message: "${testCase.message}"`);
        
        try {
            const response = await axios.post(`${API_URL}/api/chat`, {
                message: testCase.message,
                sessionId: `test_${Date.now()}`
            });
            
            if (response.data.success) {
                console.log(`✅ Response received`);
                console.log(`📄 Preview: ${response.data.response.substring(0, 150)}...`);
                
                // Check if the response indicates tool usage
                if (testCase.expectedTool && response.data.response.includes('📊')) {
                    console.log(`🛠️ Tool appears to have been used (found expected formatting)`);
                } else if (testCase.expectedBehavior && response.data.response.includes('phone number')) {
                    console.log(`📱 Correctly asked for phone number`);
                } else {
                    console.log(`⚠️ Response might not be using expected tool/behavior`);
                }
            } else {
                console.log(`❌ Error: ${response.data.error}`);
            }
        } catch (error) {
            console.log(`❌ Request failed: ${error.response?.data?.error || error.message}`);
        }
        
        console.log(''); // Empty line for separation
    }
}

async function testConfig() {
    console.log('🔧 Testing configuration endpoint...');
    
    try {
        const response = await axios.get(`${API_URL}/api/config`);
        console.log(`✅ Config response:`, response.data);
        
        if (response.data.geminiEnabled) {
            console.log(`🤖 Gemini AI is enabled`);
        } else {
            console.log(`⚠️ Gemini AI is not configured - tests will use fallback responses`);
        }
    } catch (error) {
        console.log(`❌ Config request failed: ${error.message}`);
    }
    
    console.log('');
}

async function main() {
    console.log('🚀 Starting Gemini AI Assistant Tests');
    console.log('====================================\n');
    
    // Test configuration
    await testConfig();
    
    // Test chat functionality
    await testChatAPI();
    
    console.log('🏁 Tests completed!');
    console.log('\n💡 Tips:');
    console.log('- Check server logs for detailed tool usage information');
    console.log('- Ensure your .env file has a valid GEMINI_API_KEY');
    console.log('- Make sure the backend API is running on port 8000');
}

// Run tests
main().catch(console.error);
