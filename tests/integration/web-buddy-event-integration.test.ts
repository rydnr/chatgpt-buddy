/*
                        Web-Buddy Event Integration Tests

    TDD-Emoji Approach: 🔴 RED → 🟢 GREEN → 🔵 REFACTOR

    Feature: Web-Buddy Event System Integration
    Goal: Ensure the new Web-Buddy event-driven architecture works with existing ChatGPT-Buddy
*/

import { createApp } from '../../packages/chatgpt-buddy-server/src/infrastructure/express-app';
import { WebBuddyClient } from '../../packages/web-buddy-core/src/client';
import { Server } from 'http';

describe('🌐 Web-Buddy Event Integration', () => {
  let server: Server;
  let client: any;
  const TEST_PORT = 3002; // Different port to avoid conflicts

  beforeAll(async () => {
    // Start test server
    const app = createApp();
    server = app.listen(TEST_PORT);
    
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Create Web-Buddy client
    client = new WebBuddyClient({
      serverUrl: `http://localhost:${TEST_PORT}`
    });
  });

  beforeEach(async () => {
    // Clear automation storage between tests to avoid interference
    const clearEvent = {
      type: 'clearAllAutomations',
      correlationId: `clear-${Date.now()}`,
      timestamp: new Date(),
      eventId: `clear-${Date.now()}`
    };
    
    await client.sendEvent(clearEvent);
  });

  afterAll(async () => {
    if (server) {
      server.close();
    }
  });

  /**
   * ✅ GREEN: Web-Buddy events now work with ChatGPT-Buddy server
   */
  it('✅ should send Web-Buddy events to ChatGPT-Buddy server', async () => {
    // Arrange: Create a simple automation event
    const automationEvent = {
      type: 'automationRequested',
      payload: {
        action: 'ping',
        parameters: { message: 'Hello from Web-Buddy!' },
        context: { source: 'test' }
      },
      correlationId: `web-buddy-${Date.now()}`,
      timestamp: new Date(),
      eventId: `evt-${Date.now()}`,
      website: 'test.com'
    };

    // Act: Send event using Web-Buddy client
    const response = await client.sendEvent(automationEvent);

    // Assert: Should receive proper response
    expect(response).toBeDefined();
    expect(response.correlationId).toBe(automationEvent.correlationId);
    // This will fail initially because ChatGPT-Buddy server doesn't handle Web-Buddy events yet
  });
  
  /**
   * ✅ GREEN: Event-to-message compatibility working
   */
  it('✅ should handle both events and legacy messages', async () => {
    // Test legacy message format
    const legacyResponse = await client.sendMessage({
      message: 'Legacy ping',
      correlationId: 'legacy-test'
    });

    // Test new event format  
    const eventResponse = await client.sendEvent({
      type: 'pingRequested',
      payload: { message: 'Event ping' },
      correlationId: 'event-test',
      timestamp: new Date(),
      eventId: 'evt-ping-123'
    });

    // Both should work
    expect(legacyResponse).toBeDefined();
    expect(eventResponse).toBeDefined();
  });

  /**
   * ✅ GREEN: Automation Learning Storage now working
   */
  it('✅ should store and retrieve automation implementations', async () => {
    // Arrange: Create an automation implementation event
    const implementationEvent = {
      type: 'automationImplemented',
      payload: {
        requestEventId: 'search-123',
        action: 'search',
        playwrightScript: 'await page.goto("https://google.com");',
        templatedScript: 'await page.goto("https://google.com"); await page.fill("input", payload.parameters.query);',
        metadata: {
          recordedAt: new Date(),
          websiteUrl: 'https://google.com',
          recordingDuration: 5000,
          stepCount: 3,
          elements: []
        }
      },
      correlationId: `impl-${Date.now()}`,
      timestamp: new Date(),
      eventId: `impl-${Date.now()}`,
      website: 'google.com'
    };

    // Act: Send implementation event
    const saveResponse = await client.sendEvent(implementationEvent);

    // Assert: Should be saved successfully (client returns data part directly)
    expect(saveResponse.stored).toBe(true);
    expect(saveResponse.automationId).toBeDefined();
    
    // Act: Request same automation again
    const searchRequest = {
      type: 'automationRequested',
      payload: {
        action: 'search',
        parameters: { query: 'test' },
        context: { searchType: 'web' }
      },
      correlationId: `search-${Date.now()}`,
      timestamp: new Date(),
      eventId: `search-${Date.now()}`,
      website: 'google.com'
    };

    const searchResponse = await client.sendEvent(searchRequest);

    // Assert: Should find and offer to reuse the stored automation
    expect(searchResponse.automationFound).toBe(true);
    expect(searchResponse.reuseOffered).toBe(true);
    expect(searchResponse.automation).toBeDefined();
  });

  /**
   * ✅ GREEN: User Preferences for "Don't ask again" now working
   */
  it('✅ should respect user preferences for automation reuse', async () => {
    // First, store an automation (reuse from previous test)
    const implementationEvent = {
      type: 'automationImplemented', 
      payload: {
        requestEventId: 'login-123',
        action: 'login',
        playwrightScript: 'await page.fill("#username", "user");',
        templatedScript: 'await page.fill("#username", payload.parameters.username);',
        metadata: {
          recordedAt: new Date(),
          websiteUrl: 'https://example.com',
          recordingDuration: 3000,
          stepCount: 2,
          elements: []
        }
      },
      correlationId: `impl-login-${Date.now()}`,
      timestamp: new Date(),
      eventId: `impl-login-${Date.now()}`,
      website: 'example.com'
    };

    await client.sendEvent(implementationEvent);

    // Set user preference to always reuse without asking
    const preferenceEvent = {
      type: 'userPreferenceSet',
      payload: {
        action: 'login',
        website: 'example.com', 
        preference: 'alwaysReuse',
        doNotAskFor: {
          type: 'duration',
          value: 60 // 60 minutes
        }
      },
      correlationId: `pref-${Date.now()}`,
      timestamp: new Date(),
      eventId: `pref-${Date.now()}`
    };

    const prefResponse = await client.sendEvent(preferenceEvent);
    expect(prefResponse.preferenceSet).toBe(true);

    // Now request the same automation - should execute immediately without asking
    const loginRequest = {
      type: 'automationRequested',
      payload: {
        action: 'login', 
        parameters: { username: 'testuser' },
        context: { loginType: 'form' }
      },
      correlationId: `login-${Date.now()}`,
      timestamp: new Date(),
      eventId: `login-${Date.now()}`,
      website: 'example.com'
    };

    const loginResponse = await client.sendEvent(loginRequest);

    // Should execute immediately based on user preference
    expect(loginResponse.automationFound).toBe(true);
    expect(loginResponse.executedImmediately).toBe(true);
    expect(loginResponse.userPreferenceApplied).toBe(true);
  });

  /**
   * ✅ GREEN: Browser Extension Communication now working
   */
  it('✅ should handle browser extension events for recording', async () => {
    // This test will require WebSocket communication with browser extension
    const recordingStartEvent = {
      type: 'recordingStarted',
      payload: {
        actionType: 'form-fill',
        targetUrl: 'https://example.com/form',
        recordingId: `rec-${Date.now()}`
      },
      correlationId: `rec-start-${Date.now()}`,
      timestamp: new Date(),
      eventId: `rec-start-${Date.now()}`,
      source: 'browser-extension'
    };

    const startResponse = await client.sendEvent(recordingStartEvent);
    expect(startResponse.recordingAcknowledged).toBe(true);
    expect(startResponse.recordingId).toBeDefined();

    // Simulate recording completion
    const recordingCompletedEvent = {
      type: 'recordingCompleted',
      payload: {
        recordingId: startResponse.recordingId,
        actions: [
          { type: 'click', selector: '#submit-btn', timestamp: Date.now() },
          { type: 'fill', selector: '#email', value: 'test@example.com', timestamp: Date.now() + 1000 }
        ],
        playwrightScript: 'await page.click("#submit-btn"); await page.fill("#email", "test@example.com");'
      },
      correlationId: `rec-complete-${Date.now()}`,
      timestamp: new Date(),
      eventId: `rec-complete-${Date.now()}`,
      source: 'browser-extension'
    };

    const completeResponse = await client.sendEvent(recordingCompletedEvent);
    expect(completeResponse.automationCreated).toBe(true);
    expect(completeResponse.automationId).toBeDefined();
  });

  /**
   * 🔴 RED: Next feature - Smart Implementation Matching Algorithm
   */
  it('🔴 should intelligently match similar automation requests', async () => {
    // First, store a generic search automation
    const searchImplementation = {
      type: 'automationImplemented',
      payload: {
        requestEventId: 'search-generic-123',
        action: 'search',
        playwrightScript: 'await page.goto("https://google.com"); await page.fill("input[name=q]", "query");',
        templatedScript: 'await page.goto("https://google.com"); await page.fill("input[name=q]", payload.parameters.query);',
        metadata: {
          recordedAt: new Date(),
          websiteUrl: 'https://google.com',
          recordingDuration: 4000,
          stepCount: 2,
          elements: [
            { selector: 'input[name="q"]', action: 'fill' }
          ]
        }
      },
      correlationId: `impl-search-${Date.now()}`,
      timestamp: new Date(),
      eventId: `impl-search-${Date.now()}`,
      website: 'google.com'
    };

    await client.sendEvent(searchImplementation);

    // Test 1: Exact match should score 100%
    const exactMatchRequest = {
      type: 'automationRequested',
      payload: {
        action: 'search',
        parameters: { query: 'TypeScript tutorials' },
        context: { searchType: 'web' }
      },
      correlationId: `exact-${Date.now()}`,
      timestamp: new Date(),
      eventId: `exact-${Date.now()}`,
      website: 'google.com'
    };

    const exactResponse = await client.sendEvent(exactMatchRequest);
    expect(exactResponse.automationFound).toBe(true);
    expect(exactResponse.matchScore).toBeGreaterThanOrEqual(1.0);

    // Test 2: Similar action on different site should score lower
    const similarRequest = {
      type: 'automationRequested', 
      payload: {
        action: 'search',
        parameters: { query: 'React patterns' },
        context: { searchType: 'web' }
      },
      correlationId: `similar-${Date.now()}`,
      timestamp: new Date(),
      eventId: `similar-${Date.now()}`,
      website: 'bing.com'
    };

    const similarResponse = await client.sendEvent(similarRequest);
    expect(similarResponse.automationFound).toBe(true);
    expect(similarResponse.matchScore).toBeLessThan(1.0);
    expect(similarResponse.matchScore).toBeGreaterThan(0.5);
    expect(similarResponse.adaptationSuggested).toBe(true);

    // Test 3: Completely different action should not match
    const differentRequest = {
      type: 'automationRequested',
      payload: {
        action: 'login',
        parameters: { username: 'test@example.com' },
        context: { loginType: 'email' }
      },
      correlationId: `different-${Date.now()}`,
      timestamp: new Date(),
      eventId: `different-${Date.now()}`,
      website: 'google.com'
    };

    const differentResponse = await client.sendEvent(differentRequest);
    expect(differentResponse.automationFound).toBe(false);
    expect(differentResponse.recordingSuggested).toBe(true);
  });

  /**
   * 🔴 RED: Next feature - Automation Confidence and Usage Tracking
   */
  it('🔴 should track automation confidence and usage statistics', async () => {
    // Store an automation
    const implementation = {
      type: 'automationImplemented',
      payload: {
        requestEventId: 'form-fill-123',
        action: 'fillForm',
        playwrightScript: 'await page.fill("#email", "test@example.com");',
        templatedScript: 'await page.fill("#email", payload.parameters.email);',
        metadata: {
          recordedAt: new Date(),
          websiteUrl: 'https://signup.example.com',
          recordingDuration: 2000,
          stepCount: 1,
          elements: [{ selector: '#email', action: 'fill' }]
        }
      },
      correlationId: `impl-form-${Date.now()}`,
      timestamp: new Date(),
      eventId: `impl-form-${Date.now()}`,
      website: 'signup.example.com'
    };

    const implResponse = await client.sendEvent(implementation);
    const automationId = implResponse.automationId;

    // Execute the automation multiple times to track usage
    for (let i = 0; i < 3; i++) {
      const executionRequest = {
        type: 'automationExecuted',
        payload: {
          automationId: automationId,
          parameters: { email: `test${i}@example.com` },
          executionResult: 'success',
          executionTime: 1500 + (i * 100)
        },
        correlationId: `exec-${Date.now()}-${i}`,
        timestamp: new Date(),
        eventId: `exec-${Date.now()}-${i}`,
        website: 'signup.example.com'
      };

      const execResponse = await client.sendEvent(executionRequest);
      expect(execResponse.usageRecorded).toBe(true);
    }

    // Check updated statistics
    const statsRequest = {
      type: 'automationStatsRequested',
      payload: {
        action: 'fillForm',
        website: 'signup.example.com'
      },
      correlationId: `stats-${Date.now()}`,
      timestamp: new Date(),
      eventId: `stats-${Date.now()}`,
      website: 'signup.example.com'
    };

    const statsResponse = await client.sendEvent(statsRequest);
    expect(statsResponse.automation).toBeDefined();
    expect(statsResponse.automation.usageCount).toBe(3);
    expect(statsResponse.automation.confidence).toBeGreaterThan(0.8);
    expect(statsResponse.automation.averageExecutionTime).toBeDefined();
    expect(statsResponse.automation.successRate).toBe(1.0);
  });

  /**
   * 🔴 RED: Next feature - IndexedDB Persistent Storage
   */
  it('🔴 should persist automations using IndexedDB instead of in-memory storage', async () => {
    // Store an automation
    const implementation = {
      type: 'automationImplemented',
      payload: {
        requestEventId: 'persistent-test-123',
        action: 'persistentAction',
        playwrightScript: 'await page.click("#persistent-button");',
        templatedScript: 'await page.click("#persistent-button");',
        metadata: {
          recordedAt: new Date(),
          websiteUrl: 'https://persistent.example.com',
          recordingDuration: 1000,
          stepCount: 1,
          elements: [{ selector: '#persistent-button', action: 'click' }]
        }
      },
      correlationId: `impl-persistent-${Date.now()}`,
      timestamp: new Date(),
      eventId: `impl-persistent-${Date.now()}`,
      website: 'persistent.example.com'
    };

    const implResponse = await client.sendEvent(implementation);
    expect(implResponse.stored).toBe(true);
    
    // Simulate server restart by creating a new server instance
    // In a real implementation, this would test that data persists after restart
    const persistenceCheckRequest = {
      type: 'automationRequested',
      payload: {
        action: 'persistentAction',
        parameters: {},
        context: {}
      },
      correlationId: `persistent-check-${Date.now()}`,
      timestamp: new Date(),
      eventId: `persistent-check-${Date.now()}`,
      website: 'persistent.example.com'
    };

    const persistenceResponse = await client.sendEvent(persistenceCheckRequest);
    
    // Should find the automation even after "restart" (this will fail until IndexedDB is implemented)
    expect(persistenceResponse.automationFound).toBe(true);
    expect(persistenceResponse.automation.action).toBe('persistentAction');
    expect(persistenceResponse.persistentStorage).toBe(true); // Flag to indicate IndexedDB is being used
  });
});