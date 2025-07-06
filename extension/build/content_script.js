// Web-Buddy content script for DOM automation
// Handles automation commands from the background script
import { webBuddyStorage } from './storage';
import { contractDiscovery } from './contracts/contract-discovery-adapter';
import { contractExecution } from './contracts/contract-execution-service';
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
// Initialize contract discovery system
(async () => {
    try {
        await contractDiscovery.initialize();
        console.log('🔍 Contract discovery system initialized');
    }
    catch (error) {
        console.error('❌ Failed to initialize contract discovery:', error);
    }
})();
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    console.log('📨 Content script received message:', message);
    // Store for E2E testing
    window.extensionTestData.lastReceivedMessage = message;
    let response;
    try {
        // Handle different event types
        if (message.type === 'automationRequested') {
            response = await handleAutomationRequest(message);
        }
        else if (message.type === 'contractExecutionRequested') {
            response = await handleContractExecution(message);
        }
        else if (message.type === 'contractDiscoveryRequested') {
            response = await handleContractDiscovery(message);
        }
        else if (message.type === 'contractAvailabilityCheck') {
            response = await handleContractAvailabilityCheck(message);
        }
        else if (message.type === 'ping') {
            response = handlePingMessage(message);
        }
        else if (message.type === 'storageRequest') {
            response = await handleStorageRequest(message);
        }
        else {
            // Handle legacy action-based messages for backward compatibility
            response = await handleLegacyAction(message);
        }
    }
    catch (error) {
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
    if (response.status === 'success' && message.type === 'automationRequested') {
        await persistAutomationPattern(message, response);
    }
    sendResponse(response);
    return true; // Keep message channel open for async responses
});
// Helper function to persist automation patterns
async function persistAutomationPattern(message, response) {
    try {
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
        await webBuddyStorage.saveAutomationPattern(pattern);
        console.log('💾 Automation pattern persisted:', action);
    }
    catch (error) {
        console.error('❌ Failed to persist automation pattern:', error);
    }
}
// Helper function to save user interactions
async function saveUserInteraction(eventType, target, success, context = {}) {
    try {
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
        await webBuddyStorage.saveUserInteraction(interaction);
        console.log('📊 User interaction saved:', eventType);
    }
    catch (error) {
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
        metaDescription: document.querySelector('meta[name="description"]')?.content || '',
        elementCount: document.querySelectorAll('*').length
    };
    return btoa(JSON.stringify(context)).slice(0, 16);
}
// Enhanced automation handler with contract-based execution and pattern matching
async function handleAutomationRequest(message) {
    const { payload, correlationId } = message;
    const { action, parameters } = payload;
    console.log(`🎯 Executing automation: ${action}`, parameters);
    // Step 1: Try contract-based execution first
    try {
        const contractResult = await contractExecution.executeWithContract({
            action,
            parameters,
            domain: currentDomain
        });
        if (contractResult.success) {
            console.log('✅ Contract-based execution successful');
            return {
                correlationId,
                status: 'success',
                data: {
                    ...contractResult.data,
                    executionMethod: 'contract',
                    contractId: contractResult.contractId,
                    capabilityName: contractResult.capabilityName
                },
                timestamp: contractResult.timestamp
            };
        }
        else {
            console.log('⚠️ Contract-based execution failed, falling back to patterns');
        }
    }
    catch (contractError) {
        console.log('⚠️ Contract execution error, falling back to patterns:', contractError);
    }
    // Step 2: Check for existing patterns for this action (fallback)
    const existingPatterns = await webBuddyStorage.getAutomationPatterns({
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
            }
            catch (error) {
                console.log('⚠️ Existing pattern failed, trying next...');
            }
        }
    }
    // Step 3: Fall back to standard action handling
    return handleStandardAction(action, parameters, correlationId);
}
// Apply an existing automation pattern
async function applyAutomationPattern(pattern, newParameters, correlationId) {
    // Merge pattern parameters with new parameters (new parameters take precedence)
    const mergedParameters = { ...pattern.parameters, ...newParameters };
    return handleStandardAction(pattern.action, mergedParameters, correlationId);
}
// Standard action handler (existing logic)
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
    }
    catch (error) {
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
async function handleStorageRequest(message) {
    const { action, payload, correlationId } = message;
    console.log(`💾 Handling storage request: ${action}`);
    try {
        switch (action) {
            case 'getStorageStats':
                const stats = await webBuddyStorage.getStorageStats();
                return {
                    correlationId,
                    success: true,
                    stats: stats,
                    timestamp: new Date().toISOString()
                };
            case 'getAutomationPatterns':
                const patterns = await webBuddyStorage.getAutomationPatterns({
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
                await webBuddyStorage.clearOldData(payload.days || 30);
                return {
                    correlationId,
                    success: true,
                    message: `Cleared data older than ${payload.days || 30} days`,
                    timestamp: new Date().toISOString()
                };
            default:
                throw new Error(`Unknown storage action: ${action}`);
        }
    }
    catch (error) {
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
// Contract-based message handlers
async function handleContractExecution(message) {
    const { payload, correlationId } = message;
    const { action, parameters, preferredContract, timeout } = payload;
    console.log(`📋 Executing contract-based action: ${action}`);
    try {
        const result = await contractExecution.executeWithContract({
            action,
            parameters,
            preferredContract,
            timeout,
            domain: currentDomain
        });
        return {
            correlationId,
            status: result.success ? 'success' : 'error',
            data: result.data,
            error: result.error,
            executionTime: result.executionTime,
            contractId: result.contractId,
            capabilityName: result.capabilityName,
            timestamp: result.timestamp
        };
    }
    catch (error) {
        return {
            correlationId,
            status: 'error',
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
}
async function handleContractDiscovery(message) {
    const { correlationId } = message;
    console.log('🔍 Performing contract discovery');
    try {
        const contracts = await contractDiscovery.discoverContracts();
        const availability = await contractExecution.checkContractAvailability();
        const actions = contractExecution.getAvailableActions();
        return {
            correlationId,
            status: 'success',
            data: {
                contracts: contracts,
                availability: availability,
                availableActions: actions,
                url: currentUrl,
                domain: currentDomain
            },
            timestamp: new Date().toISOString()
        };
    }
    catch (error) {
        return {
            correlationId,
            status: 'error',
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
}
async function handleContractAvailabilityCheck(message) {
    const { correlationId } = message;
    console.log('🔍 Checking contract availability');
    try {
        const availability = await contractExecution.checkContractAvailability();
        const recommendations = contractExecution.getContractRecommendations();
        return {
            correlationId,
            status: 'success',
            data: {
                availability: availability,
                recommendations: recommendations,
                url: currentUrl,
                domain: currentDomain
            },
            timestamp: new Date().toISOString()
        };
    }
    catch (error) {
        return {
            correlationId,
            status: 'error',
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
}
// Notify background script that content script is ready
chrome.runtime.sendMessage({
    type: "CONTENT_SCRIPT_READY",
    url: window.location.href,
    timestamp: new Date().toISOString()
});
console.log('🚀 Web-Buddy content script loaded on:', window.location.href);
