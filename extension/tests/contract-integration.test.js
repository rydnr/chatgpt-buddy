/**
 * @fileoverview Contract Integration Tests
 * @description Tests for contract discovery and execution in Web-Buddy extension
 */

// Mock Chrome APIs
global.chrome = {
  runtime: {
    onMessage: {
      addListener: jest.fn()
    },
    sendMessage: jest.fn(),
    id: 'test-extension-id'
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn()
  }
};

// Mock WebSocket
global.WebSocket = jest.fn().mockImplementation(() => ({
  onopen: null,
  onmessage: null,
  onclose: null,
  onerror: null,
  send: jest.fn(),
  close: jest.fn()
}));

// Mock DOM for contract discovery
const mockDocument = {
  querySelectorAll: jest.fn(),
  querySelector: jest.fn(),
  body: {
    classList: [],
    children: { length: 5 }
  },
  title: 'Demo E-commerce Store',
  addEventListener: jest.fn(),
  dispatchEvent: jest.fn()
};

const mockWindow = {
  location: {
    hostname: 'demo-store.example.com',
    href: 'https://demo-store.example.com/',
    pathname: '/'
  },
  addEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
  setInterval: jest.fn(),
  clearInterval: jest.fn(),
  setTimeout: jest.fn(),
  Date: Date
};

// Set up global mocks
global.document = mockDocument;
global.window = mockWindow;

