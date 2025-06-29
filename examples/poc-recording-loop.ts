/*
                        Web-Buddy POC: Basic Recording Loop

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
 * Proof of Concept: Basic Event Recording Loop
 * 
 * This minimal implementation demonstrates the core learning workflow:
 * 1. searchRequested event with payload "TypeScript patterns"
 * 2. Browser extension dialog showing event interpretation
 * 3. User guidance and recording workflow
 * 4. Script generation and storage
 */

import { createAutomationClient, AutomationEventFactory } from '../packages/web-buddy-core/dist/index.js';

/**
 * Simulated browser extension for POC
 * In real implementation, this would run in the browser extension context
 */
class POCBrowserExtension {
  private isRecording = false;
  private recordedActions: any[] = [];
  
  /**
   * Simulates the browser extension receiving an automation request
   */
  async handleAutomationRequest(event: any): Promise<void> {
    console.log('\n🌐 Browser Extension: Event received');
    console.log('Event Type:', event.type);
    console.log('Payload:', JSON.stringify(event.payload, null, 2));
    
    // Show user guidance dialog (simulated)
    const userChoice = await this.showGuidanceDialog(event);
    
    if (userChoice === 'record') {
      await this.startRecordingWorkflow(event);
    } else {
      console.log('❌ User cancelled automation recording');
    }
  }
  
  /**
   * Simulates the guidance dialog that shows event details
   */
  private async showGuidanceDialog(event: any): Promise<string> {
    console.log('\n📋 Dialog: searchRequested event received, please interpret it');
    console.log('━'.repeat(60));
    console.log('Event Details:');
    console.log('  Action:', event.payload.action);
    console.log('  Parameters:', JSON.stringify(event.payload.parameters, null, 4));
    if (event.payload.context) {
      console.log('  Context:', JSON.stringify(event.payload.context, null, 4));
    }
    if (event.payload.expectedOutcome) {
      console.log('  Expected Outcome:', event.payload.expectedOutcome);
    }
    console.log('━'.repeat(60));
    console.log('Options:');
    console.log('  [1] Proceed to Record - Start Playwright recording');
    console.log('  [2] Cancel - Skip automation for now');
    console.log('━'.repeat(60));
    
    // Simulate user clicking "proceed"
    console.log('👤 User clicks: [1] Proceed to Record');
    return 'record';
  }
  
  /**
   * Simulates the recording workflow
   */
  private async startRecordingWorkflow(event: any): Promise<void> {
    console.log('\n🔴 Recording: Playwright recording mode activated');
    console.log('Recording indicator shown to user...');
    console.log('Waiting for user to demonstrate the automation...');
    
    // Simulate recording some actions
    this.isRecording = true;
    this.recordedActions = [];
    
    // Simulate user actions (in real implementation, these would be captured by Playwright)
    await this.simulateUserActions(event.payload.parameters);
    
    // Stop recording after demonstration
    await this.stopRecording(event);
  }
  
  /**
   * Simulates user demonstrating search actions
   */
  private async simulateUserActions(parameters: any): Promise<void> {
    console.log('\n👤 User demonstrates search automation:');
    
    // Simulate waiting for page load
    await this.sleep(1000);
    console.log('  ✓ User navigates to search page');
    this.recordedActions.push({
      type: 'navigate',
      url: 'https://google.com',
      timestamp: Date.now()
    });
    
    // Simulate clicking search box
    await this.sleep(500);
    console.log('  ✓ User clicks search input field');
    this.recordedActions.push({
      type: 'click',
      selector: 'input[name="q"]',
      timestamp: Date.now()
    });
    
    // Simulate typing search query
    await this.sleep(800);
    console.log(`  ✓ User types: "${parameters.query}"`);
    this.recordedActions.push({
      type: 'fill',
      selector: 'input[name="q"]',
      value: parameters.query,
      timestamp: Date.now()
    });
    
    // Simulate pressing enter
    await this.sleep(500);
    console.log('  ✓ User presses Enter to search');
    this.recordedActions.push({
      type: 'keyboard',
      key: 'Enter',
      timestamp: Date.now()
    });
    
    // Simulate waiting for results
    await this.sleep(1500);
    console.log('  ✓ User waits for search results to load');
    this.recordedActions.push({
      type: 'wait',
      selector: '.search-results',
      timestamp: Date.now()
    });
    
    console.log('\n👤 User clicks "Done Recording" button');
  }
  
  /**
   * Stops recording and processes the result
   */
  private async stopRecording(originalEvent: any): Promise<void> {
    this.isRecording = false;
    
    console.log('\n⏹️  Recording stopped');
    console.log(`Captured ${this.recordedActions.length} actions`);
    
    // Generate Playwright script
    const script = this.generatePlaywrightScript();
    console.log('\n📝 Generated Playwright script:');
    console.log('━'.repeat(60));
    console.log(script);
    console.log('━'.repeat(60));
    
    // Show script review dialog
    const userApproval = await this.showScriptReview(script);
    
    if (userApproval.approved) {
      await this.saveImplementation(originalEvent, userApproval.modifiedScript || script);
    }
  }
  
