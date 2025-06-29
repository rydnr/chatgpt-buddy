/*
                        Web-Buddy Framework Demo

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
 * Google Automation Demo
 * 
 * This example demonstrates the layered architecture of Web-Buddy:
 * 1. Generic Core API - Low-level message passing
 * 2. Domain Wrapper API - Google-specific convenience methods
 * 3. Advanced Usage Patterns - Batch operations, filtering, etc.
 */

import { createWebBuddyClient } from '@web-buddy/core';
import { GoogleBuddyClient, GoogleMessages } from '@google-buddy/client';

/**
 * Demo 1: Using the convenient Google-specific API
 * Most developers will use this approach
 */
async function demoConvenientAPI() {
  console.log('=== Demo 1: Google-Buddy Convenient API ===');
  
  // Setup
  const webClient = createWebBuddyClient({
    serverUrl: 'http://localhost:3000',
    timeout: 30000
  });
  const googleClient = new GoogleBuddyClient(webClient);
  
  try {
    // Simple search
    console.log('Performing simple search...');
    const results = await googleClient.search('TypeScript EDA patterns');
    console.log(`Found ${results.length} results`);
    
    // Get first result
    const firstResult = await googleClient.getFirstResult();
    console.log(`Top result: ${firstResult.title}`);
    console.log(`URL: ${firstResult.url}`);
    
    // Search and click first result ("I'm feeling lucky")
    console.log('\nPerforming "I\'m feeling lucky" search...');
    const clickResult = await googleClient.searchAndClickFirst('TypeScript tutorial');
    console.log(`Navigated to: ${clickResult.url}`);
    
    // Batch search multiple terms
    console.log('\nPerforming batch search...');
    const batchResults = await googleClient.batchSearch([
      'TypeScript', 'JavaScript', 'React'
    ]);
    console.log(`Batch search completed: ${batchResults.length} result sets`);
    batchResults.forEach((results, index) => {
      console.log(`  Term ${index + 1}: ${results.length} results`);
    });
    
    // Advanced filtering
    console.log('\nPerforming filtered search...');
    const filteredResults = await googleClient.searchWithFilter(
      'web development frameworks',
      (result) => result.title.toLowerCase().includes('react') || 
                 result.title.toLowerCase().includes('vue'),
      { maxResults: 3 }
    );
    console.log(`Filtered results: ${filteredResults.length} matching React/Vue`);
    
  } catch (error) {
    console.error('Error in convenient API demo:', error);
  }
}

/**
 * Demo 2: Using the generic Web-Buddy Core API
 * Power users and advanced automation scenarios
 */
async function demoGenericAPI() {
  console.log('\n=== Demo 2: Web-Buddy Generic Core API ===');
  
  // Setup
  const webClient = createWebBuddyClient({
    serverUrl: 'http://localhost:3000',
    timeout: 30000
  });
  
  try {
    // Direct message sending with full control
    console.log('Sending low-level search message...');
    const searchResponse = await webClient.sendMessage({
      [GoogleMessages.ENTER_SEARCH_TERM]: {
        searchTerm: 'advanced TypeScript patterns',
        correlationId: 'demo-search-001'
      }
    });
    console.log('Search initiated:', searchResponse.success);
    
    // Get results with custom correlation ID
    const resultsResponse = await webClient.sendMessage({
      [GoogleMessages.GET_SEARCH_RESULTS]: {
        correlationId: 'demo-results-001'
      }
    });
    console.log(`Found ${resultsResponse.results?.length || 0} results via generic API`);
    
    // Batch messages for efficiency
    console.log('\nSending batch of messages...');
    const responses = await webClient.sendMessages([
      { [GoogleMessages.ENTER_SEARCH_TERM]: { searchTerm: 'term1' } },
      { [GoogleMessages.GET_SEARCH_RESULTS]: {} },
      { [GoogleMessages.GET_FIRST_RESULT]: {} }
    ], { parallel: true });
    console.log(`Batch operation completed: ${responses.length} responses`);
    
  } catch (error) {
    console.error('Error in generic API demo:', error);
  }
}

/**
 * Demo 3: Advanced patterns and error handling
 */
