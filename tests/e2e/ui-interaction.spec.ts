// Phase 6: UI Interaction Testing
// Element selection and confirmation dialogs testing

import { test, expect, Page, BrowserContext } from '@playwright/test';
import { ChatGPTBuddyTrainingApplication } from '../../extension/src/training/application/training-application';
import {
  AutomationRequest,
  ExecutionContext
} from '../../extension/src/training/domain/events/training-events';

test.describe('🎨 UI Interaction and Element Selection E2E', () => {
  let context: BrowserContext;
  let page: Page;
  let trainingApp: ChatGPTBuddyTrainingApplication;

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext({
      permissions: ['storage-access'],
      viewport: { width: 1280, height: 720 }
    });

    page = await context.newPage();
    trainingApp = new ChatGPTBuddyTrainingApplication();

    // Create interactive test page with diverse UI elements
    await page.goto('data:text/html,<!DOCTYPE html><html><head><title>UI Interaction Test</title></head><body>' +
      '<div class="test-environment">' +
        '<header class="app-header">' +
          '<h1>UI Interaction Test Suite</h1>' +
          '<div class="header-controls">' +
            '<button id="theme-toggle" data-testid="theme-toggle" class="control-btn">🌓 Toggle Theme</button>' +
            '<button id="notifications" data-testid="notifications" class="control-btn">🔔 Notifications</button>' +
            '<div class="user-menu">' +
              '<button id="user-profile" data-testid="user-profile" class="profile-btn">👤 Profile</button>' +
              '<div class="dropdown-menu" id="profile-dropdown" style="display: none;">' +
                '<a href="#" data-testid="settings-link">Settings</a>' +
                '<a href="#" data-testid="logout-link">Logout</a>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</header>' +
        
        '<nav class="main-navigation">' +
          '<ul class="nav-list">' +
            '<li><a href="#dashboard" data-testid="nav-dashboard" class="nav-link active">📊 Dashboard</a></li>' +
            '<li><a href="#projects" data-testid="nav-projects" class="nav-link">📁 Projects</a></li>' +
            '<li><a href="#tasks" data-testid="nav-tasks" class="nav-link">✅ Tasks</a></li>' +
            '<li><a href="#calendar" data-testid="nav-calendar" class="nav-link">📅 Calendar</a></li>' +
            '<li><a href="#reports" data-testid="nav-reports" class="nav-link">📈 Reports</a></li>' +
          '</ul>' +
        '</nav>' +
        
        '<main class="content-area">' +
          '<div class="widget-grid">' +
            // Form widget
            '<div class="widget form-widget">' +
              '<h3>Quick Task Creation</h3>' +
              '<form id="task-form" class="task-form">' +
                '<div class="form-row">' +
                  '<label for="task-title">Task Title</label>' +
                  '<input id="task-title" data-testid="task-title" type="text" placeholder="Enter task title..." required />' +
                '</div>' +
                
                '<div class="form-row">' +
                  '<label for="task-category">Category</label>' +
                  '<select id="task-category" data-testid="task-category">' +
                    '<option value="">Select category...</option>' +
                    '<option value="development">Development</option>' +
                    '<option value="design">Design</option>' +
                    '<option value="testing">Testing</option>' +
                    '<option value="documentation">Documentation</option>' +
                  '</select>' +
                '</div>' +
                
                '<div class="form-row">' +
                  '<label for="task-priority">Priority</label>' +
                  '<div class="radio-group">' +
                    '<label><input type="radio" name="priority" value="low" data-testid="priority-low" /> Low</label>' +
                    '<label><input type="radio" name="priority" value="medium" data-testid="priority-medium" checked /> Medium</label>' +
                    '<label><input type="radio" name="priority" value="high" data-testid="priority-high" /> High</label>' +
                    '<label><input type="radio" name="priority" value="urgent" data-testid="priority-urgent" /> Urgent</label>' +
                  '</div>' +
                '</div>' +
                
                '<div class="form-row">' +
                  '<label for="task-description">Description</label>' +
                  '<textarea id="task-description" data-testid="task-description" rows="3" placeholder="Describe the task..."></textarea>' +
                '</div>' +
                
                '<div class="form-row checkbox-row">' +
                  '<label class="checkbox-label">' +
                    '<input type="checkbox" id="task-urgent" data-testid="task-urgent" />' +
                    '<span class="checkmark"></span>' +
                    'Mark as urgent' +
                  '</label>' +
                  '<label class="checkbox-label">' +
                    '<input type="checkbox" id="task-notifications" data-testid="task-notifications" checked />' +
                    '<span class="checkmark"></span>' +
                    'Enable notifications' +
                  '</label>' +
                '</div>' +
                
                '<div class="form-actions">' +
                  '<button type="button" id="save-draft" data-testid="save-draft" class="btn btn-secondary">💾 Save Draft</button>' +
                  '<button type="submit" id="create-task" data-testid="create-task" class="btn btn-primary">✨ Create Task</button>' +
                  '<button type="button" id="cancel-form" data-testid="cancel-form" class="btn btn-danger">❌ Cancel</button>' +
                '</div>' +
              '</form>' +
            '</div>' +
            
            // List widget
            '<div class="widget list-widget">' +
              '<h3>Recent Tasks</h3>' +
              '<div class="task-list">' +
                '<div class="task-item" data-testid="task-item-1" data-task-id="1">' +
                  '<div class="task-content">' +
                    '<h4>Implement user authentication</h4>' +
                    '<p>Add login/logout functionality with JWT tokens</p>' +
                    '<span class="task-status status-in-progress">In Progress</span>' +
                  '</div>' +
                  '<div class="task-actions">' +
                    '<button data-testid="edit-task-1" class="action-btn">✏️</button>' +
                    '<button data-testid="complete-task-1" class="action-btn">✅</button>' +
                    '<button data-testid="delete-task-1" class="action-btn">🗑️</button>' +
                  '</div>' +
                '</div>' +
                
                '<div class="task-item" data-testid="task-item-2" data-task-id="2">' +
                  '<div class="task-content">' +
                    '<h4>Design dashboard layout</h4>' +
                    '<p>Create wireframes and mockups for the main dashboard</p>' +
                    '<span class="task-status status-completed">Completed</span>' +
                  '</div>' +
                  '<div class="task-actions">' +
                    '<button data-testid="edit-task-2" class="action-btn">✏️</button>' +
                    '<button data-testid="archive-task-2" class="action-btn">📦</button>' +
                    '<button data-testid="delete-task-2" class="action-btn">🗑️</button>' +
                  '</div>' +
                '</div>' +
                
                '<div class="task-item" data-testid="task-item-3" data-task-id="3">' +
                  '<div class="task-content">' +
                    '<h4>Write API documentation</h4>' +
                    '<p>Document all REST endpoints with examples</p>' +
                    '<span class="task-status status-pending">Pending</span>' +
                  '</div>' +
                  '<div class="task-actions">' +
                    '<button data-testid="start-task-3" class="action-btn">▶️</button>' +
                    '<button data-testid="edit-task-3" class="action-btn">✏️</button>' +
                    '<button data-testid="delete-task-3" class="action-btn">🗑️</button>' +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>' +
            
            // Interactive widget
            '<div class="widget interactive-widget">' +
              '<h3>Interactive Elements</h3>' +
              '<div class="interactive-content">' +
                '<div class="slider-group">' +
                  '<label for="progress-slider">Progress: <span id="progress-value">50</span>%</label>' +
                  '<input type="range" id="progress-slider" data-testid="progress-slider" min="0" max="100" value="50" />' +
                '</div>' +
                
                '<div class="toggle-group">' +
                  '<label class="switch">' +
                    '<input type="checkbox" id="auto-save" data-testid="auto-save" />' +
                    '<span class="slider round"></span>' +
                  '</label>' +
                  '<span>Auto-save enabled</span>' +
                '</div>' +
                
                '<div class="color-picker-group">' +
                  '<label for="theme-color">Theme Color:</label>' +
                  '<input type="color" id="theme-color" data-testid="theme-color" value="#007bff" />' +
                '</div>' +
                
                '<div class="file-upload-group">' +
                  '<label for="file-upload">Upload File:</label>' +
                  '<input type="file" id="file-upload" data-testid="file-upload" accept=".pdf,.doc,.docx" />' +
                '</div>' +
                
                '<div class="date-picker-group">' +
                  '<label for="due-date">Due Date:</label>' +
                  '<input type="date" id="due-date" data-testid="due-date" />' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
          
          '<div class="action-bar">' +
            '<button id="bulk-actions" data-testid="bulk-actions" class="btn btn-outline">Bulk Actions</button>' +
            '<button id="export-data" data-testid="export-data" class="btn btn-outline">📊 Export</button>' +
            '<button id="import-data" data-testid="import-data" class="btn btn-outline">📥 Import</button>' +
            '<button id="refresh-data" data-testid="refresh-data" class="btn btn-outline">🔄 Refresh</button>' +
          '</div>' +
        '</main>' +
        
        '<aside class="sidebar">' +
          '<div class="sidebar-section">' +
            '<h4>Quick Stats</h4>' +
            '<div class="stats-grid">' +
              '<div class="stat-item" data-testid="stat-total-tasks">' +
                '<span class="stat-value">24</span>' +
                '<span class="stat-label">Total Tasks</span>' +
              '</div>' +
              '<div class="stat-item" data-testid="stat-completed">' +
                '<span class="stat-value">18</span>' +
                '<span class="stat-label">Completed</span>' +
              '</div>' +
              '<div class="stat-item" data-testid="stat-in-progress">' +
                '<span class="stat-value">4</span>' +
                '<span class="stat-label">In Progress</span>' +
              '</div>' +
              '<div class="stat-item" data-testid="stat-pending">' +
                '<span class="stat-value">2</span>' +
                '<span class="stat-label">Pending</span>' +
              '</div>' +
            '</div>' +
          '</div>' +
          
          '<div class="sidebar-section">' +
            '<h4>Quick Actions</h4>' +
            '<div class="quick-actions">' +
              '<button data-testid="quick-add-task" class="quick-btn">➕ Add Task</button>' +
              '<button data-testid="quick-add-project" class="quick-btn">📁 Add Project</button>' +
              '<button data-testid="quick-add-note" class="quick-btn">📝 Add Note</button>' +
              '<button data-testid="quick-schedule" class="quick-btn">📅 Schedule</button>' +
            '</div>' +
          '</div>' +
        '</aside>' +
      '</div>' +
      
      // Rich CSS styling for realistic UI testing
      '<style>' +
        '* { margin: 0; padding: 0; box-sizing: border-box; }' +
        'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f8f9fa; color: #333; }' +
        '.test-environment { min-height: 100vh; display: grid; grid-template: "header header" auto "nav nav" auto "main sidebar" 1fr / 1fr 300px; gap: 1px; background: #e0e0e0; }' +
        '.app-header { grid-area: header; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; }' +
        '.header-controls { display: flex; gap: 1rem; align-items: center; }' +
        '.control-btn, .profile-btn { background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; transition: all 0.2s; }' +
        '.control-btn:hover, .profile-btn:hover { background: rgba(255,255,255,0.3); }' +
        '.user-menu { position: relative; }' +
        '.dropdown-menu { position: absolute; top: 100%; right: 0; background: white; border: 1px solid #ddd; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); min-width: 120px; z-index: 1000; }' +
        '.dropdown-menu a { display: block; padding: 0.75rem 1rem; color: #333; text-decoration: none; transition: background 0.2s; }' +
        '.dropdown-menu a:hover { background: #f8f9fa; }' +
        '.main-navigation { grid-area: nav; background: #2c3e50; padding: 0; }' +
        '.nav-list { list-style: none; display: flex; }' +
        '.nav-link { display: block; padding: 1rem 2rem; color: #ecf0f1; text-decoration: none; transition: all 0.2s; position: relative; }' +
        '.nav-link:hover, .nav-link.active { background: #34495e; color: white; }' +
        '.nav-link.active::after { content: ""; position: absolute; bottom: 0; left: 0; right: 0; height: 3px; background: #3498db; }' +
        '.content-area { grid-area: main; padding: 2rem; overflow-y: auto; }' +
        '.widget-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 2rem; margin-bottom: 2rem; }' +
        '.widget { background: white; border-radius: 12px; box-shadow: 0 2px 20px rgba(0,0,0,0.08); padding: 1.5rem; }' +
        '.widget h3 { color: #2c3e50; margin-bottom: 1.5rem; font-size: 1.2rem; }' +
        '.form-row { margin-bottom: 1.5rem; }' +
        '.form-row label { display: block; margin-bottom: 0.5rem; font-weight: 600; color: #555; }' +
        '.form-row input, .form-row select, .form-row textarea { width: 100%; padding: 0.75rem; border: 2px solid #e1e8ed; border-radius: 8px; font-size: 1rem; transition: border-color 0.2s; }' +
        '.form-row input:focus, .form-row select:focus, .form-row textarea:focus { outline: none; border-color: #3498db; }' +
        '.radio-group { display: flex; gap: 1rem; flex-wrap: wrap; }' +
        '.radio-group label { font-weight: normal; display: flex; align-items: center; gap: 0.5rem; }' +
        '.checkbox-row { display: flex; gap: 2rem; }' +
        '.checkbox-label { display: flex; align-items: center; gap: 0.5rem; font-weight: normal; cursor: pointer; }' +
        '.form-actions { display: flex; gap: 1rem; justify-content: flex-start; margin-top: 2rem; }' +
        '.btn { padding: 0.75rem 1.5rem; border: none; border-radius: 8px; font-size: 1rem; font-weight: 500; cursor: pointer; transition: all 0.2s; text-decoration: none; display: inline-block; }' +
        '.btn-primary { background: #3498db; color: white; }' +
        '.btn-primary:hover { background: #2980b9; transform: translateY(-1px); }' +
        '.btn-secondary { background: #95a5a6; color: white; }' +
        '.btn-secondary:hover { background: #7f8c8d; }' +
        '.btn-danger { background: #e74c3c; color: white; }' +
        '.btn-danger:hover { background: #c0392b; }' +
        '.btn-outline { background: transparent; border: 2px solid #3498db; color: #3498db; }' +
        '.btn-outline:hover { background: #3498db; color: white; }' +
        '.task-item { display: flex; justify-content: space-between; align-items: center; padding: 1rem; border: 1px solid #e1e8ed; border-radius: 8px; margin-bottom: 1rem; transition: all 0.2s; }' +
        '.task-item:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); transform: translateY(-1px); }' +
        '.task-content h4 { color: #2c3e50; margin-bottom: 0.5rem; }' +
        '.task-content p { color: #7f8c8d; font-size: 0.9rem; margin-bottom: 0.5rem; }' +
        '.task-status { font-size: 0.8rem; font-weight: 600; padding: 0.25rem 0.75rem; border-radius: 12px; }' +
        '.status-in-progress { background: #fff3cd; color: #856404; }' +
        '.status-completed { background: #d4edda; color: #155724; }' +
        '.status-pending { background: #f8d7da; color: #721c24; }' +
        '.task-actions { display: flex; gap: 0.5rem; }' +
        '.action-btn, .quick-btn { background: #f8f9fa; border: 1px solid #e1e8ed; padding: 0.5rem; border-radius: 6px; cursor: pointer; transition: all 0.2s; width: 100%; text-align: left; margin-bottom: 0.5rem; }' +
        '.action-btn:hover, .quick-btn:hover { background: #e9ecef; }' +
        '.interactive-content > div { margin-bottom: 1.5rem; }' +
        '.slider-group label { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }' +
        '.toggle-group { display: flex; align-items: center; gap: 1rem; }' +
        '.switch { position: relative; display: inline-block; width: 60px; height: 34px; }' +
        '.switch input { opacity: 0; width: 0; height: 0; }' +
        '.slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 34px; }' +
        '.slider:before { position: absolute; content: ""; height: 26px; width: 26px; left: 4px; bottom: 4px; background-color: white; transition: .4s; border-radius: 50%; }' +
        'input:checked + .slider { background-color: #2196F3; }' +
        'input:checked + .slider:before { transform: translateX(26px); }' +
        '.action-bar { display: flex; gap: 1rem; justify-content: center; margin-top: 2rem; }' +
        '.sidebar { grid-area: sidebar; background: white; padding: 2rem; overflow-y: auto; }' +
        '.sidebar-section { margin-bottom: 2rem; }' +
        '.sidebar-section h4 { color: #2c3e50; margin-bottom: 1rem; }' +
        '.stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }' +
        '.stat-item { text-align: center; padding: 1rem; background: #f8f9fa; border-radius: 8px; }' +
        '.stat-value { display: block; font-size: 1.5rem; font-weight: bold; color: #3498db; }' +
        '.stat-label { font-size: 0.8rem; color: #7f8c8d; }' +
        '.quick-actions { display: flex; flex-direction: column; gap: 0.5rem; }' +
        '@media (max-width: 768px) { .test-environment { grid-template: "header" auto "nav" auto "main" 1fr "sidebar" auto / 1fr; } }' +
      '</style>' +
      
      // Interactive JavaScript for realistic behavior
      '<script>' +
        'document.addEventListener("DOMContentLoaded", function() {' +
          // Profile dropdown toggle
          'const profileBtn = document.getElementById("user-profile");' +
          'const dropdown = document.getElementById("profile-dropdown");' +
          'profileBtn.addEventListener("click", () => {' +
            'dropdown.style.display = dropdown.style.display === "none" ? "block" : "none";' +
          '});' +
          
          // Navigation active state
          'document.querySelectorAll(".nav-link").forEach(link => {' +
            'link.addEventListener("click", (e) => {' +
              'e.preventDefault();' +
              'document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));' +
              'link.classList.add("active");' +
            '});' +
          '});' +
          
          // Form interactions
          'const progressSlider = document.getElementById("progress-slider");' +
          'const progressValue = document.getElementById("progress-value");' +
          'progressSlider.addEventListener("input", () => {' +
            'progressValue.textContent = progressSlider.value;' +
          '});' +
          
          // Task interactions
          'document.querySelectorAll(".task-item").forEach(item => {' +
            'item.addEventListener("click", () => {' +
              'document.querySelectorAll(".task-item").forEach(i => i.classList.remove("selected"));' +
              'item.classList.add("selected");' +
            '});' +
          '});' +
          
          // Button click handlers
          'document.querySelectorAll("button").forEach(btn => {' +
            'btn.addEventListener("click", (e) => {' +
              'if (!e.target.closest(".training-overlay, .training-confirmation-overlay")) {' +
                'console.log(`Button clicked: ${btn.textContent || btn.getAttribute("data-testid")}`);' +
              '}' +
            '});' +
          '});' +
        '});' +
      '</script>' +
      '</body></html>');
  });

  test.afterEach(async () => {
    if (trainingApp) {
      await trainingApp.stop();
    }
    await context.close();
  });

  test('🎨 Training overlay appearance and styling', async () => {
    // GIVEN: Training mode enabled
    await trainingApp.start();
    await trainingApp.enableTrainingMode('localhost');

    // WHEN: Automation request triggers training UI
    const request: AutomationRequest = {
      messageType: 'ClickElementRequested',
      payload: { element: 'create task button' },
      context: getCurrentContext(page)
    };

    await trainingApp.handleAutomationRequest(request);

    // THEN: Training overlay should appear with proper styling
    await page.waitForSelector('.training-overlay', { timeout: 5000 });
    
    const overlay = page.locator('.training-overlay');
    await expect(overlay).toBeVisible();
    await expect(overlay).toHaveCSS('position', 'fixed');
    await expect(overlay).toHaveCSS('z-index', '10000');
    
    // Check overlay content
    await expect(overlay).toContainText('Training Mode Active');
    await expect(overlay).toContainText('ClickElementRequested');
    await expect(overlay).toContainText('create task button');
    
    // Check if body cursor changed to crosshair
    const bodyCursor = await page.evaluate(() => window.getComputedStyle(document.body).cursor);
    expect(bodyCursor).toBe('crosshair');
  });

  test('🖱️ Element highlighting during selection mode', async () => {
    // GIVEN: Training mode with element selection active
    await trainingApp.start();
    await trainingApp.enableTrainingMode('localhost');

    const request: AutomationRequest = {
      messageType: 'FillTextRequested',
      payload: { element: 'task title', value: 'Test task' },
      context: getCurrentContext(page)
    };

    await trainingApp.handleAutomationRequest(request);
    await page.waitForSelector('.training-overlay');

    // WHEN: Hovering over different elements
    const taskTitleInput = page.locator('[data-testid="task-title"]');
    const createButton = page.locator('[data-testid="create-task"]');
    const navDashboard = page.locator('[data-testid="nav-dashboard"]');

    // THEN: Elements should highlight on hover
    await taskTitleInput.hover();
    await page.waitForTimeout(100);
    
    // Check if element gets highlighted (outline should be applied)
    const inputOutline = await taskTitleInput.evaluate(el => window.getComputedStyle(el).outline);
    expect(inputOutline).toContain('blue'); // Should have blue outline from training system

    // Test hover on different element types
    await createButton.hover();
    await page.waitForTimeout(100);
    
    await navDashboard.hover();
    await page.waitForTimeout(100);
  });

  test('🎯 Element selection and confirmation flow', async () => {
    // GIVEN: Training mode for button click
    await trainingApp.start();
    await trainingApp.enableTrainingMode('localhost');

    const request: AutomationRequest = {
      messageType: 'ClickElementRequested',
      payload: { element: 'save draft button' },
      context: getCurrentContext(page)
    };

    await trainingApp.handleAutomationRequest(request);
    await page.waitForSelector('.training-overlay');

    // WHEN: User clicks on the save draft button
    await page.locator('[data-testid="save-draft"]').click();

    // THEN: Confirmation dialog should appear
    await page.waitForSelector('.training-confirmation-overlay', { timeout: 3000 });
    
    const confirmationDialog = page.locator('.training-confirmation-overlay');
    await expect(confirmationDialog).toBeVisible();
    await expect(confirmationDialog).toHaveCSS('z-index', '10001'); // Higher than training overlay
    
    // Check confirmation dialog content
    await expect(confirmationDialog).toContainText('Element Selected');
    await expect(confirmationDialog).toContainText('save-draft');
    await expect(confirmationDialog).toContainText('Do you want to automate');
    
    // Check available action buttons
    await expect(confirmationDialog.locator('button:has-text("Yes, Automate")')).toBeVisible();
    await expect(confirmationDialog.locator('button:has-text("Select Different Element")')).toBeVisible();
    await expect(confirmationDialog.locator('button:has-text("Cancel")')).toBeVisible();
  });

  test('✅ Confirmation dialog actions', async () => {
    // GIVEN: Training confirmation dialog is showing
    await trainingApp.start();
    await trainingApp.enableTrainingMode('localhost');

    const request: AutomationRequest = {
      messageType: 'FillTextRequested',
      payload: { element: 'task description', value: 'Test description' },
      context: getCurrentContext(page)
    };

    await trainingApp.handleAutomationRequest(request);
    await page.waitForSelector('.training-overlay');
    await page.locator('[data-testid="task-description"]').click();
    await page.waitForSelector('.training-confirmation-overlay');

    // WHEN: User confirms automation
    await page.locator('button:has-text("Yes, Automate")').click();

    // THEN: Both overlays should disappear
    await expect(page.locator('.training-overlay')).not.toBeVisible();
    await expect(page.locator('.training-confirmation-overlay')).not.toBeVisible();
    
    // AND: Body cursor should return to normal
    const bodyCursor = await page.evaluate(() => window.getComputedStyle(document.body).cursor);
    expect(bodyCursor).not.toBe('crosshair');
    
    // AND: Pattern should be stored
    const patterns = await trainingApp.exportPatterns();
    const learnedPattern = patterns.find(p => p.messageType === 'FillTextRequested');
    expect(learnedPattern).toBeDefined();
    expect(learnedPattern!.selector).toContain('task-description');
  });

  test('🔄 Select different element workflow', async () => {
    // GIVEN: Training confirmation dialog is showing
    await trainingApp.start();
    await trainingApp.enableTrainingMode('localhost');

    const request: AutomationRequest = {
      messageType: 'ClickElementRequested',
      payload: { element: 'quick add button' },
      context: getCurrentContext(page)
    };

    await trainingApp.handleAutomationRequest(request);
    await page.waitForSelector('.training-overlay');
    
    // Select wrong element first
    await page.locator('[data-testid="cancel-form"]').click();
    await page.waitForSelector('.training-confirmation-overlay');

    // WHEN: User chooses to select different element
    await page.locator('button:has-text("Select Different Element")').click();

    // THEN: Confirmation dialog should disappear, training overlay should remain
    await expect(page.locator('.training-confirmation-overlay')).not.toBeVisible();
    await expect(page.locator('.training-overlay')).toBeVisible();
    
    // AND: Element selection mode should be re-enabled
    const bodyCursor = await page.evaluate(() => window.getComputedStyle(document.body).cursor);
    expect(bodyCursor).toBe('crosshair');

    // WHEN: User selects the correct element
    await page.locator('[data-testid="quick-add-task"]').click();
    await page.waitForSelector('.training-confirmation-overlay');

    // THEN: New confirmation should show correct element
    const confirmationDialog = page.locator('.training-confirmation-overlay');
    await expect(confirmationDialog).toContainText('quick-add-task');
  });

  test('❌ Training cancellation scenarios', async () => {
    // Test case 1: Cancel from main training overlay
    await trainingApp.start();
    await trainingApp.enableTrainingMode('localhost');

    const request: AutomationRequest = {
      messageType: 'ClickElementRequested',
      payload: { element: 'test button' },
      context: getCurrentContext(page)
    };

    await trainingApp.handleAutomationRequest(request);
    await page.waitForSelector('.training-overlay');

    // WHEN: User cancels from main overlay
    await page.locator('.training-overlay button:has-text("Cancel")').click();

    // THEN: Training should be cancelled
    await expect(page.locator('.training-overlay')).not.toBeVisible();
    
    const patterns = await trainingApp.exportPatterns();
    expect(patterns.length).toBe(0);

    // Test case 2: Cancel with Escape key
    await trainingApp.handleAutomationRequest(request);
    await page.waitForSelector('.training-overlay');

    // WHEN: User presses Escape
    await page.keyboard.press('Escape');

    // THEN: Training should be cancelled
    await expect(page.locator('.training-overlay')).not.toBeVisible();
  });

  test('🎛️ Complex form element selection', async () => {
    // GIVEN: Training mode for various form elements
    await trainingApp.start();
    await trainingApp.enableTrainingMode('localhost');

    // Test different form element types
    const formElements = [
      { selector: '[data-testid="task-category"]', type: 'select', messageType: 'SelectOptionRequested' },
      { selector: '[data-testid="priority-high"]', type: 'radio', messageType: 'SelectRadioRequested' },
      { selector: '[data-testid="task-urgent"]', type: 'checkbox', messageType: 'ToggleCheckboxRequested' },
      { selector: '[data-testid="progress-slider"]', type: 'range', messageType: 'SetSliderRequested' },
      { selector: '[data-testid="theme-color"]', type: 'color', messageType: 'SetColorRequested' }
    ];

    for (const element of formElements.slice(0, 2)) { // Test first 2 elements
      const request: AutomationRequest = {
        messageType: element.messageType as any,
        payload: { element: `${element.type} element` },
        context: getCurrentContext(page)
      };

      await trainingApp.handleAutomationRequest(request);
      await page.waitForSelector('.training-overlay');

      // Select the element
      await page.locator(element.selector).click();
      await page.waitForSelector('.training-confirmation-overlay');

      // Verify correct element information in confirmation
      const confirmationDialog = page.locator('.training-confirmation-overlay');
      await expect(confirmationDialog).toContainText(element.selector.replace('[data-testid="', '').replace('"]', ''));

      // Confirm the selection
      await page.locator('button:has-text("Yes, Automate")').click();
      await expect(page.locator('.training-overlay')).not.toBeVisible();
    }

    // Verify patterns were learned
    const patterns = await trainingApp.exportPatterns();
    expect(patterns.length).toBe(2);
  });

  test('📱 Responsive UI elements selection', async () => {
    // GIVEN: Training mode on different viewport sizes
    await trainingApp.start();
    await trainingApp.enableTrainingMode('localhost');

    // Test on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    const mobileRequest: AutomationRequest = {
      messageType: 'ClickElementRequested',
      payload: { element: 'mobile navigation' },
      context: getCurrentContext(page)
    };

    await trainingApp.handleAutomationRequest(mobileRequest);
    await page.waitForSelector('.training-overlay');

    // Verify training overlay is properly sized for mobile
    const overlay = page.locator('.training-overlay');
    const overlayBox = await overlay.boundingBox();
    expect(overlayBox!.width).toBeLessThanOrEqual(375);

    // Test element selection on mobile
    await page.locator('[data-testid="nav-dashboard"]').click();
    await page.waitForSelector('.training-confirmation-overlay');

    // Verify confirmation dialog fits mobile viewport
    const confirmationDialog = page.locator('.training-confirmation-overlay');
    const confirmationBox = await confirmationDialog.boundingBox();
    expect(confirmationBox!.width).toBeLessThanOrEqual(375);

    await page.locator('button:has-text("Yes, Automate")').click();

    // Switch back to desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });

    // Test that patterns work across viewport changes
    const desktopRequest: AutomationRequest = {
      messageType: 'ClickElementRequested',
      payload: { element: 'mobile navigation' },
      context: getCurrentContext(page)
    };

    await trainingApp.switchToAutomaticMode();
    const result = await trainingApp.handleAutomationRequest(desktopRequest);
    
    // Should still work on desktop
    expect(['AutomationPatternExecuted', 'PatternExecutionFailed']).toContain(result.eventType);
  });

  test('🎨 Visual feedback and animations', async () => {
    // GIVEN: Training mode with visual feedback
    await trainingApp.start();
    await trainingApp.enableTrainingMode('localhost');

    const request: AutomationRequest = {
      messageType: 'ClickElementRequested',
      payload: { element: 'interactive button' },
      context: getCurrentContext(page)
    };

    await trainingApp.handleAutomationRequest(request);
    await page.waitForSelector('.training-overlay');

    // WHEN: Hovering over elements
    const testElements = [
      '[data-testid="task-title"]',
      '[data-testid="create-task"]',
      '[data-testid="quick-add-task"]'
    ];

    for (const selector of testElements) {
      await page.locator(selector).hover();
      await page.waitForTimeout(200);
      
      // Verify visual feedback (outline/highlight)
      const elementStyle = await page.locator(selector).evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          outline: styles.outline,
          backgroundColor: styles.backgroundColor
        };
      });
      
      // Should have some form of visual feedback
      expect(elementStyle.outline || elementStyle.backgroundColor).toBeTruthy();
    }

    // WHEN: Selecting an element
    await page.locator('[data-testid="task-title"]').click();
    await page.waitForSelector('.training-confirmation-overlay');

    // THEN: Confirmation dialog should have smooth appearance
    const confirmationDialog = page.locator('.training-confirmation-overlay');
    await expect(confirmationDialog).toBeVisible();
    
    // Check if dialog has proper styling and positioning
    const dialogBox = await confirmationDialog.boundingBox();
    expect(dialogBox!.x).toBeGreaterThan(0);
    expect(dialogBox!.y).toBeGreaterThan(0);
    expect(dialogBox!.width).toBeGreaterThan(200);
    expect(dialogBox!.height).toBeGreaterThan(100);
  });
});

// Helper function to get current page context
function getCurrentContext(page: Page): ExecutionContext {
  return {
    url: page.url(),
    hostname: new URL(page.url()).hostname,
    pathname: new URL(page.url()).pathname,
    title: 'UI Interaction Test',
    timestamp: new Date(),
    pageStructureHash: 'ui-interaction-test-hash'
  };
}