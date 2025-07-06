/**
 * @fileoverview Contract Validation Demo
 * @description Demonstrates the ATDD framework for validating automation contracts across different websites
 */

import { 
  ContractTestRunner, 
  ContractDiscovery, 
  TestUtilities, 
  WebBuddyTestEnvironment,
  createTestEnvironment,
  WebBuddyContract,
  AutomationCapability
} from '../packages/testing/src';

/**
 * Contract validation demonstration showing how to:
 * 1. Discover automation capabilities on web pages
 * 2. Validate contracts against real websites
 * 3. Run cross-browser compatibility tests
 * 4. Generate comprehensive test reports
 */
export class ContractValidationDemo {
  
  /**
   * Demonstrates complete contract discovery and validation workflow
   */
  async demonstrateContractValidation(): Promise<void> {
    console.log('🧪 Starting Contract Validation Demonstration');
    console.log('====================================================');
    
    try {
      // Step 1: Discover contracts from popular websites
      await this.discoverContractsFromWebsites();
      
      // Step 2: Validate pre-defined contracts
      await this.validateExistingContracts();
      
      // Step 3: Run cross-browser validation
      await this.runCrossBrowserValidation();
      
      // Step 4: Demonstrate performance benchmarking
      await this.benchmarkContractPerformance();
      
      // Step 5: Show accessibility testing
      await this.validateAccessibility();
      
      console.log('\n✅ Contract validation demonstration completed successfully!');
      
    } catch (error) {
      console.error('❌ Contract validation demonstration failed:', error);
      throw error;
    }
  }

  /**
   * Discovers automation contracts from live websites
   */
  private async discoverContractsFromWebsites(): Promise<void> {
    console.log('\n📍 Step 1: Discovering Contracts from Websites');
    console.log('----------------------------------------------');
    
    const websites = [
      { url: 'https://google.com', name: 'Google Search' },
      { url: 'https://github.com', name: 'GitHub' },
      { url: 'https://stackoverflow.com', name: 'Stack Overflow' }
    ];
    
    const discovery = new ContractDiscovery();
    
    for (const website of websites) {
      console.log(`\n🔍 Discovering automation capabilities on ${website.name}...`);
      
      const environment = createTestEnvironment(website.name, {
        headless: true,
        timeout: 30000
      });
      
      try {
        await environment.initialize();
        await environment.navigateTo(website.url);
        
        const discoveryResult = await discovery.discoverFromPage(environment.getPage());
        
        console.log(`✅ Found ${discoveryResult.contracts.length} contracts on ${website.name}`);
        
        for (const contract of discoveryResult.contracts) {
          console.log(`   📋 Contract: ${contract.title}`);
          console.log(`      Domain: ${contract.domain}`);
          console.log(`      Capabilities: ${Object.keys(contract.capabilities).length}`);
          console.log(`      Version: ${contract.version}`);
          
          // Show sample capabilities
          const capabilityNames = Object.keys(contract.capabilities).slice(0, 3);
          if (capabilityNames.length > 0) {
            console.log(`      Sample capabilities: ${capabilityNames.join(', ')}`);
          }
        }
        
        if (discoveryResult.warnings.length > 0) {
          console.log(`   ⚠️  Warnings: ${discoveryResult.warnings.join(', ')}`);
        }
        
      } finally {
        await environment.cleanup();
      }
    }
  }

  /**
   * Validates pre-defined automation contracts
   */
  private async validateExistingContracts(): Promise<void> {
    console.log('\n📋 Step 2: Validating Existing Contracts');
    console.log('----------------------------------------');
    
    const contracts = this.getTestContracts();
    
    for (const contract of contracts) {
      console.log(`\n🧪 Validating contract: ${contract.title}`);
      
      const environment = createTestEnvironment(contract.domain, {
        headless: true,
        timeout: 30000
      });
      
      try {
        await environment.initialize();
        await environment.navigateTo(`https://${contract.domain}`);
        
        const testRunner = new ContractTestRunner(environment.getWebBuddyClient());
        
        const testContext = {
          browser: environment.getBrowser(),
          page: environment.getPage(),
          webBuddyClient: environment.getWebBuddyClient(),
          contract,
          baseUrl: `https://${contract.domain}`,
          timeout: 30000
        };
        
        const results = await testRunner.executeContractTests(contract, testContext);
        const report = testRunner.generateTestReport(results);
        
        console.log(`   📊 Test Results:`);
        console.log(`      Total capabilities: ${report.summary.totalCapabilities}`);
        console.log(`      Passed: ${report.summary.passed}`);
        console.log(`      Failed: ${report.summary.failed}`);
        console.log(`      Success rate: ${report.summary.successRate.toFixed(1)}%`);
        console.log(`      Execution time: ${report.summary.totalDuration}ms`);
        
        // Show detailed results for failed tests
        for (const result of results) {
          if (!result.success) {
            console.log(`   ❌ Failed: ${result.capabilityName}`);
            console.log(`      Error: ${result.error?.message}`);
            console.log(`      Execution time: ${result.executionTime}ms`);
          } else {
            console.log(`   ✅ Passed: ${result.capabilityName} (${result.executionTime}ms)`);
          }
        }
        
      } finally {
        await environment.cleanup();
      }
    }
  }

