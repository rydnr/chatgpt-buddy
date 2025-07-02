/*
                        Web-Buddy Framework
                        Chrome Downloads Infrastructure Adapter

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
import { 
    FileDownloadProgress,
    FileDownloadCompleted,
    FileDownloadFailed,
    ServerFileAccessRequested,
    ServerFileAccessProvided
} from '../../domain/events/download-events';

/**
 * Chrome Downloads Adapter - Bridges Chrome Downloads API with domain events
 * 
 * Responsibilities:
 * - Listen to Chrome downloads API events
 * - Convert Chrome download states to domain events
 * - Provide file system access for downloaded files
 * - Handle download interruptions and errors
 */
export class ChromeDownloadsAdapter extends Adapter {
    private activeDownloads = new Map<number, chrome.downloads.DownloadItem>();
    private downloadListeners = new Set<(event: FileDownloadProgress) => void>();

    constructor() {
        super();
        this.initializeDownloadListeners();
    }

    /**
     * Initializes Chrome Downloads API listeners
     */
    private initializeDownloadListeners(): void {
        // Listen for download state changes
        chrome.downloads.onChanged.addListener((downloadDelta) => {
            this.handleDownloadChange(downloadDelta);
        });

        // Listen for download creation
        chrome.downloads.onCreated.addListener((downloadItem) => {
            this.activeDownloads.set(downloadItem.id, downloadItem);
            this.emitProgressEvent(downloadItem);
        });

        // Listen for download determination (file path resolved)
        chrome.downloads.onDeterminingFilename.addListener((downloadItem, suggest) => {
            this.activeDownloads.set(downloadItem.id, downloadItem);
            // Let Chrome determine the filename automatically
            suggest();
        });
    }

    /**
     * Handles download state changes from Chrome API
     */
    private handleDownloadChange(downloadDelta: chrome.downloads.DownloadDelta): void {
        const downloadId = downloadDelta.id;
        const currentDownload = this.activeDownloads.get(downloadId);

        if (!currentDownload) {
            // Fetch download info if not cached
            chrome.downloads.search({ id: downloadId }, (downloads) => {
                if (downloads.length > 0) {
                    const download = downloads[0];
                    this.activeDownloads.set(downloadId, download);
                    this.emitProgressEvent(download);
                }
            });
            return;
        }

        // Update cached download with changes
        const updatedDownload = this.applyDownloadDelta(currentDownload, downloadDelta);
        this.activeDownloads.set(downloadId, updatedDownload);
        this.emitProgressEvent(updatedDownload);

        // Handle completion or failure
        if (downloadDelta.state?.current === 'complete') {
            this.handleDownloadCompleted(updatedDownload);
        } else if (downloadDelta.state?.current === 'interrupted') {
            this.handleDownloadFailed(updatedDownload, downloadDelta.error?.current);
        }
    }

    /**
     * Applies download delta changes to cached download item
     */
    private applyDownloadDelta(
        download: chrome.downloads.DownloadItem,
        delta: chrome.downloads.DownloadDelta
    ): chrome.downloads.DownloadItem {
        return {
            ...download,
            state: delta.state?.current || download.state,
            paused: delta.paused?.current ?? download.paused,
            error: delta.error?.current || download.error,
            bytesReceived: delta.bytesReceived?.current ?? download.bytesReceived,
            totalBytes: delta.totalBytes?.current ?? download.totalBytes,
            filename: delta.filename?.current || download.filename,
            exists: delta.exists?.current ?? download.exists
        };
    }

    /**
     * Emits progress event for download state changes
     */
    private emitProgressEvent(download: chrome.downloads.DownloadItem): void {
        const progressEvent = new FileDownloadProgress(
            download.id,
            download.url,
            download.filename,
            download.state as 'in_progress' | 'interrupted' | 'complete',
            download.bytesReceived,
            download.totalBytes,
            download.filename, // filepath is same as filename in Chrome downloads
            download.error
        );

        // Emit to all registered listeners
        this.downloadListeners.forEach(listener => {
            try {
                listener(progressEvent);
            } catch (error) {
                console.error('Error in download progress listener:', error);
            }
        });
    }

    /**
     * Handles successful download completion
     */
    private handleDownloadCompleted(download: chrome.downloads.DownloadItem): void {
        const completedEvent = new FileDownloadCompleted(
            download.id,
            download.url,
            download.filename,
            download.filename, // Chrome provides relative path
            download.totalBytes,
            download.mime
        );

        this.emit(completedEvent);
        
        // Clean up from active downloads after a delay (keep for status queries)
        setTimeout(() => {
            this.activeDownloads.delete(download.id);
        }, 60000); // Keep for 1 minute
    }

