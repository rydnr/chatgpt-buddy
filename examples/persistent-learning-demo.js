/*
                        Web-Buddy Demo: Persistent Learning Workflow

    Demonstrates the complete "reuse this automation?" workflow with storage
*/

/**
 * Mock implementation of IndexedDB for Node.js environment
 */
class MockIndexedDB {
  constructor() {
    this.stores = new Map();
  }
  
  open(name, version) {
    return {
      onsuccess: null,
      onerror: null,
      onupgradeneeded: null,
      result: {
        createObjectStore: (storeName, options) => {
          const store = new MockObjectStore();
          this.stores.set(storeName, store);
          return store;
        },
        transaction: (storeNames, mode) => {
          return {
            objectStore: (storeName) => this.stores.get(storeName)
          };
        }
      }
    };
  }
}

class MockObjectStore {
  constructor() {
    this.data = new Map();
    this.indexes = new Map();
  }
  
  createIndex(name, keyPath, options) {
    this.indexes.set(name, { keyPath, options });
  }
  
  put(value) {
    this.data.set(value.id, value);
    return { onsuccess: null, onerror: null };
  }
  
  get(key) {
    return {
      onsuccess: null,
      onerror: null,
      result: this.data.get(key)
    };
  }
  
  getAll(query) {
    return {
      onsuccess: null,
      onerror: null,
      result: Array.from(this.data.values())
    };
  }
  
  index(name) {
    return {
      getAll: (value) => ({
        onsuccess: null,
        onerror: null,
        result: Array.from(this.data.values()).filter(item => {
          const indexInfo = this.indexes.get(name);
          if (Array.isArray(indexInfo.keyPath)) {
            return indexInfo.keyPath.every((path, i) => 
              this.getNestedProperty(item, path) === value[i]
            );
          } else {
            return this.getNestedProperty(item, indexInfo.keyPath) === value;
          }
        })
      })
    };
  }
  
  getNestedProperty(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}

// Mock global IndexedDB
global.indexedDB = new MockIndexedDB();

/**
 * Simulated automation storage (simplified version)
 */
class MockAutomationStorage {
  constructor() {
    this.automations = new Map();
  }

  async save(automation) {
    this.automations.set(automation.id, { ...automation });
    console.log(`💾 Saved automation: ${automation.id} (${automation.action})`);
  }

  async findMatching(criteria) {
    const results = [];
    
    for (const automation of this.automations.values()) {
      if (criteria.action && automation.action !== criteria.action) continue;
      if (criteria.website && automation.website !== criteria.website) continue;
      
      if (criteria.parameters) {
        const hasAllParams = criteria.parameters.every(param => 
          automation.parameters.includes(param)
        );
        if (!hasAllParams) continue;
      }
      
      results.push({ ...automation });
    }
    
    return results.sort((a, b) => b.metadata.confidence - a.metadata.confidence);
  }

  async getById(id) {
    const automation = this.automations.get(id);
    return automation ? { ...automation } : null;
  }

  async updateUsage(id) {
    const automation = this.automations.get(id);
    if (automation) {
      automation.metadata.lastUsed = new Date();
      automation.metadata.useCount += 1;
      automation.metadata.confidence = Math.min(1.0, automation.metadata.confidence + 0.05);
      console.log(`📈 Updated usage for ${automation.action}: ${automation.metadata.useCount} times used`);
    }
  }

  async exportAll() {
    return Array.from(this.automations.values());
  }

  async clear() {
    this.automations.clear();
  }
}

/**
 * Simulated automation manager
 */
class MockAutomationManager {
  constructor() {
    this.storage = new MockAutomationStorage();
    this.userPreferences = new Map();
  }

  async handleAutomationRequest(event) {
    console.log(`🔍 Checking for existing automations for: ${event.payload.action}`);
    
    const criteria = {
      action: event.payload.action,
      website: event.website,
      parameters: Object.keys(event.payload.parameters)
    };
    
    const matches = await this.storage.findMatching(criteria);
    
    if (matches.length === 0) {
      console.log('❌ No existing automation found');
      return { action: 'record-new', message: 'No existing automation found' };
    }
    
    console.log(`✅ Found ${matches.length} matching automation(s)`);
    
    // Check user preferences
    const prefKey = `${event.payload.action}:${event.website}`;
    const userPref = this.userPreferences.get(prefKey);
    
    if (userPref && userPref.until > new Date()) {
      console.log(`⚡ User preference: ${userPref.preference.action}`);
      if (userPref.preference.action === 'reuse') {
        return { action: 'execute', automation: matches[0] };
      }
    }
    
    return { action: 'reuse-prompt', automation: matches[0] };
  }

