/*
                        Web-Buddy Framework
                        FileDownload Domain Entity

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

import { Entity, listen } from '@typescript-eda/core';
import { 
    FileDownloadRequested,
    FileDownloadStarted,
    FileDownloadCompleted,
    FileDownloadFailed,
    FileDownloadProgress,
    FileDownloadStatusRequested,
    FileDownloadListRequested,
    DownloadStatusProvided,
    DownloadListProvided
} from '../events/download-events';

/**
 * FileDownload Entity - Manages file download operations and state
 * 
 * Responsibilities:
 * - Handle download initiation through Chrome Downloads API
 * - Track download progress and state changes
 * - Provide download status and list management
 * - Coordinate with training system for learned download patterns
 */
export class FileDownload extends Entity<FileDownload> {
    private downloadId: number | null = null;
    private url: string = '';
    private filename: string = '';
    private state: 'pending' | 'in_progress' | 'interrupted' | 'complete' = 'pending';
    private bytesReceived: number = 0;
    private totalBytes: number = 0;
    private error: string | null = null;
    private startTime: Date | null = null;
    private endTime: Date | null = null;
    private filepath: string = '';

    /**
     * Initiates a file download
     */
    @listen(FileDownloadRequested)
    public async startDownload(event: FileDownloadRequested): Promise<FileDownloadStarted | FileDownloadFailed> {
        try {
            this.url = event.url;
            this.filename = event.filename || this.extractFilenameFromUrl(event.url);
            this.state = 'pending';
            this.startTime = new Date();

            // Use Chrome Downloads API to start download
            const downloadOptions: chrome.downloads.DownloadOptions = {
                url: event.url,
                filename: event.filename,
                conflictAction: event.conflictAction || 'uniquify',
                saveAs: event.saveAs || false
            };

            return new Promise((resolve) => {
                chrome.downloads.download(downloadOptions, (downloadId) => {
                    if (chrome.runtime.lastError) {
                        this.error = chrome.runtime.lastError.message || 'Unknown download error';
                        this.state = 'interrupted';
                        resolve(new FileDownloadFailed(
                            event.correlationId,
                            this.url,
                            this.error
                        ));
                        return;
                    }

                    this.downloadId = downloadId;
                    this.state = 'in_progress';
                    resolve(new FileDownloadStarted(
                        event.correlationId,
                        downloadId,
                        this.url,
                        this.filename
                    ));
                });
            });
        } catch (error) {
            this.error = error instanceof Error ? error.message : 'Download initialization failed';
            this.state = 'interrupted';
            return new FileDownloadFailed(
                event.correlationId,
                this.url,
                this.error
            );
        }
    }

    /**
     * Updates download progress (typically called by Chrome Downloads API listeners)
     */
    @listen(FileDownloadProgress)
    public updateProgress(event: FileDownloadProgress): Promise<void> {
        if (event.downloadId === this.downloadId) {
            this.bytesReceived = event.bytesReceived;
            this.totalBytes = event.totalBytes;
            this.state = event.state;
            
            if (event.state === 'complete') {
                this.endTime = new Date();
                this.filepath = event.filepath || '';
            } else if (event.state === 'interrupted') {
                this.error = event.error || 'Download interrupted';
            }
        }
        return Promise.resolve();
    }

    /**
     * Provides download status information
     */
    @listen(FileDownloadStatusRequested)
    public async getDownloadStatus(event: FileDownloadStatusRequested): Promise<DownloadStatusProvided> {
        if (event.downloadId && event.downloadId !== this.downloadId) {
            // Query Chrome Downloads API for status of specific download
            return new Promise((resolve) => {
                chrome.downloads.search({ id: event.downloadId }, (downloads) => {
                    const download = downloads[0];
                    if (download) {
                        resolve(new DownloadStatusProvided(
                            event.correlationId,
                            {
                                downloadId: download.id,
                                url: download.url,
                                filename: download.filename,
                                state: download.state as 'in_progress' | 'interrupted' | 'complete',
                                bytesReceived: download.bytesReceived,
                                totalBytes: download.totalBytes,
                                exists: download.exists,
                                paused: download.paused,
                                error: download.error
                            }
                        ));
                    } else {
                        resolve(new DownloadStatusProvided(
                            event.correlationId,
                            {
                                downloadId: event.downloadId!,
                                url: '',
                                filename: '',
                                state: 'interrupted',
                                bytesReceived: 0,
                                totalBytes: 0,
                                error: 'Download not found'
                            }
                        ));
                    }
                });
            });
        }

        // Return current instance status
        return new DownloadStatusProvided(
            event.correlationId,
            {
                downloadId: this.downloadId || 0,
                url: this.url,
                filename: this.filename,
                state: this.state as 'in_progress' | 'interrupted' | 'complete',
                bytesReceived: this.bytesReceived,
                totalBytes: this.totalBytes,
                exists: this.state === 'complete',
                paused: false,
                error: this.error || undefined
            }
        );
    }

    /**
     * Provides list of downloads based on query criteria
     */
    @listen(FileDownloadListRequested)
    public async getDownloadsList(event: FileDownloadListRequested): Promise<DownloadListProvided> {
        return new Promise((resolve) => {
            const query: chrome.downloads.DownloadQuery = {
                orderBy: event.query?.orderBy || ['-startTime'],
                limit: event.query?.limit || 100,
                state: event.query?.state
            };

            chrome.downloads.search(query, (downloads) => {
                const downloadList = downloads.map(download => ({
                    id: download.id,
                    url: download.url,
                    filename: download.filename,
                    state: download.state as 'in_progress' | 'interrupted' | 'complete',
                    bytesReceived: download.bytesReceived,
                    totalBytes: download.totalBytes,
                    startTime: download.startTime,
                    endTime: download.endTime
                }));

                resolve(new DownloadListProvided(
                    event.correlationId,
                    downloadList
                ));
            });
        });
    }

    /**
     * Extracts filename from URL if not provided
     */
    private extractFilenameFromUrl(url: string): string {
        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            const filename = pathname.split('/').pop() || 'download';
            return filename.includes('.') ? filename : `${filename}.unknown`;
        } catch {
            return 'download.unknown';
        }
    }

    /**
     * Gets the current download state
     */
    public getState(): 'pending' | 'in_progress' | 'interrupted' | 'complete' {
        return this.state;
    }

    /**
     * Gets the download progress as percentage
     */
    public getProgressPercentage(): number {
        if (this.totalBytes === 0) return 0;
        return Math.round((this.bytesReceived / this.totalBytes) * 100);
    }

    /**
     * Gets the download file path (available after completion)
     */
    public getFilepath(): string {
        return this.filepath;
    }

    /**
     * Checks if download is complete and file exists
     */
    public isCompleted(): boolean {
        return this.state === 'complete' && this.filepath !== '';
    }
}