/**
 * @fileoverview ChatGPT-Buddy Client Example
 * @description Example usage of the ChatGPT-Buddy client SDK
 * @author rydnr
 */

import { createChatGPTBuddyClient, ChatGPTBuddyClientConfig } from './chatgpt-buddy-client';

// Client configuration
const config: ChatGPTBuddyClientConfig = {
  serverUrl: 'http://localhost:3003',
  defaultModel: 'gpt-4',
  enableWebSocket: true,
  timeout: 30000,
  // apiKey: 'your-api-key-here' // Optional for authenticated servers
};

async function demonstrateChatGPTIntegration() {
  console.log('🤖 ChatGPT-Buddy Client Demo');
  console.log('=============================\n');

  try {
    // Initialize the client
    console.log('1. Initializing ChatGPT-Buddy client...');
    const client = await createChatGPTBuddyClient(config);
    
    // Check server health
    console.log('\n2. Checking server health...');
    const serverInfo = await client.getServerInfo();
    console.log('Server info:', JSON.stringify(serverInfo, null, 2));

    // Simple ChatGPT interaction
    console.log('\n3. Testing ChatGPT interaction...');
    const chatResponse = await client.chat({
      prompt: "Explain the benefits of event-driven architecture in web automation",
      model: "gpt-4",
      interactionOptions: {
        maxTokens: 500,
        temperature: 0.7,
        enableLearning: true
      }
    });
    
    console.log('ChatGPT Response:');
    console.log('Content:', chatResponse.content);
    console.log('Model used:', chatResponse.modelUsed);
    console.log('Response time:', `${chatResponse.responseTime}ms`);
    console.log('Token usage:', chatResponse.usage);

    // Enable pattern learning
    console.log('\n4. Enabling pattern learning...');
    await client.setPatternLearning({
      enabled: true,
      sessionType: 'demo_session',
      learningLevel: 'intermediate'
    });

    // AI-enhanced automation example
    console.log('\n5. Testing AI-enhanced automation...');
    const automationResult = await client.automateWithAI({
      task: "Research information about TypeScript decorators",
      instructions: [
        "Search for TypeScript decorator documentation",
        "Extract key concepts and examples",
        "Summarize the main use cases"
      ],
      automationOptions: {
        enableLearning: true,
        aiInsights: true,
        crossSiteAdaptation: true
      }
    });

    console.log('Automation Result:');
    console.log('Success:', automationResult.success);
    console.log('AI Insights:', automationResult.aiInsights);
    console.log('Performance:', automationResult.performance);

    // Get learned patterns
    console.log('\n6. Retrieving learned patterns...');
    const patterns = await client.getPatterns();
    console.log(`Found ${patterns.length} automation patterns`);
    patterns.forEach((pattern, index) => {
      console.log(`  ${index + 1}. ${pattern.name} (confidence: ${pattern.confidence})`);
    });

    // Multi-model interaction example
    console.log('\n7. Testing with different AI models...');
    
    const gpt35Response = await client.chat({
      prompt: "What is the difference between TypeScript and JavaScript?",
      model: "gpt-3.5-turbo",
      interactionOptions: {
        maxTokens: 200,
        temperature: 0.5
      }
    });
    
    console.log('GPT-3.5 Response length:', gpt35Response.content.length);
    console.log('Tokens used:', gpt35Response.usage.totalTokens);

    // Conversational context example
    console.log('\n8. Testing contextual conversation...');
    
    const contextualResponse = await client.chat({
      prompt: "Can you give me a practical example?",
      context: {
        previousInteraction: "We were discussing TypeScript vs JavaScript",
        userPreferences: {
          codeExamples: true,
          detailLevel: "intermediate"
        }
      },
      interactionOptions: {
        contextRetention: true
      }
    });
    
    console.log('Contextual response:', contextualResponse.content.substring(0, 200) + '...');

    // Clean up
    console.log('\n9. Cleaning up...');
    await client.setPatternLearning({ enabled: false });
    await client.disconnect();
    
    console.log('\n✅ Demo completed successfully!');

  } catch (error) {
    console.error('\n❌ Demo failed:', error);
  }
}

async function demonstrateAdvancedFeatures() {
  console.log('\n🚀 Advanced Features Demo');
  console.log('==========================\n');

  try {
    const client = await createChatGPTBuddyClient(config);

    // Intelligent model selection based on task
    console.log('1. Testing intelligent model selection...');
    
    // Complex reasoning task (use GPT-4)
    const reasoningResponse = await client.chat({
      prompt: "Design a scalable architecture for a real-time collaboration platform",
      interactionOptions: {
        maxTokens: 1000,
        enableLearning: true
      }
    });
    console.log('Complex task model:', reasoningResponse.modelUsed);

    // Simple task (could use GPT-3.5)
    const simpleResponse = await client.chat({
      prompt: "What is 2 + 2?",
      model: "gpt-3.5-turbo"
    });
    console.log('Simple task model:', simpleResponse.modelUsed);

    // Workflow automation with AI insights
    console.log('\n2. Advanced workflow automation...');
    
    const workflowResult = await client.automateWithAI({
      task: "Create a comprehensive research report",
      instructions: [
        "Search for recent articles on AI automation",
        "Extract key statistics and trends",
        "Generate executive summary",
        "Create actionable recommendations"
      ],
      automationOptions: {
        enableLearning: true,
        aiInsights: true,
        errorRecovery: true
      }
    });

    console.log('Workflow insights:', workflowResult.aiInsights.length);
    console.log('Learned patterns:', workflowResult.learnedPatterns.length);
    console.log('Performance score:', workflowResult.performance.optimizationScore);

    await client.disconnect();
    console.log('\n✅ Advanced demo completed!');

  } catch (error) {
    console.error('\n❌ Advanced demo failed:', error);
  }
}

// Run the demonstrations
async function main() {
  await demonstrateChatGPTIntegration();
  await demonstrateAdvancedFeatures();
}

// Export the client and main function for use in other modules
export { createChatGPTBuddyClient, main };

// Run if this file is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
}
