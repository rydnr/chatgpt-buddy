/*
                        Semantest Browser Automation Framework

    Copyright (C) 2025-today  Semantest Team

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
 * @fileoverview Refactored Semantest Client using TypeScript-EDA foundation
 * @description Core client for intelligent, contract-driven web automation built on typescript-eda
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  SemanTestContract, 
  SemanTestCapability,
  ContractDiscoveredEvent,
  ContractValidatedEvent,
  ContractExecutedEvent
} from 'typescript-eda-domain';
import { 
  WebSocketCommunicationAdapter, 
  WebSocketConfig 
} from 'typescript-eda-infrastructure';
import { 
  SemanTestClientOptions 
} from '../types/semantest-types';

/**
 * Refactored Semantest client built on TypeScript-EDA foundation
 * Leverages proven event-driven patterns and infrastructure adapters
 */
export class SemanTestClient {
  private communicationAdapter: WebSocketCommunicationAdapter;
  private discoveredContracts = new Map<string, SemanTestContract>();
  private eventListeners = new Map<string, Array<(event: any) => void>>();
  
  constructor(private options: SemanTestClientOptions) {
    this.validateOptions();
    this.setupCommunicationAdapter();
    this.setupEventHandlers();
  }

  /**
   * Connect to Semantest server
   */
  async connect(): Promise<void> {
    await this.communicationAdapter.connect();
    this.log('Connected to Semantest server using TypeScript-EDA foundation', 'info');
  }

  /**
   * Disconnect from server
   */
  async disconnect(): Promise<void> {
    await this.communicationAdapter.disconnect();
    this.log('Disconnected from Semantest server', 'info');
  }

  /**
   * Execute automation contract capability
   */
  async executeContract(contractId: string, capabilityName: string, parameters?: Record<string, any>): Promise<any> {
    const contract = this.discoveredContracts.get(contractId);
    if (!contract) {
      throw new Error(`Contract '${contractId}' not found. Use discoverCapabilities() first.`);
    }

    const capability = contract.getCapability(capabilityName);
    if (!capability) {
      throw new Error(`Capability '${capabilityName}' not found in contract '${contractId}'`);
    }

    // Validate parameters using domain entity
    if (parameters) {
      const validation = capability.validateParameters(parameters);
      if (!validation.valid) {
        throw new Error(`Parameter validation failed: ${validation.errors.join(', ')}`);
      }
    }

    const startTime = Date.now();
    
    try {
      const result = await this.communicationAdapter.sendMessage(
        'EXECUTE_CONTRACT',
        {
          contractId,
          capabilityName,
          parameters: parameters || {}
        },
        { expectResponse: true, timeout: capability.getTimeout() }
      );

      const executionTime = Date.now() - startTime;

      // Emit domain event
      const executedEvent = new ContractExecutedEvent({
        contractId,
        domain: contract.getDomain(),
        capabilityName,
        parameters: parameters || {},
        result: {
          success: true,
          data: result,
          executionTime
        },
        timestamp: new Date(),
        executionContext: {
          correlationId: uuidv4(),
          clientId: this.options.clientId || 'semantest-client'
        }
      });

      this.emit('contract_executed', executedEvent);
      return result;

    } catch (error) {
      const executionTime = Date.now() - startTime;

      // Emit domain event for failure
      const executedEvent = new ContractExecutedEvent({
        contractId,
        domain: contract.getDomain(),
        capabilityName,
        parameters: parameters || {},
        result: {
          success: false,
          error: error.message,
          executionTime
        },
        timestamp: new Date()
      });

      this.emit('contract_executed', executedEvent);
      throw error;
    }
  }

