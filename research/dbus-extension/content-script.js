/**
 * ChatGPT-buddy D-Bus Integration Content Script
 * 
 * This content script handles automation commands received via D-Bus
 * and executes them on the current webpage.
 */

class DBusAutomationHandler {
  constructor() {
    this.init();
  }
  
  init() {
    console.log('🎯 D-Bus automation handler initialized on:', window.location.href);
    
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep message channel open for async response
    });
    
    // Inject automation status indicator
    this.injectStatusIndicator();
  }
  
  async handleMessage(message, sender, sendResponse) {
    try {
      console.log('📩 Content script received message:', message);
      
      const { action, payload, correlationId } = message;
      let result;
      
      switch (action) {
        case 'SELECT_PROJECT':
          result = await this.selectProject(payload);
          break;
          
        case 'FILL_PROMPT':
          result = await this.fillPrompt(payload);
          break;
          
        case 'GET_RESPONSE':
          result = await this.getResponse(payload);
          break;
          
        case 'CLICK_ELEMENT':
          result = await this.clickElement(payload);
          break;
          
        case 'GET_PAGE_INFO':
          result = await this.getPageInfo(payload);
          break;
          
        default:
          result = { success: false, error: `Unknown action: ${action}` };
      }
      
      console.log(`✅ Action ${action} completed:`, result);
      sendResponse(result);
      
    } catch (error) {
      console.error('❌ Error executing automation:', error);
      sendResponse({ 
        success: false, 
        error: error.message,
        stack: error.stack 
      });
    }
  }
  
  async selectProject(payload) {
    const { selector, value } = payload;
    
    try {
      // Find the project selector element
      const element = document.querySelector(selector);
      
      if (!element) {
        return { 
          success: false, 
          error: `Element not found: ${selector}` 
        };
      }
      
      // Handle different types of elements
      if (element.tagName === 'SELECT') {
        // Dropdown selection
        const option = Array.from(element.options).find(opt => 
          opt.value === value || opt.textContent.includes(value)
        );
        
        if (option) {
          element.value = option.value;
          element.dispatchEvent(new Event('change', { bubbles: true }));
          
          return { 
            success: true, 
            selectedValue: option.value,
            selectedText: option.textContent
          };
        } else {
          return { 
            success: false, 
            error: `Option not found: ${value}` 
          };
        }
        
      } else if (element.tagName === 'INPUT') {
        // Input field
        element.focus();
        element.value = value;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        
        return { 
          success: true, 
          value: element.value 
        };
        
      } else {
        // Clickable element (button, div, etc.)
        this.simulateClick(element);
        
        return { 
          success: true, 
          clicked: true,
          elementText: element.textContent.trim()
        };
      }
      
    } catch (error) {
      return { 
        success: false, 
        error: error.message 
      };
    }
  }
  
  async fillPrompt(payload) {
    const { selector, value } = payload;
    
    try {
      const element = document.querySelector(selector);
      
      if (!element) {
        return { 
          success: false, 
          error: `Element not found: ${selector}` 
        };
      }
      
      // Focus the element
      element.focus();
      
      // Clear existing content
      if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
        element.select();
        element.value = '';
      } else if (element.contentEditable === 'true') {
        element.textContent = '';
      }
      
      // Type the new content with realistic timing
      await this.typeText(element, value);
      
      return { 
        success: true, 
        text: value,
        elementType: element.tagName.toLowerCase()
      };
      
    } catch (error) {
      return { 
        success: false, 
        error: error.message 
      };
    }
  }
  
  async getResponse(payload) {
    const { selector, timeout = 30000 } = payload;
    
    try {
      // Wait for response element to appear or change
      const result = await this.waitForElement(selector, timeout);
      
      if (result.success) {
        return {
          success: true,
          text: result.element.textContent.trim(),
          html: result.element.innerHTML,
          timestamp: Date.now()
        };
      } else {
        return result;
      }
      
    } catch (error) {
      return { 
        success: false, 
        error: error.message 
      };
    }
  }
  
  async clickElement(payload) {
    const { selector } = payload;
    
    try {
      const element = document.querySelector(selector);
      
      if (!element) {
        return { 
          success: false, 
          error: `Element not found: ${selector}` 
        };
      }
      
      // Scroll element into view
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Wait a moment for scroll to complete
      await this.delay(500);
      
      // Simulate click
      this.simulateClick(element);
      
      return { 
        success: true, 
        clicked: true,
        elementText: element.textContent.trim(),
        elementTag: element.tagName.toLowerCase()
      };
      
    } catch (error) {
      return { 
        success: false, 
        error: error.message 
      };
    }
  }
  
  async getPageInfo(payload) {
    try {
      const info = {
        url: window.location.href,
        title: document.title,
        domain: window.location.hostname,
        path: window.location.pathname,
        timestamp: Date.now(),
        readyState: document.readyState,
        elementCounts: {
          inputs: document.querySelectorAll('input').length,
          buttons: document.querySelectorAll('button').length,
          textareas: document.querySelectorAll('textarea').length,
          selects: document.querySelectorAll('select').length
        }
      };
      
      // Check for specific ChatGPT elements
      if (window.location.hostname.includes('chatgpt.com') || 
          window.location.hostname.includes('chat.openai.com')) {
        info.chatgptElements = {
          promptTextarea: !!document.querySelector('textarea[placeholder*="message"]'),
          conversationElements: document.querySelectorAll('[data-message-author-role]').length,
          modelSelector: !!document.querySelector('select, [role="combobox"]'),
          sendButton: !!document.querySelector('button[data-testid="send-button"]')
        };
      }
      
      return { 
        success: true, 
        pageInfo: info 
      };
      
    } catch (error) {
      return { 
        success: false, 
        error: error.message 
      };
    }
  }
  
  simulateClick(element) {
    // Create realistic click event sequence
    const events = ['mousedown', 'mouseup', 'click'];
    
    events.forEach(eventType => {
      const event = new MouseEvent(eventType, {
        bubbles: true,
        cancelable: true,
        view: window,
        button: 0,
        buttons: 1,
        clientX: element.getBoundingClientRect().left + element.offsetWidth / 2,
        clientY: element.getBoundingClientRect().top + element.offsetHeight / 2
      });
      
      element.dispatchEvent(event);
    });
  }
  
  async typeText(element, text, typingSpeed = 50) {
    // Simulate realistic typing
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      // Add character to element
      if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
        element.value += char;
        element.dispatchEvent(new Event('input', { bubbles: true }));
      } else if (element.contentEditable === 'true') {
        element.textContent += char;
        element.dispatchEvent(new Event('input', { bubbles: true }));
      }
      
      // Random typing delay for realism
      const delay = typingSpeed + Math.random() * 30;
      await this.delay(delay);
    }
    
    // Fire final change event
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }
  
  async waitForElement(selector, timeout = 10000) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const checkElement = () => {
        const element = document.querySelector(selector);
        
        if (element) {
          resolve({ 
            success: true, 
            element: element,
            waitTime: Date.now() - startTime
          });
        } else if (Date.now() - startTime >= timeout) {
          resolve({ 
            success: false, 
            error: `Element not found within ${timeout}ms: ${selector}`,
            waitTime: Date.now() - startTime
          });
        } else {
          setTimeout(checkElement, 100);
        }
      };
      
      checkElement();
    });
  }
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  injectStatusIndicator() {
    // Create a small status indicator to show D-Bus connection status
    const indicator = document.createElement('div');
    indicator.id = 'chatgpt-buddy-dbus-indicator';
    indicator.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #4CAF50;
      border: 2px solid #fff;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      z-index: 10000;
      cursor: pointer;
      transition: all 0.3s ease;
    `;
    indicator.title = 'ChatGPT-buddy D-Bus Integration Active';
    
    // Add click handler to show status
    indicator.addEventListener('click', () => {
      this.showStatusDialog();
    });
    
    document.body.appendChild(indicator);
    
    // Check D-Bus status periodically
    setInterval(() => {
      chrome.runtime.sendMessage({ action: 'GET_DBUS_STATUS' }, (response) => {
        if (response && response.connected) {
          indicator.style.background = '#4CAF50'; // Green for connected
          indicator.title = 'ChatGPT-buddy D-Bus: Connected';
        } else {
          indicator.style.background = '#f44336'; // Red for disconnected
          indicator.title = 'ChatGPT-buddy D-Bus: Disconnected';
        }
      });
    }, 5000);
  }
  
  showStatusDialog() {
    // Create status dialog
    const dialog = document.createElement('div');
    dialog.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10001;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 400px;
    `;
    
    chrome.runtime.sendMessage({ action: 'GET_DBUS_STATUS' }, (response) => {
      dialog.innerHTML = `
        <h3 style="margin: 0 0 15px 0; color: #333;">ChatGPT-buddy D-Bus Status</h3>
        <p><strong>Connection:</strong> ${response?.connected ? '✅ Connected' : '❌ Disconnected'}</p>
        <p><strong>Attempts:</strong> ${response?.connectionAttempts || 0}</p>
        <p><strong>Queue Size:</strong> ${response?.queueSize || 0}</p>
        <p><strong>Page:</strong> ${window.location.hostname}</p>
        <button id="test-dbus" style="margin: 10px 5px 0 0; padding: 8px 16px; background: #007cba; color: white; border: none; border-radius: 4px; cursor: pointer;">Test D-Bus</button>
        <button id="close-dialog" style="margin: 10px 0 0 5px; padding: 8px 16px; background: #666; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
      `;
      
      // Add event listeners
      dialog.querySelector('#test-dbus').addEventListener('click', () => {
        chrome.runtime.sendMessage({ 
          action: 'SEND_DBUS_TEST', 
          data: { page: window.location.href, timestamp: Date.now() }
        }, (response) => {
          alert(response?.sent ? 'Test signal sent!' : 'Failed to send test signal');
        });
      });
      
      dialog.querySelector('#close-dialog').addEventListener('click', () => {
        document.body.removeChild(dialog);
      });
      
      document.body.appendChild(dialog);
      
      // Auto-close after 10 seconds
      setTimeout(() => {
        if (document.body.contains(dialog)) {
          document.body.removeChild(dialog);
        }
      }, 10000);
    });
  }
}

// Initialize automation handler when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new DBusAutomationHandler();
  });
} else {
  new DBusAutomationHandler();
}