// E2E tests for tab switching functionality
import { test, expect, chromium, Browser, BrowserContext } from '@playwright/test';
import WebSocket from 'ws';

test.describe('Tab Switching E2E Tests', () => {
  let browser: Browser;
  let context: BrowserContext;
  let ws: WebSocket;
  let extensionId: string;

  test.beforeAll(async () => {
    // Start the test server
    console.log('🚀 Starting test server for tab switching tests...');
    
    // Launch browser with extension
    browser = await chromium.launch({
      headless: false, // Need visible browser for tab switching
      args: [
        `--disable-extensions-except=${process.cwd()}/extension`,
        `--load-extension=${process.cwd()}/extension`,
        '--no-first-run',
        '--disable-default-apps'
      ]
    });

    context = await browser.newContext();
  });

  test.afterAll(async () => {
    if (ws) {
      ws.close();
    }
    await context?.close();
    await browser?.close();
  });

  test.beforeEach(async () => {
    // Connect to WebSocket server
    ws = new WebSocket('ws://localhost:3003/ws');
    
    await new Promise((resolve, reject) => {
      ws.on('open', resolve);
      ws.on('error', reject);
      setTimeout(() => reject(new Error('WebSocket connection timeout')), 5000);
    });
  });

  test.afterEach(async () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close();
    }
  });

  test('🔄 should switch to tab by title successfully', async () => {
    // Create multiple tabs with different titles
    const googlePage = await context.newPage();
    await googlePage.goto('https://www.google.com');
    await googlePage.waitForLoadState('domcontentloaded');
    
    const githubPage = await context.newPage();
    await githubPage.goto('https://github.com');
    await githubPage.waitForLoadState('domcontentloaded');
    
    const facebookPage = await context.newPage();
    await facebookPage.goto('https://www.facebook.com');
    await facebookPage.waitForLoadState('domcontentloaded');

    // Wait for extension to register
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Send tab switch request
    const tabSwitchMessage = {
      type: 'TabSwitchRequested',
      payload: {
        title: 'Google'
      },
      correlationId: 'e2e-tab-switch-test',
      timestamp: new Date().toISOString(),
      eventId: 'tab-switch-e2e-1'
    };

    // Listen for response
    const responsePromise = new Promise((resolve) => {
      ws.on('message', (data) => {
        const response = JSON.parse(data.toString());
        if (response.correlationId === 'e2e-tab-switch-test') {
          resolve(response);
        }
      });
    });

    // Send the message
    ws.send(JSON.stringify(tabSwitchMessage));

    // Wait for response
    const response = await responsePromise as any;

    // Verify response
    expect(response.status).toBe('success');
    expect(response.data.action).toBe('TabSwitchRequested');
    expect(response.data.switchedTo.title).toContain('Google');
    expect(response.data.switchedTo.url).toContain('google.com');

    // Verify the tab is actually active
    const pages = context.pages();
    const activePage = pages.find(page => page.url().includes('google.com'));
    expect(activePage).toBeDefined();

    // Clean up
    await googlePage.close();
    await githubPage.close();
    await facebookPage.close();
  });

  test('🔍 should handle case-insensitive title matching', async () => {
    // Create tab with uppercase title
    const page = await context.newPage();
    await page.goto('https://www.github.com');
    await page.waitForLoadState('domcontentloaded');

    // Wait for extension to register
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Send tab switch request with lowercase
    const tabSwitchMessage = {
      type: 'TabSwitchRequested',
      payload: {
        title: 'github' // lowercase
      },
      correlationId: 'e2e-case-insensitive-test',
      timestamp: new Date().toISOString(),
      eventId: 'tab-switch-case-1'
    };

    // Listen for response
    const responsePromise = new Promise((resolve) => {
      ws.on('message', (data) => {
        const response = JSON.parse(data.toString());
        if (response.correlationId === 'e2e-case-insensitive-test') {
          resolve(response);
        }
      });
    });

    // Send the message
    ws.send(JSON.stringify(tabSwitchMessage));

    // Wait for response
    const response = await responsePromise as any;

    // Verify response
    expect(response.status).toBe('success');
    expect(response.data.switchedTo.url).toContain('github.com');

    await page.close();
  });

  test('❌ should handle tab not found error', async () => {
    // Create a tab that won't match
    const page = await context.newPage();
    await page.goto('https://www.example.com');
    await page.waitForLoadState('domcontentloaded');

    // Wait for extension to register
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Send tab switch request for non-existent title
    const tabSwitchMessage = {
      type: 'TabSwitchRequested',
      payload: {
        title: 'NonExistentTabTitle'
      },
      correlationId: 'e2e-tab-not-found-test',
      timestamp: new Date().toISOString(),
      eventId: 'tab-switch-error-1'
    };

    // Listen for response
    const responsePromise = new Promise((resolve) => {
      ws.on('message', (data) => {
        const response = JSON.parse(data.toString());
        if (response.correlationId === 'e2e-tab-not-found-test') {
          resolve(response);
        }
      });
    });

    // Send the message
    ws.send(JSON.stringify(tabSwitchMessage));

    // Wait for response
    const response = await responsePromise as any;

    // Verify error response
    expect(response.status).toBe('error');
    expect(response.error).toContain('No tab found with title containing');
    expect(response.error).toContain('NonExistentTabTitle');
    expect(response.availableTabs).toBeDefined();
    expect(Array.isArray(response.availableTabs)).toBe(true);

    await page.close();
  });

  test('📋 should provide available tabs in error response', async () => {
    // Create multiple tabs
    const googlePage = await context.newPage();
    await googlePage.goto('https://www.google.com');
    await googlePage.waitForLoadState('domcontentloaded');
    
    const githubPage = await context.newPage();
    await githubPage.goto('https://github.com');
    await githubPage.waitForLoadState('domcontentloaded');

    // Wait for extension to register
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Send tab switch request for non-existent title
    const tabSwitchMessage = {
      type: 'TabSwitchRequested',
      payload: {
        title: 'SomeRandomTitle'
      },
      correlationId: 'e2e-available-tabs-test',
      timestamp: new Date().toISOString(),
      eventId: 'tab-switch-available-1'
    };

    // Listen for response
    const responsePromise = new Promise((resolve) => {
      ws.on('message', (data) => {
        const response = JSON.parse(data.toString());
        if (response.correlationId === 'e2e-available-tabs-test') {
          resolve(response);
        }
      });
    });

    // Send the message
    ws.send(JSON.stringify(tabSwitchMessage));

    // Wait for response
    const response = await responsePromise as any;

    // Verify available tabs are listed
    expect(response.status).toBe('error');
    expect(response.availableTabs).toBeDefined();
    expect(response.availableTabs.length).toBeGreaterThan(0);
    
    // Check that some of our created tabs are in the list
    const tabTitles = response.availableTabs.map((tab: any) => tab.title);
    const tabUrls = response.availableTabs.map((tab: any) => tab.url);
    
    expect(tabUrls.some((url: string) => url.includes('google.com'))).toBe(true);
    expect(tabUrls.some((url: string) => url.includes('github.com'))).toBe(true);

    await googlePage.close();
    await githubPage.close();
  });

  test('🎯 should switch to first matching tab when multiple matches exist', async () => {
    // Create multiple tabs with "test" in title
    const testPage1 = await context.newPage();
    await testPage1.goto('data:text/html,<title>Test Page 1</title><h1>First Test Page</h1>');
    
    const testPage2 = await context.newPage();
    await testPage2.goto('data:text/html,<title>Test Page 2</title><h1>Second Test Page</h1>');
    
    const testPage3 = await context.newPage();
    await testPage3.goto('data:text/html,<title>Another Test</title><h1>Third Test Page</h1>');

    // Wait for extension to register
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Send tab switch request
    const tabSwitchMessage = {
      type: 'TabSwitchRequested',
      payload: {
        title: 'Test'
      },
      correlationId: 'e2e-multiple-matches-test',
      timestamp: new Date().toISOString(),
      eventId: 'tab-switch-multiple-1'
    };

    // Listen for response
    const responsePromise = new Promise((resolve) => {
      ws.on('message', (data) => {
        const response = JSON.parse(data.toString());
        if (response.correlationId === 'e2e-multiple-matches-test') {
          resolve(response);
        }
      });
    });

    // Send the message
    ws.send(JSON.stringify(tabSwitchMessage));

    // Wait for response
    const response = await responsePromise as any;

    // Verify response
    expect(response.status).toBe('success');
    expect(response.data.switchedTo.title).toContain('Test');
    expect(response.data.totalMatches).toBeGreaterThanOrEqual(3);

    await testPage1.close();
    await testPage2.close();
    await testPage3.close();
  });

  test('🔗 should handle special characters in tab titles', async () => {
    // Create tab with special characters
    const specialPage = await context.newPage();
    await specialPage.goto('data:text/html,<title>Test & Special [Characters] (123)</title><h1>Special Characters</h1>');

    // Wait for extension to register
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Send tab switch request
    const tabSwitchMessage = {
      type: 'TabSwitchRequested',
      payload: {
        title: 'Special [Characters]'
      },
      correlationId: 'e2e-special-chars-test',
      timestamp: new Date().toISOString(),
      eventId: 'tab-switch-special-1'
    };

    // Listen for response
    const responsePromise = new Promise((resolve) => {
      ws.on('message', (data) => {
        const response = JSON.parse(data.toString());
        if (response.correlationId === 'e2e-special-chars-test') {
          resolve(response);
        }
      });
    });

    // Send the message
    ws.send(JSON.stringify(tabSwitchMessage));

    // Wait for response
    const response = await responsePromise as any;

    // Verify response
    expect(response.status).toBe('success');
    expect(response.data.switchedTo.title).toContain('Special [Characters]');

    await specialPage.close();
  });
});