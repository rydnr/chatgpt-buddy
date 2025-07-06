/*
                        Google-Buddy ATDD Tests

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
 * @fileoverview Acceptance Test-Driven Development tests for Google-Buddy
 * @description Contract-based end-to-end tests validating Google search automation
 */

import { test, expect } from '@playwright/test';
import { 
  createTestEnvironment, 
  ContractTestRunner, 
  contractTest,
  WebBuddyContract 
} from '@web-buddy/testing';
import { createGoogleAutomationClient } from '../src';

/**
 * Google search automation contract
 */
const googleSearchContract: WebBuddyContract = {
  version: '1.0.0',
  domain: 'google.com',
  title: 'Google Search Automation Contract',
  description: 'Automated interaction with Google Search functionality',
  
  context: {
    urlPatterns: [
      'https://google.com',
      'https://www.google.com',
      'https://google.com/search*'
    ],
    prerequisites: [
      {
        type: 'element',
        description: 'Search input field must be present',
        selector: 'input[name="q"]',
        required: true
      }
    ]
  },

  capabilities: {
    enterSearchTerm: {
      type: 'form',
      description: 'Enter search term in Google search box',
      selector: 'input[name="q"]',
      parameters: [
        {
          name: 'searchTerm',
          type: 'string',
          description: 'The search query to enter',
          required: true,
          examples: ['TypeScript EDA patterns', 'Web automation testing']
        }
      ],
      returnType: {
        type: 'object',
        description: 'Success confirmation',
        examples: [{ success: true, searchTerm: 'example query' }]
      },
      timeout: 5000,
      validation: {
        elementExists: true,
        elementVisible: true,
        elementEnabled: true
      },
      examples: [
        {
          description: 'Search for programming concepts',
          parameters: { searchTerm: 'TypeScript EDA patterns' },
          expectedResult: { success: true }
        }
      ]
    },

    getSearchResults: {
      type: 'query',
      description: 'Retrieve search results from Google results page',
      selector: 'div[data-async-context] h3, .g h3',
      returnType: {
        type: 'array',
        description: 'Array of search results',
        examples: [
          [
            {
              title: 'Example Result',
              url: 'https://example.com',
              snippet: 'Example description'
            }
          ]
        ]
      },
      timeout: 10000,
      validation: {
        elementExists: true
      }
    },

    getFirstResult: {
      type: 'query',
      description: 'Get the first search result',
      selector: 'div[data-async-context] h3:first-of-type, .g:first-of-type h3',
      returnType: {
        type: 'object',
        description: 'First search result',
        examples: [
          {
            title: 'First Result Title',
            url: 'https://first-result.com',
            snippet: 'First result description'
          }
        ]
      },
      timeout: 5000
    },

    clickResult: {
      type: 'action',
      description: 'Click on a search result by index',
      selector: 'div[data-async-context] h3, .g h3',
      parameters: [
        {
          name: 'index',
          type: 'number',
          description: 'Index of the result to click (0-based)',
          required: true,
          minimum: 0,
          maximum: 10,
          examples: [0, 1, 2]
        }
      ],
      returnType: {
        type: 'object',
        description: 'Click confirmation',
        examples: [{ success: true, index: 0, title: 'Clicked Result' }]
      },
      timeout: 5000
    }
  },

  workflows: {
    completeSearch: {
      description: 'Complete search workflow from query to results',
      parameters: [
        {
          name: 'query',
          type: 'string',
          description: 'Search query to execute',
          required: true
        }
      ],
      steps: [
        {
          capability: 'enterSearchTerm',
          parameters: { searchTerm: '${query}' }
        },
        {
          capability: 'getSearchResults'
        }
      ]
    }
  },

  metadata: {
    author: 'Web-Buddy Team',
    created: '2025-01-01',
    tags: ['search', 'google', 'automation'],
    compatibilityScore: 95
  }
};