    /**
     * Handles download failures
     */
    private handleDownloadFailed(download: chrome.downloads.DownloadItem, error?: string): void {
        const failedEvent = new FileDownloadFailed(
            '', // No correlation ID for Chrome-initiated events
            download.url,
            error || download.error || 'Download interrupted',
            download.id
        );

        this.emit(failedEvent);
        
        // Clean up from active downloads
        setTimeout(() => {
            this.activeDownloads.delete(download.id);
        }, 30000); // Keep for 30 seconds for error analysis
    }

    /**
     * Registers a progress listener
     */
    public addProgressListener(listener: (event: FileDownloadProgress) => void): void {
        this.downloadListeners.add(listener);
    }

    /**
     * Removes a progress listener
     */
    public removeProgressListener(listener: (event: FileDownloadProgress) => void): void {
        this.downloadListeners.delete(listener);
    }

    /**
     * Handles server file access requests
     */
    @listen(ServerFileAccessRequested)
    public async handleServerFileAccess(event: ServerFileAccessRequested): Promise<void> {
        try {
            const download = this.activeDownloads.get(event.downloadId);
            
            if (!download || download.state !== 'complete') {
                const errorEvent = new ServerFileAccessProvided(
                    event.correlationId,
                    event.downloadId,
                    event.requestedOperation,
                    false,
                    undefined,
                    undefined,
                    'Download not found or not completed'
                );
                this.emit(errorEvent);
                return;
            }

            switch (event.requestedOperation) {
                case 'read':
                    await this.handleFileRead(event, download);
                    break;
                case 'copy':
                    await this.handleFileCopy(event, download);
                    break;
                case 'move':
                    await this.handleFileMove(event, download);
                    break;
                case 'delete':
                    await this.handleFileDelete(event, download);
                    break;
                default:
                    throw new Error(`Unsupported operation: ${event.requestedOperation}`);
            }
        } catch (error) {
            const errorEvent = new ServerFileAccessProvided(
                event.correlationId,
                event.downloadId,
                event.requestedOperation,
                false,
                undefined,
                undefined,
                error instanceof Error ? error.message : 'File operation failed'
            );
            this.emit(errorEvent);
        }
    }

    /**
     * Handles file read operations (limited in browser context)
     */
    private async handleFileRead(
        event: ServerFileAccessRequested,
        download: chrome.downloads.DownloadItem
    ): Promise<void> {
        // Note: Direct file reading is limited in browser extension context
        // This would typically require native messaging or file system API
        const responseEvent = new ServerFileAccessProvided(
            event.correlationId,
            event.downloadId,
            'read',
            true,
            download.filename,
            undefined, // Content reading requires additional permissions
            undefined
        );
        this.emit(responseEvent);
    }

    /**
     * Handles file copy operations
     */
    private async handleFileCopy(
        event: ServerFileAccessRequested,
        download: chrome.downloads.DownloadItem
    ): Promise<void> {
        // File copy operations require native messaging or additional APIs
        // For now, we provide the file path information
        const responseEvent = new ServerFileAccessProvided(
            event.correlationId,
            event.downloadId,
            'copy',
            true,
            download.filename,
            undefined,
            undefined
        );
        this.emit(responseEvent);
    }

    /**
     * Handles file move operations
     */
    private async handleFileMove(
        event: ServerFileAccessRequested,
        download: chrome.downloads.DownloadItem
    ): Promise<void> {
        // File move operations are limited in browser context
        const responseEvent = new ServerFileAccessProvided(
            event.correlationId,
            event.downloadId,
            'move',
            false,
            undefined,
            undefined,
            'File move not supported in browser context'
        );
        this.emit(responseEvent);
    }

    /**
     * Handles file delete operations
     */
    private async handleFileDelete(
        event: ServerFileAccessRequested,
        download: chrome.downloads.DownloadItem
    ): Promise<void> {
        try {
            // Use Chrome Downloads API to remove download
            await new Promise<void>((resolve, reject) => {
                chrome.downloads.removeFile(download.id, () => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                    } else {
                        resolve();
                    }
                });
            });

            const responseEvent = new ServerFileAccessProvided(
                event.correlationId,
                event.downloadId,
                'delete',
                true,
                download.filename,
                undefined,
                undefined
            );
            this.emit(responseEvent);
        } catch (error) {
            const errorEvent = new ServerFileAccessProvided(
                event.correlationId,
                event.downloadId,
                'delete',
                false,
                undefined,
                undefined,
                error instanceof Error ? error.message : 'File deletion failed'
            );
            this.emit(errorEvent);
        }
    }

    /**
     * Gets current downloads status
     */
    public getActiveDownloads(): Map<number, chrome.downloads.DownloadItem> {
        return new Map(this.activeDownloads);
    }

    /**
     * Cleanup method
     */
    public dispose(): void {
        this.downloadListeners.clear();
        this.activeDownloads.clear();
    }
}