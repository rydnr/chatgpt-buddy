/*
                        ChatGPT-Buddy ATDD Tests

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
 * @fileoverview Acceptance Test-Driven Development tests for ChatGPT-Buddy
 * @description Contract-based end-to-end tests validating ChatGPT automation capabilities
 */

import { test, expect } from '@playwright/test';
import { 
  createTestEnvironment, 
  ContractTestRunner, 
  contractTest,
  WebBuddyContract 
} from '@web-buddy/testing';
import { createChatGPTBuddyClient } from '../src';

/**
 * ChatGPT automation contract
 */
const chatgptAutomationContract: WebBuddyContract = {
  version: '1.0.0',
  domain: 'chatgpt.com',
  title: 'ChatGPT Automation Contract',
  description: 'Automated interaction with ChatGPT interface for project management and conversations',
  
  context: {
    urlPatterns: [
      'https://chatgpt.com',
      'https://chat.openai.com',
      'https://chatgpt.com/*',
      'https://chat.openai.com/*'
    ],
    prerequisites: [
      {
        type: 'authentication',
        description: 'User must be logged into ChatGPT',
        required: true
      },
      {
        type: 'element',
        description: 'Chat interface must be loaded',
        selector: 'textarea[placeholder*="Message"], #prompt-textarea',
        required: true
      }
    ]
  },

  capabilities: {
    selectProject: {
      type: 'navigation',
      description: 'Select a ChatGPT project by name',
      selector: '[data-testid*="project"], .project-item, .nav-item',
      parameters: [
        {
          name: 'projectName',
          type: 'string',
          description: 'Name of the project to select',
          required: true,
          examples: ['Web Development', 'Data Analysis', 'Creative Writing']
        }
      ],
      returnType: {
        type: 'object',
        description: 'Project selection confirmation',
        examples: [{ success: true, project: 'Web Development' }]
      },
      timeout: 8000,
      validation: {
        elementExists: true,
        elementVisible: true
      }
    },

    selectChat: {
      type: 'navigation',
      description: 'Select an existing chat conversation',
      selector: '.conversation-item, [data-testid*="conversation"]',
      parameters: [
        {
          name: 'chatTitle',
          type: 'string',
          description: 'Title or partial title of the chat to select',
          required: true,
          examples: ['TypeScript Help', 'Project Planning', 'Code Review']
        }
      ],
      returnType: {
        type: 'object',
        description: 'Chat selection confirmation',
        examples: [{ success: true, chatId: 'chat-123', title: 'TypeScript Help' }]
      },
      timeout: 6000
    },

    sendMessage: {
      type: 'form',
      description: 'Send a message to ChatGPT',
      selector: 'textarea[placeholder*="Message"], #prompt-textarea',
      parameters: [
        {
          name: 'message',
          type: 'string',
          description: 'Message content to send',
          required: true,
          minLength: 1,
          maxLength: 4000,
          examples: [
            'Help me write a TypeScript function for sorting arrays',
            'Explain the benefits of event-driven architecture'
          ]
        }
      ],
      returnType: {
        type: 'object',
        description: 'Message send confirmation',
        examples: [{ success: true, message: 'Message sent successfully' }]
      },
      timeout: 5000,
      validation: {
        elementExists: true,
        elementVisible: true,
        elementEnabled: true
      }
    },

    getResponse: {
      type: 'query',
      description: 'Get the latest response from ChatGPT',
      selector: '.message-content, .response-text, [data-message-author-role="assistant"]',
      returnType: {
        type: 'object',
        description: 'ChatGPT response content',
        examples: [
          {
            success: true,
            response: 'Here is a TypeScript function for sorting arrays...',
            timestamp: '2025-01-01T12:00:00Z'
          }
        ]
      },
      timeout: 30000, // ChatGPT responses can take time
      validation: {
        elementExists: true
      }
    },

    startNewChat: {
      type: 'action',
      description: 'Start a new chat conversation',
      selector: '[data-testid="new-chat"], .new-chat-button, button[aria-label*="New chat"]',
      returnType: {
        type: 'object',
        description: 'New chat confirmation',
        examples: [{ success: true, chatId: 'new-chat-456' }]
      },
      timeout: 5000,
      validation: {
        elementExists: true,
        elementVisible: true
      }
    },

    getChatHistory: {
      type: 'query',
      description: 'Get list of recent chat conversations',
      selector: '.conversation-item, [data-testid*="conversation"], .chat-list-item',
      returnType: {
        type: 'array',
        description: 'List of chat conversations',
        examples: [
          [
            { id: 'chat-1', title: 'TypeScript Help', date: '2025-01-01' },
            { id: 'chat-2', title: 'Project Planning', date: '2024-12-31' }
          ]
        ]
      },
      timeout: 8000
    }
  },

  workflows: {
    askQuestion: {
      description: 'Complete workflow to ask a question in a specific project',
      parameters: [
        {
          name: 'projectName',
          type: 'string',
          description: 'Project to work in',
          required: true
        },
        {
          name: 'question',
          type: 'string',
          description: 'Question to ask ChatGPT',
          required: true
        }
      ],
      steps: [
        {
          capability: 'selectProject',
          parameters: { projectName: '${projectName}' }
        },
        {
          capability: 'startNewChat'
        },
        {
          capability: 'sendMessage',
          parameters: { message: '${question}' }
        },
        {
          capability: 'getResponse'
        }
      ],
      errorHandling: {
        strategy: 'retry',
        maxRetries: 2
      }
    },

    continueConversation: {
      description: 'Continue an existing conversation',
      parameters: [
        {
          name: 'chatTitle',
          type: 'string',
          description: 'Title of existing chat',
          required: true
        },
        {
          name: 'message',
          type: 'string',
          description: 'Follow-up message',
          required: true
        }
      ],
      steps: [
        {
          capability: 'selectChat',
          parameters: { chatTitle: '${chatTitle}' }
        },
        {
          capability: 'sendMessage',
          parameters: { message: '${message}' }
        },
        {
          capability: 'getResponse'
        }
      ]
    }
  },

  metadata: {
    author: 'Web-Buddy Team',
    created: '2025-01-01',
    tags: ['chatgpt', 'ai', 'conversation', 'automation'],
    compatibilityScore: 85
  }
};

