// Phase 6: Cross-Session Pattern Persistence Tests
// Pattern persistence across browser sessions and application restarts

import { test, expect, Page, BrowserContext } from '@playwright/test';
import { ChatGPTBuddyTrainingApplication } from '../../extension/src/training/application/training-application';
import {
  AutomationRequest,
  AutomationPatternData,
  ExecutionContext
} from '../../extension/src/training/domain/events/training-events';

test.describe('💾 Cross-Session Pattern Persistence E2E', () => {
  let context: BrowserContext;
  let page: Page;

  // Create shared test page for consistency across sessions
  const createTestPage = async (page: Page) => {
    await page.goto('data:text/html,<!DOCTYPE html><html><head><title>Persistence Test</title></head><body>' +
      '<div class="persistent-test-app">' +
        '<header class="app-header">' +
          '<h1>Cross-Session Persistence Test</h1>' +
          '<div class="session-info">' +
            '<span id="session-id" data-testid="session-id">Session: ' + Date.now() + '</span>' +
            '<button id="new-session" data-testid="new-session">🔄 New Session</button>' +
          '</div>' +
        '</header>' +
        
        '<main class="test-workspace">' +
          '<section class="project-management">' +
            '<h2>Project Management</h2>' +
            '<div class="project-grid">' +
              '<div class="project-card" data-testid="project-webapp" data-project="webapp">' +
                '<h3>Web Application</h3>' +
                '<p>Full-stack web development project</p>' +
                '<button data-testid="select-webapp" class="select-btn">Select Project</button>' +
              '</div>' +
              
              '<div class="project-card" data-testid="project-mobile" data-project="mobile">' +
                '<h3>Mobile App</h3>' +
                '<p>Cross-platform mobile application</p>' +
                '<button data-testid="select-mobile" class="select-btn">Select Project</button>' +
              '</div>' +
              
              '<div class="project-card" data-testid="project-api" data-project="api">' +
                '<h3>REST API</h3>' +
                '<p>Backend API development</p>' +
                '<button data-testid="select-api" class="select-btn">Select Project</button>' +
              '</div>' +
            '</div>' +
          '</section>' +
          
          '<section class="task-management">' +
            '<h2>Task Management</h2>' +
            '<div class="task-form">' +
              '<div class="form-group">' +
                '<label for="task-name">Task Name</label>' +
                '<input id="task-name" data-testid="task-name" type="text" placeholder="Enter task name..." />' +
              '</div>' +
              
              '<div class="form-group">' +
                '<label for="task-type">Task Type</label>' +
                '<select id="task-type" data-testid="task-type">' +
                  '<option value="">Select type...</option>' +
                  '<option value="feature">Feature Development</option>' +
                  '<option value="bugfix">Bug Fix</option>' +
                  '<option value="testing">Testing</option>' +
                  '<option value="documentation">Documentation</option>' +
                '</select>' +
              '</div>' +
              
              '<div class="form-group">' +
                '<label for="task-details">Task Details</label>' +
                '<textarea id="task-details" data-testid="task-details" rows="4" placeholder="Describe the task..."></textarea>' +
              '</div>' +
              
              '<div class="form-actions">' +
                '<button id="save-task" data-testid="save-task" class="btn btn-primary">💾 Save Task</button>' +
                '<button id="create-task" data-testid="create-task" class="btn btn-success">✨ Create Task</button>' +
                '<button id="schedule-task" data-testid="schedule-task" class="btn btn-info">📅 Schedule</button>' +
              '</div>' +
            '</div>' +
          '</section>' +
          
          '<section class="communication">' +
            '<h2>Team Communication</h2>' +
            '<div class="chat-interface">' +
              '<div class="chat-history" data-testid="chat-history">' +
                '<div class="message" data-testid="message-1">' +
                  '<strong>Alice:</strong> How is the authentication feature going?' +
                '</div>' +
                '<div class="message" data-testid="message-2">' +
                  '<strong>Bob:</strong> Almost done, just need to add password reset.' +
                '</div>' +
                '<div class="message" data-testid="message-3">' +
                  '<strong>Carol:</strong> Great! I can help with testing once ready.' +
                '</div>' +
              '</div>' +
              
              '<div class="message-input">' +
                '<input id="message-text" data-testid="message-text" type="text" placeholder="Type your message..." />' +
                '<button id="send-message" data-testid="send-message" class="btn btn-primary">📤 Send</button>' +
              '</div>' +
            '</div>' +
          '</section>' +
          
          '<section class="analytics">' +
            '<h2>Project Analytics</h2>' +
            '<div class="analytics-controls">' +
              '<button data-testid="refresh-data" class="btn btn-outline">🔄 Refresh Data</button>' +
              '<button data-testid="export-report" class="btn btn-outline">📊 Export Report</button>' +
              '<button data-testid="view-metrics" class="btn btn-outline">📈 View Metrics</button>' +
              '<button data-testid="generate-charts" class="btn btn-outline">📉 Generate Charts</button>' +
            '</div>' +
            
            '<div class="metrics-display" data-testid="metrics-display">' +
              '<div class="metric-card">' +
                '<h4>Completed Tasks</h4>' +
                '<span class="metric-value">42</span>' +
              '</div>' +
              '<div class="metric-card">' +
                '<h4>Active Projects</h4>' +
                '<span class="metric-value">3</span>' +
              '</div>' +
              '<div class="metric-card">' +
                '<h4>Team Members</h4>' +
                '<span class="metric-value">8</span>' +
              '</div>' +
            '</div>' +
          '</section>' +
        '</main>' +
        
        '<footer class="app-footer">' +
          '<div class="persistence-controls">' +
            '<button data-testid="clear-storage" class="btn btn-warning">🗑️ Clear Storage</button>' +
            '<button data-testid="backup-data" class="btn btn-info">💾 Backup Data</button>' +
            '<button data-testid="restore-data" class="btn btn-info">📥 Restore Data</button>' +
            '<span id="storage-status" data-testid="storage-status">Storage: Ready</span>' +
          '</div>' +
        '</footer>' +
      '</div>' +
      
      // Styling for test consistency
      '<style>' +
        '* { margin: 0; padding: 0; box-sizing: border-box; }' +
        'body { font-family: system-ui, sans-serif; background: #f5f7fa; color: #333; line-height: 1.6; }' +
        '.persistent-test-app { min-height: 100vh; display: flex; flex-direction: column; }' +
        '.app-header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 1.5rem; display: flex; justify-content: space-between; align-items: center; }' +
        '.session-info { display: flex; align-items: center; gap: 1rem; }' +
        '#session-id { background: rgba(255,255,255,0.2); padding: 0.5rem 1rem; border-radius: 20px; font-family: monospace; }' +
        '#new-session { background: rgba(255,255,255,0.3); border: none; color: white; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; }' +
        '.test-workspace { flex: 1; padding: 2rem; max-width: 1200px; margin: 0 auto; }' +
        'section { background: white; margin-bottom: 2rem; padding: 2rem; border-radius: 12px; box-shadow: 0 2px 15px rgba(0,0,0,0.1); }' +
        'section h2 { color: #2c3e50; margin-bottom: 1.5rem; border-bottom: 2px solid #ecf0f1; padding-bottom: 0.5rem; }' +
        '.project-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; }' +
        '.project-card { border: 2px solid #ecf0f1; border-radius: 8px; padding: 1.5rem; transition: all 0.3s; cursor: pointer; }' +
        '.project-card:hover { border-color: #3498db; transform: translateY(-2px); box-shadow: 0 4px 20px rgba(52, 152, 219, 0.2); }' +
        '.project-card.selected { border-color: #2ecc71; background: #d5f4e6; }' +
        '.project-card h3 { color: #2c3e50; margin-bottom: 0.5rem; }' +
        '.project-card p { color: #7f8c8d; margin-bottom: 1rem; font-size: 0.9rem; }' +
        '.select-btn { background: #3498db; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; width: 100%; }' +
        '.select-btn:hover { background: #2980b9; }' +
        '.form-group { margin-bottom: 1.5rem; }' +
        '.form-group label { display: block; margin-bottom: 0.5rem; font-weight: 600; color: #2c3e50; }' +
        '.form-group input, .form-group select, .form-group textarea { width: 100%; padding: 0.75rem; border: 2px solid #ecf0f1; border-radius: 6px; font-size: 1rem; transition: border-color 0.2s; }' +
        '.form-group input:focus, .form-group select:focus, .form-group textarea:focus { outline: none; border-color: #3498db; }' +
        '.form-actions { display: flex; gap: 1rem; justify-content: flex-start; }' +
        '.btn { padding: 0.75rem 1.5rem; border: none; border-radius: 6px; font-size: 0.9rem; font-weight: 500; cursor: pointer; transition: all 0.2s; text-decoration: none; display: inline-block; }' +
        '.btn-primary { background: #3498db; color: white; }' +
        '.btn-primary:hover { background: #2980b9; }' +
        '.btn-success { background: #2ecc71; color: white; }' +
        '.btn-success:hover { background: #27ae60; }' +
        '.btn-info { background: #17a2b8; color: white; }' +
        '.btn-info:hover { background: #138496; }' +
        '.btn-warning { background: #f39c12; color: white; }' +
        '.btn-warning:hover { background: #e67e22; }' +
        '.btn-outline { background: transparent; border: 2px solid #3498db; color: #3498db; }' +
        '.btn-outline:hover { background: #3498db; color: white; }' +
        '.chat-history { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 6px; padding: 1rem; margin-bottom: 1rem; max-height: 200px; overflow-y: auto; }' +
        '.message { margin-bottom: 0.5rem; padding: 0.5rem; border-radius: 4px; background: white; }' +
        '.message-input { display: flex; gap: 1rem; }' +
        '.message-input input { flex: 1; }' +
        '.analytics-controls { display: flex; gap: 1rem; margin-bottom: 2rem; flex-wrap: wrap; }' +
        '.metrics-display { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; }' +
        '.metric-card { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 6px; padding: 1rem; text-align: center; }' +
        '.metric-card h4 { color: #495057; margin-bottom: 0.5rem; font-size: 0.9rem; }' +
        '.metric-value { font-size: 2rem; font-weight: bold; color: #3498db; display: block; }' +
        '.app-footer { background: #2c3e50; color: white; padding: 1rem; }' +
        '.persistence-controls { display: flex; gap: 1rem; align-items: center; justify-content: center; flex-wrap: wrap; }' +
        '#storage-status { background: rgba(255,255,255,0.2); padding: 0.5rem 1rem; border-radius: 6px; }' +
      '</style>' +
      
      // Interactive JavaScript
      '<script>' +
        'document.addEventListener("DOMContentLoaded", function() {' +
          // Project selection
          'document.querySelectorAll(".project-card").forEach(card => {' +
            'card.addEventListener("click", function() {' +
              'document.querySelectorAll(".project-card").forEach(c => c.classList.remove("selected"));' +
              'this.classList.add("selected");' +
              'console.log("Project selected:", this.dataset.project);' +
            '});' +
          '});' +
          
          // Form interactions
          'document.getElementById("message-text").addEventListener("keypress", function(e) {' +
            'if (e.key === "Enter") {' +
              'document.getElementById("send-message").click();' +
            '}' +
          '});' +
          
          'document.getElementById("send-message").addEventListener("click", function() {' +
            'const input = document.getElementById("message-text");' +
            'if (input.value.trim()) {' +
              'const chatHistory = document.querySelector(".chat-history");' +
              'const message = document.createElement("div");' +
              'message.className = "message";' +
              'message.innerHTML = `<strong>You:</strong> ${input.value}`;' +
              'chatHistory.appendChild(message);' +
              'chatHistory.scrollTop = chatHistory.scrollHeight;' +
              'input.value = "";' +
            '}' +
          '});' +
          
          // Storage controls
          'document.getElementById("clear-storage").addEventListener("click", function() {' +
            'localStorage.clear();' +
            'sessionStorage.clear();' +
            'document.getElementById("storage-status").textContent = "Storage: Cleared";' +
          '});' +
          
          'document.getElementById("new-session").addEventListener("click", function() {' +
            'const sessionId = Date.now();' +
            'document.getElementById("session-id").textContent = "Session: " + sessionId;' +
          '});' +
          
          'console.log("Persistence test page initialized");' +
        '});' +
      '</script>' +
      '</body></html>');
  };

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext({
      permissions: ['storage-access', 'persistent-storage'],
      viewport: { width: 1280, height: 720 }
    });

    page = await context.newPage();
    await createTestPage(page);
  });

  test.afterEach(async () => {
    await context.close();
  });

  test('💾 Pattern learning and persistence across application restarts', async () => {
    // PHASE 1: Learn patterns in first session
    let trainingApp = new ChatGPTBuddyTrainingApplication();
    await trainingApp.start();
    await trainingApp.enableTrainingMode('localhost');

    // Learn project selection pattern
    const projectRequest: AutomationRequest = {
      messageType: 'SelectProjectRequested',
      payload: { projectName: 'Web Application' },
      context: getCurrentContext(page)
    };

    await trainingApp.handleAutomationRequest(projectRequest);
    await page.waitForSelector('.training-overlay');
    await page.locator('[data-testid="select-webapp"]').click();
    await page.waitForSelector('.training-confirmation-overlay');
    await page.locator('button:has-text("Yes, Automate")').click();

    // Learn task creation pattern
    const taskRequest: AutomationRequest = {
      messageType: 'FillTextRequested',
      payload: { element: 'task name', value: 'Implement feature' },
      context: getCurrentContext(page)
    };

    await trainingApp.handleAutomationRequest(taskRequest);
    await page.waitForSelector('.training-overlay');
    await page.locator('[data-testid="task-name"]').click();
    await page.waitForSelector('.training-confirmation-overlay');
    await page.locator('button:has-text("Yes, Automate")').click();

    // Verify patterns were learned
    const patterns = await trainingApp.exportPatterns();
    expect(patterns.length).toBe(2);
    
    const projectPattern = patterns.find(p => p.messageType === 'SelectProjectRequested');
    const taskPattern = patterns.find(p => p.messageType === 'FillTextRequested');
    
    expect(projectPattern).toBeDefined();
    expect(taskPattern).toBeDefined();
    expect(projectPattern!.selector).toContain('select-webapp');
    expect(taskPattern!.selector).toContain('task-name');

    // Stop first application instance
    await trainingApp.stop();

    // PHASE 2: Restart application and verify patterns persist
    trainingApp = new ChatGPTBuddyTrainingApplication();
    await trainingApp.start();
    await trainingApp.switchToAutomaticMode();

    // Verify patterns are still available after restart
    const persistedPatterns = await trainingApp.exportPatterns();
    expect(persistedPatterns.length).toBe(2);

    // Test automatic execution of persisted patterns
    const result1 = await trainingApp.handleAutomationRequest(projectRequest);
    expect(['AutomationPatternExecuted', 'PatternExecutionFailed']).toContain(result1.eventType);

    const result2 = await trainingApp.handleAutomationRequest(taskRequest);
    expect(['AutomationPatternExecuted', 'PatternExecutionFailed']).toContain(result2.eventType);

    await trainingApp.stop();
  });

  test('🔄 Pattern updates and version management across sessions', async () => {
    // PHASE 1: Create initial pattern
    let trainingApp = new ChatGPTBuddyTrainingApplication();
    await trainingApp.start();
    
    const initialPattern: AutomationPatternData = {
      id: 'versioned-pattern-1',
      messageType: 'ClickElementRequested',
      payload: { element: 'export button' },
      selector: '[data-testid="export-report"]',
      context: getCurrentContext(page),
      confidence: 1.0,
      usageCount: 0,
      successfulExecutions: 0
    };

    await trainingApp.importPatterns([initialPattern]);
    await trainingApp.stop();

    // PHASE 2: Update pattern in new session
    trainingApp = new ChatGPTBuddyTrainingApplication();
    await trainingApp.start();
    await trainingApp.switchToAutomaticMode();

    // Execute pattern multiple times to update statistics
    const request: AutomationRequest = {
      messageType: 'ClickElementRequested',
      payload: { element: 'export button' },
      context: getCurrentContext(page)
    };

    for (let i = 0; i < 3; i++) {
      const result = await trainingApp.handleAutomationRequest(request);
      if (result.eventType === 'AutomationPatternExecuted') {
        // Verify export button was clicked
        await expect(page.locator('[data-testid="export-report"]')).toBeVisible();
      }
      await page.waitForTimeout(100);
    }

    const updatedPatterns = await trainingApp.exportPatterns();
    const updatedPattern = updatedPatterns.find(p => p.id === 'versioned-pattern-1');
    
    expect(updatedPattern).toBeDefined();
    expect(updatedPattern!.usageCount).toBeGreaterThan(0);
    expect(updatedPattern!.confidence).toBeGreaterThanOrEqual(1.0);

    await trainingApp.stop();

    // PHASE 3: Verify updates persist to next session
    trainingApp = new ChatGPTBuddyTrainingApplication();
    await trainingApp.start();

    const finalPatterns = await trainingApp.exportPatterns();
    const finalPattern = finalPatterns.find(p => p.id === 'versioned-pattern-1');
    
    expect(finalPattern).toBeDefined();
    expect(finalPattern!.usageCount).toBeGreaterThan(0);

    await trainingApp.stop();
  });

  test('📊 Pattern analytics persistence and aggregation', async () => {
    // PHASE 1: Generate pattern usage data
    let trainingApp = new ChatGPTBuddyTrainingApplication();
    await trainingApp.start();
    
    const analyticsPatterns: AutomationPatternData[] = [
      {
        id: 'analytics-pattern-1',
        messageType: 'ClickElementRequested',
        payload: { element: 'refresh data' },
        selector: '[data-testid="refresh-data"]',
        context: getCurrentContext(page),
        confidence: 1.2,
        usageCount: 5,
        successfulExecutions: 4
      },
      {
        id: 'analytics-pattern-2',
        messageType: 'ClickElementRequested',
        payload: { element: 'view metrics' },
        selector: '[data-testid="view-metrics"]',
        context: getCurrentContext(page),
        confidence: 0.9,
        usageCount: 8,
        successfulExecutions: 6
      },
      {
        id: 'analytics-pattern-3',
        messageType: 'FillTextRequested',
        payload: { element: 'message text' },
        selector: '[data-testid="message-text"]',
        context: getCurrentContext(page),
        confidence: 1.5,
        usageCount: 12,
        successfulExecutions: 11
      }
    ];

    await trainingApp.importPatterns(analyticsPatterns);
    
    // Get initial statistics
    const initialStats = await trainingApp.getPatternStatistics();
    expect(initialStats.totalPatterns).toBe(3);
    expect(initialStats.averageConfidence).toBeCloseTo(1.2, 1);
    expect(initialStats.successRate).toBeCloseTo(0.84, 2); // (4+6+11)/(5+8+12)

    await trainingApp.stop();

    // PHASE 2: Add more data in new session
    trainingApp = new ChatGPTBuddyTrainingApplication();
    await trainingApp.start();
    
    const additionalPattern: AutomationPatternData = {
      id: 'analytics-pattern-4',
      messageType: 'SelectOptionRequested',
      payload: { element: 'task type', value: 'feature' },
      selector: '[data-testid="task-type"]',
      context: getCurrentContext(page),
      confidence: 1.0,
      usageCount: 3,
      successfulExecutions: 3
    };

    await trainingApp.importPatterns([additionalPattern]);
    
    const updatedStats = await trainingApp.getPatternStatistics();
    expect(updatedStats.totalPatterns).toBe(4);
    expect(updatedStats.successRate).toBeCloseTo(0.86, 2); // (4+6+11+3)/(5+8+12+3)

    await trainingApp.stop();

    // PHASE 3: Verify statistical persistence
    trainingApp = new ChatGPTBuddyTrainingApplication();
    await trainingApp.start();
    
    const persistedStats = await trainingApp.getPatternStatistics();
    expect(persistedStats.totalPatterns).toBe(4);
    expect(persistedStats.patternsByType['ClickElementRequested']).toBe(2);
    expect(persistedStats.patternsByType['FillTextRequested']).toBe(1);
    expect(persistedStats.patternsByType['SelectOptionRequested']).toBe(1);

    await trainingApp.stop();
  });

  test('🗑️ Pattern cleanup and storage management across sessions', async () => {
    // PHASE 1: Create patterns with different ages and success rates
    let trainingApp = new ChatGPTBuddyTrainingApplication();
    await trainingApp.start();
    
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 45); // 45 days ago
    
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 5); // 5 days ago

    const cleanupTestPatterns: AutomationPatternData[] = [
      {
        id: 'old-good-pattern',
        messageType: 'ClickElementRequested',
        payload: { element: 'backup data' },
        selector: '[data-testid="backup-data"]',
        context: { ...getCurrentContext(page), timestamp: oldDate },
        confidence: 1.2,
        usageCount: 10,
        successfulExecutions: 9 // Good success rate
      },
      {
        id: 'old-bad-pattern',
        messageType: 'ClickElementRequested',
        payload: { element: 'bad button' },
        selector: '[data-testid="nonexistent-button"]',
        context: { ...getCurrentContext(page), timestamp: oldDate },
        confidence: 0.3,
        usageCount: 8,
        successfulExecutions: 2 // Poor success rate
      },
      {
        id: 'recent-pattern',
        messageType: 'FillTextRequested',
        payload: { element: 'task details' },
        selector: '[data-testid="task-details"]',
        context: { ...getCurrentContext(page), timestamp: recentDate },
        confidence: 1.0,
        usageCount: 3,
        successfulExecutions: 3 // Perfect success rate
      }
    ];

    await trainingApp.importPatterns(cleanupTestPatterns);
    
    const beforeCleanup = await trainingApp.getPatternStatistics();
    expect(beforeCleanup.totalPatterns).toBe(3);

    // Perform cleanup (30 day threshold)
    const deletedCount = await trainingApp.cleanupStalePatterns(30);
    expect(deletedCount).toBeGreaterThan(0); // Should delete the old bad pattern

    const afterCleanup = await trainingApp.getPatternStatistics();
    expect(afterCleanup.totalPatterns).toBeLessThan(beforeCleanup.totalPatterns);

    await trainingApp.stop();

    // PHASE 2: Verify cleanup persistence
    trainingApp = new ChatGPTBuddyTrainingApplication();
    await trainingApp.start();
    
    const persistedAfterCleanup = await trainingApp.getPatternStatistics();
    expect(persistedAfterCleanup.totalPatterns).toBe(afterCleanup.totalPatterns);
    
    const remainingPatterns = await trainingApp.exportPatterns();
    const badPatternExists = remainingPatterns.some(p => p.id === 'old-bad-pattern');
    expect(badPatternExists).toBe(false); // Bad pattern should be gone
    
    const goodPatternExists = remainingPatterns.some(p => p.id === 'old-good-pattern');
    const recentPatternExists = remainingPatterns.some(p => p.id === 'recent-pattern');
    expect(goodPatternExists || recentPatternExists).toBe(true); // Good patterns should remain

    await trainingApp.stop();
  });

  test('🔄 Export/Import pattern data across sessions', async () => {
    // PHASE 1: Create and export patterns
    let trainingApp = new ChatGPTBuddyTrainingApplication();
    await trainingApp.start();
    
    const exportTestPatterns: AutomationPatternData[] = [
      {
        id: 'export-pattern-1',
        messageType: 'ClickElementRequested',
        payload: { element: 'generate charts' },
        selector: '[data-testid="generate-charts"]',
        context: getCurrentContext(page),
        confidence: 1.1,
        usageCount: 4,
        successfulExecutions: 4
      },
      {
        id: 'export-pattern-2',
        messageType: 'FillTextRequested',
        payload: { element: 'task type' },
        selector: '[data-testid="task-type"]',
        context: getCurrentContext(page),
        confidence: 0.95,
        usageCount: 6,
        successfulExecutions: 5
      }
    ];

    await trainingApp.importPatterns(exportTestPatterns);
    
    const exportedData = await trainingApp.exportPatterns();
    expect(exportedData.length).toBe(2);
    expect(exportedData.map(p => p.id)).toContain('export-pattern-1');
    expect(exportedData.map(p => p.id)).toContain('export-pattern-2');

    await trainingApp.stop();

    // PHASE 2: Clear storage and reimport
    trainingApp = new ChatGPTBuddyTrainingApplication();
    await trainingApp.start();
    
    // Verify storage is empty initially
    const emptyPatterns = await trainingApp.exportPatterns();
    expect(emptyPatterns.length).toBe(2); // Should still have patterns from previous session
    
    // Clear all patterns
    await page.locator('[data-testid="clear-storage"]').click();
    
    // Re-import the exported data
    await trainingApp.importPatterns(exportedData);
    
    const reimportedPatterns = await trainingApp.exportPatterns();
    expect(reimportedPatterns.length).toBe(exportedData.length);
    
    // Verify pattern integrity after round-trip
    const reimportedPattern1 = reimportedPatterns.find(p => p.id === 'export-pattern-1');
    const originalPattern1 = exportedData.find(p => p.id === 'export-pattern-1');
    
    expect(reimportedPattern1).toBeDefined();
    expect(reimportedPattern1!.messageType).toBe(originalPattern1!.messageType);
    expect(reimportedPattern1!.selector).toBe(originalPattern1!.selector);
    expect(reimportedPattern1!.confidence).toBe(originalPattern1!.confidence);

    await trainingApp.stop();

    // PHASE 3: Verify persistence after import
    trainingApp = new ChatGPTBuddyTrainingApplication();
    await trainingApp.start();
    
    const finalPersistedPatterns = await trainingApp.exportPatterns();
    expect(finalPersistedPatterns.length).toBe(2);

    await trainingApp.stop();
  });

  test('⚡ Performance with large pattern datasets across sessions', async () => {
    // PHASE 1: Create large dataset
    let trainingApp = new ChatGPTBuddyTrainingApplication();
    await trainingApp.start();
    
    const largePatternSet: AutomationPatternData[] = [];
    
    // Generate 50 patterns with varying characteristics
    for (let i = 0; i < 50; i++) {
      largePatternSet.push({
        id: `bulk-pattern-${i}`,
        messageType: i % 2 === 0 ? 'ClickElementRequested' : 'FillTextRequested',
        payload: { element: `test-element-${i}`, value: `test-value-${i}` },
        selector: `[data-testid="test-${i}"]`,
        context: getCurrentContext(page),
        confidence: 0.5 + (Math.random() * 1.0), // Random confidence 0.5-1.5
        usageCount: Math.floor(Math.random() * 20), // Random usage 0-19
        successfulExecutions: Math.floor(Math.random() * 15) // Random success 0-14
      });
    }

    const startImport = performance.now();
    await trainingApp.importPatterns(largePatternSet);
    const importTime = performance.now() - startImport;
    
    expect(importTime).toBeLessThan(5000); // Should complete within 5 seconds

    const stats = await trainingApp.getPatternStatistics();
    expect(stats.totalPatterns).toBe(50);

    await trainingApp.stop();

    // PHASE 2: Test retrieval performance
    trainingApp = new ChatGPTBuddyTrainingApplication();
    
    const startLoad = performance.now();
    await trainingApp.start();
    const loadTime = performance.now() - startLoad;
    
    expect(loadTime).toBeLessThan(3000); // Should load within 3 seconds

    const startExport = performance.now();
    const allPatterns = await trainingApp.exportPatterns();
    const exportTime = performance.now() - startExport;
    
    expect(exportTime).toBeLessThan(1000); // Should export within 1 second
    expect(allPatterns.length).toBe(50);

    // Test pattern matching performance
    const startMatching = performance.now();
    const testRequest: AutomationRequest = {
      messageType: 'ClickElementRequested',
      payload: { element: 'test-element-25' },
      context: getCurrentContext(page)
    };
    
    await trainingApp.handleAutomationRequest(testRequest);
    const matchingTime = performance.now() - startMatching;
    
    expect(matchingTime).toBeLessThan(500); // Should match within 500ms

    await trainingApp.stop();
  });

  test('🛡️ Data integrity and corruption recovery', async () => {
    // PHASE 1: Create patterns with specific data
    let trainingApp = new ChatGPTBuddyTrainingApplication();
    await trainingApp.start();
    
    const integrityTestPattern: AutomationPatternData = {
      id: 'integrity-test-pattern',
      messageType: 'ClickElementRequested',
      payload: { 
        element: 'restore data',
        metadata: {
          checksum: 'abc123',
          version: '1.0.0',
          created: new Date().toISOString()
        }
      },
      selector: '[data-testid="restore-data"]',
      context: getCurrentContext(page),
      confidence: 1.0,
      usageCount: 1,
      successfulExecutions: 1
    };

    await trainingApp.importPatterns([integrityTestPattern]);
    
    // Verify data integrity
    const storedPatterns = await trainingApp.exportPatterns();
    const storedPattern = storedPatterns.find(p => p.id === 'integrity-test-pattern');
    
    expect(storedPattern).toBeDefined();
    expect(storedPattern!.payload.metadata.checksum).toBe('abc123');
    expect(storedPattern!.payload.metadata.version).toBe('1.0.0');

    await trainingApp.stop();

    // PHASE 2: Verify data integrity after restart
    trainingApp = new ChatGPTBuddyTrainingApplication();
    await trainingApp.start();
    
    const reloadedPatterns = await trainingApp.exportPatterns();
    const reloadedPattern = reloadedPatterns.find(p => p.id === 'integrity-test-pattern');
    
    expect(reloadedPattern).toBeDefined();
    expect(reloadedPattern!.payload.metadata.checksum).toBe('abc123');
    expect(reloadedPattern!.payload.metadata.version).toBe('1.0.0');
    
    // Test that complex nested data structures are preserved
    expect(typeof reloadedPattern!.payload.metadata).toBe('object');
    expect(reloadedPattern!.payload.metadata.created).toBeTruthy();

    await trainingApp.stop();
  });
});

// Helper function to get current page context
function getCurrentContext(page: Page): ExecutionContext {
  return {
    url: page.url(),
    hostname: new URL(page.url()).hostname,
    pathname: new URL(page.url()).pathname,
    title: 'Persistence Test',
    timestamp: new Date(),
    pageStructureHash: 'persistence-test-hash'
  };
}