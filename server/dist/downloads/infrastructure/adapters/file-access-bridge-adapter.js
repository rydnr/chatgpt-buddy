"use strict";
/*
                        Web-Buddy Framework
                        Server File Access Bridge Adapter

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
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileAccessBridgeAdapter = void 0;
const core_1 = require("@typescript-eda/core");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const download_events_1 = require("../../domain/events/download-events");
/**
 * File Access Bridge Adapter - Bridges browser downloads with server file system
 *
 * Responsibilities:
 * - Provide server-side access to browser-downloaded files
 * - Handle file operations requested by clients (read, copy, move, delete)
 * - Manage download directory monitoring and file indexing
 * - Bridge the gap between browser-constrained downloads and server file access
 */
let FileAccessBridgeAdapter = (() => {
    var _a;
    let _classSuper = core_1.Adapter;
    let _instanceExtraInitializers = [];
    let _handleFileAccessRequest_decorators;
    return _a = class FileAccessBridgeAdapter extends _classSuper {
            constructor(downloadDirectory) {
                super();
                this.downloadDirectory = __runInitializers(this, _instanceExtraInitializers);
                this.downloadIndex = new Map();
                this.watchers = new Map();
                this.downloadDirectory = downloadDirectory || this.getDefaultDownloadDirectory();
                this.initializeFileWatching();
            }
            /**
             * Gets the default download directory for the current platform
             */
            getDefaultDownloadDirectory() {
                const homeDir = os.homedir();
                switch (process.platform) {
                    case 'win32':
                        return path.join(homeDir, 'Downloads');
                    case 'darwin':
                        return path.join(homeDir, 'Downloads');
                    case 'linux':
                        return path.join(homeDir, 'Downloads');
                    default:
                        return path.join(homeDir, 'Downloads');
                }
            }
            /**
             * Initializes file system watching for download directory
             */
            initializeFileWatching() {
                return __awaiter(this, void 0, void 0, function* () {
                    var _b, e_1, _c, _d;
                    try {
                        // Ensure download directory exists
                        yield fs.mkdir(this.downloadDirectory, { recursive: true });
                        // Watch for new files in download directory
                        const watcher = fs.watch(this.downloadDirectory, { recursive: false });
                        try {
                            for (var _e = true, watcher_1 = __asyncValues(watcher), watcher_1_1; watcher_1_1 = yield watcher_1.next(), _b = watcher_1_1.done, !_b; _e = true) {
                                _d = watcher_1_1.value;
                                _e = false;
                                const event = _d;
                                if (event.eventType === 'rename') {
                                    yield this.handleFileChange(event.filename);
                                }
                            }
                        }
                        catch (e_1_1) { e_1 = { error: e_1_1 }; }
                        finally {
                            try {
                                if (!_e && !_b && (_c = watcher_1.return)) yield _c.call(watcher_1);
                            }
                            finally { if (e_1) throw e_1.error; }
                        }
                    }
                    catch (error) {
                        console.error('Failed to initialize file watching:', error);
                    }
                });
            }
            /**
             * Handles file changes in download directory
             */
            handleFileChange(filename) {
                return __awaiter(this, void 0, void 0, function* () {
                    if (!filename)
                        return;
                    const filepath = path.join(this.downloadDirectory, filename);
                    try {
                        const stats = yield fs.stat(filepath);
                        if (stats.isFile()) {
                            // New file detected - add to index
                            yield this.indexDownloadedFile(filepath, stats);
                        }
                    }
                    catch (error) {
                        // File might have been deleted or moved
                        yield this.removeFromIndex(filepath);
                    }
                });
            }
            /**
             * Indexes a newly downloaded file
             */
            indexDownloadedFile(filepath, stats) {
                return __awaiter(this, void 0, void 0, function* () {
                    const filename = path.basename(filepath);
                    const downloadInfo = {
                        id: Date.now(), // Simple ID generation
                        filename,
                        filepath,
                        size: stats.size,
                        downloadedAt: stats.birthtime,
                        mimeType: this.getMimeType(filename),
                        accessible: true
                    };
                    this.downloadIndex.set(downloadInfo.id, downloadInfo);
                    // Emit completion event for monitoring
                    this.emit(new download_events_1.FileDownloadCompleted(downloadInfo.id, '', // URL not available in server context
                    filename, filepath, stats.size, downloadInfo.mimeType));
                });
            }
            /**
             * Removes file from index
             */
            removeFromIndex(filepath) {
                return __awaiter(this, void 0, void 0, function* () {
                    for (const [id, info] of this.downloadIndex.entries()) {
                        if (info.filepath === filepath) {
                            this.downloadIndex.delete(id);
                            break;
                        }
                    }
                });
            }
            /**
             * Handles server file access requests from clients
             */
            handleFileAccessRequest(event) {
                return __awaiter(this, void 0, void 0, function* () {
                    try {
                        const downloadInfo = this.downloadIndex.get(event.downloadId);
                        if (!downloadInfo) {
                            yield this.sendErrorResponse(event, 'Download not found in server index');
                            return;
                        }
                        if (!(yield this.fileExists(downloadInfo.filepath))) {
                            yield this.sendErrorResponse(event, 'File no longer exists on disk');
                            return;
                        }
                        switch (event.requestedOperation) {
                            case 'read':
                                yield this.handleFileRead(event, downloadInfo);
                                break;
                            case 'copy':
                                yield this.handleFileCopy(event, downloadInfo);
                                break;
                            case 'move':
                                yield this.handleFileMove(event, downloadInfo);
                                break;
                            case 'delete':
                                yield this.handleFileDelete(event, downloadInfo);
                                break;
                            default:
                                yield this.sendErrorResponse(event, `Unsupported operation: ${event.requestedOperation}`);
                        }
                    }
                    catch (error) {
                        yield this.sendErrorResponse(event, error instanceof Error ? error.message : 'File operation failed');
                    }
                });
            }
            /**
             * Handles file read operations
             */
            handleFileRead(event, info) {
                return __awaiter(this, void 0, void 0, function* () {
                    try {
                        const content = yield fs.readFile(info.filepath);
                        const response = new download_events_1.ServerFileAccessProvided(event.correlationId, event.downloadId, 'read', true, info.filepath, content, undefined);
                        this.emit(response);
                    }
                    catch (error) {
                        yield this.sendErrorResponse(event, `Failed to read file: ${error.message}`);
                    }
                });
            }
            /**
             * Handles file copy operations
             */
            handleFileCopy(event, info) {
                return __awaiter(this, void 0, void 0, function* () {
                    try {
                        const targetPath = event.targetPath || this.generateCopyPath(info.filepath);
                        yield fs.copyFile(info.filepath, targetPath);
                        const response = new download_events_1.ServerFileAccessProvided(event.correlationId, event.downloadId, 'copy', true, targetPath, undefined, undefined);
                        this.emit(response);
                    }
                    catch (error) {
                        yield this.sendErrorResponse(event, `Failed to copy file: ${error.message}`);
                    }
                });
            }
            /**
             * Handles file move operations
             */
            handleFileMove(event, info) {
                return __awaiter(this, void 0, void 0, function* () {
                    try {
                        const targetPath = event.targetPath || this.generateMovePath(info.filepath);
                        yield fs.rename(info.filepath, targetPath);
                        // Update index with new path
                        info.filepath = targetPath;
                        info.filename = path.basename(targetPath);
                        const response = new download_events_1.ServerFileAccessProvided(event.correlationId, event.downloadId, 'move', true, targetPath, undefined, undefined);
                        this.emit(response);
                    }
                    catch (error) {
                        yield this.sendErrorResponse(event, `Failed to move file: ${error.message}`);
                    }
                });
            }
            /**
             * Handles file delete operations
             */
            handleFileDelete(event, info) {
                return __awaiter(this, void 0, void 0, function* () {
                    try {
                        yield fs.unlink(info.filepath);
                        // Remove from index
                        this.downloadIndex.delete(event.downloadId);
                        const response = new download_events_1.ServerFileAccessProvided(event.correlationId, event.downloadId, 'delete', true, info.filepath, undefined, undefined);
                        this.emit(response);
                    }
                    catch (error) {
                        yield this.sendErrorResponse(event, `Failed to delete file: ${error.message}`);
                    }
                });
            }
            /**
             * Sends error response for failed operations
             */
            sendErrorResponse(event, errorMessage) {
                return __awaiter(this, void 0, void 0, function* () {
                    const response = new download_events_1.ServerFileAccessProvided(event.correlationId, event.downloadId, event.requestedOperation, false, undefined, undefined, errorMessage);
                    this.emit(response);
                });
            }
            /**
             * Checks if file exists
             */
            fileExists(filepath) {
                return __awaiter(this, void 0, void 0, function* () {
                    try {
                        yield fs.access(filepath);
                        return true;
                    }
                    catch (_b) {
                        return false;
                    }
                });
            }
            /**
             * Generates copy path for file
             */
            generateCopyPath(originalPath) {
                const dir = path.dirname(originalPath);
                const ext = path.extname(originalPath);
                const basename = path.basename(originalPath, ext);
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                return path.join(dir, `${basename}_copy_${timestamp}${ext}`);
            }
            /**
             * Generates move path for file
             */
            generateMovePath(originalPath) {
                const dir = path.dirname(originalPath);
                const ext = path.extname(originalPath);
                const basename = path.basename(originalPath, ext);
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                return path.join(dir, 'moved', `${basename}_${timestamp}${ext}`);
            }
            /**
             * Gets MIME type from file extension
             */
            getMimeType(filename) {
                const ext = path.extname(filename).toLowerCase();
                const mimeTypes = {
                    '.jpg': 'image/jpeg',
                    '.jpeg': 'image/jpeg',
                    '.png': 'image/png',
                    '.gif': 'image/gif',
                    '.webp': 'image/webp',
                    '.bmp': 'image/bmp',
                    '.svg': 'image/svg+xml',
                    '.pdf': 'application/pdf',
                    '.txt': 'text/plain',
                    '.json': 'application/json',
                    '.xml': 'application/xml',
                    '.zip': 'application/zip',
                    '.mp4': 'video/mp4',
                    '.mp3': 'audio/mpeg'
                };
                return mimeTypes[ext] || 'application/octet-stream';
            }
            /**
             * Gets download statistics
             */
            getDownloadStats() {
                return {
                    totalFiles: this.downloadIndex.size,
                    downloadDirectory: this.downloadDirectory,
                    recentDownloads: Array.from(this.downloadIndex.values())
                        .sort((a, b) => b.downloadedAt.getTime() - a.downloadedAt.getTime())
                        .slice(0, 10),
                    sizeDistribution: this.calculateSizeDistribution()
                };
            }
            /**
             * Calculates size distribution of downloads
             */
            calculateSizeDistribution() {
                const distribution = {
                    small: 0, // < 1MB
                    medium: 0, // 1MB - 10MB
                    large: 0, // 10MB - 100MB
                    huge: 0 // > 100MB
                };
                for (const info of this.downloadIndex.values()) {
                    const sizeMB = info.size / (1024 * 1024);
                    if (sizeMB < 1) {
                        distribution.small++;
                    }
                    else if (sizeMB < 10) {
                        distribution.medium++;
                    }
                    else if (sizeMB < 100) {
                        distribution.large++;
                    }
                    else {
                        distribution.huge++;
                    }
                }
                return distribution;
            }
            /**
             * Manually registers a download (for browser downloads detected by extension)
             */
            registerDownload(downloadInfo) {
                return __awaiter(this, void 0, void 0, function* () {
                    var _b;
                    const id = Date.now() + Math.floor(Math.random() * 1000);
                    const fullInfo = {
                        id,
                        filename: downloadInfo.filename || 'unknown',
                        filepath: downloadInfo.filepath || '',
                        size: downloadInfo.size || 0,
                        downloadedAt: downloadInfo.downloadedAt || new Date(),
                        mimeType: downloadInfo.mimeType || 'application/octet-stream',
                        accessible: (_b = downloadInfo.accessible) !== null && _b !== void 0 ? _b : true
                    };
                    this.downloadIndex.set(id, fullInfo);
                    return id;
                });
            }
            /**
             * Cleanup method
             */
            dispose() {
                // Close all file watchers
                for (const watcher of this.watchers.values()) {
                    watcher.close();
                }
                this.watchers.clear();
                this.downloadIndex.clear();
            }
        },
        (() => {
            var _b;
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create((_b = _classSuper[Symbol.metadata]) !== null && _b !== void 0 ? _b : null) : void 0;
            _handleFileAccessRequest_decorators = [(0, core_1.listen)(download_events_1.ServerFileAccessRequested)];
            __esDecorate(_a, null, _handleFileAccessRequest_decorators, { kind: "method", name: "handleFileAccessRequest", static: false, private: false, access: { has: obj => "handleFileAccessRequest" in obj, get: obj => obj.handleFileAccessRequest }, metadata: _metadata }, null, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
exports.FileAccessBridgeAdapter = FileAccessBridgeAdapter;
