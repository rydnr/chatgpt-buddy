/**
 * @fileoverview ChatGPT-Buddy Background Script
 * @description AI-enhanced background script extending Web-Buddy framework for ChatGPT automation
 * @author rydnr
 */

import { Application, Enable } from '@typescript-eda/application';
import { listen } from '@typescript-eda/domain';
import { BackgroundApplication } from '@web-buddy/browser-extension';
import {
  ConnectionRequestedEvent,
  MessageReceivedEvent,
  TabSwitchRequestedEvent,
  AutomationRequestedEvent
} from '@web-buddy/browser-extension';
import {
  ChatGPTInteractionRequestedEvent,
  AIPatternRecognitionEvent,
  TrainingModeRequestedEvent,
  LanguageModelIntegrationEvent
} from './training/domain/events/training-events';
import { TrainingApplication } from './training/application/training-application';

/**
 * ChatGPT-specific background application extending Web-Buddy base functionality
 * Adds AI automation, pattern recognition, and ChatGPT integration capabilities
 */
@Enable(TrainingApplication)
export class ChatGPTBackgroundApplication extends BackgroundApplication {
  public readonly metadata = new Map([
    ['name', 'ChatGPT-Buddy Background Application'],
    ['description', 'AI-powered browser extension for ChatGPT automation'],
    ['version', '2.0.0'],
    ['capabilities', [
      'websocket', 
      'tabManagement', 
      'messageStore', 
      'automation',
      'chatgpt-integration',
      'ai-pattern-recognition',
      'training-system',
      'language-model-routing'
    ]],
    ['supportedModels', [
      'gpt-4', 
      'gpt-4-turbo', 
      'gpt-3.5-turbo', 
      'claude-3-opus', 
      'claude-3-sonnet'
    ]]
  ]);

  private aiConfig = {
    enablePatternRecognition: true,
    enableTrainingMode: false,
    preferredModel: 'gpt-4',
    contextRetention: true,
    smartAutomation: true
  };

  constructor() {
    super();
    console.log('🤖 ChatGPT-Buddy Background Application initializing...');
  }

