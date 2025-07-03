/**
 * ChatGPT-buddy D-Bus Extension Popup Script
 * 
 * Provides UI for monitoring and controlling D-Bus integration.
 */

class DBusPopupController {
  constructor() {
    this.logs = [];
    this.maxLogs = 50;
    this.init();
  }
  
  init() {
    this.setupEventListeners();
    this.updateStatus();
    
    // Auto-refresh status every 5 seconds
    setInterval(() => {
      this.updateStatus();
    }, 5000);
  }
  
  setupEventListeners() {
    document.getElementById('test-connection').addEventListener('click', () => {
      this.testConnection();
    });
    
    document.getElementById('ping-dbus').addEventListener('click', () => {
      this.pingDBus();
    });
    
    document.getElementById('refresh-status').addEventListener('click', () => {
      this.updateStatus();
    });
    
    document.getElementById('toggle-logs').addEventListener('click', () => {
      this.toggleLogs();
    });
  }
  
  async updateStatus() {
    try {
      const response = await this.sendMessage({ action: 'GET_DBUS_STATUS' });
      
      const statusElement = document.getElementById('status');
      const statusText = document.getElementById('status-text');
      const attemptsValue = document.getElementById('attempts-value');
      const queueValue = document.getElementById('queue-value');
      
      if (response && response.connected) {
        statusElement.className = 'status connected';
        statusText.textContent = 'Connected to D-Bus host';
      } else {
        statusElement.className = 'status disconnected';
        statusText.textContent = 'Disconnected from D-Bus host';
      }
      
      attemptsValue.textContent = response?.connectionAttempts || 0;
      queueValue.textContent = response?.queueSize || 0;
      
      this.addLog('Status updated', { 
        connected: response?.connected, 
        attempts: response?.connectionAttempts,
        queue: response?.queueSize
      });
      
    } catch (error) {
      console.error('Failed to update status:', error);
      this.addLog('Status update failed', { error: error.message });
    }
  }
  
  async testConnection() {
    this.addLog('Testing D-Bus connection...');
    
    try {
      const response = await this.sendMessage({ 
        action: 'SEND_DBUS_TEST',
        data: {
          test: true,
          timestamp: Date.now(),
          source: 'popup'
        }
      });
      
      if (response && response.sent) {
        this.addLog('✅ Test signal sent successfully');
        this.showNotification('Test signal sent via D-Bus!', 'success');
      } else {
        this.addLog('❌ Failed to send test signal');
        this.showNotification('Failed to send test signal', 'error');
      }
      
    } catch (error) {
      this.addLog('❌ Test connection error', { error: error.message });
      this.showNotification('Test connection failed', 'error');
    }
  }
  
  async pingDBus() {
    this.addLog('Pinging D-Bus host...');
    
    try {
      const startTime = Date.now();
      const response = await this.sendMessage({ action: 'PING_DBUS' });
      const roundTripTime = Date.now() - startTime;
      
      if (response && response.pinged) {
        this.addLog(`🏓 Ping successful (${roundTripTime}ms)`);
        this.showNotification(`Ping: ${roundTripTime}ms`, 'success');
      } else {
        this.addLog('❌ Ping failed');
        this.showNotification('Ping failed', 'error');
      }
      
    } catch (error) {
      this.addLog('❌ Ping error', { error: error.message });
      this.showNotification('Ping error', 'error');
    }
  }
  
  toggleLogs() {
    const logsElement = document.getElementById('logs');
    const button = document.getElementById('toggle-logs');
    
    if (logsElement.classList.contains('hidden')) {
      logsElement.classList.remove('hidden');
      button.textContent = 'Hide Logs';
      this.updateLogsDisplay();
    } else {
      logsElement.classList.add('hidden');
      button.textContent = 'Show Logs';
    }
  }
  
  addLog(message, data = null) {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = {
      timestamp: timestamp,
      message: message,
      data: data
    };
    
    this.logs.push(logEntry);
    
    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
    
    // Update display if logs are visible
    if (!document.getElementById('logs').classList.contains('hidden')) {
      this.updateLogsDisplay();
    }
  }
  
  updateLogsDisplay() {
    const logContent = document.getElementById('log-content');
    
    if (this.logs.length === 0) {
      logContent.innerHTML = 'No logs yet...';
      return;
    }
    
    const logHTML = this.logs.map(log => {
      let content = `
        <div class="log-entry">
          <span class="log-timestamp">${log.timestamp}</span>
          <span>${log.message}</span>
      `;
      
      if (log.data) {
        content += `<br><small style="color: #666; margin-left: 60px;">${JSON.stringify(log.data, null, 2)}</small>`;
      }
      
      content += '</div>';
      return content;
    }).join('');
    
    logContent.innerHTML = logHTML;
    
    // Scroll to bottom
    logContent.scrollTop = logContent.scrollHeight;
  }
  
  showNotification(message, type = 'info') {
    // Create temporary notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      padding: 10px 15px;
      border-radius: 6px;
      color: white;
      font-weight: bold;
      z-index: 1000;
      transition: opacity 0.3s ease;
    `;
    
    switch (type) {
      case 'success':
        notification.style.background = '#28a745';
        break;
      case 'error':
        notification.style.background = '#dc3545';
        break;
      default:
        notification.style.background = '#007cba';
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
  
  sendMessage(message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  }
}

// Initialize popup controller when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new DBusPopupController();
});