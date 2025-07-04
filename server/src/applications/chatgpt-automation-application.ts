/**
 * @fileoverview ChatGPT Automation Application 
 * @description Specialized automation application for ChatGPT and language model integration
 * @author rydnr
 */

import { Application, Enable } from '@typescript-eda/application';
import { listen } from '@typescript-eda/domain';
import {
  AutomationRequestReceivedEvent,
  ExtensionConnectedEvent,
  AutomationResponseReceivedEvent
} from '@web-buddy/nodejs-server';
import { 
  ChatGPTInteractionRequestedEvent,
  ChatGPTResponseReceivedEvent,
  LanguageModelIntegrationEvent,
  AIAutomationPatternDetectedEvent
} from '../events/chatgpt-events';
import { OpenAIIntegrationAdapter } from '../adapters/openai-integration-adapter';
import { AnthropicIntegrationAdapter } from '../adapters/anthropic-integration-adapter';
import { ChatGPTPatternRecognitionAdapter } from '../adapters/chatgpt-pattern-recognition-adapter';
import { AIResponseAnalysisAdapter } from '../adapters/ai-response-analysis-adapter';

/**
 * ChatGPT-specific automation application
 * Extends Web-Buddy coordination with AI language model integration
 */
@Enable(OpenAIIntegrationAdapter)
@Enable(AnthropicIntegrationAdapter)
@Enable(ChatGPTPatternRecognitionAdapter)
@Enable(AIResponseAnalysisAdapter)
export class ChatGPTAutomationApplication extends Application {
  public readonly metadata = new Map([
    ['name', 'ChatGPT-Buddy Automation Engine'],
    ['version', '2.0.0'],
    ['capabilities', [
      'chatgpt-integration',
      'openai-api',
      'anthropic-api',
      'ai-pattern-recognition',
      'intelligent-automation',
      'language-model-routing'
    ]],
    ['supportedModels', [
      'gpt-4',
      'gpt-4-turbo',
      'gpt-3.5-turbo',
      'claude-3-opus',
      'claude-3-sonnet',
      'claude-3-haiku'
    ]]
  ]);

  private activeAIInteractions = new Map<string, AIInteractionSession>();
  private patternRecognitionEnabled = true;
  private aiInsightsEnabled = true;

  /**
   * Handle ChatGPT interaction requests from browser extensions
   */
  @listen(ChatGPTInteractionRequestedEvent)
  public async handleChatGPTInteraction(event: ChatGPTInteractionRequestedEvent): Promise<void> {
    console.log(`🤖 ChatGPT interaction requested: ${event.requestId}`);
    console.log(`💬 Prompt: ${event.prompt.substring(0, 100)}...`);
    console.log(`🎯 Model: ${event.modelPreference || 'auto'}`);

    try {
      // Create interaction session
      const session: AIInteractionSession = {
        requestId: event.requestId,
        extensionId: event.extensionId,
        startTime: new Date(),
        modelUsed: this.selectOptimalModel(event.modelPreference, event.prompt),
        context: event.context,
        status: 'processing'
      };

      this.activeAIInteractions.set(event.requestId, session);

      // Determine the best AI service for this request
      const aiService = this.selectAIService(session.modelUsed);
      
      // Send request to AI service
      const aiResponse = await aiService.generateResponse({
        prompt: event.prompt,
        model: session.modelUsed,
        context: event.context,
        options: event.options || {}
      });

      // Update session with response
      session.status = 'completed';
      session.response = aiResponse;
      session.endTime = new Date();
      session.duration = session.endTime.getTime() - session.startTime.getTime();

      console.log(`✅ ChatGPT response generated: ${event.requestId}`);
      console.log(`⏱️ Duration: ${session.duration}ms`);
      console.log(`🔤 Response length: ${aiResponse.content.length} characters`);

      // Emit response event
      // await this.emit(new ChatGPTResponseReceivedEvent(
      //   event.requestId,
      //   event.extensionId,
      //   aiResponse,
      //   session.duration
      // ));

      // Perform pattern recognition if enabled
      if (this.patternRecognitionEnabled) {
        await this.analyzeInteractionPatterns(session);
      }

    } catch (error) {
      console.error(`❌ ChatGPT interaction failed: ${event.requestId}`, error);
      
      const session = this.activeAIInteractions.get(event.requestId);
      if (session) {
        session.status = 'failed';
        session.error = error.message;
        session.endTime = new Date();
      }

      // Emit error event
      // await this.emit(new ChatGPTInteractionFailedEvent(event.requestId, error.message));
    }
  }

