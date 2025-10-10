#!/usr/bin/env python3
"""
Integration test for AgentVerse and tactical-command-interface connection.
Tests trust receipt generation and verification across both systems.
"""

import os
import json
import time
import requests
from typing import Dict, Any, Optional

# Import the enhanced gammatria agent
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import from the local gammatria-agent.py file
import importlib.util
spec = importlib.util.spec_from_file_location("gammatria_agent", "gammatria-agent.py")
gammatria_agent = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gammatria_agent)

handle_query = gammatria_agent.handle_query
verify_tactical_receipt = gammatria_agent.verify_tactical_receipt
tactical_rag_query = gammatria_agent.tactical_rag_query

def test_environment_setup():
    """Test that all required environment variables are set."""
    required_vars = [
        'OPENAI_API_KEY',
        'WEAVIATE_URL',
        'WEAVIATE_API_KEY',
        'TACTICAL_COMMAND_URL',
        'SYMBI_EXECUTOR_URL',
        'TACTICAL_BRIDGE_URL'
    ]
    
    missing_vars = []
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print(f"❌ Missing environment variables: {', '.join(missing_vars)}")
        return False
    
    print("✅ All required environment variables are set")
    return True

def test_tactical_rag_query():
    """Test RAG query to tactical-command-interface."""
    print("\n🔍 Testing tactical RAG query...")
    
    test_query = "What is SYMBI framework?"
    result = tactical_rag_query(test_query, top_k=3)
    
    if result:
        print(f"✅ Tactical RAG query successful")
        print(f"   Query: {test_query}")
        print(f"   Results: {len(result.get('results', []))} documents")
        if result.get('results'):
            print(f"   First result: {result['results'][0].get('title', 'No title')[:50]}...")
        return True
    else:
        print(f"❌ Tactical RAG query failed")
        return False

def test_gammatria_agent_integration():
    """Test the enhanced gammatria agent with tactical integration."""
    print("\n🤖 Testing gammatria agent integration...")
    
    test_input = "Explain the SYMBI trust receipt system"
    
    try:
        result = handle_query(test_input)
        
        # Check if tactical integration is present
        if 'tactical_integration' in result:
            print("✅ Tactical integration present in agent response")
            
            tactical_data = result['tactical_integration']
            if tactical_data.get('rag_result'):
                print(f"   RAG results: {len(tactical_data['rag_result'].get('results', []))} documents")
            
            print(f"   Bridge URL: {tactical_data.get('bridge_url')}")
        else:
            print("❌ Tactical integration missing from agent response")
            return False
        
        # Check receipt generation
        if 'receipt_stub' in result:
            print("✅ Trust receipt stub generated")
            receipt = result['receipt_stub']
            print(f"   Policy ID: {receipt.get('policy_id')}")
            print(f"   Timestamp: {receipt.get('timestamp')}")
            print(f"   Status: {receipt.get('status')}")
        else:
            print("❌ Trust receipt stub missing")
            return False
        
        # Check receipt verification
        if 'receipt_verification' in result:
            verification = result['receipt_verification']
            if verification:
                print("✅ Receipt verification attempted")
                print(f"   Verification result: {verification}")
            else:
                print("⚠️  Receipt verification returned None (may be expected if tactical interface is not running)")
        
        return True
        
    except Exception as e:
        print(f"❌ Gammatria agent integration test failed: {e}")
        return False

def test_symbi_executor_connectivity():
    """Test connectivity to symbi-executor API endpoints."""
    print("\n🔗 Testing symbi-executor connectivity...")
    
    executor_url = os.getenv('SYMBI_EXECUTOR_URL', 'http://localhost:3002')
    bridge_url = os.getenv('TACTICAL_BRIDGE_URL', 'http://localhost:3002/api/tactical-bridge')
    
    # Test executor health
    try:
        response = requests.get(f"{executor_url}/api/health", timeout=5)
        if response.ok:
            print("✅ Symbi-executor health check passed")
        else:
            print(f"⚠️  Symbi-executor health check returned {response.status_code}")
    except Exception as e:
        print(f"❌ Symbi-executor not reachable: {e}")
        return False
    
    # Test bridge endpoint
    try:
        test_payload = {
            "action": "health_check"
        }
        response = requests.post(bridge_url, json=test_payload, timeout=5)
        if response.ok:
            print("✅ Tactical bridge endpoint reachable")
        else:
            print(f"⚠️  Tactical bridge returned {response.status_code}")
    except Exception as e:
        print(f"❌ Tactical bridge not reachable: {e}")
        return False
    
    return True

def test_end_to_end_workflow():
    """Test complete end-to-end workflow."""
    print("\n🔄 Testing end-to-end workflow...")
    
    # Simulate a multi-agent query
    test_queries = [
        "What are the core principles of SYMBI?",
        "How does trust receipt verification work?",
        "Explain the AgentVerse integration architecture"
    ]
    
    success_count = 0
    
    for i, query in enumerate(test_queries, 1):
        print(f"\n   Test {i}/3: {query[:40]}...")
        
        try:
            result = handle_query(query)
            
            # Check for required components
            has_intent = 'intent' in result
            has_receipt = 'receipt_stub' in result
            has_tactical = 'tactical_integration' in result
            
            if has_intent and has_receipt and has_tactical:
                print(f"   ✅ Query {i} processed successfully")
                success_count += 1
            else:
                print(f"   ❌ Query {i} missing components: intent={has_intent}, receipt={has_receipt}, tactical={has_tactical}")
        
        except Exception as e:
            print(f"   ❌ Query {i} failed: {e}")
        
        # Small delay between queries
        time.sleep(0.5)
    
    if success_count == len(test_queries):
        print(f"\n✅ End-to-end workflow test passed ({success_count}/{len(test_queries)} queries)")
        return True
    else:
        print(f"\n⚠️  End-to-end workflow partial success ({success_count}/{len(test_queries)} queries)")
        return success_count > 0

def main():
    """Run all integration tests."""
    print("🚀 Starting AgentVerse ↔ tactical-command-interface Integration Tests")
    print("=" * 70)
    
    tests = [
        ("Environment Setup", test_environment_setup),
        ("Tactical RAG Query", test_tactical_rag_query),
        ("Gammatria Agent Integration", test_gammatria_agent_integration),
        ("Symbi-Executor Connectivity", test_symbi_executor_connectivity),
        ("End-to-End Workflow", test_end_to_end_workflow)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print(f"\n{'='*20} {test_name} {'='*20}")
        try:
            success = test_func()
            results.append((test_name, success))
        except Exception as e:
            print(f"❌ {test_name} crashed: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "="*70)
    print("📊 TEST SUMMARY")
    print("="*70)
    
    passed = sum(1 for _, success in results if success)
    total = len(results)
    
    for test_name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All integration tests passed! AgentVerse ↔ tactical-command-interface connection is ready.")
        return 0
    else:
        print("⚠️  Some tests failed. Check the output above for details.")
        return 1

if __name__ == "__main__":
    exit(main())