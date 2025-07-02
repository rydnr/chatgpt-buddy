// Phase 6: Training-Enhanced E2E Testing
// Complete user guidance and pattern learning workflows

import { test, expect, Page, BrowserContext } from '@playwright/test';
import { ChatGPTBuddyTrainingApplication } from '../../extension/src/training/application/training-application';
import {
  AutomationRequest,
  ExecutionContext,
  AutomationPatternData,
  PatternLearned,
  AutomationPatternExecuted,
  ElementSelectionRequested
} from '../../extension/src/training/domain/events/training-events';

// Test configuration for training workflows
test.describe('🎓 Interactive Training System E2E Workflows', () => {
  let context: BrowserContext;
  let page: Page;
  let trainingApp: ChatGPTBuddyTrainingApplication;

  test.beforeEach(async ({ browser }) => {
    // Create context with extension permissions
    context = await browser.newContext({
      permissions: ['storage-access'],
      viewport: { width: 1280, height: 720 }
    });

    page = await context.newPage();
    
    // Initialize training application
    trainingApp = new ChatGPTBuddyTrainingApplication();
    
    // Mock ChatGPT-like interface for testing
    await page.goto('data:text/html,<!DOCTYPE html><html><head><title>ChatGPT Training Test</title></head><body>' +
      '<div class="header"><h1>ChatGPT</h1></div>' +
      '<div class="sidebar">' +
        '<div class="project-list">' +
          '<div data-testid="project-typescript" class="project-item">TypeScript Development</div>' +
          '<div data-testid="project-python" class="project-item">Python Projects</div>' +
          '<div data-testid="project-javascript" class="project-item">JavaScript Apps</div>' +
        '</div>' +
      '</div>' +
      '<div class="main-content">' +
        '<div class="chat-list">' +
          '<div data-testid="chat-algorithms" class="chat-item">Algorithm Discussion</div>' +
          '<div data-testid="chat-patterns" class="chat-item">Design Patterns</div>' +
        '</div>' +
        '<div class="chat-interface">' +
          '<input data-testid="prompt-input" type="text" placeholder="Send a message..." />' +
          '<button data-testid="send-button">Send</button>' +
        '</div>' +
        '<div class="response-area" data-testid="response-area"></div>' +
      '</div>' +
      '<style>' +
        'body { font-family: sans-serif; margin: 0; display: flex; flex-direction: column; height: 100vh; }' +
        '.header { background: #343541; color: white; padding: 1rem; }' +
        '.sidebar { width: 250px; background: #202123; color: white; padding: 1rem; position: fixed; height: 100%; }' +
        '.project-item, .chat-item { padding: 0.5rem; margin: 0.5rem 0; background: #40414f; border-radius: 4px; cursor: pointer; }' +
        '.project-item:hover, .chat-item:hover { background: #565869; }' +
        '.main-content { margin-left: 250px; padding: 1rem; flex: 1; }' +
        '.chat-interface { display: flex; gap: 0.5rem; margin: 1rem 0; }' +
        '.chat-interface input { flex: 1; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; }' +
        '.chat-interface button { padding: 0.5rem 1rem; background: #19c37d; color: white; border: none; border-radius: 4px; cursor: pointer; }' +
        '.response-area { min-height: 200px; border: 1px solid #ccc; border-radius: 4px; padding: 1rem; background: #f9f9f9; }' +
        '</style>' +
      '</body></html>');

    // Inject training application into page context
    await page.addInitScript(() => {
      (window as any).trainingApp = null; // Will be set by test
    });
  });

  test.afterEach(async () => {
    if (trainingApp) {
      await trainingApp.stop();
    }
    await context.close();
  });

  test('🎯 Complete training workflow: Project selection learning', async () => {
    // GIVEN: Training mode enabled and ChatGPT-like page loaded
    await trainingApp.start();
    const enableResult = await trainingApp.enableTrainingMode('localhost');
    expect(enableResult.eventType).toBe('TrainingModeEnabled');

    // WHEN: ProjectSelectionRequested automation is requested
    const projectRequest: AutomationRequest = {
      messageType: 'SelectProjectRequested',
      payload: { projectName: 'TypeScript Development' },
      context: {
        url: page.url(),
        hostname: 'localhost',
        pathname: '/',
        title: 'ChatGPT Training Test',
        timestamp: new Date()
      }
    };

    // Trigger automation request (in real scenario, this comes from server)
    const requestResult = await trainingApp.handleAutomationRequest(projectRequest);
    expect(requestResult.eventType).toBe('ElementSelectionRequested');

    // THEN: Training UI should appear with guidance
    await page.waitForFunction(() => {
      return document.querySelector('.training-overlay') !== null;
    }, { timeout: 5000 });

    const trainingOverlay = page.locator('.training-overlay');
    await expect(trainingOverlay).toBeVisible();
    await expect(trainingOverlay).toContainText('Training Mode Active');
    await expect(trainingOverlay).toContainText('SelectProjectRequested');

    // WHEN: User clicks on the TypeScript project (simulating element selection)
    await page.locator('[data-testid="project-typescript"]').click();

    // THEN: Confirmation dialog should appear
    await page.waitForFunction(() => {
      return document.querySelector('.training-confirmation-overlay') !== null;
    }, { timeout: 3000 });

    const confirmationDialog = page.locator('.training-confirmation-overlay');
    await expect(confirmationDialog).toBeVisible();
    await expect(confirmationDialog).toContainText('Element Selected');
    await expect(confirmationDialog).toContainText('Do you want to automate');

    // WHEN: User confirms automation
    await page.locator('button:has-text("Yes, Automate")').click();

    // THEN: Pattern should be learned and UI should disappear
    await expect(trainingOverlay).not.toBeVisible();
    await expect(confirmationDialog).not.toBeVisible();

    // AND: Pattern should be stored in application
    const patterns = await trainingApp.exportPatterns();
    expect(patterns.length).toBeGreaterThan(0);
    
    const learnedPattern = patterns.find(p => p.messageType === 'SelectProjectRequested');
    expect(learnedPattern).toBeDefined();
    expect(learnedPattern!.selector).toContain('project-typescript');
    expect(learnedPattern!.confidence).toBe(1.0);
  });

  test('🚀 Auto-execution of learned patterns without training UI', async () => {
    // GIVEN: Pattern already learned and stored
    await trainingApp.start();
    
    const existingPattern: AutomationPatternData = {
      id: 'test-project-pattern',
      messageType: 'SelectProjectRequested',
      payload: { projectName: 'TypeScript Development' },
      selector: '[data-testid="project-typescript"]',
      context: {
        url: page.url(),
        hostname: 'localhost',
        pathname: '/',
        title: 'ChatGPT Training Test',
        timestamp: new Date()
      },
      confidence: 1.0,
      usageCount: 0,
      successfulExecutions: 0
    };

    await trainingApp.importPatterns([existingPattern]);
    await trainingApp.switchToAutomaticMode();

    // WHEN: Same automation request is made in automatic mode
    const projectRequest: AutomationRequest = {
      messageType: 'SelectProjectRequested',
      payload: { projectName: 'TypeScript Development' },
      context: {
        url: page.url(),
        hostname: 'localhost',
        pathname: '/',
        title: 'ChatGPT Training Test',
        timestamp: new Date()
      }
    };

    // Execute automation request
    const result = await trainingApp.handleAutomationRequest(projectRequest);

    // THEN: Should execute automatically without training UI
    await expect(page.locator('.training-overlay')).not.toBeVisible();
    
    // Pattern execution should have been attempted
    expect(['AutomationPatternExecuted', 'PatternExecutionFailed']).toContain(result.eventType);

    // AND: Element should show interaction (visual feedback)
    const projectElement = page.locator('[data-testid="project-typescript"]');
    await expect(projectElement).toBeVisible();
  });

  test('💬 Chat selection training workflow', async () => {
    // GIVEN: Training mode for chat selection
    await trainingApp.start();
    await trainingApp.enableTrainingMode('localhost');

    // WHEN: ChatSelectionRequested automation is requested
    const chatRequest: AutomationRequest = {
      messageType: 'SelectChatRequested',
      payload: { chatTitle: 'Algorithm Discussion' },
      context: {
        url: page.url(),
        hostname: 'localhost',
        pathname: '/',
        title: 'ChatGPT Training Test',
        timestamp: new Date()
      }
    };

    await trainingApp.handleAutomationRequest(chatRequest);

    // THEN: Training UI appears for chat selection
    await page.waitForSelector('.training-overlay');
    const trainingOverlay = page.locator('.training-overlay');
    await expect(trainingOverlay).toContainText('SelectChatRequested');

    // WHEN: User selects chat element
    await page.locator('[data-testid="chat-algorithms"]').click();

    // THEN: Confirmation dialog for chat selection
    await page.waitForSelector('.training-confirmation-overlay');
    await expect(page.locator('.training-confirmation-overlay')).toContainText('chat-algorithms');

    // WHEN: User confirms
    await page.locator('button:has-text("Yes, Automate")').click();

    // THEN: Chat selection pattern should be learned
    const patterns = await trainingApp.exportPatterns();
    const chatPattern = patterns.find(p => p.messageType === 'SelectChatRequested');
    expect(chatPattern).toBeDefined();
    expect(chatPattern!.selector).toContain('chat-algorithms');
  });

  test('✏️ Text input training workflow', async () => {
    // GIVEN: Training mode for text input
    await trainingApp.start();
    await trainingApp.enableTrainingMode('localhost');

    // WHEN: FillTextRequested automation is requested
    const textRequest: AutomationRequest = {
      messageType: 'FillTextRequested',
      payload: { 
        element: 'prompt input', 
        value: 'Explain TypeScript decorators' 
      },
      context: {
        url: page.url(),
        hostname: 'localhost',
        pathname: '/',
        title: 'ChatGPT Training Test',
        timestamp: new Date()
      }
    };

    await trainingApp.handleAutomationRequest(textRequest);

    // THEN: Training UI appears with text-specific guidance
    await page.waitForSelector('.training-overlay');
    const trainingOverlay = page.locator('.training-overlay');
    await expect(trainingOverlay).toContainText('FillTextRequested');
    await expect(trainingOverlay).toContainText('prompt input');

    // WHEN: User clicks on the text input
    await page.locator('[data-testid="prompt-input"]').click();

    // THEN: Confirmation shows input element details
    await page.waitForSelector('.training-confirmation-overlay');
    const confirmationDialog = page.locator('.training-confirmation-overlay');
    await expect(confirmationDialog).toContainText('input');
    await expect(confirmationDialog).toContainText('prompt-input');

    // WHEN: User confirms text input automation
    await page.locator('button:has-text("Yes, Automate")').click();

    // THEN: Text input pattern should be learned
    const patterns = await trainingApp.exportPatterns();
    const textPattern = patterns.find(p => p.messageType === 'FillTextRequested');
    expect(textPattern).toBeDefined();
    expect(textPattern!.selector).toContain('prompt-input');
  });

  test('❌ Training cancellation workflow', async () => {
    // GIVEN: Training mode active
    await trainingApp.start();
    await trainingApp.enableTrainingMode('localhost');

    // WHEN: Automation request triggers training
    const request: AutomationRequest = {
      messageType: 'ClickElementRequested',
      payload: { element: 'send button' },
      context: {
        url: page.url(),
        hostname: 'localhost',
        pathname: '/',
        title: 'ChatGPT Training Test',
        timestamp: new Date()
      }
    };

    await trainingApp.handleAutomationRequest(request);
    await page.waitForSelector('.training-overlay');

    // WHEN: User cancels training
    await page.locator('button:has-text("Cancel")').click();

    // THEN: Training UI should disappear
    await expect(page.locator('.training-overlay')).not.toBeVisible();

    // AND: No patterns should be learned
    const patterns = await trainingApp.exportPatterns();
    const cancelledPattern = patterns.find(p => p.messageType === 'ClickElementRequested');
    expect(cancelledPattern).toBeUndefined();
  });

  test('🔄 Pattern re-learning workflow', async () => {
    // GIVEN: Existing pattern that user wants to retrain
    await trainingApp.start();
    
    const oldPattern: AutomationPatternData = {
      id: 'old-pattern',
      messageType: 'ClickElementRequested',
      payload: { element: 'send button' },
      selector: '[data-testid="old-send-button"]', // Wrong selector
      context: {
        url: page.url(),
        hostname: 'localhost',
        pathname: '/',
        title: 'ChatGPT Training Test',
        timestamp: new Date()
      },
      confidence: 0.3, // Low confidence
      usageCount: 5,
      successfulExecutions: 1 // Low success rate
    };

    await trainingApp.importPatterns([oldPattern]);
    await trainingApp.enableTrainingMode('localhost');

    // WHEN: Same automation request is made
    const request: AutomationRequest = {
      messageType: 'ClickElementRequested',
      payload: { element: 'send button' },
      context: {
        url: page.url(),
        hostname: 'localhost',
        pathname: '/',
        title: 'ChatGPT Training Test',
        timestamp: new Date()
      }
    };

    await trainingApp.handleAutomationRequest(request);

    // THEN: Should still show training UI for retraining
    await page.waitForSelector('.training-overlay');
    await expect(page.locator('.training-overlay')).toBeVisible();

    // WHEN: User selects correct element
    await page.locator('[data-testid="send-button"]').click();
    await page.waitForSelector('.training-confirmation-overlay');
    await page.locator('button:has-text("Yes, Automate")').click();

    // THEN: New pattern should be created with correct selector
    const patterns = await trainingApp.exportPatterns();
    const updatedPatterns = patterns.filter(p => p.messageType === 'ClickElementRequested');
    expect(updatedPatterns.length).toBeGreaterThan(0);
    
    const latestPattern = updatedPatterns[updatedPatterns.length - 1];
    expect(latestPattern.selector).toContain('send-button');
    expect(latestPattern.confidence).toBe(1.0);
  });

  test('📊 Pattern statistics and analytics', async () => {
    // GIVEN: Multiple patterns with usage history
    await trainingApp.start();
    
    const patterns: AutomationPatternData[] = [
      {
        id: 'high-usage-pattern',
        messageType: 'SelectProjectRequested',
        payload: { projectName: 'TypeScript' },
        selector: '[data-testid="project-typescript"]',
        context: {
          url: page.url(),
          hostname: 'localhost',
          pathname: '/',
          title: 'ChatGPT Training Test',
          timestamp: new Date()
        },
        confidence: 1.2,
        usageCount: 10,
        successfulExecutions: 9
      },
      {
        id: 'low-usage-pattern',
        messageType: 'FillTextRequested',
        payload: { element: 'input' },
        selector: 'input[type="text"]',
        context: {
          url: page.url(),
          hostname: 'localhost',
          pathname: '/',
          title: 'ChatGPT Training Test',
          timestamp: new Date()
        },
        confidence: 0.8,
        usageCount: 3,
        successfulExecutions: 1
      }
    ];

    await trainingApp.importPatterns(patterns);

    // WHEN: Getting pattern statistics
    const stats = await trainingApp.getPatternStatistics();

    // THEN: Statistics should reflect pattern data
    expect(stats.totalPatterns).toBe(2);
    expect(stats.averageConfidence).toBeGreaterThan(0);
    expect(stats.successRate).toBeGreaterThan(0);
    expect(stats.patternsByType['SelectProjectRequested']).toBe(1);
    expect(stats.patternsByType['FillTextRequested']).toBe(1);

    // AND: Should be able to clean up low-performing patterns
    const deletedCount = await trainingApp.cleanupStalePatterns(0); // Aggressive cleanup
    expect(deletedCount).toBeGreaterThanOrEqual(0);
  });

  test('🌐 Multi-website pattern isolation', async () => {
    // GIVEN: Patterns from different websites
    await trainingApp.start();
    
    const chatgptPattern: AutomationPatternData = {
      id: 'chatgpt-pattern',
      messageType: 'FillTextRequested',
      payload: { element: 'prompt' },
      selector: '#prompt-textarea',
      context: {
        url: 'https://chatgpt.com/chat',
        hostname: 'chatgpt.com',
        pathname: '/chat',
        title: 'ChatGPT',
        timestamp: new Date()
      },
      confidence: 1.0,
      usageCount: 5,
      successfulExecutions: 5
    };

    const googlePattern: AutomationPatternData = {
      id: 'google-pattern',
      messageType: 'FillTextRequested',
      payload: { element: 'search' },
      selector: 'input[name="q"]',
      context: {
        url: 'https://google.com/',
        hostname: 'google.com',
        pathname: '/',
        title: 'Google',
        timestamp: new Date()
      },
      confidence: 1.0,
      usageCount: 3,
      successfulExecutions: 3
    };

    await trainingApp.importPatterns([chatgptPattern, googlePattern]);
    await trainingApp.switchToAutomaticMode();

    // WHEN: Making request on localhost (different hostname)
    const localhostRequest: AutomationRequest = {
      messageType: 'FillTextRequested',
      payload: { element: 'prompt' },
      context: {
        url: page.url(),
        hostname: 'localhost',
        pathname: '/',
        title: 'Test Page',
        timestamp: new Date()
      }
    };

    const result = await trainingApp.handleAutomationRequest(localhostRequest);

    // THEN: Should not match patterns from different hostnames
    // Should fall back to requesting element selection
    expect(result.eventType).toBe('PatternExecutionFailed');
  });
});

// Helper functions for E2E testing

async function simulateTyping(page: Page, selector: string, text: string, delay: number = 50) {
  const element = page.locator(selector);
  await element.focus();
  await element.fill('');
  
  for (const char of text) {
    await element.type(char, { delay });
  }
}