  /**
   * Handle ChatGPT-specific interaction requests
   */
  @listen(ChatGPTInteractionRequestedEvent)
  public async handleChatGPTInteraction(event: ChatGPTInteractionRequestedEvent): Promise<void> {
    console.log(`🤖 ChatGPT interaction requested: ${event.interactionType}`);
    
    try {
      // Get active tab for ChatGPT interaction
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.id) {
        throw new Error('No active tab found for ChatGPT interaction');
      }

      // Check if this is a ChatGPT tab
      const isChatGPTTab = tab.url?.includes('chat.openai.com') || 
                          tab.url?.includes('chatgpt.com') ||
                          tab.title?.toLowerCase().includes('chatgpt');

      if (!isChatGPTTab) {
        console.log('⚠️ Current tab is not a ChatGPT tab, attempting to find or open one');
        await this.ensureChatGPTTab();
        return;
      }

      // Send ChatGPT-specific message to content script
      const chatGPTMessage = {
        action: 'chatgpt_interaction',
        interactionType: event.interactionType,
        prompt: event.prompt,
        context: event.context,
        model: event.preferredModel || this.aiConfig.preferredModel,
        correlationId: event.correlationId
      };

      chrome.tabs.sendMessage(tab.id, chatGPTMessage, (response) => {
        if (chrome.runtime.lastError) {
          console.error('❌ Error sending ChatGPT message:', chrome.runtime.lastError.message);
        } else {
          console.log('✅ ChatGPT interaction response:', response);
        }
      });

    } catch (error) {
      console.error('❌ Error handling ChatGPT interaction:', error);
    }
  }

  /**
   * Handle AI pattern recognition events
   */
  @listen(AIPatternRecognitionEvent)
  public async handlePatternRecognition(event: AIPatternRecognitionEvent): Promise<void> {
    if (!this.aiConfig.enablePatternRecognition) {
      console.log('🔍 Pattern recognition disabled, skipping event');
      return;
    }

    console.log(`🧠 AI pattern detected: ${event.patternType}`);
    
    // Analyze pattern and suggest automation opportunities
    const suggestions = await this.analyzePattern(event);
    
    if (suggestions.length > 0) {
      console.log('💡 Automation suggestions generated:', suggestions);
      
      // Notify user of automation opportunities
      await this.notifyAutomationOpportunities(suggestions);
    }
  }

  /**
   * Handle training mode requests for pattern learning
   */
  @listen(TrainingModeRequestedEvent)
  public async handleTrainingModeRequest(event: TrainingModeRequestedEvent): Promise<void> {
    console.log(`🎓 Training mode ${event.enabled ? 'enabled' : 'disabled'}`);
    
    this.aiConfig.enableTrainingMode = event.enabled;
    
    // Get active tab and enable/disable training UI
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab.id) {
      chrome.tabs.sendMessage(tab.id, {
        action: 'toggle_training_mode',
        enabled: event.enabled,
        sessionType: event.sessionType,
        learningLevel: event.learningLevel
      });
    }
  }

  /**
   * Handle language model integration events
   */
  @listen(LanguageModelIntegrationEvent)
  public async handleLanguageModelIntegration(event: LanguageModelIntegrationEvent): Promise<void> {
    console.log(`🔄 Language model integration: ${event.modelType}`);
    
    // Route request to appropriate AI service
    switch (event.modelType) {
      case 'openai':
        await this.handleOpenAIIntegration(event);
        break;
      case 'anthropic':
        await this.handleAnthropicIntegration(event);
        break;
      default:
        console.warn(`⚠️ Unknown model type: ${event.modelType}`);
    }
  }

  /**
   * Ensure a ChatGPT tab is available, opening one if necessary
   */
  private async ensureChatGPTTab(): Promise<chrome.tabs.Tab> {
    // First, try to find an existing ChatGPT tab
    const tabs = await chrome.tabs.query({});
    const chatGPTTab = tabs.find(tab => 
      tab.url?.includes('chat.openai.com') || 
      tab.url?.includes('chatgpt.com') ||
      tab.title?.toLowerCase().includes('chatgpt')
    );

    if (chatGPTTab) {
      console.log('✅ Found existing ChatGPT tab, switching to it');
      await chrome.tabs.update(chatGPTTab.id!, { active: true });
      await chrome.windows.update(chatGPTTab.windowId!, { focused: true });
      return chatGPTTab;
    }

    // No existing tab found, create a new one
    console.log('🆕 Creating new ChatGPT tab');
    const newTab = await chrome.tabs.create({
      url: 'https://chat.openai.com',
      active: true
    });

    return newTab;
  }

  /**
   * Analyze detected patterns for automation opportunities
   */
  private async analyzePattern(event: AIPatternRecognitionEvent): Promise<string[]> {
    const suggestions: string[] = [];

    switch (event.patternType) {
      case 'repetitive_prompts':
        suggestions.push('Create prompt template for repeated queries');
        suggestions.push('Set up automated prompt sequences');
        break;
      case 'data_extraction':
        suggestions.push('Automate data extraction workflow');
        suggestions.push('Create structured output templates');
        break;
      case 'workflow_optimization':
        suggestions.push('Optimize interaction flow');
        suggestions.push('Reduce manual steps with smart automation');
        break;
      default:
        suggestions.push('General automation pattern detected');
    }

    return suggestions;
  }

  /**
   * Notify user of automation opportunities
   */
  private async notifyAutomationOpportunities(suggestions: string[]): Promise<void> {
    // For now, log to console. In future, could show notification or popup
    console.log('💡 Automation Opportunities Available:');
    suggestions.forEach((suggestion, index) => {
      console.log(`  ${index + 1}. ${suggestion}`);
    });
    
    // Could also badge the extension icon to indicate opportunities
    chrome.action.setBadgeText({ text: suggestions.length.toString() });
    chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
  }

  /**
   * Handle OpenAI API integration
   */
  private async handleOpenAIIntegration(event: LanguageModelIntegrationEvent): Promise<void> {
    console.log('🔗 Integrating with OpenAI API');
    // Implementation would send to server for API handling
  }

  /**
   * Handle Anthropic API integration
   */
  private async handleAnthropicIntegration(event: LanguageModelIntegrationEvent): Promise<void> {
    console.log('🔗 Integrating with Anthropic API');
    // Implementation would send to server for API handling
  }

  /**
   * Override Chrome message handling to add ChatGPT-specific actions
   */
  protected async handleChromeMessage(message: any, sender: any, sendResponse: Function): Promise<void> {
    // Handle ChatGPT-specific actions first
    switch (message.action) {
      case 'chatgpt_prompt':
        await this.accept(new ChatGPTInteractionRequestedEvent(
          'prompt_submission',
          message.prompt,
          message.context,
          message.model,
          message.correlationId
        ));
        sendResponse({ success: true });
        break;
        
      case 'enable_training':
        await this.accept(new TrainingModeRequestedEvent(
          true,
          message.sessionType || 'general',
          message.learningLevel || 'intermediate'
        ));
        sendResponse({ success: true });
        break;
        
      case 'disable_training':
        await this.accept(new TrainingModeRequestedEvent(false));
        sendResponse({ success: true });
        break;

      case 'get_ai_config':
        sendResponse({ 
          success: true, 
          config: this.aiConfig,
          metadata: Object.fromEntries(this.metadata)
        });
        break;

      default:
        // Fall back to parent class handling
        await super.handleChromeMessage(message, sender, sendResponse);
    }
  }

  /**
   * Initialize ChatGPT-specific functionality
   */
  public async initialize(): Promise<void> {
    console.log('🤖 Initializing ChatGPT-Buddy background application');
    
    // Initialize parent Web-Buddy functionality
    await super.initialize();
    
    // Initialize ChatGPT-specific features
    await this.initializeChatGPTFeatures();
    
    console.log('✅ ChatGPT-Buddy background application initialized');
  }

  /**
   * Initialize ChatGPT-specific features
   */
  private async initializeChatGPTFeatures(): Promise<void> {
    // Set up AI-specific configuration
    this.aiConfig.enablePatternRecognition = 
      (await chrome.storage.sync.get(['enablePatternRecognition']))?.enablePatternRecognition ?? true;
    
    this.aiConfig.preferredModel = 
      (await chrome.storage.sync.get(['preferredModel']))?.preferredModel ?? 'gpt-4';

    // Set up extension badge
    chrome.action.setBadgeText({ text: 'AI' });
    chrome.action.setBadgeBackgroundColor({ color: '#2196F3' });

    console.log('🔧 ChatGPT features initialized:', this.aiConfig);
  }
}

// Initialize and start the ChatGPT background application
const chatgptBackgroundApp = new ChatGPTBackgroundApplication();
chatgptBackgroundApp.initialize().catch(error => {
  console.error('❌ Failed to initialize ChatGPT background application:', error);
});

// Export for testing
if (typeof globalThis !== 'undefined') {
  (globalThis as any).chatgptBackgroundApp = chatgptBackgroundApp;
}