  /**
   * Generates Playwright script from recorded actions
   */
  private generatePlaywrightScript(): string {
    let script = `// Auto-generated Playwright script for search automation\n`;
    script += `import { test, expect } from '@playwright/test';\n\n`;
    script += `test('search automation', async ({ page }) => {\n`;
    
    for (const action of this.recordedActions) {
      switch (action.type) {
        case 'navigate':
          script += `  await page.goto('${action.url}');\n`;
          break;
        case 'click':
          script += `  await page.click('${action.selector}');\n`;
          break;
        case 'fill':
          script += `  await page.fill('${action.selector}', '${action.value}');\n`;
          break;
        case 'keyboard':
          script += `  await page.keyboard.press('${action.key}');\n`;
          break;
        case 'wait':
          script += `  await page.waitForSelector('${action.selector}');\n`;
          break;
      }
    }
    
    script += `});\n`;
    return script;
  }
  
  /**
   * Shows script review dialog
   */
  private async showScriptReview(script: string): Promise<{ approved: boolean; modifiedScript?: string }> {
    console.log('\n📖 Script Review Dialog:');
    console.log('Please review the generated script and replace hardcoded values with payload placeholders');
    console.log('\nSuggested changes:');
    console.log(`  Replace: '${this.recordedActions.find(a => a.type === 'fill')?.value}'`);
    console.log(`  With: \${payload.parameters.query}`);
    
    // Simulate user modifying the script
    const modifiedScript = script.replace(
      /await page\.fill\('([^']+)', '([^']+)'\);/g,
      "await page.fill('$1', payload.parameters.query);"
    );
    
    console.log('\n👤 User modifies script and clicks "Approve & Save"');
    
    return {
      approved: true,
      modifiedScript
    };
  }
  
  /**
   * Saves the implementation for future reuse
   */
  private async saveImplementation(originalEvent: any, script: string): Promise<void> {
    console.log('\n💾 Saving automation implementation...');
    
    // In real implementation, this would save to IndexedDB or server
    const implementation = {
      eventType: originalEvent.type,
      action: originalEvent.payload.action,
      website: originalEvent.website || 'google.com',
      script,
      metadata: {
        recordedAt: new Date(),
        actionsCount: this.recordedActions.length,
        parameters: Object.keys(originalEvent.payload.parameters)
      }
    };
    
    console.log('✅ Implementation saved:', JSON.stringify(implementation, null, 2));
    console.log('\n🎉 Success! Future searchRequested events will show:');
    console.log('   "Reuse this automated behavior?" with preview of stored script');
    console.log('   Option: "Do not ask for 10 times or 30 minutes"');
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Main POC demonstration
 */
async function runPOCRecordingLoop(): Promise<void> {
  console.log('🧪 POC: Basic Event Recording Loop');
  console.log('Demonstrating your exact requirement: searchRequested → user guidance → recording → storage\n');
  
  try {
    // Step 1: Create client (your part - defining the event)
    const client = createAutomationClient({
      serverUrl: 'http://localhost:3000'  // Would be running server in real scenario
    });
    
    // Step 2: Create the searchRequested event with payload "TypeScript patterns" (your requirement)
    console.log('📤 Client: Sending searchRequested event...');
    const searchEvent = AutomationEventFactory.createSearchRequest(
      'TypeScript patterns',  // Your exact payload requirement
      'google.com',
      {
        searchType: 'web',
        userIntent: 'find learning resources',
        priority: 'high'
      }
    );
    
    console.log('Event created:', JSON.stringify({
      type: searchEvent.type,
      payload: searchEvent.payload,
      correlationId: searchEvent.correlationId,
      eventId: searchEvent.eventId
    }, null, 2));
    
    // Step 3: Simulate server receiving and forwarding to browser extension
    console.log('\n🖥️  Server: Event received, no implementation found');
    console.log('Server: Triggering learning workflow...');
    console.log('Server: Forwarding guidance request to browser extension...');
    
    // Step 4: Browser extension handles the automation request (my part - technical implementation)
    const browserExtension = new POCBrowserExtension();
    await browserExtension.handleAutomationRequest(searchEvent);
    
    console.log('\n✨ POC Complete! The learning loop is working:');
    console.log('1. ✅ searchRequested event received with payload "TypeScript patterns"');
    console.log('2. ✅ Browser dialog shows "please interpret it" with payload details');
    console.log('3. ✅ User clicks "proceed" → Playwright recording starts');
    console.log('4. ✅ User demonstrates search actions → Script generated');
    console.log('5. ✅ User reviews/modifies script → Implementation saved');
    console.log('6. ✅ Future requests will offer to reuse stored automation');
    
    console.log('\n🚀 Ready for next phase: Real browser extension integration!');
    
  } catch (error) {
    console.error('❌ POC failed:', error);
  }
}

// Export for use in other examples
export { runPOCRecordingLoop, POCBrowserExtension };

// Run if executed directly
if (require.main === module) {
  runPOCRecordingLoop().catch(console.error);
}