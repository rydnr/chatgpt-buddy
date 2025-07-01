/**
 * Time-Travel Debugging UI Component
 * 
 * Provides an interactive interface for debugging message flows
 * with time-travel capabilities through the message store.
 */

import { globalMessageStore, MessageStoreState, MessageState } from './message-store.js';

export class TimeTravelUI {
  private isVisible = false;
  private container: HTMLElement | null = null;
  private unsubscribe: (() => void) | null = null;
  
  constructor() {
    this.createUI();
    this.subscribeToStore();
  }

  private createUI(): void {
    // Create main container
    this.container = document.createElement('div');
    this.container.id = 'time-travel-debug-ui';
    this.container.innerHTML = `
      <style>
        #time-travel-debug-ui {
          position: fixed;
          top: 20px;
          right: 20px;
          width: 400px;
          max-height: 600px;
          background: linear-gradient(135deg, #1e1e2e 0%, #2d2d3a 100%);
          border: 2px solid #6366f1;
          border-radius: 12px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          color: #e5e7eb;
          font-family: 'Monaco', 'Consolas', monospace;
          z-index: 999999;
          display: none;
          backdrop-filter: blur(10px);
        }
        
        .tt-header {
          padding: 12px 16px;
          background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%);
          border-radius: 10px 10px 0 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: bold;
          font-size: 14px;
        }
        
        .tt-close {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          font-size: 18px;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: background 0.2s;
        }
        
        .tt-close:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        
        .tt-body {
          padding: 16px;
          max-height: 500px;
          overflow-y: auto;
        }
        
        .tt-controls {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
          align-items: center;
        }
        
        .tt-btn {
          background: #374151;
          border: 1px solid #4b5563;
          color: #e5e7eb;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s;
        }
        
        .tt-btn:hover:not(:disabled) {
          background: #4b5563;
          border-color: #6b7280;
        }
        
        .tt-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .tt-btn.active {
          background: #6366f1;
          border-color: #818cf8;
        }
        
        .tt-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 16px;
          font-size: 11px;
        }
        
        .tt-stat {
          background: #374151;
          padding: 8px;
          border-radius: 6px;
          text-align: center;
        }
        
        .tt-stat-value {
          font-size: 16px;
          font-weight: bold;
          color: #10b981;
        }
        
        .tt-messages {
          max-height: 300px;
          overflow-y: auto;
          border: 1px solid #374151;
          border-radius: 6px;
        }
        
        .tt-message {
          padding: 8px 12px;
          border-bottom: 1px solid #374151;
          cursor: pointer;
          transition: background 0.2s;
          font-size: 11px;
        }
        
        .tt-message:hover {
          background: #374151;
        }
        
        .tt-message.current {
          background: #6366f1;
          color: white;
        }
        
        .tt-message.success {
          border-left: 3px solid #10b981;
        }
        
        .tt-message.error {
          border-left: 3px solid #ef4444;
        }
        
        .tt-message.pending {
          border-left: 3px solid #f59e0b;
        }
        
        .tt-message-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }
        
        .tt-message-type {
          font-weight: bold;
          color: #60a5fa;
        }
        
        .tt-message-time {
          color: #9ca3af;
          font-size: 10px;
        }
        
        .tt-message-direction {
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 4px;
          background: #374151;
        }
        
        .tt-message-direction.inbound {
          background: #065f46;
          color: #a7f3d0;
        }
        
        .tt-message-direction.outbound {
          background: #7c2d12;
          color: #fed7aa;
        }
        
        .tt-message-details {
          font-size: 10px;
          color: #d1d5db;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .tt-timeline {
          margin-top: 12px;
          font-size: 11px;
        }
        
        .tt-timeline-slider {
          width: 100%;
          margin: 8px 0;
        }
        
        .tt-filters {
          margin-bottom: 12px;
        }
        
        .tt-filter-group {
          margin-bottom: 8px;
        }
        
        .tt-filter-label {
          font-size: 11px;
          color: #9ca3af;
          margin-bottom: 4px;
        }
        
        .tt-filter-buttons {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
        }
        
        .tt-filter-btn {
          font-size: 10px;
          padding: 3px 8px;
          background: #374151;
          border: 1px solid #4b5563;
          color: #d1d5db;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .tt-filter-btn.active {
          background: #6366f1;
          border-color: #818cf8;
          color: white;
        }
        
        .tt-export-section {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #374151;
        }
        
        .tt-export-buttons {
          display: flex;
          gap: 8px;
        }
      </style>
      
      <div class="tt-header">
        <span>🚀 Time Travel Debug</span>
        <button class="tt-close" onclick="window.timeTravelUI?.hide()">&times;</button>
      </div>
      
      <div class="tt-body">
        <div class="tt-controls">
          <button class="tt-btn" id="tt-btn-back" onclick="window.timeTravelUI?.goBack()">⬅️ Back</button>
          <button class="tt-btn" id="tt-btn-forward" onclick="window.timeTravelUI?.goForward()">➡️ Forward</button>
          <button class="tt-btn" id="tt-btn-reset" onclick="window.timeTravelUI?.resetTimeTravel()">🏠 Present</button>
          <button class="tt-btn" id="tt-btn-clear" onclick="window.timeTravelUI?.clearMessages()">🗑️ Clear</button>
        </div>
        
        <div class="tt-stats">
          <div class="tt-stat">
            <div class="tt-stat-value" id="tt-total-count">0</div>
            <div>Total Messages</div>
          </div>
          <div class="tt-stat">
            <div class="tt-stat-value" id="tt-current-index">-</div>
            <div>Current Position</div>
          </div>
        </div>
        
        <div class="tt-filters">
          <div class="tt-filter-group">
            <div class="tt-filter-label">Direction:</div>
            <div class="tt-filter-buttons">
              <button class="tt-filter-btn" data-filter="direction" data-value="inbound">📥 Inbound</button>
              <button class="tt-filter-btn" data-filter="direction" data-value="outbound">📤 Outbound</button>
            </div>
          </div>
          <div class="tt-filter-group">
            <div class="tt-filter-label">Status:</div>
            <div class="tt-filter-buttons">
              <button class="tt-filter-btn" data-filter="status" data-value="success">✅ Success</button>
              <button class="tt-filter-btn" data-filter="status" data-value="error">❌ Error</button>
              <button class="tt-filter-btn" data-filter="status" data-value="pending">⏳ Pending</button>
            </div>
          </div>
        </div>
        
        <div class="tt-timeline">
          <div>Timeline Position:</div>
          <input type="range" class="tt-timeline-slider" id="tt-timeline-slider" min="0" max="0" value="0" />
        </div>
        
        <div class="tt-messages" id="tt-messages-list">
          <!-- Messages will be populated here -->
        </div>
        
        <div class="tt-export-section">
          <div class="tt-filter-label">Export/Import:</div>
          <div class="tt-export-buttons">
            <button class="tt-btn" onclick="window.timeTravelUI?.exportMessages()">💾 Export</button>
            <button class="tt-btn" onclick="window.timeTravelUI?.importMessages()">📂 Import</button>
          </div>
        </div>
      </div>
    `;
    
    // Make globally accessible
    (window as any).timeTravelUI = this;
  }

