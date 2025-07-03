#!/usr/bin/env python3
"""
D-Bus Monitoring Proof of Concept for ChatGPT-buddy

This script demonstrates how to monitor D-Bus signals and communicate
with a browser extension via native messaging protocol.

Prerequisites:
- python3-dbus
- python3-gi
- D-Bus session bus access

Usage:
    python3 dbus-monitor-poc.py

Test with:
    dbus-send --session --dest=org.chatgpt.buddy \
      --type=signal /automation \
      org.chatgpt.buddy.automation.TestSignal \
      string:"Hello from client"
"""

import dbus
import json
import sys
import time
import struct
import threading
from dbus.mainloop.glib import DBusGMainLoop
from gi.repository import GLib

class ChatGPTBuddyDBusMonitor:
    """
    D-Bus signal monitor that bridges D-Bus events to browser extension
    via Chrome Native Messaging protocol.
    """
    
    def __init__(self):
        self.setup_dbus()
        self.setup_native_messaging()
        self.message_queue = []
        self.running = True
        
    def setup_dbus(self):
        """Initialize D-Bus connection and signal handlers."""
        try:
            # Set up D-Bus main loop
            DBusGMainLoop(set_as_default=True)
            
            # Connect to session bus
            self.bus = dbus.SessionBus()
            
            # Monitor ChatGPT-buddy automation signals
            self.bus.add_signal_receiver(
                self.on_automation_signal,
                dbus_interface="org.chatgpt.buddy.automation",
                path="/automation"
            )
            
            # Monitor Firefox signals (if available)
            try:
                self.bus.add_signal_receiver(
                    self.on_firefox_signal,
                    dbus_interface="org.mozilla.firefox.Remote",
                    path="/org/mozilla/firefox/Remote"
                )
            except Exception as e:
                self.log_message(f"Firefox D-Bus monitoring not available: {e}")
            
            # Expose our own D-Bus service for receiving commands
            self.setup_dbus_service()
            
            self.log_message("D-Bus monitoring initialized successfully")
            
        except Exception as e:
            self.log_message(f"Failed to initialize D-Bus: {e}")
            sys.exit(1)
    
    def setup_dbus_service(self):
        """Set up D-Bus service to receive commands from clients."""
        try:
            # Request a well-known name
            bus_name = dbus.service.BusName("org.chatgpt.buddy", self.bus)
            
            # Create service object
            self.service = ChatGPTBuddyDBusService(bus_name)
            self.service.set_monitor(self)
            
            self.log_message("D-Bus service 'org.chatgpt.buddy' registered")
            
        except Exception as e:
            self.log_message(f"Failed to register D-Bus service: {e}")
    
    def setup_native_messaging(self):
        """Initialize native messaging communication with browser extension."""
        self.stdin = sys.stdin.buffer
        self.stdout = sys.stdout.buffer
        
        # Start input reader thread
        self.input_thread = threading.Thread(target=self.read_native_messages)
        self.input_thread.daemon = True
        self.input_thread.start()
        
        self.log_message("Native messaging initialized")
    
    def on_automation_signal(self, *args, **kwargs):
        """Handle ChatGPT-buddy automation signals."""
        signal_data = {
            "type": "DBUS_AUTOMATION_SIGNAL",
            "interface": "org.chatgpt.buddy.automation",
            "args": [str(arg) for arg in args],  # Convert to JSON-serializable
            "sender": kwargs.get('sender', 'unknown'),
            "timestamp": time.time(),
            "path": "/automation"
        }
        
        self.send_to_extension(signal_data)
        self.log_message(f"Automation signal received: {args}")
    
    def on_firefox_signal(self, *args, **kwargs):
        """Handle Firefox D-Bus signals."""
        signal_data = {
            "type": "DBUS_FIREFOX_SIGNAL", 
            "interface": "org.mozilla.firefox.Remote",
            "args": [str(arg) for arg in args],
            "sender": kwargs.get('sender', 'unknown'),
            "timestamp": time.time(),
            "path": "/org/mozilla/firefox/Remote"
        }
        
        self.send_to_extension(signal_data)
        self.log_message(f"Firefox signal received: {args}")
    
    def send_to_extension(self, message):
        """Send message to browser extension using native messaging protocol."""
        try:
            # Encode message as JSON
            encoded_message = json.dumps(message).encode('utf-8')
            
            # Send length prefix (4 bytes, little-endian)
            length = len(encoded_message)
            self.stdout.write(struct.pack('<I', length))
            
            # Send message content
            self.stdout.write(encoded_message)
            self.stdout.flush()
            
        except Exception as e:
            self.log_message(f"Failed to send message to extension: {e}")
    
    def read_native_messages(self):
        """Read messages from browser extension via native messaging."""
        try:
            while self.running:
                # Read message length (4 bytes)
                length_bytes = self.stdin.read(4)
                if not length_bytes:
                    break
                
                length = struct.unpack('<I', length_bytes)[0]
                
                # Read message content
                message_bytes = self.stdin.read(length)
                if not message_bytes:
                    break
                
                # Parse JSON message
                try:
                    message = json.loads(message_bytes.decode('utf-8'))
                    self.handle_extension_message(message)
                except json.JSONDecodeError as e:
                    self.log_message(f"Invalid JSON from extension: {e}")
                    
        except Exception as e:
            self.log_message(f"Error reading native messages: {e}")
    
    def handle_extension_message(self, message):
        """Handle messages received from browser extension."""
        msg_type = message.get('type', 'unknown')
        
        if msg_type == 'SEND_DBUS_SIGNAL':
            self.emit_dbus_signal(message.get('signal', {}))
        elif msg_type == 'PING':
            self.send_to_extension({"type": "PONG", "timestamp": time.time()})
        elif msg_type == 'GET_STATUS':
            self.send_status_update()
        else:
            self.log_message(f"Unknown message type from extension: {msg_type}")
    
    def emit_dbus_signal(self, signal_data):
        """Emit a D-Bus signal based on extension request."""
        try:
            interface = signal_data.get('interface', 'org.chatgpt.buddy.automation')
            member = signal_data.get('member', 'AutomationEvent')
            args = signal_data.get('args', [])
            
            # Use the service to emit the signal
            if hasattr(self, 'service'):
                self.service.emit_automation_signal(member, args)
                self.log_message(f"Emitted D-Bus signal: {member} with args: {args}")
            
        except Exception as e:
            self.log_message(f"Failed to emit D-Bus signal: {e}")
    
    def send_status_update(self):
        """Send current status to browser extension."""
        status = {
            "type": "STATUS_UPDATE",
            "dbus_connected": True,
            "service_registered": hasattr(self, 'service'),
            "uptime": time.time(),
            "message_count": len(self.message_queue)
        }
        self.send_to_extension(status)
    
    def log_message(self, message):
        """Log message to stderr (visible when running from terminal)."""
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        sys.stderr.write(f"[{timestamp}] ChatGPT-buddy D-Bus: {message}\n")
        sys.stderr.flush()
        
        # Also queue for extension
        self.message_queue.append({
            "type": "LOG_MESSAGE",
            "message": message,
            "timestamp": time.time()
        })
        
        # Keep queue size manageable
        if len(self.message_queue) > 100:
            self.message_queue = self.message_queue[-50:]
    
    def run(self):
        """Start the D-Bus monitoring main loop."""
        try:
            self.log_message("ChatGPT-buddy D-Bus monitor starting...")
            
            # Send initial status
            self.send_to_extension({
                "type": "MONITOR_STARTED",
                "timestamp": time.time(),
                "pid": os.getpid() if 'os' in globals() else 'unknown'
            })
            
            # Start GLib main loop for D-Bus
            loop = GLib.MainLoop()
            loop.run()
            
        except KeyboardInterrupt:
            self.log_message("Received interrupt signal, shutting down...")
        except Exception as e:
            self.log_message(f"Unexpected error: {e}")
        finally:
            self.cleanup()
    
    def cleanup(self):
        """Clean up resources before exit."""
        self.running = False
        self.log_message("D-Bus monitor shutting down")