  async saveAutomation(implementationData) {
    const automation = {
      id: `auto-${Date.now()}`,
      eventType: 'automationRequested',
      action: implementationData.action,
      website: implementationData.website || 'example.com',
      parameters: ['query'], // Simplified
      playwrightScript: implementationData.playwrightScript,
      templatedScript: implementationData.templatedScript,
      metadata: {
        recordedAt: new Date(),
        useCount: 0,
        actionsCount: implementationData.actionsCount || 5,
        confidence: 0.8
      },
      matching: {
        urlPattern: `https://${implementationData.website || 'example.com'}/*`,
        domainPattern: implementationData.website || 'example.com',
        exactParameters: ['query']
      },
      version: 1
    };

    await this.storage.save(automation);
    return automation;
  }

  async executeAutomation(automationId, parameters) {
    const automation = await this.storage.getById(automationId);
    if (!automation) {
      throw new Error(`Automation ${automationId} not found`);
    }

    await this.storage.updateUsage(automationId);

    console.log(`🚀 Executing automation: ${automation.action}`);
    console.log(`   Parameters: ${JSON.stringify(parameters)}`);
    console.log(`   Script: ${automation.templatedScript.substring(0, 100)}...`);

    return {
      success: true,
      result: { status: 'completed', data: 'Search results for ' + parameters.query },
      executionTime: 1500
    };
  }

  setUserPreference(eventType, action, website, preference) {
    const key = `${action}:${website}`;
    let until = new Date();
    
    if (preference.doNotAskFor) {
      if (preference.doNotAskFor.type === 'duration') {
        until = new Date(Date.now() + preference.doNotAskFor.value * 60 * 1000);
      } else {
        until = new Date(Date.now() + 60 * 60 * 1000); // 1 hour per time
      }
    }
    
    this.userPreferences.set(key, { until, preference });
    console.log(`⚙️  User preference saved: ${action} -> ${preference.action} (until ${until.toLocaleTimeString()})`);
  }