  private subscribeToStore(): void {
    this.unsubscribe = globalMessageStore.subscribe((state: MessageStoreState) => {
      this.updateUI(state);
    });
  }

  private updateUI(state: MessageStoreState): void {
    if (!this.isVisible || !this.container) return;
    
    // Update stats
    const totalCount = document.getElementById('tt-total-count');
    const currentIndex = document.getElementById('tt-current-index');
    
    if (totalCount) totalCount.textContent = state.messages.length.toString();
    if (currentIndex) {
      currentIndex.textContent = state.isTimeTraveling ? state.currentIndex.toString() : 'Present';
    }
    
    // Update timeline slider
    const slider = document.getElementById('tt-timeline-slider') as HTMLInputElement;
    if (slider) {
      slider.max = Math.max(0, state.messages.length - 1).toString();
      slider.value = state.currentIndex.toString();
    }
    
    // Update control buttons
    const backBtn = document.getElementById('tt-btn-back') as HTMLButtonElement;
    const forwardBtn = document.getElementById('tt-btn-forward') as HTMLButtonElement;
    const resetBtn = document.getElementById('tt-btn-reset') as HTMLButtonElement;
    
    if (backBtn) backBtn.disabled = !globalMessageStore.canTimeTravelBack();
    if (forwardBtn) forwardBtn.disabled = !globalMessageStore.canTimeTravelForward();
    if (resetBtn) resetBtn.classList.toggle('active', state.isTimeTraveling);
    
    // Update messages list
    this.updateMessagesList(state);
  }

