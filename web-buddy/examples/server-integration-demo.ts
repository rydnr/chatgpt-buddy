/*
                        Web-Buddy Framework

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
 * Server Integration Demo
 * 
 * Demonstrates how domain clients can communicate with the Web-Buddy server
 * and how the server coordinates with browser extensions.
 */

import { createWebBuddyServer } from '../packages/server/src';
import { createChatGPTBuddyClient } from '../implementations/chatgpt-buddy/src';
import { createWikipediaBuddyClient } from '../implementations/wikipedia-buddy/src';
import { createGoogleAutomationClient } from '../implementations/google-buddy/src';

async function serverIntegrationDemo() {
  console.log('🚀 Starting Web-Buddy Server Integration Demo');
  
  // 1. Start the Web-Buddy server
  const server = createWebBuddyServer({
    port: 3002,
    cors: {
      enabled: true,
      origins: ['*'] // Allow all origins for demo
    },
    logging: {
      level: 'info'
    }
  });
  
  try {
    await server.start();
    console.log('✅ Web-Buddy Server started on port 3002');
    
    // 2. Create domain-specific clients that connect to the server
    const chatgptClient = createChatGPTBuddyClient('http://localhost:3002', {
      timeout: 5000
    });
    const wikipediaClient = createWikipediaBuddyClient('http://localhost:3002', {
      timeout: 5000
    });
    const googleClient = createGoogleAutomationClient({
      serverUrl: 'http://localhost:3002',
      timeout: 5000
    });
    
    console.log('✅ Domain clients created');
    
    // 3. Test server health
    console.log('\n📊 Testing server health...');
    const response = await fetch('http://localhost:3002/health');
    const health = await response.json();
    console.log('Server health:', {
      status: health.status,
      uptime: Math.round(health.uptime * 1000) + 'ms',
      extensions: health.extensions.connected
    });
    
    // 4. Test client requests (these will fail without extensions, but show communication)
    console.log('\n🧪 Testing domain client requests...');
    
    try {
      console.log('Testing ChatGPT client...');
      await chatgptClient.selectProject('Demo Project');
    } catch (error: any) {
      console.log('Expected error (no extension):', error.message);
    }
    
    try {
      console.log('Testing Wikipedia client...');
      await wikipediaClient.searchArticle('Artificial Intelligence');
    } catch (error: any) {
      console.log('Expected error (no extension):', error.message);
    }
    
    try {
      console.log('Testing Google client...');
      await googleClient.search('Web automation');
    } catch (error: any) {
      console.log('Expected error (no extension):', error.message);
    }
    
    // 5. Demonstrate server metrics
    console.log('\n📈 Server metrics:');
    const metricsResponse = await fetch('http://localhost:3002/api/metrics');
    const metrics = await metricsResponse.json();
    console.log('Memory usage:', {
      rss: Math.round(metrics.data.memory.rss / 1024 / 1024) + 'MB',
      heapUsed: Math.round(metrics.data.memory.heapUsed / 1024 / 1024) + 'MB'
    });
    console.log('Extensions:', metrics.data.extensions);
    
    // 6. Show client transport information
    console.log('\n🔌 Client transport information:');
    console.log('ChatGPT client:', await chatgptClient.getWebBuddyClient().getTransportInfo());
    console.log('Wikipedia client:', await wikipediaClient.getWebBuddyClient().getTransportInfo());
    console.log('Google client:', await googleClient.getWebBuddyClient().getTransportInfo());
    
    console.log('\n✅ Integration demo completed successfully!');
    console.log('\n💡 To fully test automation:');
    console.log('   1. Load the Web-Buddy browser extension');
    console.log('   2. Navigate to ChatGPT, Wikipedia, or Google');
    console.log('   3. The extension will connect to this server');
    console.log('   4. Run client commands to see full automation');
    
  } catch (error) {
    console.error('❌ Demo failed:', error);
  } finally {
    // 7. Cleanup
    console.log('\n🛑 Stopping server...');
    await server.stop();
    console.log('✅ Server stopped');
  }
}

// Run the demo
if (require.main === module) {
  serverIntegrationDemo().catch(console.error);
}