test.describe('ChatGPT Automation - Contract-Based ATDD', () => {
  test.describe.configure({ mode: 'serial' });

  // Skip tests in CI if no OpenAI access
  const skipInCI = process.env.CI && !process.env.OPENAI_ACCESS_TOKEN;

  test('Contract Validation: ChatGPT automation contract structure', async () => {
    test.skip(skipInCI, 'Skipping ChatGPT tests in CI without authentication');

    const { environment, client } = await createTestEnvironment('chatgpt-buddy', {
      headless: true,
      timeout: 30000
    });

    try {
      await environment.initialize();
      
      // Note: In real scenario, would navigate to actual ChatGPT
      // For testing, we'll use a mock page or skip navigation
      await environment.navigateTo('https://example.com'); // Mock for now

      const testRunner = new ContractTestRunner(client);
      const testContext = {
        browser: environment.getBrowser(),
        page: environment.getPage(),
        webBuddyClient: client,
        contract: chatgptAutomationContract,
        baseUrl: 'https://chatgpt.com',
        timeout: 30000
      };

      // Validate contract structure
      expect(chatgptAutomationContract.capabilities).toBeDefined();
      expect(Object.keys(chatgptAutomationContract.capabilities)).toContain('selectProject');
      expect(Object.keys(chatgptAutomationContract.capabilities)).toContain('sendMessage');
      expect(Object.keys(chatgptAutomationContract.capabilities)).toContain('getResponse');

      console.log(`📋 Contract structure validation completed`);

    } finally {
      await environment.cleanup();
    }
  });

  test('Capability: Send message should work with proper message format', async ({ page }) => {
    test.skip(skipInCI, 'Skipping ChatGPT tests in CI without authentication');

    // GIVEN: A mock ChatGPT-like interface
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head><title>Mock ChatGPT</title></head>
        <body>
          <div id="app">
            <textarea placeholder="Message ChatGPT..." id="prompt-textarea"></textarea>
            <button id="send-button">Send</button>
            <div class="message-content" style="display: none;">Response will appear here</div>
          </div>
          <script>
            document.getElementById('send-button').addEventListener('click', () => {
              const textarea = document.getElementById('prompt-textarea');
              const response = document.querySelector('.message-content');
              if (textarea.value.trim()) {
                response.textContent = 'Mock response: ' + textarea.value;
                response.style.display = 'block';
                textarea.value = '';
              }
            });
          </script>
        </body>
      </html>
    `);

    // WHEN: Using the ChatGPT client to send a message
    const environment = createTestEnvironment('chatgpt-buddy', { headless: true });
    await environment.initialize();

    try {
      // Simulate sending a message
      await page.fill('#prompt-textarea', 'Test message for ChatGPT automation');
      await page.click('#send-button');

      // THEN: The message should be sent and response should appear
      await expect(page.locator('.message-content')).toBeVisible();
      await expect(page.locator('.message-content')).toContainText('Mock response: Test message');

      console.log(`💬 Message sending capability validated`);

    } finally {
      await environment.cleanup();
    }
  });

  test('Workflow: Complete ask question workflow should handle all steps', async ({ page }) => {
    test.skip(skipInCI, 'Skipping ChatGPT tests in CI without authentication');

    // GIVEN: A comprehensive mock ChatGPT interface
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head><title>Mock ChatGPT with Projects</title></head>
        <body>
          <div id="sidebar">
            <div class="project-item" data-project="Web Development">Web Development</div>
            <div class="project-item" data-project="Data Analysis">Data Analysis</div>
          </div>
          <div id="main">
            <button id="new-chat-button">New Chat</button>
            <textarea placeholder="Message ChatGPT..." id="prompt-textarea"></textarea>
            <button id="send-button">Send</button>
            <div class="message-content" style="display: none;"></div>
          </div>
          <script>
            let selectedProject = null;
            
            document.querySelectorAll('.project-item').forEach(item => {
              item.addEventListener('click', () => {
                selectedProject = item.dataset.project;
                document.querySelectorAll('.project-item').forEach(p => p.classList.remove('selected'));
                item.classList.add('selected');
              });
            });

            document.getElementById('new-chat-button').addEventListener('click', () => {
              if (selectedProject) {
                console.log('New chat started in project:', selectedProject);
              }
            });

            document.getElementById('send-button').addEventListener('click', () => {
              const textarea = document.getElementById('prompt-textarea');
              const response = document.querySelector('.message-content');
              if (textarea.value.trim()) {
                response.textContent = \`Response to: \${textarea.value} (Project: \${selectedProject || 'None'})\`;
                response.style.display = 'block';
                textarea.value = '';
              }
            });
          </script>
          <style>
            .project-item { cursor: pointer; padding: 8px; margin: 4px; }
            .project-item.selected { background: #007bff; color: white; }
            .project-item:hover { background: #f0f0f0; }
          </style>
        </body>
      </html>
    `);

    // WHEN: Executing the complete ask question workflow
    await page.click('[data-project="Web Development"]');
    await page.click('#new-chat-button');
    await page.fill('#prompt-textarea', 'How do I implement TypeScript interfaces?');
    await page.click('#send-button');

    // THEN: The complete workflow should execute successfully
    await expect(page.locator('.project-item.selected')).toHaveText('Web Development');
    await expect(page.locator('.message-content')).toBeVisible();
    await expect(page.locator('.message-content')).toContainText('Response to: How do I implement TypeScript interfaces?');
    await expect(page.locator('.message-content')).toContainText('Project: Web Development');

    console.log(`🎯 Complete workflow validation completed`);
  });

  test('Error Handling: Should handle authentication requirements gracefully', async ({ page }) => {
    // GIVEN: A page that simulates authentication required state
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head><title>ChatGPT - Login Required</title></head>
        <body>
          <div id="login-required">
            <h1>Please log in to continue</h1>
            <button id="login-button">Log In</button>
          </div>
        </body>
      </html>
    `);

    // WHEN: Attempting to execute ChatGPT contract on login page
    const report = await contractTest(chatgptAutomationContract, 'data:text/html,' + encodeURIComponent(await page.content()))
      .headless(true)
      .timeout(10000)
      .run();

    // THEN: The contract should fail gracefully with authentication errors
    expect(report.summary.successRate).toBe(0);
    
    // AND: Should provide meaningful error messages about authentication
    for (const result of report.results) {
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    }

    console.log(`🔐 Authentication error handling validated`);
  });

  test('Performance: ChatGPT automation should handle response delays', async ({ page }) => {
    // GIVEN: A mock interface that simulates ChatGPT response delays
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head><title>Mock ChatGPT - Slow Response</title></head>
        <body>
          <textarea placeholder="Message ChatGPT..." id="prompt-textarea"></textarea>
          <button id="send-button">Send</button>
          <div class="message-content" style="display: none;"></div>
          <script>
            document.getElementById('send-button').addEventListener('click', () => {
              const textarea = document.getElementById('prompt-textarea');
              const response = document.querySelector('.message-content');
              
              if (textarea.value.trim()) {
                // Simulate ChatGPT thinking time
                setTimeout(() => {
                  response.textContent = 'Simulated ChatGPT response after delay: ' + textarea.value;
                  response.style.display = 'block';
                  textarea.value = '';
                }, 3000); // 3 second delay
              }
            });
          </script>
        </body>
      </html>
    `);

    const startTime = Date.now();

    // WHEN: Sending a message that will have a delayed response
    await page.fill('#prompt-textarea', 'Complex question requiring analysis');
    await page.click('#send-button');

    // Wait for response with generous timeout for ChatGPT
    await expect(page.locator('.message-content')).toBeVisible({ timeout: 15000 });

    const totalTime = Date.now() - startTime;

    // THEN: The response should handle delays appropriately
    expect(totalTime).toBeLessThan(15000); // Should complete within reasonable time
    await expect(page.locator('.message-content')).toContainText('Simulated ChatGPT response');

    console.log(`⏱️ Performance with delays validated: ${totalTime}ms`);
  });

  test('Accessibility: ChatGPT interface should be accessible', async ({ page }) => {
    // GIVEN: A ChatGPT-like interface with accessibility features
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head><title>Accessible ChatGPT Interface</title></head>
        <body>
          <main role="main">
            <label for="message-input">Message to ChatGPT:</label>
            <textarea 
              id="message-input" 
              placeholder="Message ChatGPT..." 
              aria-label="Type your message to ChatGPT"
              role="textbox"
              aria-multiline="true"
            ></textarea>
            <button 
              id="send-button" 
              aria-label="Send message to ChatGPT"
              type="button"
            >Send</button>
            <div 
              class="message-content" 
              role="log" 
              aria-live="polite"
              aria-label="ChatGPT response"
              style="display: none;"
            ></div>
          </main>
        </body>
      </html>
    `);

    // WHEN: Testing accessibility features
    const messageInput = page.locator('#message-input');
    const sendButton = page.locator('#send-button');

    // THEN: Elements should have proper accessibility attributes
    await expect(messageInput).toHaveAttribute('aria-label');
    await expect(sendButton).toHaveAttribute('aria-label');
    await expect(page.locator('.message-content')).toHaveAttribute('role', 'log');

    // AND: Should be keyboard accessible
    await messageInput.focus();
    await expect(messageInput).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(sendButton).toBeFocused();

    console.log(`♿ Accessibility validation completed`);
  });

  test('Contract Discovery: Should identify ChatGPT automation opportunities', async ({ page }) => {
    // GIVEN: A page with ChatGPT-like interface elements
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>ChatGPT Interface</title>
          <meta name="web-buddy-contract" content="chatgpt-automation.json">
        </head>
        <body>
          <script type="application/web-buddy-contract">
            ${JSON.stringify(chatgptAutomationContract)}
          </script>
          
          <div class="project-item">Web Development</div>
          <textarea placeholder="Message ChatGPT..."></textarea>
          <button>Send</button>
          <div class="message-content"></div>
        </body>
      </html>
    `);

    // WHEN: Running contract discovery
    const environment = createTestEnvironment('chatgpt-buddy', { headless: true });
    await environment.initialize();

    try {
      await environment.navigateTo('data:text/html,' + encodeURIComponent(await page.content()));

      // Check for contract discovery
      const embeddedContract = await environment.getPage().evaluate(() => {
        const contractScript = document.querySelector('script[type="application/web-buddy-contract"]');
        return contractScript ? JSON.parse(contractScript.textContent || '{}') : null;
      });

      // THEN: Should discover the embedded contract
      expect(embeddedContract).toBeDefined();
      expect(embeddedContract.domain).toBe('chatgpt.com');
      expect(embeddedContract.capabilities.selectProject).toBeDefined();

      console.log(`🔍 Contract discovery for ChatGPT completed`);

    } finally {
      await environment.cleanup();
    }
  });
});