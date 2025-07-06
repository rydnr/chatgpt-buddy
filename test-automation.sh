#!/usr/bin/env bash

# Simple automation test script using curl
SERVER_URL="http://localhost:3003"

echo "🚀 Starting automation command tests..."
echo

# Test 1: Simple test action
echo "🎯 Testing testAction..."
curl -X POST "$SERVER_URL/api/dispatch" \
  -H "Content-Type: application/json" \
  -d '{
    "target": {
      "extensionId": "test-extension",
      "tabId": 1
    },
    "message": {
      "type": "automationRequested",
      "payload": {
        "action": "testAction",
        "parameters": {
          "message": "Hello from automation test!"
        }
      },
      "correlationId": "test-1",
      "timestamp": "'$(date -Iseconds)'",
      "eventId": "automation-test-1"
    }
  }' | jq '.'

echo -e "\n---\n"
sleep 2

# Test 2: Fill input action
echo "🎯 Testing fillInput..."
curl -X POST "$SERVER_URL/api/dispatch" \
  -H "Content-Type: application/json" \
  -d '{
    "target": {
      "extensionId": "test-extension", 
      "tabId": 1
    },
    "message": {
      "type": "automationRequested",
      "payload": {
        "action": "fillInput",
        "parameters": {
          "selector": "#search-input",
          "value": "Web-Buddy test automation"
        }
      },
      "correlationId": "test-2",
      "timestamp": "'$(date -Iseconds)'",
      "eventId": "automation-test-2"
    }
  }' | jq '.'

echo -e "\n---\n"
sleep 2

# Test 3: Click element action
echo "🎯 Testing clickElement..."
curl -X POST "$SERVER_URL/api/dispatch" \
  -H "Content-Type: application/json" \
  -d '{
    "target": {
      "extensionId": "test-extension",
      "tabId": 1
    },
    "message": {
      "type": "automationRequested", 
      "payload": {
        "action": "clickElement",
        "parameters": {
          "selector": ".submit-button"
        }
      },
      "correlationId": "test-3",
      "timestamp": "'$(date -Iseconds)'",
      "eventId": "automation-test-3"
    }
  }' | jq '.'

echo -e "\n---\n"
sleep 2

# Test 4: Get text action
echo "🎯 Testing getText..."
curl -X POST "$SERVER_URL/api/dispatch" \
  -H "Content-Type: application/json" \
  -d '{
    "target": {
      "extensionId": "test-extension",
      "tabId": 1
    },
    "message": {
      "type": "automationRequested",
      "payload": {
        "action": "getText", 
        "parameters": {
          "selector": "h1"
        }
      },
      "correlationId": "test-4",
      "timestamp": "'$(date -Iseconds)'",
      "eventId": "automation-test-4"
    }
  }' | jq '.'

echo -e "\n🎉 Automation tests completed!"