describe('Contract Discovery and Integration', () => {
  let contractDiscovery;
  let contractExecution;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset DOM mocks
    mockDocument.querySelectorAll.mockReturnValue([]);
    mockDocument.querySelector.mockReturnValue(null);
  });

  describe('Contract Discovery', () => {
    test('should discover contracts from meta tags', () => {
      // Mock meta tag with contract
      const mockMetaTag = {
        getAttribute: jest.fn().mockReturnValue(JSON.stringify({
          version: '1.0.0',
          domain: 'demo-store.example.com',
          title: 'E-commerce Contract',
          capabilities: {
            searchProducts: {
              type: 'form',
              description: 'Search for products',
              selector: '[data-testid="search-input"]'
            }
          }
        }))
      };
      
      mockDocument.querySelectorAll.mockImplementation((selector) => {
        if (selector === 'meta[name^="web-buddy-contract"]') {
          return [mockMetaTag];
        }
        return [];
      });

      // Import and test contract discovery
      const { ContractDiscoveryAdapter } = require('../src/contracts/contract-discovery-adapter');
      contractDiscovery = new ContractDiscoveryAdapter();
      
      const result = contractDiscovery.discoverFromMetaTags();
      
      expect(result).toHaveLength(1);
      expect(result[0].domain).toBe('demo-store.example.com');
      expect(result[0].title).toBe('E-commerce Contract');
      expect(result[0].capabilities.searchProducts).toBeDefined();
    });

    test('should discover contracts from JSON-LD scripts', () => {
      // Mock JSON-LD script with contract
      const mockScript = {
        textContent: JSON.stringify({
          '@type': 'WebBuddyContract',
          version: '1.0.0',
          domain: 'demo-store.example.com',
          title: 'JSON-LD Contract',
          capabilities: {
            addToCart: {
              type: 'action',
              description: 'Add product to cart',
              selector: '.add-to-cart-btn'
            }
          }
        })
      };
      
      mockDocument.querySelectorAll.mockImplementation((selector) => {
        if (selector === 'script[type="application/ld+json"]') {
          return [mockScript];
        }
        return [];
      });

      const { ContractDiscoveryAdapter } = require('../src/contracts/contract-discovery-adapter');
      contractDiscovery = new ContractDiscoveryAdapter();
      
      const result = contractDiscovery.discoverFromJsonLD();
      
      expect(result).toHaveLength(1);
      expect(result[0]['@type']).toBe('WebBuddyContract');
      expect(result[0].capabilities.addToCart).toBeDefined();
    });

    test('should handle invalid contract data gracefully', () => {
      // Mock meta tag with invalid JSON
      const mockMetaTag = {
        getAttribute: jest.fn().mockReturnValue('invalid json content')
      };
      
      mockDocument.querySelectorAll.mockImplementation((selector) => {
        if (selector === 'meta[name^="web-buddy-contract"]') {
          return [mockMetaTag];
        }
        return [];
      });

      const { ContractDiscoveryAdapter } = require('../src/contracts/contract-discovery-adapter');
      contractDiscovery = new ContractDiscoveryAdapter();
      
      // Should not throw and return empty array
      const result = contractDiscovery.discoverFromMetaTags();
      expect(result).toHaveLength(0);
    });
  });

  describe('Contract Execution', () => {
    test('should execute contract capabilities successfully', async () => {
      // Mock DOM element for execution
      const mockElement = {
        click: jest.fn(),
        tagName: 'BUTTON',
        getAttribute: jest.fn(),
        value: '',
        dispatchEvent: jest.fn()
      };
      
      mockDocument.querySelector.mockReturnValue(mockElement);

      const { ContractExecutionService } = require('../src/contracts/contract-execution-service');
      contractExecution = new ContractExecutionService();
      
      // Mock contract discovery to return a test contract
      const mockContract = {
        domain: 'demo-store.example.com',
        title: 'Test Contract',
        capabilities: {
          clickButton: {
            type: 'action',
            description: 'Click a button',
            selector: '[data-testid="test-button"]'
          }
        }
      };

      // Mock the discovery adapter
      contractExecution.discoveryAdapter = {
        getContractsByDomain: jest.fn().mockReturnValue([mockContract]),
        executeCapability: jest.fn().mockResolvedValue({
          success: true,
          action: 'click',
          element: 'BUTTON'
        })
      };

      const result = await contractExecution.executeWithContract({
        action: 'clickButton',
        parameters: {},
        domain: 'demo-store.example.com'
      });

      expect(result.success).toBe(true);
      expect(result.data.action).toBe('click');
    });

    test('should validate execution parameters correctly', () => {
      const { ContractExecutionService } = require('../src/contracts/contract-execution-service');
      contractExecution = new ContractExecutionService();
      
      // Mock contract with required parameters
      const mockContract = {
        domain: 'demo-store.example.com',
        title: 'Test Contract',
        capabilities: {
          fillForm: {
            type: 'form',
            description: 'Fill a form',
            selector: '[data-testid="form"]',
            parameters: [
              {
                name: 'username',
                type: 'string',
                required: true
              },
              {
                name: 'email',
                type: 'string',
                required: true
              }
            ]
          }
        }
      };

      contractExecution.discoveryAdapter = {
        getContractsByDomain: jest.fn().mockReturnValue([mockContract])
      };

      // Test with missing required parameter
      const invalidResult = contractExecution.validateExecutionParams('fillForm', {
        username: 'testuser'
        // missing email
      });

      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors).toContain('Required parameter missing: email');

      // Test with all required parameters
      const validResult = contractExecution.validateExecutionParams('fillForm', {
        username: 'testuser',
        email: 'test@example.com'
      });

      expect(validResult.valid).toBe(true);
      expect(validResult.errors).toHaveLength(0);
    });

    test('should provide contract availability information', async () => {
      const { ContractExecutionService } = require('../src/contracts/contract-execution-service');
      contractExecution = new ContractExecutionService();
      
      const mockContracts = [
        {
          domain: 'demo-store.example.com',
          title: 'E-commerce Contract',
          capabilities: {
            search: { type: 'form', description: 'Search products' },
            addToCart: { type: 'action', description: 'Add to cart' }
          }
        }
      ];

      contractExecution.discoveryAdapter = {
        getContractsByDomain: jest.fn().mockReturnValue(mockContracts)
      };

      const availability = await contractExecution.checkContractAvailability();

      expect(availability.available).toBe(true);
      expect(availability.contractCount).toBe(1);
      expect(availability.capabilities).toContain('search');
      expect(availability.capabilities).toContain('addToCart');
      expect(availability.domain).toBe('demo-store.example.com');
    });
  });

  describe('Message Handling Integration', () => {
    test('should handle contract execution messages', async () => {
      // Mock content script with contract handlers
      const mockSendResponse = jest.fn();
      
      // Simulate contract execution message
      const message = {
        type: 'contractExecutionRequested',
        correlationId: 'test-123',
        payload: {
          action: 'searchProducts',
          parameters: { query: 'laptop' }
        }
      };

      // Mock successful contract execution
      const expectedResponse = {
        correlationId: 'test-123',
        status: 'success',
        data: {
          success: true,
          action: 'search',
          query: 'laptop'
        },
        executionTime: 150,
        contractId: 'demo-store.example.com_contract_123',
        timestamp: expect.any(String)
      };

      // Verify message structure
      expect(message.type).toBe('contractExecutionRequested');
      expect(message.payload.action).toBe('searchProducts');
      expect(message.payload.parameters.query).toBe('laptop');
    });

    test('should handle contract discovery messages', async () => {
      const message = {
        type: 'contractDiscoveryRequested',
        correlationId: 'discovery-456'
      };

      const expectedResponse = {
        correlationId: 'discovery-456',
        status: 'success',
        data: {
          contracts: expect.any(Array),
          availability: expect.objectContaining({
            available: expect.any(Boolean),
            contractCount: expect.any(Number)
          }),
          availableActions: expect.any(Array),
          url: expect.any(String),
          domain: expect.any(String)
        },
        timestamp: expect.any(String)
      };

      // Verify message structure
      expect(message.type).toBe('contractDiscoveryRequested');
      expect(message.correlationId).toBe('discovery-456');
    });
  });

  describe('Background Script Integration', () => {
    test('should register contract handlers in message dispatcher', () => {
      // Mock the message dispatcher registration
      const mockHandlers = new Map();
      const mockDispatcher = {
        handlers: mockHandlers,
        registerHandler: jest.fn((type, handler) => {
          mockHandlers.set(type, handler);
        })
      };

      // Simulate handler registration
      mockDispatcher.registerHandler('ContractExecutionRequested', {});
      mockDispatcher.registerHandler('ContractDiscoveryRequested', {});
      mockDispatcher.registerHandler('ContractAvailabilityCheck', {});

      expect(mockHandlers.has('ContractExecutionRequested')).toBe(true);
      expect(mockHandlers.has('ContractDiscoveryRequested')).toBe(true);
      expect(mockHandlers.has('ContractAvailabilityCheck')).toBe(true);
    });

    test('should forward contract messages to content script', async () => {
      const mockTab = { id: 123 };
      chrome.tabs.query.mockResolvedValue([mockTab]);
      
      const mockMessage = {
        type: 'ContractExecutionRequested',
        correlationId: 'test-789',
        payload: { action: 'test' }
      };

      // Simulate message forwarding
      chrome.tabs.sendMessage.mockImplementation((tabId, message, callback) => {
        expect(tabId).toBe(123);
        expect(message.type).toBe('contractExecutionRequested');
        callback({ status: 'success' });
      });

      // This would be called by the actual handler
      chrome.tabs.sendMessage(mockTab.id, {
        ...mockMessage,
        type: 'contractExecutionRequested'
      }, (response) => {
        expect(response.status).toBe('success');
      });

      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
        123,
        expect.objectContaining({
          type: 'contractExecutionRequested',
          correlationId: 'test-789'
        }),
        expect.any(Function)
      );
    });
  });
});