  /**
   * Handle automation requests with AI enhancement
   */
  @listen(AutomationRequestReceivedEvent)
  public async handleAutomationWithAI(event: AutomationRequestReceivedEvent): Promise<void> {
    console.log(`🤖 AI-enhanced automation request: ${event.requestId}`);

    // Check if this automation could benefit from AI insights
    if (this.aiInsightsEnabled && this.shouldEnhanceWithAI(event.automationPayload)) {
      console.log(`🧠 Enhancing automation with AI insights: ${event.requestId}`);
      
      try {
        const aiInsights = await this.generateAutomationInsights(event);
        
        // Store insights for later use
        this.storeAutomationInsights(event.requestId, aiInsights);
        
        console.log(`💡 AI insights generated for automation: ${event.requestId}`);
      } catch (error) {
        console.warn(`⚠️ Failed to generate AI insights for ${event.requestId}:`, error);
        // Continue with normal automation even if AI insights fail
      }
    }

    // Let the base Web-Buddy framework handle the automation routing
    // The AI insights will be available for the extension to use
  }

  /**
   * Handle automation responses with AI analysis
   */
  @listen(AutomationResponseReceivedEvent)
  public async handleAutomationResponseWithAI(event: AutomationResponseReceivedEvent): Promise<void> {
    console.log(`📊 Analyzing automation response with AI: ${event.requestId}`);

    try {
      // Analyze the automation response for improvement opportunities
      const analysisResult = await this.analyzeAutomationResponse(event);
      
      if (analysisResult.suggestions.length > 0) {
        console.log(`💡 AI suggestions for improvement:`, analysisResult.suggestions);
        
        // Store suggestions for pattern learning
        await this.storeImprovementSuggestions(event.requestId, analysisResult);
      }

      // Update pattern recognition with this execution
      if (this.patternRecognitionEnabled) {
        await this.updateAutomationPatterns(event);
      }

    } catch (error) {
      console.warn(`⚠️ Failed to analyze automation response with AI:`, error);
    }
  }

  /**
   * Handle extension connections with AI capability detection
   */
  @listen(ExtensionConnectedEvent)
  public async handleExtensionWithAICapabilities(event: ExtensionConnectedEvent): Promise<void> {
    console.log(`🔌 Extension connected with AI analysis: ${event.extensionId}`);

    // Check if extension has AI-related capabilities
    const aiCapabilities = this.detectAICapabilities(event.metadata.capabilities);
    
    if (aiCapabilities.length > 0) {
      console.log(`🤖 AI capabilities detected:`, aiCapabilities);
      
      // Configure AI-enhanced features for this extension
      await this.configureAIFeatures(event.extensionId, aiCapabilities);
    }
  }

  /**
   * Select the optimal AI model for a given request
   */
  private selectOptimalModel(preference?: string, prompt?: string): string {
    if (preference) {
      return preference;
    }

    // Simple heuristics for model selection
    const promptLength = prompt?.length || 0;
    
    if (promptLength > 8000) {
      return 'gpt-4-turbo'; // Better for longer contexts
    } else if (promptLength > 2000) {
      return 'gpt-4'; // Good balance for medium contexts
    } else {
      return 'gpt-3.5-turbo'; // Fast for short prompts
    }
  }

  /**
   * Select the appropriate AI service based on model
   */
  private selectAIService(model: string): any {
    if (model.startsWith('gpt-')) {
      return this.getAdapter('OpenAIIntegrationAdapter');
    } else if (model.startsWith('claude-')) {
      return this.getAdapter('AnthropicIntegrationAdapter');
    } else {
      // Default to OpenAI
      return this.getAdapter('OpenAIIntegrationAdapter');
    }
  }

  /**
   * Determine if automation should be enhanced with AI
   */
  private shouldEnhanceWithAI(payload: any): boolean {
    // Check for complex automation patterns that could benefit from AI
    return payload.action === 'complex_workflow' || 
           payload.options?.enableAI === true ||
           payload.target?.semanticDescription !== undefined;
  }

  /**
   * Generate AI insights for automation
   */
  private async generateAutomationInsights(event: AutomationRequestReceivedEvent): Promise<AutomationInsights> {
    const aiService = this.getAdapter('OpenAIIntegrationAdapter');
    
    const prompt = `Analyze this web automation request and provide insights:
    Action: ${event.automationPayload.action}
    Target: ${JSON.stringify(event.automationPayload.target)}
    Parameters: ${JSON.stringify(event.automationPayload.parameters)}
    
    Provide suggestions for:
    1. Potential failure points
    2. Alternative approaches
    3. Performance optimizations
    4. Error recovery strategies`;

    const response = await aiService.generateResponse({
      prompt,
      model: 'gpt-3.5-turbo',
      options: { maxTokens: 500 }
    });

    return {
      suggestions: this.parseAISuggestions(response.content),
      confidence: response.confidence || 0.8,
      generatedAt: new Date()
    };
  }

  /**
   * Analyze automation response for improvements
   */
  private async analyzeAutomationResponse(event: AutomationResponseReceivedEvent): Promise<AnalysisResult> {
    const aiService = this.getAdapter('AIResponseAnalysisAdapter');
    
    return aiService.analyzeResponse({
      success: event.response.success,
      executionTime: event.executionTime,
      result: event.response.result,
      error: event.response.error,
      metadata: event.response.metadata
    });
  }