  /**
   * Runs cross-browser compatibility tests
   */
  private async runCrossBrowserValidation(): Promise<void> {
    console.log('\n🌐 Step 3: Cross-Browser Validation');
    console.log('-----------------------------------');
    
    const testContract = this.getSimpleTestContract();
    const testUrl = 'https://google.com';
    const browsers = ['chromium', 'firefox', 'webkit'];
    
    console.log(`Testing contract "${testContract.title}" across ${browsers.length} browsers...`);
    
    const crossBrowserResults = await TestUtilities.runCrossBrowserTests(
      [testContract],
      testUrl,
      browsers as any
    );
    
    for (const [browser, reports] of crossBrowserResults) {
      console.log(`\n📱 ${browser.toUpperCase()} Results:`);
      
      for (const report of reports) {
        console.log(`   Contract: ${report.contract}`);
        console.log(`   Success Rate: ${report.summary.successRate.toFixed(1)}%`);
        console.log(`   Capabilities: ${report.summary.totalCapabilities}`);
        console.log(`   Duration: ${report.summary.totalDuration}ms`);
        
        if (report.summary.failed > 0) {
          console.log(`   ⚠️  Failed tests: ${report.summary.failed}`);
        }
      }
    }
    
    // Analyze cross-browser compatibility
    const compatibilityAnalysis = this.analyzeCrossBrowserCompatibility(crossBrowserResults);
    console.log('\n📈 Cross-Browser Compatibility Analysis:');
    console.log(`   Overall compatibility: ${compatibilityAnalysis.overallCompatibility.toFixed(1)}%`);
    console.log(`   Most compatible browser: ${compatibilityAnalysis.bestBrowser}`);
    console.log(`   Least compatible browser: ${compatibilityAnalysis.worstBrowser}`);
    
    if (compatibilityAnalysis.issues.length > 0) {
      console.log('   🚨 Compatibility Issues:');
      compatibilityAnalysis.issues.forEach(issue => {
        console.log(`      - ${issue}`);
      });
    }
  }

  /**
   * Demonstrates performance benchmarking
   */
  private async benchmarkContractPerformance(): Promise<void> {
    console.log('\n⚡ Step 4: Performance Benchmarking');
    console.log('----------------------------------');
    
    const testContract = this.getSimpleTestContract();
    const testUrl = 'https://google.com';
    const iterations = 3; // Reduced for demo purposes
    
    console.log(`Benchmarking contract "${testContract.title}" with ${iterations} iterations...`);
    
    const benchmark = await TestUtilities.benchmarkPerformance(
      testContract,
      testUrl,
      iterations
    );
    
    console.log('\n📊 Performance Benchmark Results:');
    console.log(`   Overall Performance:`);
    console.log(`      Average: ${benchmark.overall.avg.toFixed(0)}ms`);
    console.log(`      Minimum: ${benchmark.overall.min}ms`);
    console.log(`      Maximum: ${benchmark.overall.max}ms`);
    console.log(`      Median: ${benchmark.overall.median}ms`);
    
    console.log(`\n   Per-Capability Performance:`);
    for (const [capability, stats] of Object.entries(benchmark.capabilities)) {
      console.log(`      ${capability}:`);
      console.log(`         Average: ${stats.avg.toFixed(0)}ms`);
      console.log(`         Range: ${stats.min}ms - ${stats.max}ms`);
    }
    
    // Generate performance recommendations
    const recommendations = this.generatePerformanceRecommendations(benchmark);
    if (recommendations.length > 0) {
      console.log('\n💡 Performance Recommendations:');
      recommendations.forEach(rec => {
        console.log(`   - ${rec}`);
      });
    }
  }

  /**
   * Validates accessibility compliance
   */
  private async validateAccessibility(): Promise<void> {
    console.log('\n♿ Step 5: Accessibility Validation');
    console.log('----------------------------------');
    
    const testContract = this.getSimpleTestContract();
    const testUrl = 'https://google.com';
    
    console.log(`Validating accessibility for contract "${testContract.title}"...`);
    
    const accessibilityResult = await TestUtilities.createAccessibilityTests(
      testContract,
      testUrl
    );
    
    console.log('\n📋 Accessibility Test Results:');
    console.log(`   Contract: ${accessibilityResult.contract}`);
    console.log(`   Accessibility Score: ${accessibilityResult.score}/100`);
    console.log(`   Issues Found: ${accessibilityResult.issues.length}`);
    
    if (accessibilityResult.issues.length > 0) {
      console.log('\n🚨 Accessibility Issues:');
      accessibilityResult.issues.forEach(issue => {
        console.log(`   ${issue.severity.toUpperCase()}: ${issue.message}`);
        console.log(`      Capability: ${issue.capability}`);
        console.log(`      Type: ${issue.type}`);
        console.log(`      Selector: ${issue.selector}`);
      });
    }
    
    if (accessibilityResult.recommendations.length > 0) {
      console.log('\n💡 Accessibility Recommendations:');
      accessibilityResult.recommendations.forEach(rec => {
        console.log(`   - ${rec}`);
      });
    }
  }

