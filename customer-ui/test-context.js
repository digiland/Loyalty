#!/usr/bin/env node

/**
 * Context Memory Test Script
 * Tests if the AI assistant remembers phone numbers and other context
 */

const axios = require('axios');

const API_URL = 'http://localhost:5500';
const TEST_PHONE = '+263775123456';

async function testContextMemory() {
    console.log('🧠 Testing Context Memory...\n');
    
    const sessionId = `context_test_${Date.now()}`;
    
    // Conversation sequence to test context memory
    const conversation = [
        {
            message: `My phone number is ${TEST_PHONE}`,
            expectation: 'Should acknowledge and store the phone number'
        },
        {
            message: 'How many points do I have?',
            expectation: 'Should use the stored phone number without asking again'
        },
        {
            message: 'Any recommendations for me?',
            expectation: 'Should use the stored phone number for recommendations'
        },
        {
            message: 'What was my phone number again?',
            expectation: 'Should remember the phone number from earlier'
        }
    ];
    
    console.log(`📱 Starting conversation with session ID: ${sessionId}\n`);
    
    for (let i = 0; i < conversation.length; i++) {
        const { message, expectation } = conversation[i];
        
        console.log(`💬 Step ${i + 1}: "${message}"`);
        console.log(`🎯 Expected: ${expectation}`);
        
        try {
            const response = await axios.post(`${API_URL}/api/chat`, {
                message: message,
                sessionId: sessionId
            });
            
            if (response.data.success) {
                console.log(`✅ Response: ${response.data.response.substring(0, 200)}...`);
                
                // Check for specific indicators
                if (i === 0 && response.data.response.includes('phone number')) {
                    console.log(`📝 ✅ Phone number acknowledged`);
                } else if (i === 1 && !response.data.response.includes('provide your phone')) {
                    console.log(`🧠 ✅ Context remembered - no phone number requested`);
                } else if (i === 1 && response.data.response.includes('provide your phone')) {
                    console.log(`🧠 ❌ Context not remembered - phone number requested again`);
                }
            } else {
                console.log(`❌ Error: ${response.data.error}`);
            }
        } catch (error) {
            console.log(`❌ Request failed: ${error.response?.data?.error || error.message}`);
        }
        
        console.log(''); // Empty line
        
        // Wait between messages
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

async function testMultiplePhoneNumbers() {
    console.log('📞 Testing Multiple Phone Numbers in Same Session...\n');
    
    const sessionId = `multi_phone_test_${Date.now()}`;
    
    const conversation = [
        {
            message: `Check points for ${TEST_PHONE}`,
            expectation: 'Should check first phone number'
        },
        {
            message: 'Check points for +263775999888',
            expectation: 'Should check different phone number'
        },
        {
            message: 'How many points do I have?',
            expectation: 'Should use the most recent phone number'
        }
    ];
    
    for (let i = 0; i < conversation.length; i++) {
        const { message, expectation } = conversation[i];
        
        console.log(`💬 Step ${i + 1}: "${message}"`);
        console.log(`🎯 Expected: ${expectation}`);
        
        try {
            const response = await axios.post(`${API_URL}/api/chat`, {
                message: message,
                sessionId: sessionId
            });
            
            if (response.data.success) {
                console.log(`✅ Response: ${response.data.response.substring(0, 150)}...`);
            } else {
                console.log(`❌ Error: ${response.data.error}`);
            }
        } catch (error) {
            console.log(`❌ Request failed: ${error.response?.data?.error || error.message}`);
        }
        
        console.log('');
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

async function main() {
    console.log('🧪 Context Memory Testing Suite');
    console.log('===============================\n');
    
    // Test basic context memory
    await testContextMemory();
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test multiple phone numbers
    await testMultiplePhoneNumbers();
    
    console.log('🏁 Context memory tests completed!');
    console.log('\n💡 What to look for:');
    console.log('- AI should remember phone numbers within a session');
    console.log('- AI should not ask for phone number again if already provided');
    console.log('- AI should use the most recently mentioned phone number');
    console.log('- Each session should maintain separate context');
}

// Run tests
main().catch(console.error);
