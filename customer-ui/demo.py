#!/usr/bin/env python3
"""
Demo script for the Customer UI
This script demonstrates the chat assistant capabilities
"""

import requests
import json
import time

class CustomerUIDemo:
    def __init__(self, api_url="http://localhost:8000"):
        self.api_url = api_url
        self.demo_phone = "+1234567890"
        
    def setup_demo_data(self):
        """Set up demo data for testing"""
        print("🔧 Setting up demo data...")
        
        # This would typically be done through the admin interface
        # For demo purposes, we'll just check if the API is accessible
        try:
            response = requests.get(f"{self.api_url}/")
            if response.status_code == 200:
                print("✅ Backend API is accessible")
                return True
            else:
                print(f"❌ Backend API returned status {response.status_code}")
                return False
        except requests.ConnectionError:
            print("❌ Cannot connect to backend API")
            print("   Make sure the FastAPI server is running on http://localhost:8000")
            return False
    
    def test_points_lookup(self):
        """Test the points lookup functionality"""
        print(f"\n📊 Testing points lookup for {self.demo_phone}...")
        
        try:
            response = requests.get(f"{self.api_url}/customers/points/{self.demo_phone}")
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Points lookup successful:")
                print(f"   Total Points: {data.get('total_points', 0)}")
                print(f"   Recent Transactions: {len(data.get('recent_transactions', []))}")
                return True
            else:
                print(f"⚠️  Customer not found (Status: {response.status_code})")
                print("   This is expected if no demo data exists")
                return False
        except Exception as e:
            print(f"❌ Error testing points lookup: {e}")
            return False
    
    def test_recommendations(self):
        """Test the recommendations functionality"""
        print(f"\n💡 Testing recommendations for {self.demo_phone}...")
        
        try:
            response = requests.get(f"{self.api_url}/customers/recommendations/{self.demo_phone}")
            if response.status_code == 200:
                data = response.json()
                recommendations = data.get('recommendations', [])
                print(f"✅ Recommendations retrieved: {len(recommendations)} items")
                for i, rec in enumerate(recommendations[:3], 1):
                    print(f"   {i}. {rec}")
                return True
            else:
                print(f"⚠️  No recommendations found (Status: {response.status_code})")
                return False
        except Exception as e:
            print(f"❌ Error testing recommendations: {e}")
            return False
    
    def simulate_chat_queries(self):
        """Simulate various chat queries"""
        print("\n🤖 Simulating chat assistant queries...")
        
        queries = [
            "How many points do I have?",
            "What are my recent transactions?",
            "Any recommendations for me?",
            "How do referrals work?",
            "What can you do?",
            "Help me understand the loyalty program"
        ]
        
        print("The chat assistant can handle these types of queries:")
        for i, query in enumerate(queries, 1):
            print(f"   {i}. \"{query}\"")
        
        print("\n💬 Chat Assistant Features:")
        print("   • Natural language processing")
        print("   • Context-aware responses")
        print("   • Real-time API integration")
        print("   • Multi-topic support")
        print("   • Helpful and friendly tone")
    
    def run_demo(self):
        """Run the complete demo"""
        print("🎯 Customer UI Demo Starting...")
        print("=" * 50)
        
        # Setup and connectivity
        if not self.setup_demo_data():
            print("\n❌ Demo cannot continue without backend API")
            return False
        
        # Test core functionalities
        self.test_points_lookup()
        self.test_recommendations()
        self.simulate_chat_queries()
        
        # Instructions
        print("\n" + "=" * 50)
        print("🌐 How to use the Customer UI:")
        print("1. Start the backend server:")
        print("   cd backend && python -m uvicorn main:app --reload")
        print("\n2. Start the customer UI server:")
        print("   cd customer-ui && ./setup.sh")
        print("   (or: npm start)")
        print("\n3. Open your browser to:")
        print("   http://localhost:5500")
        print("\n4. Test the chat assistant with queries like:")
        print("   • 'How many points do I have for +1234567890?'")
        print("   • 'What are my recent transactions?'")
        print("   • 'Any recommendations for me?'")
        print("   • 'How do referrals work?'")
        
        print("\n✨ Features to try:")
        print("   📱 Enter a phone number to check points")
        print("   💬 Click the chat icon to open the assistant")
        print("   🎯 Ask natural language questions")
        print("   📊 View transaction history and stats")
        print("   💡 Get personalized recommendations")
        
        return True

def main():
    demo = CustomerUIDemo()
    demo.run_demo()

if __name__ == "__main__":
    main()
