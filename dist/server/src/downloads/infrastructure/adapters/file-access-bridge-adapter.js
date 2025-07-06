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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
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
class FileAccessBridgeAdapter extends core_1.Adapter {
    constructor(downloadDirectory) {
        super();
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
    async initializeFileWatching() {
        try {
            // Ensure download directory exists
            await fs.mkdir(this.downloadDirectory, { recursive: true });
            // Watch for new files in download directory
            const watcher = fs.watch(this.downloadDirectory, { recursive: false });
            for await (const event of watcher) {
                if (event.eventType === 'rename') {
                    await this.handleFileChange(event.filename);
                }
            }
        }
        catch (error) {
            console.error('Failed to initialize file watching:', error);
        }
    }
    /**
     * Handles file changes in download directory
     */
    async handleFileChange(filename) {
        if (!filename)
            return;
        const filepath = path.join(this.downloadDirectory, filename);
        try {
            const stats = await fs.stat(filepath);
            if (stats.isFile()) {
                // New file detected - add to index
                await this.indexDownloadedFile(filepath, stats);
            }
        }
        catch (error) {
            // File might have been deleted or moved
            await this.removeFromIndex(filepath);
        }
    }
    /**
     * Indexes a newly downloaded file
     */
    async indexDownloadedFile(filepath, stats) {
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
    }
    /**
     * Removes file from index
     */
    async removeFromIndex(filepath) {
        for (const [id, info] of this.downloadIndex.entries()) {
            if (info.filepath === filepath) {
                this.downloadIndex.delete(id);
                break;
            }
        }
    }
    /**
     * Handles server file access requests from clients
     */
    async handleFileAccessRequest(event) {
        try {
            const downloadInfo = this.downloadIndex.get(event.downloadId);
            if (!downloadInfo) {
                await this.sendErrorResponse(event, 'Download not found in server index');
                return;
            }
            if (!await this.fileExists(downloadInfo.filepath)) {
                await this.sendErrorResponse(event, 'File no longer exists on disk');
                return;
            }
            switch (event.requestedOperation) {
                case 'read':
                    await this.handleFileRead(event, downloadInfo);
                    break;
                case 'copy':
                    await this.handleFileCopy(event, downloadInfo);
                    break;
                case 'move':
                    await this.handleFileMove(event, downloadInfo);
                    break;
                case 'delete':
                    await this.handleFileDelete(event, downloadInfo);
                    break;
                default:
                    await this.sendErrorResponse(event, `Unsupported operation: ${event.requestedOperation}`);
            }
        }
        catch (error) {
            await this.sendErrorResponse(event, error instanceof Error ? error.message : 'File operation failed');
        }
    }
    /**
     * Handles file read operations
     */
    async handleFileRead(event, info) {
        try {
            const content = await fs.readFile(info.filepath);
            const response = new download_events_1.ServerFileAccessProvided(event.correlationId, event.downloadId, 'read', true, info.filepath, content, undefined);
            this.emit(response);
        }
        catch (error) {
            await this.sendErrorResponse(event, `Failed to read file: ${error.message}`);
        }
    }
    /**
     * Handles file copy operations
     */
    async handleFileCopy(event, info) {
        try {
            const targetPath = event.targetPath || this.generateCopyPath(info.filepath);
            await fs.copyFile(info.filepath, targetPath);
            const response = new download_events_1.ServerFileAccessProvided(event.correlationId, event.downloadId, 'copy', true, targetPath, undefined, undefined);
            this.emit(response);
        }
        catch (error) {
            await this.sendErrorResponse(event, `Failed to copy file: ${error.message}`);
        }
    }
    /**
     * Handles file move operations
     */
    async handleFileMove(event, info) {
        try {
            const targetPath = event.targetPath || this.generateMovePath(info.filepath);
            await fs.rename(info.filepath, targetPath);
            // Update index with new path
            info.filepath = targetPath;
            info.filename = path.basename(targetPath);
            const response = new download_events_1.ServerFileAccessProvided(event.correlationId, event.downloadId, 'move', true, targetPath, undefined, undefined);
            this.emit(response);
        }
        catch (error) {
            await this.sendErrorResponse(event, `Failed to move file: ${error.message}`);
        }
    }
    /**
     * Handles file delete operations
     */
    async handleFileDelete(event, info) {
        try {
            await fs.unlink(info.filepath);
            // Remove from index
            this.downloadIndex.delete(event.downloadId);
            const response = new download_events_1.ServerFileAccessProvided(event.correlationId, event.downloadId, 'delete', true, info.filepath, undefined, undefined);
            this.emit(response);
        }
        catch (error) {
            await this.sendErrorResponse(event, `Failed to delete file: ${error.message}`);
        }
    }
    /**
     * Sends error response for failed operations
     */
    async sendErrorResponse(event, errorMessage) {
        const response = new download_events_1.ServerFileAccessProvided(event.correlationId, event.downloadId, event.requestedOperation, false, undefined, undefined, errorMessage);
        this.emit(response);
    }
    /**
     * Checks if file exists
     */
    async fileExists(filepath) {
        try {
            await fs.access(filepath);
            return true;
        }
        catch {
            return false;
        }
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
    async registerDownload(downloadInfo) {
        const id = Date.now() + Math.floor(Math.random() * 1000);
        const fullInfo = {
            id,
            filename: downloadInfo.filename || 'unknown',
            filepath: downloadInfo.filepath || '',
            size: downloadInfo.size || 0,
            downloadedAt: downloadInfo.downloadedAt || new Date(),
            mimeType: downloadInfo.mimeType || 'application/octet-stream',
            accessible: downloadInfo.accessible ?? true
        };
        this.downloadIndex.set(id, fullInfo);
        return id;
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
}
exports.FileAccessBridgeAdapter = FileAccessBridgeAdapter;
__decorate([
    (0, core_1.listen)(download_events_1.ServerFileAccessRequested),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [download_events_1.ServerFileAccessRequested]),
    __metadata("design:returntype", Promise)
], FileAccessBridgeAdapter.prototype, "handleFileAccessRequest", null);
//# sourceMappingURL=file-access-bridge-adapter.js.map