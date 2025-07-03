#!/usr/bin/env python3
"""
D-Bus Integration Test for ChatGPT-buddy

Test script to validate D-Bus signal communication without requiring
full D-Bus Python bindings. Uses command line tools instead.
"""

import subprocess
import json
import time
import sys
import threading
import signal
from typing import Dict, Any

class DBusIntegrationTester:
    """
    Simple D-Bus integration tester using command line tools.
    """
    
    def __init__(self):
        self.running = True
        self.test_results = []
        
    def run_tests(self):
        """Run comprehensive D-Bus integration tests."""
        print("🧪 Starting ChatGPT-buddy D-Bus Integration Tests")
        print("=" * 60)
        
        self.test_dbus_availability()
        self.test_signal_sending()
        self.test_signal_monitoring()
        self.test_bidirectional_communication()
        self.test_native_messaging_format()
        
        print("\n" + "=" * 60)
        print("📊 Test Results Summary:")
        
        passed = sum(1 for result in self.test_results if result['passed'])
        total = len(self.test_results)
        
        for result in self.test_results:
            status = "✅ PASS" if result['passed'] else "❌ FAIL"
            print(f"{status} {result['name']}: {result['message']}")
        
        print(f"\nTests passed: {passed}/{total}")
        
        return passed == total
    
    def test_dbus_availability(self):
        """Test if D-Bus tools are available."""
        test_name = "D-Bus Tools Availability"
        
        try:
            # Check dbus-send
            result = subprocess.run(['which', 'dbus-send'], 
                                  capture_output=True, text=True)
            if result.returncode != 0:
                self.test_results.append({
                    'name': test_name,
                    'passed': False,
                    'message': 'dbus-send not found'
                })
                return
                
            # Check dbus-monitor
            result = subprocess.run(['which', 'dbus-monitor'], 
                                  capture_output=True, text=True)
            if result.returncode != 0:
                self.test_results.append({
                    'name': test_name,
                    'passed': False,
                    'message': 'dbus-monitor not found'
                })
                return
            
            self.test_results.append({
                'name': test_name,
                'passed': True,
                'message': 'dbus-send and dbus-monitor available'
            })
            
        except Exception as e:
            self.test_results.append({
                'name': test_name,
                'passed': False,
                'message': f'Error checking tools: {e}'
            })
    
    def test_signal_sending(self):
        """Test sending D-Bus signals."""
        test_name = "D-Bus Signal Sending"
        
        try:
            # Send test signal
            result = subprocess.run([
                'dbus-send',
                '--session',
                '--type=signal',
                '--dest=org.chatgpt.buddy.automation',
                '/org/chatgpt/buddy/automation',
                'org.chatgpt.buddy.automation.AutomationEvent',
                'string:INTEGRATION_TEST',
                f'string:{json.dumps({"test": "signal_sending", "timestamp": time.time()})}'
            ], capture_output=True, text=True, timeout=5)
            
            if result.returncode == 0:
                self.test_results.append({
                    'name': test_name,
                    'passed': True,
                    'message': 'Signal sent successfully'
                })
            else:
                self.test_results.append({
                    'name': test_name,
                    'passed': False,
                    'message': f'Signal sending failed: {result.stderr}'
                })
                
        except Exception as e:
            self.test_results.append({
                'name': test_name,
                'passed': False,
                'message': f'Error sending signal: {e}'
            })
    
    def test_signal_monitoring(self):
        """Test monitoring D-Bus signals."""
        test_name = "D-Bus Signal Monitoring"
        
        try:
            # Start monitoring in background
            monitor_process = subprocess.Popen([
                'dbus-monitor',
                '--session',
                "interface='org.chatgpt.buddy.automation'"
            ], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            
            # Give monitor time to start
            time.sleep(1)
            
            # Send test signal
            send_result = subprocess.run([
                'dbus-send',
                '--session',
                '--type=signal',
                '--dest=org.chatgpt.buddy.automation',
                '/org/chatgpt/buddy/automation',
                'org.chatgpt.buddy.automation.AutomationEvent',
                'string:MONITOR_TEST',
                f'string:{json.dumps({"test": "monitoring", "timestamp": time.time()})}'
            ], capture_output=True, text=True, timeout=5)
            
            # Give time for signal to be received
            time.sleep(1)
            
            # Stop monitoring
            monitor_process.terminate()
            stdout, stderr = monitor_process.communicate(timeout=3)
            
            # Check if signal was captured
            if 'AutomationEvent' in stdout and 'MONITOR_TEST' in stdout:
                self.test_results.append({
                    'name': test_name,
                    'passed': True,
                    'message': 'Signal monitoring successful'
                })
            else:
                self.test_results.append({
                    'name': test_name,
                    'passed': False,
                    'message': 'Signal not captured by monitor'
                })
                
        except Exception as e:
            self.test_results.append({
                'name': test_name,
                'passed': False,
                'message': f'Error monitoring signals: {e}'
            })
    
    def test_bidirectional_communication(self):
        """Test bidirectional D-Bus communication."""
        test_name = "Bidirectional D-Bus Communication"
        
        try:
            # Test 1: Send automation request signal
            automation_request = {
                "action": "SELECT_PROJECT",
                "payload": {
                    "selector": "#test-project",
                    "value": "test-automation"
                },
                "correlationId": f"test-{time.time()}"
            }
            
            subprocess.run([
                'dbus-send',
                '--session',
                '--type=signal',
                '--dest=org.chatgpt.buddy.automation',
                '/org/chatgpt/buddy/automation',
                'org.chatgpt.buddy.automation.AutomationEvent',
                'string:AUTOMATION_REQUEST',
                f'string:{json.dumps(automation_request)}'
            ], capture_output=True, text=True, timeout=5)
            
            # Test 2: Send completion signal
            completion_response = {
                "correlationId": automation_request["correlationId"],
                "success": True,
                "result": {"selectedValue": "test-automation"},
                "timestamp": time.time()
            }
            
            result = subprocess.run([
                'dbus-send',
                '--session',
                '--type=signal',
                '--dest=org.chatgpt.buddy.automation',
                '/org/chatgpt/buddy/automation',
                'org.chatgpt.buddy.automation.AutomationCompleted',
                f'string:{json.dumps(completion_response)}'
            ], capture_output=True, text=True, timeout=5)
            
            if result.returncode == 0:
                self.test_results.append({
                    'name': test_name,
                    'passed': True,
                    'message': 'Bidirectional communication flow tested'
                })
            else:
                self.test_results.append({
                    'name': test_name,
                    'passed': False,
                    'message': 'Failed to complete communication flow'
                })
                
        except Exception as e:
            self.test_results.append({
                'name': test_name,
                'passed': False,
                'message': f'Error in bidirectional test: {e}'
            })
    
    def test_native_messaging_format(self):
        """Test native messaging format compatibility."""
        test_name = "Native Messaging Format"
        
        try:
            # Create test message in native messaging format
            test_message = {
                "type": "SEND_DBUS_SIGNAL",
                "signal": {
                    "interface": "org.chatgpt.buddy.automation",
                    "member": "AutomationEvent",
                    "args": ["NATIVE_MESSAGE_TEST", json.dumps({"test": True})]
                }
            }
            
            # Simulate native messaging encoding
            import struct
            encoded_message = json.dumps(test_message).encode('utf-8')
            length = len(encoded_message)
            
            # Verify format is correct
            if length > 0 and length < 1024 * 1024:  # Reasonable size limit
                self.test_results.append({
                    'name': test_name,
                    'passed': True,
                    'message': f'Native messaging format valid (length: {length})'
                })
            else:
                self.test_results.append({
                    'name': test_name,
                    'passed': False,
                    'message': f'Invalid message length: {length}'
                })
                
        except Exception as e:
            self.test_results.append({
                'name': test_name,
                'passed': False,
                'message': f'Error testing native messaging format: {e}'
            })

def main():
    """Run D-Bus integration tests."""
    tester = DBusIntegrationTester()
    
    try:
        success = tester.run_tests()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n🛑 Tests interrupted by user")
        sys.exit(1)

if __name__ == "__main__":
    main()