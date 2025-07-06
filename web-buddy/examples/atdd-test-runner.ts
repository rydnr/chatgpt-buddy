/*
                        Web-Buddy ATDD Test Runner

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
 * @fileoverview Comprehensive ATDD test runner for Web-Buddy framework
 * @description Demonstrates contract-based testing across multiple domain implementations
 */

import { 
  createTestSuite, 
  runContractTests,
  TestUtilities,
  validateContract,
  runBatchTests,
  WebBuddyContract
} from '../packages/testing/src';

/**
 * Google Search contract definition
 */
const googleContract: WebBuddyContract = {
  version: '1.0.0',
  domain: 'google.com',
  title: 'Google Search Automation',
  description: 'Automated Google search interactions',
  capabilities: {
    search: {
      type: 'action',
      description: 'Perform a Google search',
      selector: 'input[name="q"]',
      parameters: [
        {
          name: 'query',
          type: 'string',
          description: 'Search query',
          required: true
        }
      ]
    },
    getResults: {
      type: 'query',
      description: 'Get search results',
      selector: '.g h3',
      returnType: {
        type: 'array',
        description: 'Search results'
      }
    }
  }
};

/**
 * ChatGPT contract definition
 */
const chatgptContract: WebBuddyContract = {
  version: '1.0.0',
  domain: 'chatgpt.com',
  title: 'ChatGPT Automation',
  description: 'Automated ChatGPT interactions',
  capabilities: {
    sendMessage: {
      type: 'form',
      description: 'Send message to ChatGPT',
      selector: 'textarea[placeholder*="Message"]',
      parameters: [
        {
          name: 'message',
          type: 'string',
          description: 'Message to send',
          required: true
        }
      ]
    },
    getResponse: {
      type: 'query',
      description: 'Get ChatGPT response',
      selector: '.message-content',
      returnType: {
        type: 'object',
        description: 'ChatGPT response'
      }
    }
  }
};

/**
 * Wikipedia contract definition
 */
const wikipediaContract: WebBuddyContract = {
  version: '1.0.0',
  domain: 'wikipedia.org',
  title: 'Wikipedia Automation',
  description: 'Automated Wikipedia article interactions',
  capabilities: {
    searchArticle: {
      type: 'form',
      description: 'Search for Wikipedia article',
      selector: '#searchInput',
      parameters: [
        {
          name: 'query',
          type: 'string',
          description: 'Article search query',
          required: true
        }
      ]
    },
    getArticleContent: {
      type: 'query',
      description: 'Get article content',
      selector: '#mw-content-text',
      returnType: {
        type: 'object',
        description: 'Article content'
      }
    }
  }
};

/**
 * Comprehensive ATDD test runner demonstration
 */
