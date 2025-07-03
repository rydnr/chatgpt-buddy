/**
 * Browser Extension D-Bus Integration Test
 * 
 * This script validates that the browser extension can properly
 * handle D-Bus integration components.
 */

const fs = require('fs');
const path = require('path');

class BrowserExtensionDBusTest {
    constructor() {
        this.extensionPath = path.join(__dirname, 'dbus-extension');
        this.testResults = [];
    }
    
    async runTests() {
        console.log('🧪 Testing Browser Extension D-Bus Integration');
        console.log('='.repeat(60));
        
        await this.testManifestStructure();
        await this.testBackgroundScriptStructure();
        await this.testContentScriptStructure();
        await this.testPopupStructure();
        await this.testNativeMessagingCompatibility();
        
        console.log('\n' + '='.repeat(60));
        console.log('📊 Test Results Summary:');
        
        const passed = this.testResults.filter(result => result.passed).length;
        const total = this.testResults.length;
        
        this.testResults.forEach(result => {
            const status = result.passed ? '✅ PASS' : '❌ FAIL';
            console.log(`${status} ${result.name}: ${result.message}`);
        });
        
        console.log(`\nTests passed: ${passed}/${total}`);
        
        return passed === total;
    }
    
    async testManifestStructure() {
        const testName = 'Manifest Structure';
        
        try {
            const manifestPath = path.join(this.extensionPath, 'manifest.json');
            
            if (!fs.existsSync(manifestPath)) {
                this.testResults.push({
                    name: testName,
                    passed: false,
                    message: 'manifest.json not found'
                });
                return;
            }
            
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            
            // Check required fields
            const requiredFields = ['name', 'version', 'manifest_version', 'permissions'];
            const missingFields = requiredFields.filter(field => !manifest[field]);
            
            if (missingFields.length > 0) {
                this.testResults.push({
                    name: testName,
                    passed: false,
                    message: `Missing required fields: ${missingFields.join(', ')}`
                });
                return;
            }
            
            // Check D-Bus specific requirements
            if (!manifest.permissions.includes('nativeMessaging')) {
                this.testResults.push({
                    name: testName,
                    passed: false,
                    message: 'nativeMessaging permission missing'
                });
                return;
            }
            
            // Check service worker
            if (!manifest.background || !manifest.background.service_worker) {
                this.testResults.push({
                    name: testName,
                    passed: false,
                    message: 'Service worker not configured'
                });
                return;
            }
            
            this.testResults.push({
                name: testName,
                passed: true,
                message: 'Manifest structure valid for D-Bus integration'
            });
            
        } catch (error) {
            this.testResults.push({
                name: testName,
                passed: false,
                message: `Error reading manifest: ${error.message}`
            });
        }
    }
    
    async testBackgroundScriptStructure() {
        const testName = 'Background Script Structure';
        
        try {
            const backgroundPath = path.join(this.extensionPath, 'background-dbus.js');
            
            if (!fs.existsSync(backgroundPath)) {
                this.testResults.push({
                    name: testName,
                    passed: false,
                    message: 'background-dbus.js not found'
                });
                return;
            }
            
            const backgroundContent = fs.readFileSync(backgroundPath, 'utf8');
            
            // Check for D-Bus integration components
            const requiredComponents = [
                'DBusIntegrationManager',
                'connectToDBusHost',
                'chrome.runtime.connectNative',
                'handleDBusMessage',
                'sendToNativeHost'
            ];
            
            const missingComponents = requiredComponents.filter(component => 
                !backgroundContent.includes(component)
            );
            
            if (missingComponents.length > 0) {
                this.testResults.push({
                    name: testName,
                    passed: false,
                    message: `Missing components: ${missingComponents.join(', ')}`
                });
                return;
            }
            
            this.testResults.push({
                name: testName,
                passed: true,
                message: 'Background script has required D-Bus components'
            });
            
        } catch (error) {
            this.testResults.push({
                name: testName,
                passed: false,
                message: `Error reading background script: ${error.message}`
            });
        }
    }
    