test.describe('Google Search Automation - Contract-Based ATDD', () => {
  test.describe.configure({ mode: 'serial' });

  test('Contract Validation: Google search contract should be valid', async () => {
    // This test validates the contract structure itself
    const { environment, client } = await createTestEnvironment('google-buddy', {
      headless: true,
      timeout: 30000
    });

    try {
      await environment.initialize();
      await environment.navigateTo('https://google.com');

      // Validate contract against actual page
      const testRunner = new ContractTestRunner(client);
      const testContext = {
        browser: environment.getBrowser(),
        page: environment.getPage(),
        webBuddyClient: client,
        contract: googleSearchContract,
        baseUrl: 'https://google.com',
        timeout: 30000
      };

      // Run contract validation
      const results = await testRunner.executeContractTests(googleSearchContract, testContext);
      const report = testRunner.generateTestReport(results);

      // Assert contract is valid
      expect(report.summary.successRate).toBeGreaterThan(80);
      expect(report.summary.failed).toBeLessThan(2);

      console.log(`📊 Contract validation completed: ${report.summary.passed}/${report.summary.total} capabilities passed`);

    } finally {
      await environment.cleanup();
    }
  });

  test('Capability: Enter search term should work correctly', async ({ page }) => {
    // GIVEN: A Google search page is loaded
    await page.goto('https://google.com');
    await page.waitForLoadState('networkidle');

    // WHEN: We use the Google automation client to enter a search term
    const environment = createTestEnvironment('google-buddy', { headless: true });
    await environment.initialize();
    
    try {
      const client = environment.getWebBuddyClient();
      const googleClient = createGoogleAutomationClient({
        serverUrl: 'http://localhost:3002',
        timeout: 5000
      });

      // Start Web-Buddy server for this test
      // Note: In real implementation, server would be started in beforeAll
      
      const searchTerm = 'TypeScript Event-Driven Architecture';
      const result = await googleClient.search(searchTerm);

      // THEN: The search should execute successfully
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);

      // AND: The page should show search results
      await expect(page).toHaveURL(/.*google\.com\/search.*/);
      await expect(page.locator('#search')).toBeVisible();

    } finally {
      await environment.cleanup();
    }
  });

  test('Workflow: Complete search workflow should execute end-to-end', async ({ page }) => {
    // GIVEN: Starting from Google homepage
    await page.goto('https://google.com');
    
    // WHEN: Executing the complete search workflow through contract
    const report = await contractTest(googleSearchContract, 'https://google.com')
      .headless(true)
      .timeout(30000)
      .run();

    // THEN: The workflow should complete successfully
    expect(report.summary.successRate).toBeGreaterThan(75);
    
    // AND: Core capabilities should work
    const enterSearchResult = report.results.find(r => r.capabilityName === 'enterSearchTerm');
    expect(enterSearchResult?.success).toBe(true);

    const getResultsResult = report.results.find(r => r.capabilityName === 'getSearchResults');
    expect(getResultsResult?.success).toBe(true);

    console.log(`🎯 Workflow test completed: ${report.summary.passed}/${report.summary.total} steps passed`);
  });

  test('Cross-Browser Compatibility: Search should work in different browsers', async () => {
    const browsers = ['chromium', 'firefox'] as const;
    const results = new Map();

    for (const browserType of browsers) {
      const environment = createTestEnvironment('google-buddy', {
        browser: browserType,
        headless: true,
        timeout: 30000
      });

      try {
        await environment.initialize();
        await environment.navigateTo('https://google.com');

        const testRunner = new ContractTestRunner(environment.getWebBuddyClient());
        const testContext = {
          browser: environment.getBrowser(),
          page: environment.getPage(),
          webBuddyClient: environment.getWebBuddyClient(),
          contract: googleSearchContract,
          baseUrl: 'https://google.com',
          timeout: 30000
        };

        const testResults = await testRunner.executeContractTests(googleSearchContract, testContext);
        const report = testRunner.generateTestReport(testResults);
        
        results.set(browserType, report);

        // Each browser should achieve reasonable success rate
        expect(report.summary.successRate).toBeGreaterThan(70);

      } finally {
        await environment.cleanup();
      }
    }

    console.log(`🌐 Cross-browser testing completed for ${browsers.length} browsers`);
  });

  test('Performance: Search automation should complete within acceptable time limits', async () => {
    const maxExecutionTime = 15000; // 15 seconds
    const startTime = Date.now();

    const report = await contractTest(googleSearchContract, 'https://google.com')
      .headless(true)
      .timeout(maxExecutionTime)
      .run();

    const totalTime = Date.now() - startTime;

    // Performance assertions
    expect(totalTime).toBeLessThan(maxExecutionTime);
    expect(report.summary.totalExecutionTime).toBeLessThan(maxExecutionTime * 0.8);

    // Individual capability performance
    for (const result of report.results) {
      expect(result.executionTime).toBeLessThan(8000); // 8 seconds max per capability
    }

    console.log(`⚡ Performance test completed in ${totalTime}ms`);
  });

  test('Error Recovery: Should handle missing elements gracefully', async ({ page }) => {
    // GIVEN: A page that doesn't have expected Google search elements
    await page.goto('https://example.com'); // Non-Google page

    // WHEN: Attempting to execute Google search contract
    const report = await contractTest(googleSearchContract, 'https://example.com')
      .headless(true)
      .timeout(10000)
      .run();

    // THEN: The contract should fail gracefully with meaningful errors
    expect(report.summary.successRate).toBe(0);
    expect(report.results.every(r => !r.success)).toBe(true);

    // AND: Each failure should have meaningful error messages
    for (const result of report.results) {
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain('not found');
    }

    console.log(`🛡️ Error recovery test completed - all failures handled gracefully`);
  });

  test('Accessibility: Contract capabilities should be accessible', async ({ page }) => {
    // GIVEN: Google search page with accessibility in mind
    await page.goto('https://google.com');

    // Check that contract selectors target accessible elements
    const searchInput = page.locator(googleSearchContract.capabilities.enterSearchTerm.selector as string);
    await expect(searchInput).toBeVisible();

    // Verify ARIA attributes are present or can be added
    const inputElement = await searchInput.first().elementHandle();
    const ariaLabel = await inputElement?.getAttribute('aria-label');
    const placeholder = await inputElement?.getAttribute('placeholder');

    // Should have some form of accessible name
    expect(ariaLabel || placeholder).toBeTruthy();

    // Verify keyboard accessibility
    await searchInput.focus();
    await expect(searchInput).toBeFocused();

    console.log(`♿ Accessibility validation completed`);
  });

  test('Contract Discovery: Should discover contract from Google page', async ({ page }) => {
    // This test verifies that the contract discovery system works
    await page.goto('https://google.com');

    // Inject contract metadata for discovery testing
    await page.addScriptTag({
      content: `
        window.webBuddyContract = ${JSON.stringify(googleSearchContract)};
      `
    });

    const environment = createTestEnvironment('google-buddy', { headless: true });
    await environment.initialize();

    try {
      await environment.navigateTo('https://google.com');

      // Simulate contract discovery
      const discoveredContract = await environment.getPage().evaluate(() => {
        return (window as any).webBuddyContract;
      });

      expect(discoveredContract).toBeDefined();
      expect(discoveredContract.domain).toBe('google.com');
      expect(Object.keys(discoveredContract.capabilities)).toContain('enterSearchTerm');

      console.log(`🔍 Contract discovery test completed`);

    } finally {
      await environment.cleanup();
    }
  });
});