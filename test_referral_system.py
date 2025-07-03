#!/usr/bin/env python3
"""
Test script to verify the referral system implementation
"""

import requests
import json

BASE_URL = "http://localhost:8000"
TEST_PHONE = "+263771234567"
TEST_PHONE_2 = "+263771234568"

def test_referral_system():
    """Test the new referral endpoints"""
    
    print("🔍 Testing Referral System...")
    
    # Test 0: Check if customers exist, create if needed
    print("\n0. Setting up test customers...")
    try:
        # Check existing customers
        response = requests.get(f"{BASE_URL}/customers/list")
        if response.status_code == 200:
            customers = response.json()
            print(f"   📋 Found {len(customers)} existing customers")
            
            # Check if our test customer exists
            test_customer_exists = any(c['phone_number'] == TEST_PHONE for c in customers)
            
            if not test_customer_exists:
                # Create test customer
                response = requests.post(f"{BASE_URL}/customers/create", params={
                    "phone_number": TEST_PHONE,
                    "initial_points": 100
                })
                if response.status_code == 200:
                    print(f"   ✅ Created test customer: {TEST_PHONE}")
                else:
                    print(f"   ❌ Failed to create customer: {response.status_code} - {response.text}")
                    return
            else:
                print(f"   ✅ Test customer {TEST_PHONE} already exists")
        else:
            print(f"   ❌ Could not list customers: {response.status_code}")
            return
    except Exception as e:
        print(f"   ❌ Exception during setup: {e}")
        return
    
    # Test 1: Get customer referral code
    print("\n1. Testing get customer referral code...")
    try:
        response = requests.get(f"{BASE_URL}/customers/{TEST_PHONE}/referral-code")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Customer referral code: {data['referral_code']}")
            referral_code = data['referral_code']
        else:
            print(f"   ❌ Error: {response.status_code} - {response.text}")
            return
    except Exception as e:
        print(f"   ❌ Exception: {e}")
        return
    
    # Test 2: Find customer by referral code
    print("\n2. Testing find customer by referral code...")
    try:
        response = requests.get(f"{BASE_URL}/referral-codes/{referral_code}/customer")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Found customer: {data['phone_number']}")
        else:
            print(f"   ❌ Error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"   ❌ Exception: {e}")
    
    # Test 3: Process transaction with referral code (create new customer)
    print("\n3. Testing transaction with referral code...")
    try:
        response = requests.post(f"{BASE_URL}/transactions/with-referral", params={
            "business_id": 1,
            "customer_phone_number": TEST_PHONE_2,
            "amount_spent": 50.0,
            "referral_code": referral_code
        })
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Transaction processed with referral!")
            print(f"   👥 New customer: {data['new_customer']['phone_number']} earned {data['new_customer']['points_earned']} points")
            print(f"   🎁 Referrer: {data['referrer']['phone_number']} earned {data['referrer']['referral_bonus']} bonus points")
        else:
            print(f"   ❌ Error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"   ❌ Exception: {e}")
    
    # Test 4: Enhanced recommendations
    print("\n4. Testing enhanced recommendations...")
    try:
        response = requests.get(f"{BASE_URL}/customers/recommendations/{TEST_PHONE}?business_id=1")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Recommendations: {len(data['recommendations'])} suggestions")
            for i, rec in enumerate(data['recommendations'][:3], 1):
                print(f"      {i}. {rec}")
            if 'customer_stats' in data:
                stats = data['customer_stats']
                print(f"   📊 Customer stats: {stats['total_transactions']} transactions, {stats['total_points']} points")
        else:
            print(f"   ❌ Error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"   ❌ Exception: {e}")
    
    # Test 5: Referral analytics
    print("\n5. Testing referral analytics...")
    try:
        response = requests.get(f"{BASE_URL}/analytics/referral_performance?business_id=1")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Referral analytics: {data['total_referrals']} total referrals")
            print(f"   📈 Conversion rate: {data['conversion_rate']}%")
            print(f"   🏆 Top referrers: {len(data['top_referrers'])}")
        else:
            print(f"   ❌ Error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"   ❌ Exception: {e}")
    
    print("\n🎉 Referral system testing complete!")

if __name__ == "__main__":
    test_referral_system()
