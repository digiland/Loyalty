#!/usr/bin/env node
/**
 * Test MCP Server Integration
 * This script tests the MCP server endpoints to ensure they're working correctly
 */

const axios = require('axios');

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:8000';

async function testMCPServer() {
    console.log('🧪 Testing MCP Server Integration...\n');
    
    try {
        // Test 1: Check if backend is running
        console.log('1. Testing backend connection...');
        const backendResponse = await axios.get(`${BACKEND_URL}/`);
        console.log('✅ Backend connected:', backendResponse.data.message);
        
        // Test 2: Test MCP tool execution - check_points
        console.log('\n2. Testing MCP tool execution (check_points)...');
        try {
            const pointsResponse = await axios.post(`${BACKEND_URL}/mcp/tool`, {
                tool: 'check_points',
                parameters: { phone_number: '+1234567890' },
                context: {}
            });
            console.log('✅ MCP check_points tool test:', pointsResponse.data.success ? 'SUCCESS' : 'FAILED');
            if (!pointsResponse.data.success) {
                console.log('   Expected error for non-existent customer:', pointsResponse.data.error);
            }
        } catch (error) {
            console.log('❌ MCP check_points tool error:', error.response?.data || error.message);
        }
        
        // Test 3: Test MCP tool execution - explain_referrals
        console.log('\n3. Testing MCP tool execution (explain_referrals)...');
        try {
            const referralsResponse = await axios.post(`${BACKEND_URL}/mcp/tool`, {
                tool: 'explain_referrals',
                parameters: {},
                context: {}
            });
            console.log('✅ MCP explain_referrals tool test:', referralsResponse.data.success ? 'SUCCESS' : 'FAILED');
            if (referralsResponse.data.success) {
                console.log('   Referral explanation available:', referralsResponse.data.data.how_it_works.length, 'steps');
            }
        } catch (error) {
            console.log('❌ MCP explain_referrals tool error:', error.response?.data || error.message);
        }
        
        // Test 4: Test MCP tool execution - get_business_info
        console.log('\n4. Testing MCP tool execution (get_business_info)...');
        try {
            const businessResponse = await axios.post(`${BACKEND_URL}/mcp/tool`, {
                tool: 'get_business_info',
                parameters: {},
                context: {}
            });
            console.log('✅ MCP get_business_info tool test:', businessResponse.data.success ? 'SUCCESS' : 'FAILED');
            if (businessResponse.data.success) {
                console.log('   Business info available:', businessResponse.data.data.businesses?.length || 0, 'businesses');
            }
        } catch (error) {
            console.log('❌ MCP get_business_info tool error:', error.response?.data || error.message);
        }
        
        console.log('\n🎉 MCP Server test completed!');
        console.log('\nNOTE: Some tests may show "FAILED" for non-existent data, which is expected.');
        console.log('The important thing is that the MCP server is responding to tool requests.');
        
    } catch (error) {
        console.error('❌ Failed to test MCP server:', error.message);
        console.log('\nTroubleshooting:');
        console.log('1. Make sure the backend FastAPI server is running on port 8000');
        console.log('2. Check that all dependencies are installed');
        console.log('3. Verify the database is accessible');
    }
}

// Run the test
testMCPServer().then(() => {
    process.exit(0);
}).catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
});