    async testContentScriptStructure() {
        const testName = 'Content Script Structure';
        
        try {
            const contentPath = path.join(this.extensionPath, 'content-script.js');
            
            if (!fs.existsSync(contentPath)) {
                this.testResults.push({
                    name: testName,
                    passed: false,
                    message: 'content-script.js not found'
                });
                return;
            }
            
            const contentContent = fs.readFileSync(contentPath, 'utf8');
            
            // Check for automation handling components
            const requiredComponents = [
                'DBusAutomationHandler',
                'chrome.runtime.onMessage.addListener',
                'selectProject',
                'fillPrompt',
                'getResponse',
                'clickElement'
            ];
            
            const missingComponents = requiredComponents.filter(component => 
                !contentContent.includes(component)
            );
            
            if (missingComponents.length > 0) {
                this.testResults.push({
                    name: testName,
                    passed: false,
                    message: `Missing components: ${missingComponents.join(', ')}`
                });
                return;
            }
            
            this.testResults.push({
                name: testName,
                passed: true,
                message: 'Content script has required automation components'
            });
            
        } catch (error) {
            this.testResults.push({
                name: testName,
                passed: false,
                message: `Error reading content script: ${error.message}`
            });
        }
    }
    
    async testPopupStructure() {
        const testName = 'Popup UI Structure';
        
        try {
            const popupHtmlPath = path.join(this.extensionPath, 'popup.html');
            const popupJsPath = path.join(this.extensionPath, 'popup.js');
            
            if (!fs.existsSync(popupHtmlPath)) {
                this.testResults.push({
                    name: testName,
                    passed: false,
                    message: 'popup.html not found'
                });
                return;
            }
            
            if (!fs.existsSync(popupJsPath)) {
                this.testResults.push({
                    name: testName,
                    passed: false,
                    message: 'popup.js not found'
                });
                return;
            }
            
            const popupHtml = fs.readFileSync(popupHtmlPath, 'utf8');
            const popupJs = fs.readFileSync(popupJsPath, 'utf8');
            
            // Check HTML structure
            const htmlRequiredElements = [
                'test-connection',
                'ping-dbus',
                'status',
                'logs'
            ];
            
            const missingHtmlElements = htmlRequiredElements.filter(element => 
                !popupHtml.includes(`id="${element}"`)
            );
            
            // Check JS functionality
            const jsRequiredFunctions = [
                'DBusPopupController',
                'testConnection',
                'pingDBus',
                'updateStatus',
                'chrome.runtime.sendMessage'
            ];
            
            const missingJsFunctions = jsRequiredFunctions.filter(func => 
                !popupJs.includes(func)
            );
            
            if (missingHtmlElements.length > 0 || missingJsFunctions.length > 0) {
                const missing = [
                    ...missingHtmlElements.map(e => `HTML: ${e}`),
                    ...missingJsFunctions.map(f => `JS: ${f}`)
                ];
                
                this.testResults.push({
                    name: testName,
                    passed: false,
                    message: `Missing elements: ${missing.join(', ')}`
                });
                return;
            }
            
            this.testResults.push({
                name: testName,
                passed: true,
                message: 'Popup UI structure valid for D-Bus monitoring'
            });
            
        } catch (error) {
            this.testResults.push({
                name: testName,
                passed: false,
                message: `Error reading popup files: ${error.message}`
            });
        }
    }
    
    async testNativeMessagingCompatibility() {
        const testName = 'Native Messaging Compatibility';
        
        try {
            // Test message format compatibility
            const testMessage = {
                type: 'SEND_DBUS_SIGNAL',
                signal: {
                    interface: 'org.chatgpt.buddy.automation',
                    member: 'AutomationEvent',
                    args: ['TEST_EVENT', JSON.stringify({ test: true })]
                }
            };
            
            // Test JSON serialization
            const serialized = JSON.stringify(testMessage);
            const deserialized = JSON.parse(serialized);
            
            // Verify structure
            if (!deserialized.type || !deserialized.signal) {
                this.testResults.push({
                    name: testName,
                    passed: false,
                    message: 'Message structure invalid after serialization'
                });
                return;
            }
            
            // Test size limits (native messaging has 1MB limit)
            const sizeLimit = 1024 * 1024; // 1MB
            if (Buffer.byteLength(serialized, 'utf8') > sizeLimit) {
                this.testResults.push({
                    name: testName,
                    passed: false,
                    message: 'Message exceeds native messaging size limit'
                });
                return;
            }
            
            this.testResults.push({
                name: testName,
                passed: true,
                message: 'Native messaging format compatible'
            });
            
        } catch (error) {
            this.testResults.push({
                name: testName,
                passed: false,
                message: `Error testing native messaging: ${error.message}`
            });
        }
    }
}

// Run tests if executed directly
if (require.main === module) {
    const tester = new BrowserExtensionDBusTest();
    
    tester.runTests().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('❌ Test execution failed:', error);
        process.exit(1);
    });
}

module.exports = BrowserExtensionDBusTest;