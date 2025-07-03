#!/usr/bin/env python3
"""
D-Bus vs WebSocket Performance Benchmark

This script benchmarks communication performance between D-Bus signals
and WebSocket communication for ChatGPT-buddy automation events.
"""

import time
import json
import subprocess
import threading
import statistics
import sys
from typing import List, Dict, Any
from concurrent.futures import ThreadPoolExecutor

class PerformanceBenchmark:
    """
    Performance benchmark comparing D-Bus and WebSocket communication.
    """
    
    def __init__(self):
        self.dbus_results = []
        self.websocket_results = []
        self.test_iterations = 100
        
    def run_benchmark(self):
        """Run comprehensive performance benchmark."""
        print("🏃 ChatGPT-buddy Communication Performance Benchmark")
        print("=" * 60)
        
        # Run D-Bus benchmarks
        print("📡 Testing D-Bus Signal Performance...")
        self.benchmark_dbus_signals()
        
        # Simulated WebSocket benchmarks (since we don't have a running server)
        print("🌐 Simulating WebSocket Performance...")
        self.benchmark_websocket_simulation()
        
        # Compare results
        self.compare_results()
        
        return {
            'dbus': self.dbus_results,
            'websocket': self.websocket_results
        }
    
    def benchmark_dbus_signals(self):
        """Benchmark D-Bus signal communication performance."""
        print(f"  Running {self.test_iterations} D-Bus signal tests...")
        
        for i in range(self.test_iterations):
            start_time = time.perf_counter()
            
            try:
                # Send D-Bus signal
                result = subprocess.run([
                    'dbus-send',
                    '--session',
                    '--type=signal',
                    '--dest=org.chatgpt.buddy.automation',
                    '/org/chatgpt/buddy/automation',
                    'org.chatgpt.buddy.automation.AutomationEvent',
                    'string:BENCHMARK_TEST',
                    f'string:{json.dumps({"iteration": i, "timestamp": time.time()})}'
                ], capture_output=True, text=True, timeout=1)
                
                end_time = time.perf_counter()
                latency = (end_time - start_time) * 1000  # Convert to milliseconds
                
                self.dbus_results.append({
                    'iteration': i,
                    'latency_ms': latency,
                    'success': result.returncode == 0,
                    'payload_size': len(json.dumps({"iteration": i, "timestamp": time.time()}))
                })
                
            except subprocess.TimeoutExpired:
                end_time = time.perf_counter()
                self.dbus_results.append({
                    'iteration': i,
                    'latency_ms': (end_time - start_time) * 1000,
                    'success': False,
                    'payload_size': 0,
                    'error': 'timeout'
                })
            except Exception as e:
                end_time = time.perf_counter()
                self.dbus_results.append({
                    'iteration': i,
                    'latency_ms': (end_time - start_time) * 1000,
                    'success': False,
                    'payload_size': 0,
                    'error': str(e)
                })
        
        print(f"  ✅ D-Bus tests completed")
    
    def benchmark_websocket_simulation(self):
        """Simulate WebSocket communication performance."""
        print(f"  Running {self.test_iterations} WebSocket simulation tests...")
        
        # Simulate WebSocket overhead with JSON serialization and network simulation
        for i in range(self.test_iterations):
            start_time = time.perf_counter()
            
            try:
                # Simulate WebSocket message creation and processing
                message = {
                    "target": {
                        "extensionId": "test_extension_id",
                        "tabId": 123
                    },
                    "message": {
                        "action": "SELECT_PROJECT",
                        "payload": {
                            "selector": "#test-selector",
                            "value": "test-value"
                        },
                        "correlationId": f"benchmark-{i}-{time.time()}"
                    }
                }
                
                # Serialize message (WebSocket overhead)
                serialized = json.dumps(message)
                
                # Simulate network latency (typical WebSocket latency: 1-10ms)
                network_latency = 0.002 + (i % 10) * 0.001  # 2-11ms
                time.sleep(network_latency)
                
                # Deserialize message
                deserialized = json.loads(serialized)
                
                end_time = time.perf_counter()
                latency = (end_time - start_time) * 1000  # Convert to milliseconds
                
                self.websocket_results.append({
                    'iteration': i,
                    'latency_ms': latency,
                    'success': True,
                    'payload_size': len(serialized),
                    'network_simulation': network_latency * 1000
                })
                
            except Exception as e:
                end_time = time.perf_counter()
                self.websocket_results.append({
                    'iteration': i,
                    'latency_ms': (end_time - start_time) * 1000,
                    'success': False,
                    'payload_size': 0,
                    'error': str(e)
                })
        
        print(f"  ✅ WebSocket simulation completed")
    
    def benchmark_concurrent_performance(self):
        """Benchmark concurrent message handling."""
        print("🔄 Testing Concurrent Performance...")
        
        concurrent_threads = [5, 10, 20, 50]
        
        for thread_count in concurrent_threads:
            print(f"  Testing with {thread_count} concurrent threads...")
            
            # D-Bus concurrent test
            dbus_concurrent_results = []
            start_time = time.perf_counter()
            
            with ThreadPoolExecutor(max_workers=thread_count) as executor:
                futures = []
                for i in range(thread_count):
                    future = executor.submit(self.send_dbus_signal_concurrent, i)
                    futures.append(future)
                
                for future in futures:
                    result = future.result()
                    dbus_concurrent_results.append(result)
            
            dbus_end_time = time.perf_counter()
            dbus_total_time = (dbus_end_time - start_time) * 1000
            
            # WebSocket simulation concurrent test
            websocket_concurrent_results = []
            start_time = time.perf_counter()
            
            with ThreadPoolExecutor(max_workers=thread_count) as executor:
                futures = []
                for i in range(thread_count):
                    future = executor.submit(self.simulate_websocket_concurrent, i)
                    futures.append(future)
                
                for future in futures:
                    result = future.result()
                    websocket_concurrent_results.append(result)
            
            websocket_end_time = time.perf_counter()
            websocket_total_time = (websocket_end_time - start_time) * 1000
            
            print(f"    D-Bus: {dbus_total_time:.2f}ms total, {dbus_total_time/thread_count:.2f}ms avg")
            print(f"    WebSocket: {websocket_total_time:.2f}ms total, {websocket_total_time/thread_count:.2f}ms avg")
    
    def send_dbus_signal_concurrent(self, thread_id):
        """Send D-Bus signal in concurrent test."""
        start_time = time.perf_counter()
        
        try:
            result = subprocess.run([
                'dbus-send',
                '--session',
                '--type=signal',
                '--dest=org.chatgpt.buddy.automation',
                '/org/chatgpt/buddy/automation',
                'org.chatgpt.buddy.automation.AutomationEvent',
                'string:CONCURRENT_TEST',
                f'string:{json.dumps({"thread_id": thread_id, "timestamp": time.time()})}'
            ], capture_output=True, text=True, timeout=2)
            
            end_time = time.perf_counter()
            return {
                'thread_id': thread_id,
                'latency_ms': (end_time - start_time) * 1000,
                'success': result.returncode == 0
            }
            
        except Exception as e:
            end_time = time.perf_counter()
            return {
                'thread_id': thread_id,
                'latency_ms': (end_time - start_time) * 1000,
                'success': False,
                'error': str(e)
            }
    
    def simulate_websocket_concurrent(self, thread_id):
        """Simulate WebSocket message in concurrent test."""
        start_time = time.perf_counter()
        
        try:
            message = {
                "thread_id": thread_id,
                "action": "CONCURRENT_TEST",
                "timestamp": time.time()
            }
            
            serialized = json.dumps(message)
            time.sleep(0.001)  # Simulate 1ms network
            deserialized = json.loads(serialized)
            
            end_time = time.perf_counter()
            return {
                'thread_id': thread_id,
                'latency_ms': (end_time - start_time) * 1000,
                'success': True
            }
            
        except Exception as e:
            end_time = time.perf_counter()
            return {
                'thread_id': thread_id,
                'latency_ms': (end_time - start_time) * 1000,
                'success': False,
                'error': str(e)
            }
    
    def compare_results(self):
        """Compare and analyze performance results."""
        print("\n" + "=" * 60)
        print("📊 Performance Analysis Results")
        print("=" * 60)
        
        # Filter successful results
        dbus_successful = [r for r in self.dbus_results if r['success']]
        websocket_successful = [r for r in self.websocket_results if r['success']]
        
        # Calculate statistics
        if dbus_successful:
            dbus_latencies = [r['latency_ms'] for r in dbus_successful]
            dbus_stats = {
                'mean': statistics.mean(dbus_latencies),
                'median': statistics.median(dbus_latencies),
                'min': min(dbus_latencies),
                'max': max(dbus_latencies),
                'stdev': statistics.stdev(dbus_latencies) if len(dbus_latencies) > 1 else 0,
                'success_rate': len(dbus_successful) / len(self.dbus_results) * 100
            }
        else:
            dbus_stats = {'error': 'No successful D-Bus tests'}
        
        if websocket_successful:
            websocket_latencies = [r['latency_ms'] for r in websocket_successful]
            websocket_stats = {
                'mean': statistics.mean(websocket_latencies),
                'median': statistics.median(websocket_latencies),
                'min': min(websocket_latencies),
                'max': max(websocket_latencies),
                'stdev': statistics.stdev(websocket_latencies) if len(websocket_latencies) > 1 else 0,
                'success_rate': len(websocket_successful) / len(self.websocket_results) * 100
            }
        else:
            websocket_stats = {'error': 'No successful WebSocket tests'}
        
        # Print comparison
        print("🔍 Latency Comparison (milliseconds):")
        print(f"{'Metric':<15} {'D-Bus':<15} {'WebSocket':<15} {'Winner':<10}")
        print("-" * 60)
        
        if 'error' not in dbus_stats and 'error' not in websocket_stats:
            metrics = ['mean', 'median', 'min', 'max', 'stdev']
            
            for metric in metrics:
                dbus_val = dbus_stats[metric]
                websocket_val = websocket_stats[metric]
                
                if metric == 'min':
                    winner = 'D-Bus' if dbus_val < websocket_val else 'WebSocket'
                elif metric == 'stdev':
                    winner = 'D-Bus' if dbus_val < websocket_val else 'WebSocket'
                else:
                    winner = 'D-Bus' if dbus_val < websocket_val else 'WebSocket'
                
                print(f"{metric.capitalize():<15} {dbus_val:<15.3f} {websocket_val:<15.3f} {winner:<10}")
            
            print("-" * 60)
            print(f"{'Success Rate':<15} {dbus_stats['success_rate']:<15.1f}% {websocket_stats['success_rate']:<15.1f}%")
            
            # Overall recommendation
            print("\n🎯 Performance Recommendations:")
            
            if dbus_stats['mean'] < websocket_stats['mean']:
                print("✅ D-Bus shows better average latency performance")
                if dbus_stats['success_rate'] > 95:
                    print("✅ D-Bus has excellent reliability")
                    print("🏆 Recommendation: D-Bus is the better choice for local automation")
                else:
                    print("⚠️  D-Bus has reliability concerns")
            else:
                print("✅ WebSocket shows better average latency performance")
                print("🏆 Recommendation: WebSocket remains the better choice for reliability")
            
            # Detailed analysis
            print("\n📋 Detailed Analysis:")
            print(f"• D-Bus average latency: {dbus_stats['mean']:.3f}ms")
            print(f"• WebSocket average latency: {websocket_stats['mean']:.3f}ms")
            print(f"• D-Bus success rate: {dbus_stats['success_rate']:.1f}%")
            print(f"• WebSocket success rate: {websocket_stats['success_rate']:.1f}%")
            
            # Use case recommendations
            print("\n🎯 Use Case Recommendations:")
            print("• D-Bus: Best for Linux desktop integration, system-level automation")
            print("• WebSocket: Best for cross-platform compatibility, web-based clients")
            print("• Hybrid: Use D-Bus for local desktop, WebSocket for remote/web clients")
            
        else:
            if 'error' in dbus_stats:
                print(f"❌ D-Bus Error: {dbus_stats['error']}")
            if 'error' in websocket_stats:
                print(f"❌ WebSocket Error: {websocket_stats['error']}")

def main():
    """Run performance benchmark."""
    benchmark = PerformanceBenchmark()
    
    try:
        results = benchmark.run_benchmark()
        
        # Run concurrent performance test
        benchmark.benchmark_concurrent_performance()
        
        return results
        
    except KeyboardInterrupt:
        print("\n🛑 Benchmark interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Benchmark failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()