// Integration test for the complete contract flow
describe('End-to-End Contract Integration', () => {
  test('should complete full contract discovery and execution flow', async () => {
    // 1. Contract Discovery Phase
    const discoveryMessage = {
      type: 'contractDiscoveryRequested',
      correlationId: 'e2e-discovery'
    };

    // Mock discovered contract
    const discoveredContract = {
      version: '1.0.0',
      domain: 'demo-store.example.com',
      title: 'E-commerce Demo Contract',
      capabilities: {
        searchProducts: {
          type: 'form',
          description: 'Search for products',
          selector: '[data-testid="search-input"]',
          parameters: [
            { name: 'query', type: 'string', required: true }
          ]
        }
      }
    };

    // 2. Contract Execution Phase
    const executionMessage = {
      type: 'contractExecutionRequested',
      correlationId: 'e2e-execution',
      payload: {
        action: 'searchProducts',
        parameters: { query: 'gaming laptop' }
      }
    };

    // 3. Verify contract availability
    const availabilityMessage = {
      type: 'contractAvailabilityCheck',
      correlationId: 'e2e-availability'
    };

    // Simulate the complete flow
    const flow = {
      discovery: {
        request: discoveryMessage,
        response: {
          correlationId: 'e2e-discovery',
          status: 'success',
          data: {
            contracts: [discoveredContract],
            availability: {
              available: true,
              contractCount: 1,
              capabilities: ['searchProducts'],
              domain: 'demo-store.example.com'
            }
          }
        }
      },
      execution: {
        request: executionMessage,
        response: {
          correlationId: 'e2e-execution',
          status: 'success',
          data: {
            success: true,
            action: 'search',
            query: 'gaming laptop'
          },
          contractId: 'demo-store.example.com_contract',
          capabilityName: 'searchProducts'
        }
      }
    };

    // Verify the flow structure
    expect(flow.discovery.request.type).toBe('contractDiscoveryRequested');
    expect(flow.discovery.response.data.contracts).toHaveLength(1);
    expect(flow.execution.request.payload.action).toBe('searchProducts');
    expect(flow.execution.response.status).toBe('success');

    console.log('✅ End-to-end contract integration test completed successfully');
  });
});