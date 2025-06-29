/*
                        Web-Buddy Learning System Demo

    Copyright (C) 2025-today  rydnr@acm-sl.org

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

/**
 * Learning Automation Demo
 * 
 * This example demonstrates the new learning capabilities:
 * 1. Event-driven architecture with automation requests
 * 2. User-guided automation recording
 * 3. Script generation and templating
 * 4. Persistent learning storage
 */

import { createAutomationClient, AutomationEventFactory } from '@web-buddy/core';

/**
 * Demo: Request automation for search (your requirement)
 */
async function demoSearchAutomationRequest() {
  console.log('=== Demo: Learning Automation Request ===');
  
  // Create automation-enabled client
  const client = createAutomationClient({
    serverUrl: 'http://localhost:3000'
  });
  
  try {
    // Your exact requirement: receive 'searchRequested' event with payload "TypeScript patterns"
    console.log('Requesting search automation...');
    
    const response = await client.requestSearch(
      'TypeScript patterns',
      'google.com',
      {
        context: {
          searchType: 'web',
          expectedResults: 'programming tutorials',
          userIntent: 'find learning resources'
        }
      }
    );
    
    console.log('Automation request response:', response);
    
    // At this point, if no implementation exists:
    // 1. Browser extension shows dialog: "searchRequested event received, please interpret it"
    // 2. User sees payload and context metadata
    // 3. User clicks "proceed" to start Playwright recording
    // 4. User demonstrates the search action
    // 5. User clicks "done" to generate script
    // 6. User reviews/modifies script with payload placeholders
    // 7. System saves as 'searchImplemented' event
    
  } catch (error) {
    console.error('Automation request failed:', error);
  }
}

/**
 * Demo: Generic automation request using the factory
 */
async function demoGenericAutomationRequest() {
  console.log('\n=== Demo: Generic Automation Request ===');
  
  const client = createAutomationClient({
    serverUrl: 'http://localhost:3000'
  });
  
  try {
    // Use the event factory for more control
    const searchEvent = AutomationEventFactory.createSearchRequest(
      'TypeScript patterns',
      'google.com',
      {
        priority: 'high',
        timeout: 30000,
        userGuidance: 'Look for official documentation and tutorials'
      }
    );
    
    console.log('Sending automation event:', searchEvent.toJSON());
    
    const response = await client.sendEvent(searchEvent);
    console.log('Event response:', response);
    
  } catch (error) {
    console.error('Generic automation request failed:', error);
  }
}

/**
 * Demo: Login automation request
 */
async function demoLoginAutomationRequest() {
  console.log('\n=== Demo: Login Automation Request ===');
  
  const client = createAutomationClient({
    serverUrl: 'http://localhost:3000'
  });
  
  try {
    const response = await client.requestLogin(
      {
        username: 'demo@example.com',
        // password would be handled securely in real implementation
      },
      'example.com',
      {
        context: {
          loginType: 'email',
          expectTwoFactor: false,
          redirectTo: '/dashboard'
        }
      }
    );
    
    console.log('Login automation response:', response);
    
  } catch (error) {
    console.error('Login automation request failed:', error);
  }
}

/**
 * Demo: How the learning loop works
 */
async function demonstrateLearningLoop() {
  console.log('\n=== Learning Loop Demonstration ===');
  
  console.log('1. User/System sends automation request:');
  console.log('   Event: searchRequested');
  console.log('   Payload: { query: "TypeScript patterns" }');
  console.log('   Context: { searchType: "web", userIntent: "learning" }');
  
  console.log('\n2. System checks for existing implementation:');
  console.log('   - No implementation found for "search" on "google.com"');
  console.log('   - Triggers learning workflow');
  
  console.log('\n3. Browser extension shows dialog:');
  console.log('   "searchRequested event received, please interpret it"');
  console.log('   Payload displayed with context to help developer understand');
  console.log('   Options: [Proceed to Record] [Cancel]');
  
  console.log('\n4. User clicks "Proceed":');
  console.log('   - Playwright recording mode activated');
  console.log('   - Recording indicator appears');
  console.log('   - User demonstrates search action');
  console.log('   - All interactions captured (clicks, typing, etc.)');
  
  console.log('\n5. User clicks "Done":');
  console.log('   - Recording stops');
  console.log('   - Playwright script generated');
  console.log('   - Script review dialog shown');
  
  console.log('\n6. User reviews script:');
  console.log('   - Hardcoded values highlighted for replacement');
  console.log('   - User replaces "TypeScript patterns" with ${payload.query}');
  console.log('   - User clicks "Accept"');
  
  console.log('\n7. System saves implementation:');
  console.log('   - Creates "searchImplemented" event');
  console.log('   - Stores templated script in persistent storage');
  console.log('   - Links to original request event');
  
  console.log('\n8. Future requests:');
  console.log('   - Same "searchRequested" triggers dialog:');
  console.log('   - "Reuse this automated behavior?"');
  console.log('   - Shows preview of stored script');
  console.log('   - Option: "Do not ask for X times or Y minutes"');
}

/**
 * Demo: Collaborative workflow
 */
async function demoCollaborativeWorkflow() {
  console.log('\n=== Collaborative Workflow Demo ===');
  
  console.log('Scenario: Working together on automation');
  console.log('\n1. You (domain expert) define the event:');
  console.log('   - searchRequested with meaningful payload');
  console.log('   - Context metadata to guide implementation');
  console.log('   - Expected outcome description');
  
  console.log('\n2. I (technical implementation) create the system:');
  console.log('   - Event handling infrastructure');
  console.log('   - Browser extension with learning UI');
  console.log('   - Playwright recording and script generation');
  console.log('   - Persistent storage and matching algorithms');
  
  console.log('\n3. Together we test and refine:');
  console.log('   - You test the recording workflow');
  console.log('   - Provide feedback on UI and user experience');
  console.log('   - I improve the technical implementation');
  console.log('   - We iterate until the workflow feels natural');
  
  console.log('\n4. Community benefits:');
  console.log('   - Other developers can reuse recorded automations');
  console.log('   - Implementations improve through collective testing');
  console.log('   - Knowledge is captured and shared systematically');
}

/**
 * Main demo runner
 */
async function runLearningDemo() {
  console.log('🎆 Web-Buddy Learning System Demo Starting...');
  console.log('Demonstrating the transformation from static to dynamic automation\n');
  
  try {
    await demoSearchAutomationRequest();
    await demoGenericAutomationRequest();
    await demoLoginAutomationRequest();
    
    demonstrateLearningLoop();
    demoCollaborativeWorkflow();
    
    console.log('\n✨ Key Innovations Demonstrated:');
    console.log('1. Events carry business meaning (not just data transport)');
    console.log('2. Learning loop turns user demonstrations into reusable automations');
    console.log('3. Playwright recording provides robust browser automation');
    console.log('4. Template system makes automations reusable with different payloads');
    console.log('5. Persistent storage enables sharing and reuse');
    console.log('6. Smart matching reduces manual work over time');
    
    console.log('\n🚀 Next Steps:');
    console.log('1. Build POC for basic recording loop');
    console.log('2. Implement smart implementation matching');
    console.log('3. Add persistent storage and sharing');
    console.log('4. Create website integration hints system');
    console.log('5. Build community features for collaboration');
    
  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
}

// Run the demo if this file is executed directly
if (require.main === module) {
  runLearningDemo().catch(console.error);
}

export {
  demoSearchAutomationRequest,
  demoGenericAutomationRequest,
  demoLoginAutomationRequest,
  demonstrateLearningLoop,
  demoCollaborativeWorkflow,
  runLearningDemo
};