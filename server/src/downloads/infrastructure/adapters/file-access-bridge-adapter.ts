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

import { Adapter, listen } from '@typescript-eda/core';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { 
    ServerFileAccessRequested,
    ServerFileAccessProvided,
    FileDownloadCompleted
} from '../../../shared/types';

/**
 * File Access Bridge Adapter - Bridges browser downloads with server file system
 * 
 * Responsibilities:
 * - Provide server-side access to browser-downloaded files
 * - Handle file operations requested by clients (read, copy, move, delete)
 * - Manage download directory monitoring and file indexing
 * - Bridge the gap between browser-constrained downloads and server file access
 */
export class FileAccessBridgeAdapter extends Adapter {
    private downloadDirectory: string;
    private downloadIndex = new Map<number, DownloadedFileInfo>();
    private watchers = new Map<string, fs.FSWatcher>();

    constructor(downloadDirectory?: string) {
        super();
        this.downloadDirectory = downloadDirectory || this.getDefaultDownloadDirectory();
        this.initializeFileWatching();
    }

    /**
     * Gets the default download directory for the current platform
     */
    private getDefaultDownloadDirectory(): string {
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
    private async initializeFileWatching(): Promise<void> {
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
        } catch (error) {
            console.error('Failed to initialize file watching:', error);
        }
    }

    /**
     * Handles file changes in download directory
     */
    private async handleFileChange(filename: string): Promise<void> {
        if (!filename) return;

        const filepath = path.join(this.downloadDirectory, filename);
        
        try {
            const stats = await fs.stat(filepath);
            
            if (stats.isFile()) {
                // New file detected - add to index
                await this.indexDownloadedFile(filepath, stats);
            }
        } catch (error) {
            // File might have been deleted or moved
            await this.removeFromIndex(filepath);
        }
    }