  /**
   * Returns test contracts for demonstration
   */
  private getTestContracts(): WebBuddyContract[] {
    return [
      {
        version: '1.0.0',
        domain: 'google.com',
        title: 'Google Search Automation',
        description: 'Basic Google search functionality',
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
                required: true
              }
            ],
            examples: [
              {
                description: 'Search for web automation',
                parameters: { searchTerm: 'web automation' },
                expectedResult: 'Search term entered successfully'
              }
            ]
          },
          submitSearch: {
            type: 'action',
            description: 'Submit the search form',
            selector: 'input[name="btnK"], form[role="search"]',
            parameters: [],
            timeout: 5000
          }
        }
      },
      {
        version: '1.0.0',
        domain: 'github.com',
        title: 'GitHub Repository Search',
        description: 'GitHub repository search and navigation',
        capabilities: {
          searchRepositories: {
            type: 'form',
            description: 'Search for repositories on GitHub',
            selector: 'input[data-test-selector="nav-search-input"]',
            parameters: [
              {
                name: 'query',
                type: 'string',
                description: 'Repository search query',
                required: true
              }
            ]
          }
        }
      }
    ];
  }

  /**
   * Returns a simple test contract for cross-browser testing
   */
  private getSimpleTestContract(): WebBuddyContract {
    return {
      version: '1.0.0',
      domain: 'google.com',
      title: 'Simple Google Search',
      description: 'Minimal Google search contract for testing',
      capabilities: {
        enterSearchTerm: {
          type: 'form',
          description: 'Enter search term',
          selector: 'input[name="q"]',
          parameters: [
            {
              name: 'searchTerm',
              type: 'string',
              required: true
            }
          ]
        }
      }
    };
  }

  /**
   * Analyzes cross-browser compatibility results
   */
  private analyzeCrossBrowserCompatibility(results: Map<string, any[]>): {
    overallCompatibility: number;
    bestBrowser: string;
    worstBrowser: string;
    issues: string[];
  } {
    const browserScores: { [browser: string]: number } = {};
    const issues: string[] = [];
    
    for (const [browser, reports] of results) {
      const totalTests = reports.reduce((sum, report) => sum + report.summary.totalCapabilities, 0);
      const passedTests = reports.reduce((sum, report) => sum + report.summary.passed, 0);
      
      browserScores[browser] = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
      
      if (browserScores[browser] < 100) {
        const failedTests = totalTests - passedTests;
        issues.push(`${browser}: ${failedTests} test(s) failed`);
      }
    }
    
    const scores = Object.values(browserScores);
    const overallCompatibility = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    
    const bestBrowser = Object.entries(browserScores).reduce((a, b) => a[1] > b[1] ? a : b)[0];
    const worstBrowser = Object.entries(browserScores).reduce((a, b) => a[1] < b[1] ? a : b)[0];
    
    return {
      overallCompatibility,
      bestBrowser,
      worstBrowser,
      issues
    };
  }

  /**
   * Generates performance recommendations based on benchmark results
   */
  private generatePerformanceRecommendations(benchmark: any): string[] {
    const recommendations: string[] = [];
    
    if (benchmark.overall.avg > 5000) {
      recommendations.push('Consider optimizing automation scripts - average execution time is high');
    }
    
    if (benchmark.overall.max > benchmark.overall.avg * 2) {
      recommendations.push('High variance in execution times - investigate timeout issues');
    }
    
    for (const [capability, stats] of Object.entries(benchmark.capabilities)) {
      if ((stats as any).avg > 3000) {
        recommendations.push(`Capability "${capability}" is slow - consider optimizing selector or adding waits`);
      }
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Performance is within acceptable ranges');
    }
    
    return recommendations;
  }
}

/**
 * Runs the complete contract validation demonstration
 */
export async function runContractValidationDemo(): Promise<void> {
  const demo = new ContractValidationDemo();
  
  try {
    await demo.demonstrateContractValidation();
  } catch (error) {
    console.error('Contract validation demo failed:', error);
    process.exit(1);
  }
}

// Run demonstration if this file is executed directly
if (require.main === module) {
  runContractValidationDemo();
}