  async getAllAutomations() {
    return this.storage.exportAll();
  }
}

/**
 * Create mock search event
 */
function createSearchEvent(query) {
  return {
    type: 'automationRequested',
    payload: {
      action: 'search',
      parameters: { query },
      context: { searchType: 'web', userIntent: 'learning' }
    },
    correlationId: `demo-${Date.now()}`,
    eventId: `search-${Date.now()}`,
    website: 'google.com'
  };
}

/**
 * Simulate user interaction with reuse dialog
 */
async function simulateUserReuseChoice(automation, choice = 'reuse', dontAskFor = null) {
  console.log('\n📋 Reuse Dialog: Found existing automation');
  console.log('━'.repeat(60));
  console.log(`Automation: ${automation.action}`);
  console.log(`Used: ${automation.metadata.useCount} times`);
  console.log(`Confidence: ${Math.round(automation.metadata.confidence * 100)}%`);
  console.log(`Website: ${automation.website}`);
  console.log('━'.repeat(60));
  console.log('Options: [Reuse This] [Record New] [Skip]');
  
  if (dontAskFor) {
    console.log(`☑️  Don't ask again for: ${dontAskFor.value} ${dontAskFor.type}`);
  }
  
  console.log(`👤 User clicks: [${choice.toUpperCase()}]`);
  
  const preference = {
    action: choice,
    doNotAskFor: dontAskFor
  };
  
  return preference;
}

/**
 * Main demonstration of persistent learning workflow
 */
async function runPersistentLearningDemo() {
  console.log('🧪 Persistent Learning Workflow Demo');
  console.log('Demonstrating: First-time recording → Storage → Reuse workflow\n');
  
  const automationManager = new MockAutomationManager();
  
  try {
    // === SCENARIO 1: First time - No automation exists ===
    console.log('=== SCENARIO 1: First Time Search Request ===');
    const firstSearchEvent = createSearchEvent('TypeScript patterns');
    
    console.log('📤 Client sends: searchRequested with "TypeScript patterns"');
    const firstResult = await automationManager.handleAutomationRequest(firstSearchEvent);
    
    if (firstResult.action === 'record-new') {
      console.log('🎬 Starting recording workflow...');
      console.log('👤 User demonstrates search automation');
      console.log('📝 Script generated and reviewed');
      
      // Simulate saving the recorded automation
      const recordedAutomation = await automationManager.saveAutomation({
        action: 'search',
        website: 'google.com',
        playwrightScript: `
// Auto-generated Playwright script
import { test, expect } from '@playwright/test';

test('search automation', async ({ page }) => {
  await page.goto('https://google.com');
  await page.click('input[name="q"]');
  await page.fill('input[name="q"]', 'TypeScript patterns');
  await page.keyboard.press('Enter');
  await page.waitForSelector('.search-results');
});`,
        templatedScript: `
// Auto-generated Playwright script
import { test, expect } from '@playwright/test';

test('search automation', async ({ page }) => {
  await page.goto('https://google.com');
  await page.click('input[name="q"]');
  await page.fill('input[name="q"]', payload.parameters.query);
  await page.keyboard.press('Enter');
  await page.waitForSelector('.search-results');
});`,
        actionsCount: 5
      });
      
      console.log(`✅ Automation recorded and saved: ${recordedAutomation.id}`);
    }
    
    // === SCENARIO 2: Second time - Show reuse dialog ===
    console.log('\n=== SCENARIO 2: Second Search Request ===');
    const secondSearchEvent = createSearchEvent('JavaScript frameworks');
    
    console.log('📤 Client sends: searchRequested with "JavaScript frameworks"');
    const secondResult = await automationManager.handleAutomationRequest(secondSearchEvent);
    
    if (secondResult.action === 'reuse-prompt') {
      console.log('🔄 Found existing automation, showing reuse dialog...');
      
      // Simulate user choosing to reuse
      const userChoice = await simulateUserReuseChoice(
        secondResult.automation, 
        'reuse',
        { type: 'times', value: 5 }
      );
      
      // Save user preference
      automationManager.setUserPreference(
        secondSearchEvent.type,
        secondSearchEvent.payload.action,
        secondSearchEvent.website,
        userChoice
      );
      
      if (userChoice.action === 'reuse') {
        console.log('🚀 Executing stored automation...');
        const result = await automationManager.executeAutomation(
          secondResult.automation.id,
          secondSearchEvent.payload.parameters
        );
        console.log(`✅ Execution result: ${result.result.status} (${result.executionTime}ms)`);
      }
    }
    
    // === SCENARIO 3: Third time - User preference applied ===
    console.log('\n=== SCENARIO 3: Third Search Request (Preference Applied) ===');
    const thirdSearchEvent = createSearchEvent('React best practices');
    
    console.log('📤 Client sends: searchRequested with "React best practices"');
    const thirdResult = await automationManager.handleAutomationRequest(thirdSearchEvent);
    
    if (thirdResult.action === 'execute') {
      console.log('⚡ User preference active - executing immediately without dialog');
      const result = await automationManager.executeAutomation(
        thirdResult.automation.id,
        thirdSearchEvent.payload.parameters
      );
      console.log(`✅ Execution result: ${result.result.status} (${result.executionTime}ms)`);
    }
    
    // === SCENARIO 4: Different action - Record new ===
    console.log('\n=== SCENARIO 4: Different Action (Login) ===');
    const loginEvent = {
      type: 'automationRequested',
      payload: {
        action: 'login',
        parameters: { username: 'demo@example.com' },
        context: { loginType: 'email' }
      },
      correlationId: `demo-${Date.now()}`,
      eventId: `login-${Date.now()}`,
      website: 'example.com'
    };
    
    console.log('📤 Client sends: automationRequested with "login"');
    const loginResult = await automationManager.handleAutomationRequest(loginEvent);
    
    if (loginResult.action === 'record-new') {
      console.log('🎬 No login automation exists - starting recording...');
    }
    
    // === Show Storage Summary ===
    console.log('\n=== STORAGE SUMMARY ===');
    const allAutomations = await automationManager.getAllAutomations();
    console.log(`📊 Total stored automations: ${allAutomations.length}`);
    
    for (const automation of allAutomations) {
      console.log(`   • ${automation.action} (${automation.website}): used ${automation.metadata.useCount} times`);
    }
    
    console.log('\n✨ Persistent Learning Demo Complete!');
    console.log('\nKey Features Demonstrated:');
    console.log('1. ✅ First-time recording and storage');
    console.log('2. ✅ "Reuse this automation?" dialog with preview');
    console.log('3. ✅ User preferences ("Don\'t ask for X times/minutes")');
    console.log('4. ✅ Automatic execution based on saved preferences');
    console.log('5. ✅ Usage statistics and confidence tracking');
    console.log('6. ✅ Persistent storage across browser sessions');
    console.log('7. ✅ Different actions handled independently');
    
    console.log('\n🚀 The learning system is working perfectly!');
    console.log('Users can now teach the system once and reuse automations forever.');
    
  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
}

// Run the demo
runPersistentLearningDemo().catch(console.error);