  private updateMessagesList(state: MessageStoreState): void {
    const messagesList = document.getElementById('tt-messages-list');
    if (!messagesList) return;
    
    const filteredMessages = this.getFilteredMessages(state);
    
    messagesList.innerHTML = filteredMessages.map((msg, index) => {
      const originalIndex = state.messages.indexOf(msg);
      const isCurrent = state.currentIndex === originalIndex;
      const time = new Date(msg.timestamp).toLocaleTimeString();
      
      return `
        <div class="tt-message ${msg.status} ${isCurrent ? 'current' : ''}" 
             onclick="window.timeTravelUI?.jumpToMessage(${originalIndex})">
          <div class="tt-message-header">
            <span class="tt-message-type">${msg.type}</span>
            <span class="tt-message-direction ${msg.direction}">${msg.direction}</span>
          </div>
          <div class="tt-message-details">
            ID: ${msg.correlationId.substring(0, 12)}... | ${time}
          </div>
          ${msg.error ? `<div style="color: #ef4444; font-size: 10px;">${msg.error}</div>` : ''}
        </div>
      `;
    }).join('');
  }

  private getFilteredMessages(state: MessageStoreState): MessageState[] {
    const activeFilters = this.getActiveFilters();
    let filtered = [...state.messages];
    
    if (activeFilters.directions.length > 0) {
      filtered = filtered.filter(msg => activeFilters.directions.includes(msg.direction));
    }
    
    if (activeFilters.statuses.length > 0) {
      filtered = filtered.filter(msg => activeFilters.statuses.includes(msg.status));
    }
    
    return filtered;
  }

  private getActiveFilters(): { directions: string[], statuses: string[] } {
    const directions: string[] = [];
    const statuses: string[] = [];
    
    document.querySelectorAll('.tt-filter-btn.active').forEach(btn => {
      const filterType = btn.getAttribute('data-filter');
      const value = btn.getAttribute('data-value');
      
      if (filterType === 'direction' && value) {
        directions.push(value);
      } else if (filterType === 'status' && value) {
        statuses.push(value);
      }
    });
    
    return { directions, statuses };
  }

  public show(): void {
    if (!this.container) return;
    
    if (!document.body.contains(this.container)) {
      document.body.appendChild(this.container);
    }
    
    this.container.style.display = 'block';
    this.isVisible = true;
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Initial update
    this.updateUI(globalMessageStore.getState());
  }

  public hide(): void {
    if (this.container) {
      this.container.style.display = 'none';
    }
    this.isVisible = false;
  }

  public toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  private setupEventListeners(): void {
    // Timeline slider
    const slider = document.getElementById('tt-timeline-slider') as HTMLInputElement;
    if (slider) {
      slider.addEventListener('input', () => {
        const index = parseInt(slider.value);
        this.jumpToMessage(index);
      });
    }
    
    // Filter buttons
    document.querySelectorAll('.tt-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.classList.toggle('active');
        this.updateUI(globalMessageStore.getState());
      });
    });
  }

  public goBack(): void {
    globalMessageStore.timeTravelBack();
  }

  public goForward(): void {
    globalMessageStore.timeTravelForward();
  }

  public resetTimeTravel(): void {
    globalMessageStore.resetTimeTravel();
  }

  public jumpToMessage(index: number): void {
    globalMessageStore.timeTravelTo(index);
  }

  public clearMessages(): void {
    if (confirm('Clear all messages? This cannot be undone.')) {
      globalMessageStore.clearAllMessages();
    }
  }

  public exportMessages(): void {
    try {
      const data = globalMessageStore.exportMessages();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `web-buddy-messages-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('📁 Messages exported successfully');
    } catch (error) {
      console.error('❌ Failed to export messages:', error);
      alert('Failed to export messages');
    }
  }

  public importMessages(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const success = globalMessageStore.importMessages(content);
          
          if (success) {
            console.log('📁 Messages imported successfully');
            alert('Messages imported successfully');
          } else {
            alert('Failed to import messages: Invalid format');
          }
        } catch (error) {
          console.error('❌ Failed to import messages:', error);
          alert('Failed to import messages');
        }
      };
      reader.readAsText(file);
    };
    
    input.click();
  }

  public destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    
    if (this.container && document.body.contains(this.container)) {
      document.body.removeChild(this.container);
    }
    
    delete (window as any).timeTravelUI;
  }
}

// Create global time travel UI instance
export const globalTimeTravelUI = new TimeTravelUI();

// Add keyboard shortcut to toggle time travel UI
document.addEventListener('keydown', (e) => {
  // Ctrl+Shift+T to toggle time travel UI
  if (e.ctrlKey && e.shiftKey && e.key === 'T') {
    e.preventDefault();
    globalTimeTravelUI.toggle();
  }
});

// Console helper
(window as any).showTimeTravelUI = () => globalTimeTravelUI.show();
console.log('🚀 Time Travel UI loaded. Press Ctrl+Shift+T to toggle or run showTimeTravelUI()');