  /**
   * Discover automation capabilities for a domain
   */
  async discoverCapabilities(domain: string): Promise<SemanTestContract[]> {
    try {
      const discoveryResult = await this.communicationAdapter.sendMessage(
        'DISCOVER_CAPABILITIES',
        { domain },
        { expectResponse: true }
      );

      const contracts: SemanTestContract[] = [];

      for (const contractData of discoveryResult.contracts || []) {
        // Create contract using domain entity
        const contract = SemanTestContract.fromJSON(contractData);
        
        // Store discovered contract
        this.discoveredContracts.set(contract.getId(), contract);
        contracts.push(contract);

        // Emit domain event
        const discoveredEvent = new ContractDiscoveredEvent({
          contract,
          domain,
          discoveryMethod: 'automatic',
          confidence: contractData.confidence || 0.8,
          timestamp: new Date(),
          discoveryContext: {
            discoveredBy: this.options.clientId || 'semantest-client'
          }
        });

        this.emit('contract_discovered', discoveredEvent);
      }

      this.log(`Discovered ${contracts.length} contracts for domain: ${domain}`, 'info');
      return contracts;

    } catch (error) {
      this.log(`Failed to discover capabilities for domain ${domain}: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Validate automation contract
   */
  async validateContract(contract: SemanTestContract): Promise<any> {
    try {
      // First validate using domain entity
      const domainValidation = contract.validate();
      
      if (!domainValidation.valid) {
        this.log(`Contract validation failed: ${domainValidation.errors.join(', ')}`, 'warn');
      }

      // Then validate with server
      const serverValidation = await this.communicationAdapter.sendMessage(
        'VALIDATE_CONTRACT',
        { 
          contract: contract.toJSON(),
          domainValidation 
        },
        { expectResponse: true }
      );

      const validationResult = {
        valid: domainValidation.valid && serverValidation.valid,
        errors: [...domainValidation.errors, ...(serverValidation.errors || [])],
        warnings: [...domainValidation.warnings, ...(serverValidation.warnings || [])],
        score: Math.min(
          domainValidation.valid ? 100 : 50,
          serverValidation.score || 50
        )
      };

      // Emit domain event
      const validatedEvent = new ContractValidatedEvent({
        contractId: contract.getId(),
        domain: contract.getDomain(),
        validationResult,
        validationType: 'structure',
        timestamp: new Date()
      });

      this.emit('contract_validated', validatedEvent);
      return validationResult;

    } catch (error) {
      this.log(`Contract validation error: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Get discovered contracts
   */
  getDiscoveredContracts(): SemanTestContract[] {
    return Array.from(this.discoveredContracts.values());
  }

  /**
   * Get contract by ID
   */
  getContract(contractId: string): SemanTestContract | undefined {
    return this.discoveredContracts.get(contractId);
  }

  /**
   * Get contracts for specific domain
   */
  getContractsForDomain(domain: string): SemanTestContract[] {
    return this.getDiscoveredContracts().filter(contract => contract.getDomain() === domain);
  }

  /**
   * Add event listener
   */
  on(eventType: string, listener: (event: any) => void): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(listener);
  }

  /**
   * Remove event listener
   */
  off(eventType: string, listener: (event: any) => void): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Get client configuration
   */
  getConfiguration(): SemanTestClientOptions {
    return { ...this.options };
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): any {
    return this.communicationAdapter.getConnectionStatus();
  }

  /**
   * Private methods
   */

  private validateOptions(): void {
    if (!this.options.serverUrl) {
      throw new Error('Server URL is required');
    }

    if (!this.options.serverUrl.startsWith('ws://') && !this.options.serverUrl.startsWith('wss://')) {
      throw new Error('Server URL must be a WebSocket URL (ws:// or wss://)');
    }
  }

  private setupCommunicationAdapter(): void {
    const wsConfig: WebSocketConfig = {
      url: this.options.serverUrl,
      timeout: this.options.timeout,
      retries: this.options.retries,
      headers: this.options.headers,
      clientId: this.options.clientId,
      debug: this.options.debug
    };

    this.communicationAdapter = new WebSocketCommunicationAdapter(wsConfig);

    // Forward communication adapter events
    this.communicationAdapter.on('connected', (data) => {
      this.emit('connected', data);
    });

    this.communicationAdapter.on('disconnected', (data) => {
      this.emit('disconnected', data);
    });

    this.communicationAdapter.on('error', (data) => {
      this.emit('error', data);
    });
  }

  private setupEventHandlers(): void {
    // Set up performance monitoring if enabled
    if (this.options.enablePerformanceMonitoring) {
      this.on('contract_executed', (event: ContractExecutedEvent) => {
        const executionTime = event.getExecutionTime();
        const capabilityName = event.getCapabilityName();
        
        this.log(`Performance: ${capabilityName} executed in ${executionTime}ms`, 'debug');
        
        if (executionTime > 5000) { // Alert for slow operations
          this.log(`Performance Alert: ${capabilityName} took ${executionTime}ms`, 'warn');
        }
      });
    }

    // Set up contract validation monitoring
    this.on('contract_validated', (event: ContractValidatedEvent) => {
      const result = event.getValidationResult();
      if (!result.valid) {
        this.log(`Contract validation failed: ${result.errors.join(', ')}`, 'warn');
      }
    });
  }

  private emit(eventType: string, data: any): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          this.log(`Event listener error: ${error.message}`, 'error');
        }
      });
    }
  }

  private log(message: string, level: 'debug' | 'info' | 'warn' | 'error'): void {
    if (!this.options.debug && level === 'debug') {
      return;
    }

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [Semantest Client] [${level.toUpperCase()}]`;
    
    switch (level) {
      case 'debug':
        console.log(`${prefix} ${message}`);
        break;
      case 'info':
        console.info(`${prefix} ${message}`);
        break;
      case 'warn':
        console.warn(`${prefix} ${message}`);
        break;
      case 'error':
        console.error(`${prefix} ${message}`);
        break;
    }
  }
}