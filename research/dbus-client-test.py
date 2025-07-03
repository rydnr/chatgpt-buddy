#!/usr/bin/env python3
"""
D-Bus Client Test Script for ChatGPT-buddy

This script demonstrates how a ChatGPT-buddy client can communicate
directly with the browser extension via D-Bus signals, bypassing
the WebSocket server.

Prerequisites:
- python3-dbus
- ChatGPT-buddy D-Bus monitor running (dbus-monitor-poc.py)

Usage:
    python3 dbus-client-test.py

Test Commands:
    python3 dbus-client-test.py --send-signal
    python3 dbus-client-test.py --call-method
    python3 dbus-client-test.py --monitor-signals
"""

import dbus
import time
import json
import argparse
import sys
from dbus.mainloop.glib import DBusGMainLoop
from gi.repository import GLib

class ChatGPTBuddyDBusClient:
    """
    D-Bus client for sending automation commands directly to browser extension
    via D-Bus signals, bypassing the WebSocket server.
    """
    
    def __init__(self):
        self.setup_dbus()
        
    def setup_dbus(self):
        """Initialize D-Bus connection."""
        try:
            # Set up D-Bus main loop
            DBusGMainLoop(set_as_default=True)
            
            # Connect to session bus
            self.bus = dbus.SessionBus()
            
            # Get reference to ChatGPT-buddy service
            try:
                self.buddy_service = self.bus.get_object(
                    "org.chatgpt.buddy", 
                    "/automation"
                )
                self.automation_interface = dbus.Interface(
                    self.buddy_service, 
                    "org.chatgpt.buddy.automation"
                )
                print("✅ Connected to ChatGPT-buddy D-Bus service")
            except Exception as e:
                print(f"⚠️  ChatGPT-buddy service not available: {e}")
                print("   Make sure dbus-monitor-poc.py is running")
                self.buddy_service = None
                
        except Exception as e:
            print(f"❌ Failed to initialize D-Bus: {e}")
            sys.exit(1)
    
    def send_automation_signal(self, action, payload, correlation_id=None):
        """Send automation signal via D-Bus."""
        if correlation_id is None:
            correlation_id = f"dbus-{int(time.time())}-{id(self)}"
            
        try:
            # Create automation event data
            event_data = {
                "action": action,
                "payload": payload,
                "correlationId": correlation_id,
                "timestamp": time.time(),
                "source": "dbus-client"
            }
            
            # Send as D-Bus signal
            signal_data = json.dumps(event_data)
            
            # Method 1: Send via dbus-send command (most reliable)
            import subprocess
            cmd = [
                "dbus-send", 
                "--session",
                "--type=signal",
                "--dest=org.chatgpt.buddy",
                "/automation",
                "org.chatgpt.buddy.automation.AutomationEvent",
                f"string:{action}",
                f"string:{signal_data}"
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode == 0:
                print(f"📡 Sent D-Bus signal: {action}")
                print(f"   Correlation ID: {correlation_id}")
                print(f"   Payload: {payload}")
                return correlation_id
            else:
                print(f"❌ Failed to send D-Bus signal: {result.stderr}")
                return None
                
        except Exception as e:
            print(f"❌ Error sending automation signal: {e}")
            return None
    
    def call_automation_method(self, automation_data):
        """Call automation method via D-Bus."""
        if not self.buddy_service:
            print("❌ No D-Bus service connection available")
            return None
            
        try:
            result = self.automation_interface.ExecuteAutomation(
                json.dumps(automation_data)
            )
            print(f"📞 Called ExecuteAutomation method")
            print(f"   Result: {result}")
            return result
            
        except Exception as e:
            print(f"❌ Error calling automation method: {e}")
            return None
    
    def monitor_signals(self, duration=30):
        """Monitor D-Bus signals for a specified duration."""
        print(f"👁️  Monitoring D-Bus signals for {duration} seconds...")
        
        # Set up signal handlers
        self.bus.add_signal_receiver(
            self.on_automation_completed,
            dbus_interface="org.chatgpt.buddy.automation",
            signal_name="AutomationCompleted"
        )
        
        self.bus.add_signal_receiver(
            self.on_automation_event,
            dbus_interface="org.chatgpt.buddy.automation", 
            signal_name="AutomationEvent"
        )
        
        # Monitor for specified duration
        def stop_monitoring():
            print("⏰ Monitoring period ended")
            loop.quit()
            
        GLib.timeout_add_seconds(duration, stop_monitoring)
        
        loop = GLib.MainLoop()
        loop.run()
    
    def on_automation_completed(self, result):
        """Handle AutomationCompleted signals."""
        print(f"✅ Automation completed: {result}")
    
    def on_automation_event(self, event_type, event_data):
        """Handle AutomationEvent signals."""
        print(f"🔔 Automation event: {event_type}")
        try:
            data = json.loads(event_data)
            print(f"   Data: {data}")
        except:
            print(f"   Raw data: {event_data}")
    
    def test_select_project(self):
        """Test SELECT_PROJECT automation."""
        return self.send_automation_signal(
            "SELECT_PROJECT",
            {"selector": "#project-select", "value": "python"}
        )
    
    def test_fill_prompt(self):
        """Test FILL_PROMPT automation.""" 
        return self.send_automation_signal(
            "FILL_PROMPT",
            {
                "selector": "#prompt-textarea",
                "value": "Create a Python script that monitors D-Bus signals"
            }
        )
    
    def test_tab_switch(self):
        """Test TAB_SWITCH automation."""
        return self.send_automation_signal(
            "TAB_SWITCH",
            {"title": "ChatGPT"}
        )
    
    def run_comprehensive_test(self):
        """Run a comprehensive test of D-Bus communication."""
        print("🧪 Running comprehensive D-Bus communication test...\n")
        
        # Test 1: Service connectivity
        print("1️⃣ Testing service connectivity...")
        if self.buddy_service:
            print("   ✅ D-Bus service is accessible")
        else:
            print("   ❌ D-Bus service not available")
            return
        
        # Test 2: Method calls
        print("\n2️⃣ Testing method calls...")
        test_data = {
            "action": "ping",
            "timestamp": time.time()
        }
        result = self.call_automation_method(test_data)
        
        # Test 3: Signal sending
        print("\n3️⃣ Testing signal sending...")
        correlation_ids = []
        
        correlation_ids.append(self.test_select_project())
        time.sleep(1)
        
        correlation_ids.append(self.test_fill_prompt())
        time.sleep(1)
        
        correlation_ids.append(self.test_tab_switch())
        time.sleep(1)
        
        # Test 4: Signal monitoring
        print("\n4️⃣ Testing signal monitoring...")
        print("   (Monitor for 10 seconds to see if we receive any responses)")
        self.monitor_signals(10)
        
        print("\n🎯 Test Summary:")
        print(f"   Sent {len([cid for cid in correlation_ids if cid])} automation signals")
        print(f"   Method call result: {result}")
        print("   Check dbus-monitor-poc.py output for received signals")


def main():
    parser = argparse.ArgumentParser(description="ChatGPT-buddy D-Bus Client Test")
    parser.add_argument("--send-signal", action="store_true", 
                       help="Send a test automation signal")
    parser.add_argument("--call-method", action="store_true",
                       help="Call an automation method") 
    parser.add_argument("--monitor-signals", action="store_true",
                       help="Monitor D-Bus signals")
    parser.add_argument("--comprehensive", action="store_true",
                       help="Run comprehensive test suite")
    parser.add_argument("--duration", type=int, default=30,
                       help="Duration for signal monitoring (seconds)")
    
    args = parser.parse_args()
    
    client = ChatGPTBuddyDBusClient()
    
    if args.send_signal:
        client.test_select_project()
        client.test_fill_prompt() 
        client.test_tab_switch()
        
    elif args.call_method:
        test_data = {
            "action": "test_method_call",
            "timestamp": time.time(),
            "data": "Hello from D-Bus client"
        }
        client.call_automation_method(test_data)
        
    elif args.monitor_signals:
        client.monitor_signals(args.duration)
        
    elif args.comprehensive:
        client.run_comprehensive_test()
        
    else:
        print("🚀 ChatGPT-buddy D-Bus Client")
        print("Usage examples:")
        print("  python3 dbus-client-test.py --comprehensive")
        print("  python3 dbus-client-test.py --send-signal")
        print("  python3 dbus-client-test.py --monitor-signals --duration 60")
        print("  python3 dbus-client-test.py --call-method")
        print()
        print("Make sure to run dbus-monitor-poc.py first to set up the D-Bus service.")


if __name__ == "__main__":
    main()