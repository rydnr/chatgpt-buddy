"use strict";
/**
 * @fileoverview Anthropic Integration Adapter for ChatGPT-Buddy
 * @description Adapter for integrating with Anthropic Claude API services
 * @author rydnr
 */
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnthropicIntegrationAdapter = exports.AnthropicIntegrationPort = void 0;
const infrastructure_1 = require("@typescript-eda/infrastructure");
/**
 * Port interface for Anthropic integration operations
 */
class AnthropicIntegrationPort extends infrastructure_1.Port {
    constructor() {
        super(...arguments);
        this.name = 'AnthropicIntegrationPort';
    }
}
exports.AnthropicIntegrationPort = AnthropicIntegrationPort;
/**
 * Anthropic integration adapter using Anthropic SDK
 * Provides Claude model integrations for automation
 */
let AnthropicIntegrationAdapter = (() => {
    let _classDecorators = [(0, infrastructure_1.AdapterFor)(AnthropicIntegrationPort)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = AnthropicIntegrationPort;
    var AnthropicIntegrationAdapter = _classThis = class extends _classSuper {
        constructor() {
            super(...arguments);
            this.isInitialized = false;
        }
        initialize() {
            return __awaiter(this, void 0, void 0, function* () {
                console.log('🔧 Initializing Anthropic integration adapter...');
                this.isInitialized = true;
                console.log('✅ Anthropic integration adapter initialized');
            });
        }
        generateResponse(request) {
            return __awaiter(this, void 0, void 0, function* () {
                console.log(`🤖 Generating Anthropic response with model: ${request.model}`);
                // Mock implementation for now
                return {
                    content: `Mock Anthropic response for: ${request.prompt.substring(0, 50)}...`,
                    usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
                    modelUsed: request.model || 'claude-3-sonnet',
                    responseTime: 1000
                };
            });
        }
        analyzeText(text, analysisType) {
            return __awaiter(this, void 0, void 0, function* () {
                console.log(`🔍 Analyzing text with Anthropic: ${analysisType}`);
                return { result: `Mock analysis of type ${analysisType}` };
            });
        }
        getModelInfo(model) {
            return __awaiter(this, void 0, void 0, function* () {
                return { id: model, capabilities: ['text-generation', 'analysis'] };
            });
        }
        isHealthy() {
            return __awaiter(this, void 0, void 0, function* () {
                return this.isInitialized;
            });
        }
        shutdown() {
            return __awaiter(this, void 0, void 0, function* () {
                console.log('🔌 Anthropic integration adapter shutting down...');
                this.isInitialized = false;
            });
        }
    };
    __setFunctionName(_classThis, "AnthropicIntegrationAdapter");
    (() => {
        var _a;
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create((_a = _classSuper[Symbol.metadata]) !== null && _a !== void 0 ? _a : null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AnthropicIntegrationAdapter = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AnthropicIntegrationAdapter = _classThis;
})();
exports.AnthropicIntegrationAdapter = AnthropicIntegrationAdapter;
