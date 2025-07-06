/*
                        Web-Buddy Browser Extension

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
 * @fileoverview Content script for Web-Buddy browser extension
 * @description Handles DOM manipulation and automation commands in web pages
 * @author Web-Buddy Team
 */

/**
 * Content script handler for domain-specific automation
 */
class WebBuddyContentScript {
  private isInitialized = false;
  private currentDomain: string;
  private handlers: Map<string, Function> = new Map();

  constructor() {
    this.currentDomain = window.location.hostname;
    this.initialize();
  }

  /**
   * Initialize content script with domain-specific handlers
   */
  private initialize(): void {
    if (this.isInitialized) return;

    console.log(`🔧 Web-Buddy content script initializing for: ${this.currentDomain}`);

    // Set up message listener for background script communications
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep message channel open for async responses
    });

    // Register domain-specific handlers
    this.registerDomainHandlers();

    // Notify background script that content script is ready
    this.notifyReady();

    this.isInitialized = true;
    console.log(`✅ Web-Buddy content script initialized for: ${this.currentDomain}`);
  }

  /**
   * Register handlers based on current domain
   */
  private registerDomainHandlers(): void {
    if (this.currentDomain.includes('chatgpt.com') || this.currentDomain.includes('openai.com')) {
      this.registerChatGPTHandlers();
    } else if (this.currentDomain.includes('google.com')) {
      this.registerGoogleHandlers();
    } else if (this.currentDomain.includes('wikipedia.org')) {
      this.registerWikipediaHandlers();
    }

    console.log(`📋 Registered ${this.handlers.size} handlers for ${this.currentDomain}`);
  }

  /**
   * Register ChatGPT-specific automation handlers
   */
  private registerChatGPTHandlers(): void {
    this.handlers.set('SELECT_PROJECT', this.handleSelectProject.bind(this));
    this.handlers.set('SEND_MESSAGE', this.handleSendMessage.bind(this));
    this.handlers.set('GET_RESPONSE', this.handleGetResponse.bind(this));
  }

  /**
   * Register Google Search-specific automation handlers
   */
  private registerGoogleHandlers(): void {
    this.handlers.set('ENTER_SEARCH_TERM', this.handleEnterSearchTerm.bind(this));
    this.handlers.set('GET_SEARCH_RESULTS', this.handleGetSearchResults.bind(this));
    this.handlers.set('CLICK_RESULT', this.handleClickResult.bind(this));
  }

  /**
   * Register Wikipedia-specific automation handlers
   */
  private registerWikipediaHandlers(): void {
    this.handlers.set('SEARCH_ARTICLE', this.handleSearchArticle.bind(this));
    this.handlers.set('GET_ARTICLE_CONTENT', this.handleGetArticleContent.bind(this));
    this.handlers.set('EXTRACT_SECTIONS', this.handleExtractSections.bind(this));
  }

  /**
   * Handle incoming messages from background script
   */
  protected async handleMessage(message: any, sender: any, sendResponse: Function): Promise<void> {
    try {
      console.log(`📨 Content script received message:`, message);

      if (message.action === 'showTimeTravelUI') {
        this.showTimeTravelUI();
        sendResponse({ success: true });
        return;
      }

      // Handle automation messages
      const messageType = Object.keys(message)[0];
      const handler = this.handlers.get(messageType);

      if (handler) {
        const result = await handler(message[messageType]);
        sendResponse({ success: true, result });
      } else {
        console.warn(`⚠️ No handler found for message type: ${messageType}`);
        sendResponse({ 
          success: false, 
          error: `No handler found for message type: ${messageType}` 
        });
      }

    } catch (error) {
      console.error(`❌ Error handling message:`, error);
      sendResponse({ 
        success: false, 
        error: error.message || 'Unknown error occurred' 
      });
    }
  }

  /**
   * ChatGPT: Select project by name
   */
  protected async handleSelectProject(data: { projectName: string }): Promise<any> {
    console.log(`🎯 Selecting ChatGPT project: ${data.projectName}`);
    
    // Look for project selector or navigation
    const projectButtons = document.querySelectorAll('[data-testid*="project"], .project-item, .nav-item');
    
    for (const button of projectButtons) {
      if (button.textContent?.toLowerCase().includes(data.projectName.toLowerCase())) {
        (button as HTMLElement).click();
        console.log(`✅ Selected project: ${data.projectName}`);
        return { success: true, project: data.projectName };
      }
    }
    
    throw new Error(`Project "${data.projectName}" not found`);
  }

  /**
   * ChatGPT: Send message to chat
   */
  protected async handleSendMessage(data: { message: string }): Promise<any> {
    console.log(`💬 Sending ChatGPT message: ${data.message}`);
    
    const textarea = document.querySelector('textarea[placeholder*="Message"], #prompt-textarea') as HTMLTextAreaElement;
    if (!textarea) {
      throw new Error('Message input not found');
    }
    
    textarea.value = data.message;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    
    // Find and click send button
    const sendButton = document.querySelector('button[data-testid="send-button"], .send-button') as HTMLButtonElement;
    if (sendButton && !sendButton.disabled) {
      sendButton.click();
      console.log(`✅ Message sent: ${data.message}`);
      return { success: true, message: data.message };
    }
    
    throw new Error('Send button not found or disabled');
  }

  /**
   * ChatGPT: Get latest response
   */
  protected async handleGetResponse(): Promise<any> {
    console.log(`📥 Getting ChatGPT response`);
    
    const responseElements = document.querySelectorAll('.message-content, .response-text');
    if (responseElements.length === 0) {
      throw new Error('No responses found');
    }
    
    const latestResponse = responseElements[responseElements.length - 1];
    const responseText = latestResponse.textContent?.trim() || '';
    
    console.log(`✅ Retrieved response: ${responseText.substring(0, 100)}...`);
    return { success: true, response: responseText };
  }

  /**
   * Google: Enter search term
   */
  protected async handleEnterSearchTerm(data: { searchTerm: string }): Promise<any> {
    console.log(`🔍 Entering Google search term: ${data.searchTerm}`);
    
    const searchInput = document.querySelector('input[name="q"], .search-input') as HTMLInputElement;
    if (!searchInput) {
      throw new Error('Search input not found');
    }
    
    searchInput.value = data.searchTerm;
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    
    // Submit the search
    const searchForm = searchInput.closest('form');
    if (searchForm) {
      searchForm.submit();
    } else {
      searchInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    }
    
    console.log(`✅ Search term entered: ${data.searchTerm}`);
    return { success: true, searchTerm: data.searchTerm };
  }

  /**
   * Google: Get search results
   */
  protected async handleGetSearchResults(): Promise<any> {
    console.log(`📋 Getting Google search results`);
    
    const resultElements = document.querySelectorAll('div[data-async-context] h3, .g h3');
    const results = Array.from(resultElements).map((el, index) => ({
      index,
      title: el.textContent?.trim() || '',
      link: el.closest('a')?.href || '',
      snippet: el.closest('.g')?.querySelector('.VwiC3b')?.textContent?.trim() || ''
    }));
    
    console.log(`✅ Found ${results.length} search results`);
    return { success: true, results };
  }

  /**
   * Google: Click search result by index
   */
  protected async handleClickResult(data: { index: number }): Promise<any> {
    console.log(`🖱️ Clicking Google search result #${data.index}`);
    
    const resultElements = document.querySelectorAll('div[data-async-context] h3, .g h3');
    const targetResult = resultElements[data.index];
    
    if (!targetResult) {
      throw new Error(`Search result #${data.index} not found`);
    }
    
    const link = targetResult.closest('a') as HTMLAnchorElement;
    if (link) {
      link.click();
      console.log(`✅ Clicked search result #${data.index}: ${targetResult.textContent}`);
      return { success: true, index: data.index, title: targetResult.textContent };
    }
    
    throw new Error(`Link not found for search result #${data.index}`);
  }

  /**
   * Wikipedia: Search for article
   */
  protected async handleSearchArticle(data: { query: string }): Promise<any> {
    console.log(`📖 Searching Wikipedia for: ${data.query}`);
    
    const searchInput = document.querySelector('#searchInput, .search-input') as HTMLInputElement;
    if (!searchInput) {
      throw new Error('Wikipedia search input not found');
    }
    
    searchInput.value = data.query;
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    
    const searchButton = document.querySelector('#searchButton, .search-button') as HTMLButtonElement;
    if (searchButton) {
      searchButton.click();
    }
    
    console.log(`✅ Wikipedia search initiated: ${data.query}`);
    return { success: true, query: data.query };
  }

  /**
   * Wikipedia: Get article content
   */
  protected async handleGetArticleContent(): Promise<any> {
    console.log(`📄 Getting Wikipedia article content`);
    
    const titleElement = document.querySelector('#firstHeading, .mw-page-title-main');
    const contentElement = document.querySelector('#mw-content-text, .mw-parser-output');
    
    if (!titleElement || !contentElement) {
      throw new Error('Wikipedia article content not found');
    }
    
    const title = titleElement.textContent?.trim() || '';
    const content = contentElement.textContent?.trim().substring(0, 1000) || '';
    
    console.log(`✅ Retrieved Wikipedia article: ${title}`);
    return { success: true, title, content };
  }

  /**
   * Wikipedia: Extract article sections
   */
  protected async handleExtractSections(): Promise<any> {
    console.log(`📑 Extracting Wikipedia article sections`);
    
    const sectionHeaders = document.querySelectorAll('.mw-headline');
    const sections = Array.from(sectionHeaders).map(header => ({
      title: header.textContent?.trim() || '',
      id: header.id || '',
      level: header.closest('h1, h2, h3, h4, h5, h6')?.tagName || 'H2'
    }));
    
    console.log(`✅ Found ${sections.length} sections`);
    return { success: true, sections };
  }

  /**
   * Show time travel UI overlay
   */
  private showTimeTravelUI(): void {
    console.log(`🕰️ Showing time travel UI`);
    
    // Create overlay if it doesn't exist
    let overlay = document.getElementById('web-buddy-time-travel-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'web-buddy-time-travel-overlay';
      overlay.innerHTML = `
        <div style="
          position: fixed;
          top: 20px;
          right: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.3);
          z-index: 10000;
          font-family: Arial, sans-serif;
          max-width: 300px;
        ">
          <h3 style="margin: 0 0 10px 0; font-size: 16px;">🕰️ Time Travel Mode</h3>
          <p style="margin: 0 0 15px 0; font-size: 14px; opacity: 0.9;">
            Extension is connected and ready for automation commands.
          </p>
          <button id="web-buddy-close-overlay" style="
            background: rgba(255,255,255,0.2);
            border: 1px solid rgba(255,255,255,0.3);
            color: white;
            padding: 8px 15px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
          ">Close</button>
        </div>
      `;
      
      document.body.appendChild(overlay);
      
      // Add close functionality
      document.getElementById('web-buddy-close-overlay')?.addEventListener('click', () => {
        overlay?.remove();
      });
      
      // Auto-close after 5 seconds
      setTimeout(() => {
        overlay?.remove();
      }, 5000);
    }
  }

  /**
   * Notify background script that content script is ready
   */
  private notifyReady(): void {
    chrome.runtime.sendMessage({
      action: 'contentScriptReady',
      domain: this.currentDomain,
      url: window.location.href,
      handlers: Array.from(this.handlers.keys())
    }).catch(error => {
      console.log('📨 Could not notify background script (background may not be ready):', error?.message);
    });
  }
}

// Initialize content script
new WebBuddyContentScript();