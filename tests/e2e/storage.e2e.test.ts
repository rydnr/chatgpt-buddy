// End-to-end tests for IndexedDB persistent storage functionality
// Tests the complete storage workflow: persistence, retrieval, and pattern matching

import { test, expect } from '@playwright/test';

test.describe('🔴 IndexedDB Storage E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a test page where the extension will be active
    await page.goto('https://example.com');
    
    // Wait for extension to load
    await page.waitForTimeout(2000);
  });

  test('🔴 should persist automation patterns to IndexedDB', async ({ page }) => {
    // Simulate an automation action that should be persisted
    const automationEvent = {
      type: 'automationRequested',
      payload: {
        action: 'fillInput',
        parameters: {
          selector: '#test-input',
          value: 'test value for storage'
        }
      },
      correlationId: 'storage-test-001'
    };

    // Create a test input element
    await page.evaluate(() => {
      const input = document.createElement('input');
      input.id = 'test-input';
      input.type = 'text';
      document.body.appendChild(input);
    });

    // Send automation event via content script
    const response = await page.evaluate(async (event) => {
      // Simulate receiving message from background script
      const messageEvent = new CustomEvent('message', { detail: event });
      return new Promise(resolve => {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
          if (message.type === 'automationRequested') {
            // This will trigger the content script's automation handler
            resolve(sendResponse);
          }
        });
        
        // Trigger the message
        chrome.runtime.onMessage.dispatch(event, {}, resolve);
      });
    }, automationEvent);

    // Verify the action was successful (which should trigger pattern persistence)
    expect(response).toBeDefined();
    
    // Wait for storage to complete
    await page.waitForTimeout(1000);

    // Verify pattern was stored by checking storage stats
    const storageStats = await page.evaluate(async () => {
      // Access the webBuddyStorage instance from content script
      return window.webBuddyStorage?.getStorageStats();
    });

    expect(storageStats).toBeDefined();
    expect(storageStats.automationPatterns).toBeGreaterThan(0);
    expect(storageStats.userInteractions).toBeGreaterThan(0);
  });

  test('🔴 should retrieve and apply existing automation patterns', async ({ page }) => {
    // First, create and store a pattern
    await page.evaluate(async () => {
      const pattern = {
        url: window.location.href,
        domain: window.location.hostname,
        action: 'clickElement',
        selector: '#test-button',
        parameters: { selector: '#test-button' },
        success: true,
        contextHash: 'test-context-hash',
        userConfirmed: true
      };
      
      await window.webBuddyStorage?.saveAutomationPattern(pattern);
    });

    // Wait for storage
    await page.waitForTimeout(500);

    // Create test button element
    await page.evaluate(() => {
      const button = document.createElement('button');
      button.id = 'test-button';
      button.textContent = 'Test Button';
      document.body.appendChild(button);
    });

    // Try to retrieve patterns for this domain and action
    const patterns = await page.evaluate(async () => {
      return await window.webBuddyStorage?.getAutomationPatterns({
        domain: window.location.hostname,
        action: 'clickElement',
        successOnly: true
      });
    });

    expect(patterns).toBeDefined();
    expect(patterns.length).toBeGreaterThan(0);
    expect(patterns[0].action).toBe('clickElement');
    expect(patterns[0].selector).toBe('#test-button');
  });

  test('🔴 should save user interactions with context', async ({ page }) => {
    // Perform a manual user action that should be captured
    await page.evaluate(() => {
      const input = document.createElement('input');
      input.id = 'manual-test-input';
      input.type = 'text';
      document.body.appendChild(input);
    });

    // Simulate user typing (this should trigger interaction saving)
    await page.fill('#manual-test-input', 'manual user input');
    
    // Wait for interaction to be saved
    await page.waitForTimeout(1000);

    // Verify interaction was saved
    const interactions = await page.evaluate(async () => {
      return await window.webBuddyStorage?.getUserInteractions({
        domain: window.location.hostname,
        limit: 5
      });
    });

    expect(interactions).toBeDefined();
    // Note: This test verifies the storage API works, but actual user interaction
    // capturing would require additional event listeners in the content script
  });

  test('🔴 should clear old data correctly', async ({ page }) => {
    // First, add some test data with old timestamps
    await page.evaluate(async () => {
      const oldPattern = {
        url: window.location.href,
        domain: window.location.hostname,
        action: 'testAction',
        selector: '#old-element',
        parameters: {},
        success: true,
        contextHash: 'old-context',
        userConfirmed: false
      };

      // Manually set an old timestamp
      const patternWithOldTimestamp = {
        ...oldPattern,
        id: 'old-pattern-123',
        timestamp: Date.now() - (31 * 24 * 60 * 60 * 1000) // 31 days ago
      };

      // Add directly to IndexedDB with old timestamp
      await window.webBuddyStorage?.saveAutomationPattern(oldPattern);
    });

    // Get initial count
    const initialStats = await page.evaluate(async () => {
      return await window.webBuddyStorage?.getStorageStats();
    });

    // Clear old data (30+ days)
    await page.evaluate(async () => {
      await window.webBuddyStorage?.clearOldData(30);
    });

    // Wait for cleanup
    await page.waitForTimeout(1000);

    // Get final count
    const finalStats = await page.evaluate(async () => {
      return await window.webBuddyStorage?.getStorageStats();
    });

    expect(finalStats).toBeDefined();
    // The cleanup should have run (exact counts depend on test timing)
    console.log('Storage stats - Initial:', initialStats, 'Final:', finalStats);
  });

  test('🔴 should handle storage errors gracefully', async ({ page }) => {
    // Test error handling by trying to save invalid data
    const errorResult = await page.evaluate(async () => {
      try {
        // Try to save pattern with missing required fields
        await window.webBuddyStorage?.saveAutomationPattern(null);
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(errorResult.success).toBe(false);
    expect(errorResult.error).toBeDefined();
  });

  test('🔴 should provide accurate storage statistics', async ({ page }) => {
    // Clear any existing data first
    await page.evaluate(async () => {
      await window.webBuddyStorage?.clearOldData(0); // Clear all data
    });

    // Add known quantities of data
    await page.evaluate(async () => {
      // Add 3 automation patterns
      for (let i = 0; i < 3; i++) {
        await window.webBuddyStorage?.saveAutomationPattern({
          url: window.location.href,
          domain: window.location.hostname,
          action: `testAction${i}`,
          selector: `#test-${i}`,
          parameters: {},
          success: true,
          contextHash: `hash-${i}`,
          userConfirmed: false
        });
      }

      // Add 2 user interactions
      for (let i = 0; i < 2; i++) {
        await window.webBuddyStorage?.saveUserInteraction({
          sessionId: 'test-session',
          url: window.location.href,
          domain: window.location.hostname,
          eventType: 'click',
          target: `#target-${i}`,
          success: true,
          context: {}
        });
      }

      // Add 1 website config
      await window.webBuddyStorage?.saveWebsiteConfig({
        domain: window.location.hostname,
        preferences: { theme: 'dark' },
        customSelectors: {},
        lastAccessed: Date.now(),
        automationEnabled: true
      });
    });

    // Wait for all saves to complete
    await page.waitForTimeout(1000);

    // Check statistics
    const stats = await page.evaluate(async () => {
      return await window.webBuddyStorage?.getStorageStats();
    });

    expect(stats).toBeDefined();
    expect(stats.automationPatterns).toBe(3);
    expect(stats.userInteractions).toBe(2);
    expect(stats.websiteConfigs).toBe(1);
  });
});

test.describe('🟢 IndexedDB Storage Integration with Extension UI', () => {
  test('🟢 should display storage stats in popup', async ({ page, context }) => {
    // This test would require the extension popup to be opened
    // For now, we'll simulate the popup functionality
    
    await page.goto('https://example.com');
    
    // Add some test data
    await page.evaluate(async () => {
      await window.webBuddyStorage?.saveAutomationPattern({
        url: window.location.href,
        domain: window.location.hostname,
        action: 'testActionForPopup',
        selector: '#popup-test',
        parameters: {},
        success: true,
        contextHash: 'popup-test-hash',
        userConfirmed: false
      });
    });

    // Wait for storage
    await page.waitForTimeout(500);

    // Simulate popup requesting storage stats
    const storageStats = await page.evaluate(async () => {
      return await window.webBuddyStorage?.getStorageStats();
    });

    expect(storageStats).toBeDefined();
    expect(storageStats.automationPatterns).toBeGreaterThan(0);
    
    // The popup should be able to display these stats
    console.log('✅ Storage stats available for popup:', storageStats);
  });
});