async function runATDDTestSuite(): Promise<void> {
  console.log('🧪 Starting Web-Buddy ATDD Test Suite');
  console.log('=====================================\n');

  try {
    // 1. Individual Contract Validation
    console.log('📋 Phase 1: Individual Contract Validation');
    console.log('------------------------------------------');

    const contractValidations = [
      { contract: googleContract, url: 'https://google.com' },
      { contract: chatgptContract, url: 'https://chatgpt.com' },
      { contract: wikipediaContract, url: 'https://wikipedia.org' }
    ];

    for (const { contract, url } of contractValidations) {
      console.log(`\n🔍 Validating ${contract.title}...`);
      
      try {
        const report = await validateContract(
          `data:application/json,${encodeURIComponent(JSON.stringify(contract))}`,
          url,
          { 
            headless: true, 
            timeout: 15000,
            browser: 'chromium'
          }
        );

        console.log(`  ✅ ${contract.domain}: ${report.summary.passed}/${report.summary.total} capabilities passed`);
        console.log(`  📊 Success rate: ${report.summary.successRate.toFixed(1)}%`);
        console.log(`  ⏱️ Execution time: ${report.summary.totalExecutionTime}ms`);

        if (report.recommendations.length > 0) {
          console.log(`  💡 Recommendations:`);
          report.recommendations.forEach(rec => console.log(`     - ${rec}`));
        }

      } catch (error: any) {
        console.log(`  ❌ ${contract.domain}: Validation failed - ${error.message}`);
      }
    }

    // 2. Cross-Domain Testing
    console.log('\n\n🌐 Phase 2: Cross-Domain Testing');
    console.log('--------------------------------');

    const contracts = [googleContract, chatgptContract, wikipediaContract];
    const testUrls = [
      'https://google.com',
      'https://chatgpt.com', 
      'https://wikipedia.org'
    ];

    console.log(`\n📊 Running cross-domain tests across ${contracts.length} contracts...`);

    try {
      const batchResults = await runBatchTests(
        contracts.map((contract, index) => ({
          contract,
          testUrl: testUrls[index]
        })),
        {
          headless: true,
          timeout: 20000,
          parallel: false // Sequential for stability
        }
      );

      console.log('\n📈 Cross-Domain Test Results:');
      for (const [domain, report] of batchResults) {
        console.log(`  ${domain}: ${report.summary.successRate.toFixed(1)}% success rate`);
      }

    } catch (error: any) {
      console.log(`  ❌ Cross-domain testing failed: ${error.message}`);
    }

    // 3. Performance Benchmarking
    console.log('\n\n⚡ Phase 3: Performance Benchmarking');
    console.log('-----------------------------------');

    for (const contract of contracts) {
      console.log(`\n🏃 Benchmarking ${contract.domain}...`);
      
      try {
        const benchmark = await TestUtilities.benchmarkPerformance(
          contract,
          `https://${contract.domain}`,
          3 // 3 iterations for demo
        );

        console.log(`  📊 Overall performance:`);
        console.log(`     Average: ${benchmark.overall.avg.toFixed(0)}ms`);
        console.log(`     Min: ${benchmark.overall.min}ms`);
        console.log(`     Max: ${benchmark.overall.max}ms`);

        console.log(`  🎯 Capability performance:`);
        for (const [capability, stats] of Object.entries(benchmark.capabilities)) {
          console.log(`     ${capability}: ${stats.avg.toFixed(0)}ms avg`);
        }

      } catch (error: any) {
        console.log(`  ❌ Benchmarking failed for ${contract.domain}: ${error.message}`);
      }
    }

    // 4. Cross-Browser Compatibility
    console.log('\n\n🌐 Phase 4: Cross-Browser Compatibility');
    console.log('--------------------------------------');

    const browsers = ['chromium', 'firefox'] as const;
    
    for (const contract of contracts) {
      console.log(`\n🔍 Testing ${contract.domain} across browsers...`);
      
      try {
        const crossBrowserResults = await TestUtilities.runCrossBrowserTests(
          [contract],
          `https://${contract.domain}`,
          browsers
        );

        for (const [browser, reports] of crossBrowserResults) {
          const report = reports[0];
          if (report) {
            console.log(`  ${browser}: ${report.summary.successRate.toFixed(1)}% success`);
          }
        }

      } catch (error: any) {
        console.log(`  ❌ Cross-browser testing failed for ${contract.domain}: ${error.message}`);
      }
    }

    // 5. Domain-Specific Test Scenarios
    console.log('\n\n🎯 Phase 5: Domain-Specific Test Scenarios');
    console.log('-----------------------------------------');

    const domainScenarios = [
      {
        domain: 'google.com',
        urls: ['https://google.com', 'https://google.com/search?q=test'],
        expectedCapabilities: ['search', 'getResults']
      },
      {
        domain: 'chatgpt.com',
        urls: ['https://chatgpt.com'],
        expectedCapabilities: ['sendMessage', 'getResponse']
      },
      {
        domain: 'wikipedia.org',
        urls: ['https://wikipedia.org', 'https://en.wikipedia.org'],
        expectedCapabilities: ['searchArticle', 'getArticleContent']
      }
    ];

    for (const scenario of domainScenarios) {
      console.log(`\n🔬 Creating test scenario for ${scenario.domain}...`);
      
      try {
        const testScenario = await TestUtilities.createDomainTestScenario(
          scenario.domain,
          scenario.urls,
          scenario.expectedCapabilities
        );

        console.log(`  📋 Found ${testScenario.contracts.length} contracts`);
        console.log(`  🎯 Test plan has ${testScenario.testPlan.phases.length} phases`);
        
        if (testScenario.recommendations.length > 0) {
          console.log(`  💡 Recommendations:`);
          testScenario.recommendations.forEach(rec => console.log(`     - ${rec}`));
        }

      } catch (error: any) {
        console.log(`  ❌ Test scenario creation failed for ${scenario.domain}: ${error.message}`);
      }
    }

    // 6. Accessibility Testing
    console.log('\n\n♿ Phase 6: Accessibility Testing');
    console.log('--------------------------------');

    for (const contract of contracts) {
      console.log(`\n🔍 Testing accessibility for ${contract.domain}...`);
      
      try {
        const accessibilityResult = await TestUtilities.createAccessibilityTests(
          contract,
          `https://${contract.domain}`
        );

        console.log(`  📊 Accessibility score: ${accessibilityResult.score}/100`);
        console.log(`  🚨 Issues found: ${accessibilityResult.issues.length}`);
        
        if (accessibilityResult.recommendations.length > 0) {
          console.log(`  💡 Accessibility recommendations:`);
          accessibilityResult.recommendations.forEach(rec => console.log(`     - ${rec}`));
        }

      } catch (error: any) {
        console.log(`  ❌ Accessibility testing failed for ${contract.domain}: ${error.message}`);
      }
    }

    // 7. Comprehensive Test Suite
    console.log('\n\n🧪 Phase 7: Comprehensive Test Suite');
    console.log('-----------------------------------');

    console.log(`\n🏗️ Creating comprehensive test suite...`);

    try {
      const suiteResult = await createTestSuite({
        name: 'Web-Buddy Framework Validation',
        description: 'Complete validation of Web-Buddy automation contracts',
        contracts: contracts,
        testUrls: testUrls,
        browser: 'chromium',
        headless: true,
        timeout: 30000,
        retries: 2,
        parallel: false,
        screenshots: true,
        reportPath: './test-results/atdd-report.json'
      });

      console.log(`\n📊 Final Test Suite Results:`);
      console.log(`  Total Contracts: ${suiteResult.summary.totalContracts}`);
      console.log(`  Total Capabilities: ${suiteResult.summary.totalCapabilities}`);
      console.log(`  Passed: ${suiteResult.summary.passed}`);
      console.log(`  Failed: ${suiteResult.summary.failed}`);
      console.log(`  Success Rate: ${suiteResult.summary.successRate.toFixed(1)}%`);
      console.log(`  Total Duration: ${suiteResult.summary.duration}ms`);
      console.log(`  Browser Used: ${suiteResult.metadata.browser}`);

      if (suiteResult.errors.length > 0) {
        console.log(`\n❌ Suite Errors:`);
        suiteResult.errors.forEach(error => console.log(`     - ${error}`));
      }

    } catch (error: any) {
      console.log(`  ❌ Comprehensive test suite failed: ${error.message}`);
    }

    console.log('\n\n✅ ATDD Test Suite Complete!');
    console.log('============================');
    console.log('🎯 Summary: Contract-based testing validates automation capabilities');
    console.log('🌐 Coverage: Google, ChatGPT, and Wikipedia automation contracts');
    console.log('🧪 Testing: Performance, cross-browser, accessibility, and domain scenarios');
    console.log('📊 Results: Detailed reporting with recommendations for improvement');

  } catch (error: any) {
    console.error('\n❌ ATDD Test Suite Failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

/**
 * Run simple contract validation example
 */
async function runSimpleExample(): Promise<void> {
  console.log('\n🔍 Simple Contract Validation Example');
  console.log('====================================\n');

  try {
    // Create a simple contract for Google search
    const simpleContract: WebBuddyContract = {
      version: '1.0.0',
      domain: 'google.com',
      title: 'Simple Google Search',
      description: 'Basic Google search automation',
      capabilities: {
        search: {
          type: 'action',
          description: 'Search Google',
          selector: 'input[name="q"]'
        }
      }
    };

    // Validate the contract
    const result = await validateContract(
      `data:application/json,${encodeURIComponent(JSON.stringify(simpleContract))}`,
      'https://google.com',
      { headless: true, browser: 'chromium' }
    );

    console.log(`📊 Simple validation result:`);
    console.log(`   Success rate: ${result.summary.successRate}%`);
    console.log(`   Execution time: ${result.summary.totalExecutionTime}ms`);
    console.log(`   Capabilities tested: ${result.summary.total}`);

  } catch (error: any) {
    console.log(`❌ Simple example failed: ${error.message}`);
  }
}

// Main execution
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  if (args.includes('--simple')) {
    await runSimpleExample();
  } else {
    await runATDDTestSuite();
  }
}

// Run the demo
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Demo failed:', error);
    process.exit(1);
  });
}