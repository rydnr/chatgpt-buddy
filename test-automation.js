#!/usr/bin/env node

// Simple automation test client
const fetch = require('node:fetch');

const SERVER_URL = 'http://localhost:3003';

async function testAutomationCommand(action, parameters = {}) {
  console.log(`🎯 Testing automation: ${action}`);
  
  const automationEvent = {
    type: 'automationRequested',
    payload: {
      action: action,
      parameters: parameters
    },
    correlationId: `test-${Date.now()}`,
    timestamp: new Date().toISOString(),
    eventId: `automation-test-${Date.now()}`
  };

  try {
    const response = await fetch(`${SERVER_URL}/api/dispatch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        target: {
          extensionId: 'test-extension',
          tabId: 1
        },
        message: automationEvent
      })
    });

    const result = await response.json();
    console.log(`✅ Response for ${action}:`, result);
    return result;
  } catch (error) {
    console.error(`❌ Error testing ${action}:`, error.message);
    return null;
  }
}

async function runAutomationTests() {
  console.log('🚀 Starting automation command tests...\n');

  // Test 1: Simple test action
  await testAutomationCommand('testAction', {
    message: 'Hello from automation test!'
  });

  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 2: Fill input action
  await testAutomationCommand('fillInput', {
    selector: '#search-input',
    value: 'Web-Buddy test automation'
  });

  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 3: Click element action
  await testAutomationCommand('clickElement', {
    selector: '.submit-button'
  });

  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test 4: Get text action
  await testAutomationCommand('getText', {
    selector: 'h1'
  });

  console.log('\n🎉 Automation tests completed!');
}

// Run the tests
runAutomationTests().catch(console.error);