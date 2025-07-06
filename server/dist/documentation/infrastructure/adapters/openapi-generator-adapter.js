"use strict";
/*
                        Web-Buddy Framework
                        OpenAPI Generator Adapter

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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAPIGeneratorAdapter = void 0;
const core_1 = require("@typescript-eda/core");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
/**
 * OpenAPI Generator Adapter - Generates OpenAPI 3.0 specification from domain events
 *
 * Responsibilities:
 * - Analyze domain events and generate corresponding API endpoints
 * - Create OpenAPI schema definitions from TypeScript types
 * - Generate complete OpenAPI specification document
 * - Support both REST API and WebSocket API documentation
 */
class OpenAPIGeneratorAdapter extends core_1.Adapter {
    constructor(version = '1.0.0', baseUrl = 'http://localhost:3000') {
        super();
        this.version = version;
        this.baseUrl = baseUrl;
        this.initializeApiSpec();
    }
    /**
     * Initializes the base OpenAPI specification structure
     */
    initializeApiSpec() {
        this.apiSpec = {
            openapi: '3.0.3',
            info: {
                title: 'Web-Buddy Framework API',
                description: `
# Web-Buddy Framework API

The Web-Buddy Framework provides a powerful, event-driven architecture for browser automation with interactive training capabilities.

## Key Features

- **Interactive Training System**: Learn automation patterns through user demonstration
- **Event-Driven Architecture**: All operations based on domain events
- **File Download Management**: Seamless browser-to-server file handling
- **Google Images Integration**: Specialized download automation for Google Images
- **Cross-Session Persistence**: Patterns and data persist across browser sessions

## Authentication

All API endpoints require Bearer token authentication:

\`\`\`
Authorization: Bearer your-secret-api-key
\`\`\`

## WebSocket Communication

The extension communicates with the server via WebSocket connections for real-time event handling.

## Event-Driven Design

All interactions follow an event-driven pattern where:
1. Client sends request event
2. Server processes through domain entities
3. Server responds with result events
4. Extension executes browser actions
5. Results flow back through the same event chain
                `.trim(),
                version: this.version,
                contact: {
                    name: 'Web-Buddy Support',
                    email: 'support@web-buddy.dev',
                    url: 'https://web-buddy.dev/support'
                },
                license: {
                    name: 'GPL v3',
                    url: 'https://www.gnu.org/licenses/gpl-3.0.html'
                }
            },
            servers: [
                {
                    url: this.baseUrl,
                    description: 'Development server'
                },
                {
                    url: 'https://api.web-buddy.dev',
                    description: 'Production server'
                }
            ],
            security: [
                {
                    bearerAuth: []
                }
            ],
            paths: {},
            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT'
                    }
                },
                schemas: {},
                examples: {}
            },
            tags: [
                {
                    name: 'automation',
                    description: 'Browser automation operations'
                },
                {
                    name: 'training',
                    description: 'Interactive training system'
                },
                {
                    name: 'downloads',
                    description: 'File download management'
                },
                {
                    name: 'patterns',
                    description: 'Automation pattern management'
                },
                {
                    name: 'google-images',
                    description: 'Google Images specific operations'
                }
            ]
        };
    }
    /**
     * Generates complete OpenAPI specification
     */
    generateSpecification() {
        return __awaiter(this, void 0, void 0, function* () {
            this.addCoreSchemas();
            this.addAutomationEndpoints();
            this.addTrainingEndpoints();
            this.addDownloadEndpoints();
            this.addPatternEndpoints();
            this.addGoogleImagesEndpoints();
            this.addWebSocketDocumentation();
            return JSON.stringify(this.apiSpec, null, 2);
        });
    }
    /**
     * Adds core schema definitions
     */
    addCoreSchemas() {
        this.apiSpec.components.schemas = Object.assign(Object.assign({}, this.apiSpec.components.schemas), { 
            // Core Types
            CorrelationId: {
                type: 'string',
                description: 'Unique identifier for tracking requests through the system',
                example: 'req_abc123def456'
            }, AgentMessage: {
                type: 'object',
                required: ['action', 'payload', 'correlationId'],
                properties: {
                    action: {
                        type: 'string',
                        enum: ['SELECT_PROJECT', 'SELECT_CHAT', 'GET_RESPONSE', 'FILL_PROMPT', 'DOWNLOAD_IMAGE', 'DOWNLOAD_FILE', 'GET_DOWNLOAD_STATUS', 'LIST_DOWNLOADS'],
                        description: 'Type of action to perform'
                    },
                    payload: {
                        type: 'object',
                        description: 'Action-specific payload data'
                    },
                    correlationId: {
                        $ref: '#/components/schemas/CorrelationId'
                    }
                }
            }, ActionResponse: {
                type: 'object',
                required: ['correlationId', 'status'],
                properties: {
                    correlationId: {
                        $ref: '#/components/schemas/CorrelationId'
                    },
                    status: {
                        type: 'string',
                        enum: ['success', 'error'],
                        description: 'Response status'
                    },
                    data: {
                        type: 'object',
                        description: 'Response data (varies by action)'
                    },
                    error: {
                        type: 'string',
                        description: 'Error message if status is error'
                    }
                }
            }, 
            // Dispatch Payload
            DispatchPayload: {
                type: 'object',
                required: ['target', 'message'],
                properties: {
                    target: {
                        type: 'object',
                        required: ['extensionId', 'tabId'],
                        properties: {
                            extensionId: {
                                type: 'string',
                                description: 'Browser extension instance identifier'
                            },
                            tabId: {
                                type: 'integer',
                                description: 'Target browser tab ID'
                            }
                        }
                    },
                    message: {
                        $ref: '#/components/schemas/AgentMessage'
                    }
                }
            }, 
            // Error Response
            ErrorResponse: {
                type: 'object',
                required: ['error'],
                properties: {
                    error: {
                        type: 'string',
                        description: 'Error message'
                    },
                    code: {
                        type: 'string',
                        description: 'Error code for programmatic handling'
                    }
                }
            }, 
            // Training Schemas
            TrainingSession: {
                type: 'object',
                properties: {
                    id: {
                        type: 'string',
                        description: 'Training session identifier'
                    },
                    mode: {
                        type: 'string',
                        enum: ['training', 'automatic'],
                        description: 'Current operation mode'
                    },
                    startedAt: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Session start timestamp'
                    },
                    patternsLearned: {
                        type: 'integer',
                        description: 'Number of patterns learned in this session'
                    }
                }
            }, AutomationPattern: {
                type: 'object',
                properties: {
                    id: {
                        type: 'string',
                        description: 'Pattern identifier'
                    },
                    messageType: {
                        type: 'string',
                        description: 'Type of message this pattern handles'
                    },
                    selector: {
                        type: 'string',
                        description: 'CSS selector for target element'
                    },
                    confidence: {
                        type: 'number',
                        minimum: 0,
                        maximum: 2,
                        description: 'Pattern confidence score'
                    },
                    usageCount: {
                        type: 'integer',
                        description: 'Number of times pattern has been used'
                    },
                    successfulExecutions: {
                        type: 'integer',
                        description: 'Number of successful executions'
                    },
                    context: {
                        type: 'object',
                        description: 'Pattern execution context'
                    }
                }
            }, 
            // Download Schemas
            DownloadFilePayload: {
                type: 'object',
                required: ['url'],
                properties: {
                    url: {
                        type: 'string',
                        format: 'uri',
                        description: 'URL of file to download'
                    },
                    filename: {
                        type: 'string',
                        description: 'Desired filename (optional)'
                    },
                    conflictAction: {
                        type: 'string',
                        enum: ['uniquify', 'overwrite', 'prompt'],
                        description: 'Action to take if file exists'
                    },
                    saveAs: {
                        type: 'boolean',
                        description: 'Show save dialog to user'
                    }
                }
            }, DownloadStatusResponse: {
                type: 'object',
                properties: {
                    downloadId: {
                        type: 'integer',
                        description: 'Download identifier'
                    },
                    url: {
                        type: 'string',
                        format: 'uri',
                        description: 'Download URL'
                    },
                    filename: {
                        type: 'string',
                        description: 'Downloaded filename'
                    },
                    state: {
                        type: 'string',
                        enum: ['in_progress', 'interrupted', 'complete'],
                        description: 'Download state'
                    },
                    bytesReceived: {
                        type: 'integer',
                        description: 'Bytes downloaded so far'
                    },
                    totalBytes: {
                        type: 'integer',
                        description: 'Total file size in bytes'
                    },
                    progress: {
                        type: 'number',
                        minimum: 0,
                        maximum: 100,
                        description: 'Download progress percentage'
                    }
                }
            }, 
            // Google Images Schemas
            GoogleImageElement: {
                type: 'object',
                required: ['src'],
                properties: {
                    src: {
                        type: 'string',
                        format: 'uri',
                        description: 'Image source URL'
                    },
                    alt: {
                        type: 'string',
                        description: 'Image alt text'
                    },
                    title: {
                        type: 'string',
                        description: 'Image title'
                    },
                    width: {
                        type: 'integer',
                        description: 'Image width in pixels'
                    },
                    height: {
                        type: 'integer',
                        description: 'Image height in pixels'
                    }
                }
            } });
    }
    /**
     * Adds automation endpoint definitions
     */
    addAutomationEndpoints() {
        this.apiSpec.paths['/api/dispatch'] = {
            post: {
                tags: ['automation'],
                summary: 'Dispatch automation command to browser extension',
                description: 'Sends an automation command to a specific browser extension and tab',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/DispatchPayload'
                            },
                            examples: {
                                selectProject: {
                                    summary: 'Select ChatGPT Project',
                                    value: {
                                        target: {
                                            extensionId: 'ext_123',
                                            tabId: 456
                                        },
                                        message: {
                                            action: 'SELECT_PROJECT',
                                            payload: {
                                                selector: '#storytelling'
                                            },
                                            correlationId: 'req_project_selection_001'
                                        }
                                    }
                                },
                                fillPrompt: {
                                    summary: 'Fill Prompt Text',
                                    value: {
                                        target: {
                                            extensionId: 'ext_123',
                                            tabId: 456
                                        },
                                        message: {
                                            action: 'FILL_PROMPT',
                                            payload: {
                                                selector: '#prompt-textarea',
                                                value: 'Generate a Python function to calculate fibonacci numbers'
                                            },
                                            correlationId: 'req_fill_prompt_001'
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: 'Command dispatched successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        status: {
                                            type: 'string',
                                            example: 'Message dispatched successfully'
                                        }
                                    }
                                }
                            }
                        }
                    },
                    400: {
                        description: 'Invalid dispatch payload',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/ErrorResponse'
                                }
                            }
                        }
                    },
                    401: {
                        description: 'Unauthorized - Missing or invalid API key',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/ErrorResponse'
                                }
                            }
                        }
                    },
                    404: {
                        description: 'Target extension not connected',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/ErrorResponse'
                                }
                            }
                        }
                    }
                }
            }
        };
    }
    /**
     * Adds training system endpoint definitions
     */
    addTrainingEndpoints() {
        this.apiSpec.paths['/api/training/enable'] = {
            post: {
                tags: ['training'],
                summary: 'Enable training mode',
                description: 'Enables interactive training mode for learning automation patterns',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['hostname'],
                                properties: {
                                    hostname: {
                                        type: 'string',
                                        description: 'Website hostname to enable training for'
                                    }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: 'Training mode enabled',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/TrainingSession'
                                }
                            }
                        }
                    }
                }
            }
        };
        this.apiSpec.paths['/api/training/patterns'] = {
            get: {
                tags: ['training', 'patterns'],
                summary: 'List learned automation patterns',
                description: 'Retrieves all learned automation patterns with their confidence scores',
                parameters: [
                    {
                        name: 'hostname',
                        in: 'query',
                        description: 'Filter patterns by hostname',
                        schema: { type: 'string' }
                    },
                    {
                        name: 'messageType',
                        in: 'query',
                        description: 'Filter patterns by message type',
                        schema: { type: 'string' }
                    }
                ],
                responses: {
                    200: {
                        description: 'List of automation patterns',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'array',
                                    items: {
                                        $ref: '#/components/schemas/AutomationPattern'
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };
    }
    /**
     * Adds download management endpoint definitions
     */
    addDownloadEndpoints() {
        this.apiSpec.paths['/api/downloads'] = {
            post: {
                tags: ['downloads'],
                summary: 'Initiate file download',
                description: 'Starts a file download through the browser extension',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                allOf: [
                                    { $ref: '#/components/schemas/DispatchPayload' },
                                    {
                                        properties: {
                                            message: {
                                                properties: {
                                                    action: { enum: ['DOWNLOAD_FILE'] },
                                                    payload: { $ref: '#/components/schemas/DownloadFilePayload' }
                                                }
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: 'Download initiated',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        downloadId: { type: 'integer' },
                                        status: { type: 'string' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };
        this.apiSpec.paths['/api/downloads/{downloadId}/status'] = {
            get: {
                tags: ['downloads'],
                summary: 'Get download status',
                description: 'Retrieves the current status of a download',
                parameters: [
                    {
                        name: 'downloadId',
                        in: 'path',
                        required: true,
                        description: 'Download identifier',
                        schema: { type: 'integer' }
                    }
                ],
                responses: {
                    200: {
                        description: 'Download status',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/DownloadStatusResponse'
                                }
                            }
                        }
                    }
                }
            }
        };
    }
    /**
     * Adds pattern management endpoint definitions
     */
    addPatternEndpoints() {
        this.apiSpec.paths['/api/patterns/export'] = {
            get: {
                tags: ['patterns'],
                summary: 'Export automation patterns',
                description: 'Exports learned patterns for backup or sharing',
                responses: {
                    200: {
                        description: 'Pattern export data',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        patterns: {
                                            type: 'array',
                                            items: { $ref: '#/components/schemas/AutomationPattern' }
                                        },
                                        exportedAt: {
                                            type: 'string',
                                            format: 'date-time'
                                        },
                                        version: { type: 'string' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };
        this.apiSpec.paths['/api/patterns/import'] = {
            post: {
                tags: ['patterns'],
                summary: 'Import automation patterns',
                description: 'Imports previously exported patterns',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['patterns'],
                                properties: {
                                    patterns: {
                                        type: 'array',
                                        items: { $ref: '#/components/schemas/AutomationPattern' }
                                    },
                                    overwrite: {
                                        type: 'boolean',
                                        description: 'Whether to overwrite existing patterns'
                                    }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: 'Patterns imported successfully',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        imported: { type: 'integer' },
                                        skipped: { type: 'integer' },
                                        errors: { type: 'integer' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };
    }
    /**
     * Adds Google Images specific endpoint definitions
     */
    addGoogleImagesEndpoints() {
        this.apiSpec.paths['/api/google-images/download'] = {
            post: {
                tags: ['google-images', 'downloads'],
                summary: 'Download image from Google Images',
                description: 'Downloads an image from Google Images with automatic high-resolution extraction',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['target', 'imageElement'],
                                properties: {
                                    target: {
                                        type: 'object',
                                        required: ['extensionId', 'tabId'],
                                        properties: {
                                            extensionId: { type: 'string' },
                                            tabId: { type: 'integer' }
                                        }
                                    },
                                    imageElement: {
                                        $ref: '#/components/schemas/GoogleImageElement'
                                    },
                                    searchQuery: {
                                        type: 'string',
                                        description: 'Original search query for context'
                                    },
                                    filename: {
                                        type: 'string',
                                        description: 'Custom filename (optional)'
                                    }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: 'Google Images download initiated',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        downloadId: { type: 'integer' },
                                        extractedUrl: { type: 'string' },
                                        filename: { type: 'string' },
                                        status: { type: 'string' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };
    }
    /**
     * Adds WebSocket API documentation
     */
    addWebSocketDocumentation() {
        // Add WebSocket info to the description
        this.apiSpec.info.description += `

## WebSocket API

The WebSocket API enables real-time communication between the server and browser extensions.

### Connection
- **URL**: \`ws://localhost:3000\` (development) or \`wss://api.web-buddy.dev\` (production)
- **Protocol**: Standard WebSocket

### Authentication
Extensions must register with the server by sending a registration message:

\`\`\`json
{
  "type": "REGISTER",
  "extensionId": "unique-extension-id",
  "secret": "extension-secret-key"
}
\`\`\`

### Message Format
All WebSocket messages follow the AgentMessage schema with additional metadata:

\`\`\`json
{
  "tabId": 123,
  "message": {
    "action": "SELECT_PROJECT",
    "payload": { "selector": "#project-name" },
    "correlationId": "req_123"
  }
}
\`\`\`

### Event Flow
1. Client sends HTTP POST to \`/api/dispatch\`
2. Server forwards message to extension via WebSocket
3. Extension executes action in browser
4. Extension sends response back via WebSocket
5. Server can correlate response with original request
        `;
    }
    /**
     * Saves the generated specification to a file
     */
    saveSpecification(outputPath) {
        return __awaiter(this, void 0, void 0, function* () {
            const spec = yield this.generateSpecification();
            const dir = path.dirname(outputPath);
            // Ensure directory exists
            yield fs.mkdir(dir, { recursive: true });
            // Write specification
            yield fs.writeFile(outputPath, spec, 'utf8');
        });
    }
    /**
     * Generates a YAML version of the specification
     */
    generateYamlSpecification() {
        return __awaiter(this, void 0, void 0, function* () {
            const jsonSpec = yield this.generateSpecification();
            // For simplicity, return JSON. In production, you'd convert to YAML
            return jsonSpec;
        });
    }
}
exports.OpenAPIGeneratorAdapter = OpenAPIGeneratorAdapter;