    /**
     * Indexes a newly downloaded file
     */
    private async indexDownloadedFile(filepath: string, stats: fs.Stats): Promise<void> {
        const filename = path.basename(filepath);
        const downloadInfo: DownloadedFileInfo = {
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
        this.emit(new FileDownloadCompleted(
            downloadInfo.id,
            '', // URL not available in server context
            filename,
            filepath,
            stats.size,
            downloadInfo.mimeType
        ));
    }

    /**
     * Removes file from index
     */
    private async removeFromIndex(filepath: string): Promise<void> {
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
    @listen(ServerFileAccessRequested)
    public async handleFileAccessRequest(event: ServerFileAccessRequested): Promise<void> {
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
        } catch (error) {
            await this.sendErrorResponse(event, error instanceof Error ? error.message : 'File operation failed');
        }
    }

    /**
     * Handles file read operations
     */
    private async handleFileRead(event: ServerFileAccessRequested, info: DownloadedFileInfo): Promise<void> {
        try {
            const content = await fs.readFile(info.filepath);
            
            const response = new ServerFileAccessProvided(
                event.correlationId,
                event.downloadId,
                'read',
                true,
                info.filepath,
                content,
                undefined
            );
            
            this.emit(response);
        } catch (error) {
            await this.sendErrorResponse(event, `Failed to read file: ${error.message}`);
        }
    }

    /**
     * Handles file copy operations
     */
    private async handleFileCopy(event: ServerFileAccessRequested, info: DownloadedFileInfo): Promise<void> {
        try {
            const targetPath = event.targetPath || this.generateCopyPath(info.filepath);
            
            await fs.copyFile(info.filepath, targetPath);
            
            const response = new ServerFileAccessProvided(
                event.correlationId,
                event.downloadId,
                'copy',
                true,
                targetPath,
                undefined,
                undefined
            );
            
            this.emit(response);
        } catch (error) {
            await this.sendErrorResponse(event, `Failed to copy file: ${error.message}`);
        }
    }

    /**
     * Handles file move operations
     */
    private async handleFileMove(event: ServerFileAccessRequested, info: DownloadedFileInfo): Promise<void> {
        try {
            const targetPath = event.targetPath || this.generateMovePath(info.filepath);
            
            await fs.rename(info.filepath, targetPath);
            
            // Update index with new path
            info.filepath = targetPath;
            info.filename = path.basename(targetPath);
            
            const response = new ServerFileAccessProvided(
                event.correlationId,
                event.downloadId,
                'move',
                true,
                targetPath,
                undefined,
                undefined
            );
            
            this.emit(response);
        } catch (error) {
            await this.sendErrorResponse(event, `Failed to move file: ${error.message}`);
        }
    }

    /**
     * Handles file delete operations
     */
    private async handleFileDelete(event: ServerFileAccessRequested, info: DownloadedFileInfo): Promise<void> {
        try {
            await fs.unlink(info.filepath);
            
            // Remove from index
            this.downloadIndex.delete(event.downloadId);
            
            const response = new ServerFileAccessProvided(
                event.correlationId,
                event.downloadId,
                'delete',
                true,
                info.filepath,
                undefined,
                undefined
            );
            
            this.emit(response);
        } catch (error) {
            await this.sendErrorResponse(event, `Failed to delete file: ${error.message}`);
        }
    }

    /**
     * Sends error response for failed operations
     */
    private async sendErrorResponse(event: ServerFileAccessRequested, errorMessage: string): Promise<void> {
        const response = new ServerFileAccessProvided(
            event.correlationId,
            event.downloadId,
            event.requestedOperation,
            false,
            undefined,
            undefined,
            errorMessage
        );
        
        this.emit(response);
    }

    /**
     * Checks if file exists
     */
    private async fileExists(filepath: string): Promise<boolean> {
        try {
            await fs.access(filepath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Generates copy path for file
     */
    private generateCopyPath(originalPath: string): string {
        const dir = path.dirname(originalPath);
        const ext = path.extname(originalPath);
        const basename = path.basename(originalPath, ext);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        return path.join(dir, `${basename}_copy_${timestamp}${ext}`);
    }

    /**
     * Generates move path for file
     */
    private generateMovePath(originalPath: string): string {
        const dir = path.dirname(originalPath);
        const ext = path.extname(originalPath);
        const basename = path.basename(originalPath, ext);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        return path.join(dir, 'moved', `${basename}_${timestamp}${ext}`);
    }

    /**
     * Gets MIME type from file extension
     */
    private getMimeType(filename: string): string {
        const ext = path.extname(filename).toLowerCase();
        
        const mimeTypes: { [key: string]: string } = {
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
    public getDownloadStats(): object {
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
    private calculateSizeDistribution(): object {
        const distribution = {
            small: 0,  // < 1MB
            medium: 0, // 1MB - 10MB
            large: 0,  // 10MB - 100MB
            huge: 0    // > 100MB
        };

        for (const info of this.downloadIndex.values()) {
            const sizeMB = info.size / (1024 * 1024);
            
            if (sizeMB < 1) {
                distribution.small++;
            } else if (sizeMB < 10) {
                distribution.medium++;
            } else if (sizeMB < 100) {
                distribution.large++;
            } else {
                distribution.huge++;
            }
        }

        return distribution;
    }

    /**
     * Manually registers a download (for browser downloads detected by extension)
     */
    public async registerDownload(downloadInfo: Partial<DownloadedFileInfo>): Promise<number> {
        const id = Date.now() + Math.floor(Math.random() * 1000);
        
        const fullInfo: DownloadedFileInfo = {
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
    public dispose(): void {
        // Close all file watchers
        for (const watcher of this.watchers.values()) {
            watcher.close();
        }
        this.watchers.clear();
        this.downloadIndex.clear();
    }
}

/**
 * Interface for downloaded file information
 */
interface DownloadedFileInfo {
    id: number;
    filename: string;
    filepath: string;
    size: number;
    downloadedAt: Date;
    mimeType: string;
    accessible: boolean;
}