async function demoAdvancedPatterns() {
  console.log('\n=== Demo 3: Advanced Patterns ===');
  
  const webClient = createWebBuddyClient({
    serverUrl: 'http://localhost:3000',
    timeout: 30000,
    retryAttempts: 3
  });
  const googleClient = new GoogleBuddyClient(webClient);
  
  try {
    // Health check
    console.log('Performing health check...');
    const healthCheck = await webClient.ping();
    console.log(`Server health: ${healthCheck.success ? 'OK' : 'FAIL'} (${healthCheck.latency}ms)`);
    
    // Custom data extraction
    console.log('\nExtracting custom data...');
    const topTitles = await googleClient.searchAndExtract(
      'web development trends 2025',
      (results) => results.slice(0, 3).map(r => r.title)
    );
    console.log('Top 3 result titles:', topTitles);
    
    // Error handling demonstration
    console.log('\nTesting error handling...');
    try {
      await googleClient.clickResult(999); // Invalid index
    } catch (error) {
      console.log('Caught expected error:', error.message);
    }
    
    // Tab-specific operations (if multiple tabs)
    console.log('\nDemonstrating tab-specific operations...');
    const tabId = 123; // Example tab ID
    await googleClient.enterSearchTerm('tab-specific search', { tabId });
    console.log(`Search performed on specific tab: ${tabId}`);
    
  } catch (error) {
    console.error('Error in advanced patterns demo:', error);
  }
}

/**
 * Demo 4: Real-world automation workflow
 */
async function demoRealWorldWorkflow() {
  console.log('\n=== Demo 4: Real-World Automation Workflow ===');
  
  const webClient = createWebBuddyClient({
    serverUrl: 'http://localhost:3000'
  });
  const googleClient = new GoogleBuddyClient(webClient);
  
  try {
    // Research workflow: Find information about a topic
    const topic = 'Event-Driven Architecture patterns';
    console.log(`Researching topic: ${topic}`);
    
    // Step 1: Initial search
    const results = await googleClient.search(topic);
    console.log(`Found ${results.length} initial results`);
    
    // Step 2: Filter for specific sources
    const authorativeResults = results.filter(result => 
      result.url.includes('microsoft.com') ||
      result.url.includes('aws.amazon.com') ||
      result.url.includes('martinfowler.com') ||
      result.url.includes('github.com')
    );
    console.log(`Found ${authorativeResults.length} results from authoritative sources`);
    
    // Step 3: Extract key information
    const topSources = authorativeResults.slice(0, 5).map(result => ({
      title: result.title,
      domain: new URL(result.url).hostname,
      description: result.description.substring(0, 100) + '...'
    }));
    
    console.log('\nTop authoritative sources:');
    topSources.forEach((source, index) => {
      console.log(`${index + 1}. ${source.title}`);
      console.log(`   Domain: ${source.domain}`);
      console.log(`   Preview: ${source.description}`);
      console.log();
    });
    
    // Step 4: Follow-up searches based on findings
    const relatedTerms = ['CQRS', 'Event Sourcing', 'Saga Pattern'];
    console.log('Performing follow-up searches for related terms...');
    
    for (const term of relatedTerms) {
      console.log(`\nSearching for: ${term}`);
      const relatedResults = await googleClient.search(`${term} ${topic}`);
      const topResult = relatedResults[0];
      if (topResult) {
        console.log(`  Top result: ${topResult.title}`);
        console.log(`  URL: ${topResult.url}`);
      }
    }
    
  } catch (error) {
    console.error('Error in real-world workflow demo:', error);
  }
}

/**
 * Main demo runner
 */
async function runAllDemos() {
  console.log('🚀 Web-Buddy Framework Demo Starting...');
  console.log('This demo shows both the convenient API and low-level generic API\n');
  
  try {
    await demoConvenientAPI();
    await demoGenericAPI();
    await demoAdvancedPatterns();
    await demoRealWorldWorkflow();
    
    console.log('\n✅ All demos completed successfully!');
    console.log('\nKey takeaways:');
    console.log('1. Use GoogleBuddyClient for most Google automation tasks');
    console.log('2. Use WebBuddyClient directly for advanced control and custom domains');
    console.log('3. Both APIs support error handling, retries, and tab-specific operations');
    console.log('4. The framework scales from simple searches to complex research workflows');
    
  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
}

// Run the demo if this file is executed directly
if (require.main === module) {
  runAllDemos().catch(console.error);
}

export {
  demoConvenientAPI,
  demoGenericAPI,
  demoAdvancedPatterns,
  demoRealWorldWorkflow,
  runAllDemos
};