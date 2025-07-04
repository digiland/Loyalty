#!/usr/bin/env python3
"""
Test script for MCP server functionality
"""
import requests
import json
import sys

# Configuration
BACKEND_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:5500"

def test_mcp_tool_endpoint():
    """Test the MCP tool endpoint directly"""
    print("🧪 Testing MCP Tool Endpoint...")
    
    # Test check_points tool
    test_data = {
        "tool": "check_points",
        "parameters": {
            "phone_number": "+1234567890"
        },
        "context": {}
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/mcp/tool", json=test_data)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_mcp_chat_endpoint():
    """Test the MCP chat endpoint via customer-ui"""
    print("\n🧪 Testing MCP Chat Endpoint...")
    
    test_data = {
        "message": "How many points do I have for +1234567890?",
        "sessionId": "test_session_123",
        "context": {
            "phone_number": "+1234567890"
        }
    }
    
    try:
        response = requests.post(f"{FRONTEND_URL}/api/mcp-chat", json=test_data)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_referral_tool():
    """Test the referral explanation tool"""
    print("\n🧪 Testing Referral Tool...")
    
    test_data = {
        "tool": "explain_referrals",
        "parameters": {},
        "context": {}
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/mcp/tool", json=test_data)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_recommendations_tool():
    """Test the recommendations tool"""
    print("\n🧪 Testing Recommendations Tool...")
    
    test_data = {
        "tool": "get_recommendations",
        "parameters": {
            "phone_number": "+1234567890"
        },
        "context": {}
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/mcp/tool", json=test_data)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    print("🚀 MCP Server Test Suite")
    print("=" * 50)
    
    tests = [
        ("MCP Tool Endpoint", test_mcp_tool_endpoint),
        ("MCP Chat Endpoint", test_mcp_chat_endpoint),
        ("Referral Tool", test_referral_tool),
        ("Recommendations Tool", test_recommendations_tool)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n📋 Running: {test_name}")
        try:
            if test_func():
                print(f"✅ {test_name} PASSED")
                passed += 1
            else:
                print(f"❌ {test_name} FAILED")
        except Exception as e:
            print(f"❌ {test_name} FAILED with exception: {e}")
    
    print(f"\n📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! MCP server is working correctly.")
        sys.exit(0)
    else:
        print("⚠️  Some tests failed. Check the logs above.")
        sys.exit(1)

if __name__ == "__main__":
    main()