  /**
   * Analyze interaction patterns for learning
   */
  private async analyzeInteractionPatterns(session: AIInteractionSession): Promise<void> {
    const patternAdapter = this.getAdapter('ChatGPTPatternRecognitionAdapter');
    
    await patternAdapter.analyzePattern({
      requestId: session.requestId,
      prompt: session.context?.prompt,
      response: session.response?.content,
      duration: session.duration,
      modelUsed: session.modelUsed
    });
  }

  /**
   * Detect AI capabilities from extension metadata
   */
  private detectAICapabilities(capabilities: string[]): string[] {
    const aiCapabilities = [];
    
    if (capabilities.includes('chatgpt')) aiCapabilities.push('chatgpt-integration');
    if (capabilities.includes('ai-analysis')) aiCapabilities.push('ai-response-analysis');
    if (capabilities.includes('pattern-learning')) aiCapabilities.push('pattern-recognition');
    if (capabilities.includes('language-models')) aiCapabilities.push('multi-model-support');
    
    return aiCapabilities;
  }

  /**
   * Configure AI features for extension
   */
  private async configureAIFeatures(extensionId: string, capabilities: string[]): Promise<void> {
    console.log(`⚙️ Configuring AI features for ${extensionId}:`, capabilities);
    // Implementation would configure specific AI features based on capabilities
  }

  /**
   * Helper methods for data management
   */
  private storeAutomationInsights(requestId: string, insights: AutomationInsights): void {
    // Implementation would store insights for later retrieval
    console.log(`💾 Storing automation insights for ${requestId}`);
  }

  private async storeImprovementSuggestions(requestId: string, analysis: AnalysisResult): Promise<void> {
    // Implementation would store suggestions for pattern improvement
    console.log(`📝 Storing improvement suggestions for ${requestId}`);
  }

  private async updateAutomationPatterns(event: AutomationResponseReceivedEvent): Promise<void> {
    // Implementation would update learned patterns
    console.log(`📊 Updating automation patterns from ${event.requestId}`);
  }

  private parseAISuggestions(content: string): string[] {
    // Simple parsing - in real implementation would be more sophisticated
    return content.split('\n').filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'));
  }

  private getAdapter(name: string): any {
    // In real TypeScript-EDA implementation, this would resolve adapters
    return {
      generateResponse: async () => ({ content: 'Mock response', confidence: 0.9 }),
      analyzeResponse: async () => ({ suggestions: [], confidence: 0.8 }),
      analyzePattern: async () => {}
    };
  }

  /**
   * Get current AI interaction statistics
   */
  public getAIStatistics(): AIStatistics {
    const sessions = Array.from(this.activeAIInteractions.values());
    const completed = sessions.filter(s => s.status === 'completed');
    const failed = sessions.filter(s => s.status === 'failed');
    
    return {
      totalInteractions: sessions.length,
      completedInteractions: completed.length,
      failedInteractions: failed.length,
      averageResponseTime: completed.reduce((sum, s) => sum + (s.duration || 0), 0) / completed.length || 0,
      modelUsage: this.calculateModelUsage(sessions)
    };
  }

  private calculateModelUsage(sessions: AIInteractionSession[]): Record<string, number> {
    const usage: Record<string, number> = {};
    sessions.forEach(session => {
      usage[session.modelUsed] = (usage[session.modelUsed] || 0) + 1;
    });
    return usage;
  }

  /**
   * Application lifecycle methods
   */
  public async start(): Promise<void> {
    console.log('🤖 ChatGPT Automation Application starting...');
    console.log(`🧠 Pattern Recognition: ${this.patternRecognitionEnabled ? 'Enabled' : 'Disabled'}`);
    console.log(`💡 AI Insights: ${this.aiInsightsEnabled ? 'Enabled' : 'Disabled'}`);
    console.log(`🎯 Supported Models: ${Array.from(this.metadata.get('supportedModels') as string[]).join(', ')}`);
  }

  public async shutdown(): Promise<void> {
    console.log('🤖 ChatGPT Automation Application shutting down...');
    
    // Clean up active interactions
    this.activeAIInteractions.clear();
    
    console.log('✅ ChatGPT Automation Application shutdown complete');
  }
}

// Supporting interfaces

interface AIInteractionSession {
  requestId: string;
  extensionId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  modelUsed: string;
  context?: any;
  response?: any;
  status: 'processing' | 'completed' | 'failed';
  error?: string;
}

interface AutomationInsights {
  suggestions: string[];
  confidence: number;
  generatedAt: Date;
}

interface AnalysisResult {
  suggestions: string[];
  confidence: number;
}

interface AIStatistics {
  totalInteractions: number;
  completedInteractions: number;
  failedInteractions: number;
  averageResponseTime: number;
  modelUsage: Record<string, number>;
}