// Web-Buddy content script for DOM automation with IndexedDB storage
// Handles automation commands from the background script and persists patterns

// Store test data for E2E testing
window.extensionTestData = {
  lastReceivedMessage: null,
  lastResponse: null,
  webSocketMessages: []
};

// Generate session ID for tracking user interactions
const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
const currentDomain = window.location.hostname;
const currentUrl = window.location.href;

console.log('🚀 Web-Buddy content script with storage loaded on:', window.location.href);

// Wait for storage to initialize and add debugging
let storageCheckAttempts = 0;
const maxStorageCheckAttempts = 10;

function checkStorageReady() {
  storageCheckAttempts++;
  console.log(`💾 Storage check attempt ${storageCheckAttempts}:`, !!window.webBuddyStorage);
  
  if (window.webBuddyStorage) {
    console.log('✅ Storage system ready');
    return true;
  } else if (storageCheckAttempts < maxStorageCheckAttempts) {
    setTimeout(checkStorageReady, 500);
    return false;
  } else {
    console.error('❌ Storage system failed to initialize after 5 seconds');
    return false;
  }
}

// Start storage check
setTimeout(checkStorageReady, 100);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 Content script received message:', message);
  
  // Store for E2E testing
  window.extensionTestData.lastReceivedMessage = message;
  
  // Handle the message asynchronously
  handleMessageAsync(message, sender, sendResponse);
  
  return true; // Keep message channel open for async responses
});

async function handleMessageAsync(message, sender, sendResponse) {
  let response;

  try {
    // Handle different event types
    if (message.type === 'automationRequested') {
      response = await handleAutomationRequest(message);
    } else if (message.type === 'ping') {
      response = handlePingMessage(message);
    } else if (message.type === 'storageRequest') {
      response = await handleStorageRequest(message);
    } else {
      // Handle legacy action-based messages for backward compatibility
      response = await handleLegacyAction(message);
    }
    
  } catch (error) {
    console.error('❌ Error in content script:', error);
    response = {
      correlationId: message.correlationId,
      status: 'error',
      error: error.message || 'Unknown content script error',
      timestamp: new Date().toISOString()
    };
  }

  // Store response for E2E testing
  window.extensionTestData.lastResponse = response;
  
  // Persist automation pattern if it was successful
  if (response && response.status === 'success' && message.type === 'automationRequested') {
    try {
      await persistAutomationPattern(message, response);
    } catch (persistError) {
      console.error('❌ Failed to persist pattern:', persistError);
    }
  }
  
  console.log('📤 Content script sending response:', response);
  sendResponse(response);
}

// Helper function to persist automation patterns
async function persistAutomationPattern(message, response) {
  try {
    if (!window.webBuddyStorage) {
      console.warn('⚠️ Storage not available, skipping pattern persistence');
      return;
    }
    
    const { payload } = message;
    const { action, parameters } = payload;
    
    const pattern = {
      url: currentUrl,
      domain: currentDomain,
      action: action,
      selector: parameters.selector || '',
      parameters: parameters,
      success: response.status === 'success',
      contextHash: generateContextHash(),
      userConfirmed: false // Will be updated when user confirms the pattern
    };

    await window.webBuddyStorage.saveAutomationPattern(pattern);
    console.log('💾 Automation pattern persisted:', action);
  } catch (error) {
    console.error('❌ Failed to persist automation pattern:', error);
  }
}

// Helper function to save user interactions
async function saveUserInteraction(eventType, target, success, context = {}) {
  try {
    if (!window.webBuddyStorage) {
      console.warn('⚠️ Storage not available, skipping interaction save');
      return;
    }
    
    const interaction = {
      sessionId,
      url: currentUrl,
      domain: currentDomain,
      eventType,
      target,
      success,
      context: {
        ...context,
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      }
    };

    await window.webBuddyStorage.saveUserInteraction(interaction);
    console.log('📊 User interaction saved:', eventType);
  } catch (error) {
    console.error('❌ Failed to save user interaction:', error);
  }
}

// Generate context hash for pattern matching
function generateContextHash() {
  const context = {
    domain: currentDomain,
    path: window.location.pathname,
    title: document.title,
    bodyClasses: Array.from(document.body.classList).sort().join(' '),
    metaDescription: (document.querySelector('meta[name="description"]'))?.content || '',
    elementCount: document.querySelectorAll('*').length
  };
  
  return btoa(JSON.stringify(context)).slice(0, 16);
}