class ChatGPTBuddyDBusService(dbus.service.Object):
    """
    D-Bus service object for receiving automation commands
    and emitting signals.
    """
    
    def __init__(self, bus_name):
        super().__init__(bus_name, "/automation")
        self.monitor = None
    
    def set_monitor(self, monitor):
        """Set reference to monitor for logging."""
        self.monitor = monitor
    
    @dbus.service.method("org.chatgpt.buddy.automation", 
                        in_signature='s', out_signature='s')
    def ExecuteAutomation(self, automation_data):
        """Method to receive automation requests via D-Bus."""
        if self.monitor:
            self.monitor.log_message(f"D-Bus method called: ExecuteAutomation({automation_data})")
        
        # Forward to extension
        message = {
            "type": "DBUS_METHOD_CALL",
            "method": "ExecuteAutomation",
            "args": [automation_data],
            "timestamp": time.time()
        }
        
        if self.monitor:
            self.monitor.send_to_extension(message)
        
        return "automation_queued"
    
    @dbus.service.signal("org.chatgpt.buddy.automation", signature='s')
    def AutomationCompleted(self, result):
        """Signal emitted when automation completes."""
        pass
    
    @dbus.service.signal("org.chatgpt.buddy.automation", signature='ss')
    def AutomationEvent(self, event_type, event_data):
        """Generic automation event signal."""
        pass
    
    def emit_automation_signal(self, signal_name, args):
        """Emit automation signal with dynamic name and args."""
        if signal_name == "AutomationCompleted" and len(args) >= 1:
            self.AutomationCompleted(str(args[0]))
        elif signal_name == "AutomationEvent" and len(args) >= 2:
            self.AutomationEvent(str(args[0]), str(args[1]))
        else:
            # Generic event
            self.AutomationEvent(signal_name, json.dumps(args))


if __name__ == "__main__":
    import os
    
    # Initialize and run the D-Bus monitor
    monitor = ChatGPTBuddyDBusMonitor()
    monitor.run()