// Enhanced automation handler with pattern matching
async function handleAutomationRequest(message) {
  const { payload, correlationId } = message;
  const { action, parameters } = payload;
  
  console.log(`🎯 Executing automation: ${action}`, parameters);
  
  // Check for existing patterns for this action
  if (window.webBuddyStorage) {
    try {
      const existingPatterns = await window.webBuddyStorage.getAutomationPatterns({
        domain: currentDomain,
        action: action,
        successOnly: true,
        limit: 5
      });
      
      if (existingPatterns.length > 0) {
        console.log(`📚 Found ${existingPatterns.length} existing patterns for ${action}`);
        
        // Try to apply the most successful pattern first
        for (const pattern of existingPatterns) {
          try {
            const result = await applyAutomationPattern(pattern, parameters, correlationId);
            if (result.status === 'success') {
              console.log('✅ Applied existing pattern successfully');
              return result;
            }
          } catch (error) {
            console.log('⚠️ Existing pattern failed, trying next...');
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Error checking existing patterns:', error);
    }
  }
  
  // Fall back to standard action handling
  return handleStandardAction(action, parameters, correlationId);
}

// Apply an existing automation pattern
async function applyAutomationPattern(pattern, newParameters, correlationId) {
  // Merge pattern parameters with new parameters (new parameters take precedence)
  const mergedParameters = { ...pattern.parameters, ...newParameters };
  
  return handleStandardAction(pattern.action, mergedParameters, correlationId);
}

// Standard action handler
async function handleStandardAction(action, parameters, correlationId) {
  try {
    switch (action) {
      case 'fillInput':
        return await handleFillInput(parameters, correlationId);
      
      case 'clickElement':
        return await handleClickElement(parameters, correlationId);
      
      case 'getText':
        return await handleGetText(parameters, correlationId);
      
      case 'testAction':
        return await handleTestAction(parameters, correlationId);
      
      default:
        throw new Error(`Unknown automation action: ${action}`);
    }
  } catch (error) {
    return {
      correlationId,
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

async function handleFillInput(parameters, correlationId) {
  const { selector, value } = parameters;
  
  const element = document.querySelector(selector);
  if (!element) {
    // Save failed interaction
    await saveUserInteraction('fillInput', selector, false, { 
      error: 'Element not found',
      value: value 
    });
    throw new Error(`Element not found: ${selector}`);
  }
  
  if (element.tagName.toLowerCase() !== 'input' && element.tagName.toLowerCase() !== 'textarea') {
    // Save failed interaction
    await saveUserInteraction('fillInput', selector, false, { 
      error: 'Invalid element type',
      actualTag: element.tagName.toLowerCase(),
      value: value 
    });
    throw new Error(`Element is not an input or textarea: ${selector}`);
  }
  
  // Perform the action
  const oldValue = element.value;
  element.value = value;
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
  
  // Save successful interaction
  await saveUserInteraction('fillInput', selector, true, {
    oldValue: oldValue,
    newValue: value,
    elementTag: element.tagName.toLowerCase(),
    elementType: element.type || 'text'
  });
  
  return {
    correlationId,
    status: 'success',
    data: {
      action: 'fillInput',
      selector,
      value,
      elementTag: element.tagName.toLowerCase(),
      oldValue: oldValue
    },
    timestamp: new Date().toISOString()
  };
}

async function handleClickElement(parameters, correlationId) {
  const { selector } = parameters;
  
  const element = document.querySelector(selector);
  if (!element) {
    // Save failed interaction
    await saveUserInteraction('clickElement', selector, false, { 
      error: 'Element not found' 
    });
    throw new Error(`Element not found: ${selector}`);
  }
  
  // Capture element info before click
  const elementInfo = {
    tag: element.tagName.toLowerCase(),
    text: element.textContent?.slice(0, 100) || '',
    className: element.className,
    id: element.id,
    href: element.href || undefined,
    disabled: element.disabled || false
  };
  
  // Perform the click
  element.click();
  
  // Save successful interaction
  await saveUserInteraction('clickElement', selector, true, {
    elementInfo: elementInfo,
    clickType: 'automated'
  });
  
  return {
    correlationId,
    status: 'success',
    data: {
      action: 'clickElement',
      selector,
      elementTag: element.tagName.toLowerCase(),
      elementInfo: elementInfo
    },
    timestamp: new Date().toISOString()
  };
}

async function handleGetText(parameters, correlationId) {
  const { selector } = parameters;
  
  const element = document.querySelector(selector);
  if (!element) {
    // Save failed interaction
    await saveUserInteraction('getText', selector, false, { 
      error: 'Element not found' 
    });
    throw new Error(`Element not found: ${selector}`);
  }
  
  const text = element.textContent || element.innerHTML;
  
  // Save successful interaction
  await saveUserInteraction('getText', selector, true, {
    textLength: text.length,
    elementTag: element.tagName.toLowerCase(),
    hasText: !!element.textContent,
    hasHtml: !!element.innerHTML
  });
  
  return {
    correlationId,
    status: 'success',
    data: {
      action: 'getText',
      selector,
      text,
      elementTag: element.tagName.toLowerCase()
    },
    timestamp: new Date().toISOString()
  };
}

async function handleTestAction(parameters, correlationId) {
  // Simple test action for E2E verification
  
  // Save test interaction
  await saveUserInteraction('testAction', 'test-target', true, {
    message: parameters.message || 'Test action executed successfully',
    parameters: parameters
  });
  
  return {
    correlationId,
    status: 'success',
    data: {
      action: 'testAction',
      message: parameters.message || 'Test action executed successfully',
      timestamp: new Date().toISOString(),
      url: window.location.href,
      title: document.title
    },
    timestamp: new Date().toISOString()
  };
}

async function handleStorageRequest(message) {
  const { action, payload, correlationId } = message;
  
  console.log(`💾 Handling storage request: ${action}`, message);
  console.log(`💾 Storage available:`, !!window.webBuddyStorage);
  console.log(`💾 Storage DB state:`, window.webBuddyStorage?.db ? 'ready' : 'not ready');
  
  if (!window.webBuddyStorage) {
    console.error('❌ Storage system not available');
    return {
      correlationId,
      success: false,
      error: 'Storage system not available',
      timestamp: new Date().toISOString()
    };
  }
  
  try {
    switch (action) {
      case 'getStorageStats':
        const stats = await window.webBuddyStorage.getStorageStats();
        return {
          correlationId,
          success: true,
          stats: stats,
          timestamp: new Date().toISOString()
        };
      
      case 'getAutomationPatterns':
        const patterns = await window.webBuddyStorage.getAutomationPatterns({
          domain: currentDomain,
          limit: payload.limit || 10
        });
        return {
          correlationId,
          success: true,
          patterns: patterns,
          timestamp: new Date().toISOString()
        };
      
      case 'clearOldData':
        await window.webBuddyStorage.clearOldData(payload.days || 30);
        return {
          correlationId,
          success: true,
          message: `Cleared data older than ${payload.days || 30} days`,
          timestamp: new Date().toISOString()
        };
      
      default:
        throw new Error(`Unknown storage action: ${action}`);
    }
  } catch (error) {
    console.error('❌ Storage request failed:', error);
    return {
      correlationId,
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

async function handleLegacyAction(message) {
  // Handle legacy action-based messages for backward compatibility
  const { action, correlationId } = message;
  
  console.log(`🔄 Handling legacy action: ${action}`);
  
  // Save legacy interaction
  await saveUserInteraction('legacyAction', action, true, {
    actionType: action,
    message: message
  });
  
  return {
    correlationId,
    status: 'success',
    data: `Legacy action ${action} executed successfully (placeholder)`,
    timestamp: new Date().toISOString()
  };
}

function handlePingMessage(message) {
  return {
    type: 'pong',
    correlationId: message.correlationId,
    payload: {
      originalMessage: message.payload || 'ping',
      url: window.location.href,
      title: document.title,
      timestamp: new Date().toISOString()
    }
  };
}

// Notify background script that content script is ready
function notifyBackgroundReady() {
  chrome.runtime.sendMessage({ 
    type: "CONTENT_SCRIPT_READY", 
    url: window.location.href,
    timestamp: new Date().toISOString(),
    storageReady: !!window.webBuddyStorage
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.log('📨 Background script not ready yet:', chrome.runtime.lastError.message);
    } else {
      console.log('✅ Background script notified of content script readiness');
    }
  });
}

// Send ready notification after storage is initialized
setTimeout(() => {
  notifyBackgroundReady();
  // Send again after a delay to ensure background script is ready
  setTimeout(notifyBackgroundReady, 2000);
}, 1000);

console.log('🚀 Web-Buddy content script with IndexedDB storage loaded on:', window.location.href);