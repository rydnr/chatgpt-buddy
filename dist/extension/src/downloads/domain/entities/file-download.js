"use strict";
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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileDownload = void 0;
const core_1 = require("@typescript-eda/core");
const download_events_1 = require("../events/download-events");
/**
 * FileDownload Entity - Manages file download operations and state
 *
 * Responsibilities:
 * - Handle download initiation through Chrome Downloads API
 * - Track download progress and state changes
 * - Provide download status and list management
 * - Coordinate with training system for learned download patterns
 */
class FileDownload extends core_1.Entity {
    constructor() {
        super(...arguments);
        this.downloadId = null;
        this.url = '';
        this.filename = '';
        this.state = 'pending';
        this.bytesReceived = 0;
        this.totalBytes = 0;
        this.error = null;
        this.startTime = null;
        this.endTime = null;
        this.filepath = '';
    }
    /**
     * Initiates a file download
     */
    async startDownload(event) {
        try {
            this.url = event.url;
            this.filename = event.filename || this.extractFilenameFromUrl(event.url);
            this.state = 'pending';
            this.startTime = new Date();
            // Use Chrome Downloads API to start download
            const downloadOptions = {
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
                        resolve(new download_events_1.FileDownloadFailed(event.correlationId, this.url, this.error));
                        return;
                    }
                    this.downloadId = downloadId;
                    this.state = 'in_progress';
                    resolve(new download_events_1.FileDownloadStarted(event.correlationId, downloadId, this.url, this.filename));
                });
            });
        }
        catch (error) {
            this.error = error instanceof Error ? error.message : 'Download initialization failed';
            this.state = 'interrupted';
            return new download_events_1.FileDownloadFailed(event.correlationId, this.url, this.error);
        }
    }
    /**
     * Updates download progress (typically called by Chrome Downloads API listeners)
     */
    updateProgress(event) {
        if (event.downloadId === this.downloadId) {
            this.bytesReceived = event.bytesReceived;
            this.totalBytes = event.totalBytes;
            this.state = event.state;
            if (event.state === 'complete') {
                this.endTime = new Date();
                this.filepath = event.filepath || '';
            }
            else if (event.state === 'interrupted') {
                this.error = event.error || 'Download interrupted';
            }
        }
        return Promise.resolve();
    }
    /**
     * Provides download status information
     */
    async getDownloadStatus(event) {
        if (event.downloadId && event.downloadId !== this.downloadId) {
            // Query Chrome Downloads API for status of specific download
            return new Promise((resolve) => {
                chrome.downloads.search({ id: event.downloadId }, (downloads) => {
                    const download = downloads[0];
                    if (download) {
                        resolve(new download_events_1.DownloadStatusProvided(event.correlationId, {
                            downloadId: download.id,
                            url: download.url,
                            filename: download.filename,
                            state: download.state,
                            bytesReceived: download.bytesReceived,
                            totalBytes: download.totalBytes,
                            exists: download.exists,
                            paused: download.paused,
                            error: download.error
                        }));
                    }
                    else {
                        resolve(new download_events_1.DownloadStatusProvided(event.correlationId, {
                            downloadId: event.downloadId,
                            url: '',
                            filename: '',
                            state: 'interrupted',
                            bytesReceived: 0,
                            totalBytes: 0,
                            error: 'Download not found'
                        }));
                    }
                });
            });
        }
        // Return current instance status
        return new download_events_1.DownloadStatusProvided(event.correlationId, {
            downloadId: this.downloadId || 0,
            url: this.url,
            filename: this.filename,
            state: this.state,
            bytesReceived: this.bytesReceived,
            totalBytes: this.totalBytes,
            exists: this.state === 'complete',
            paused: false,
            error: this.error || undefined
        });
    }
    /**
     * Provides list of downloads based on query criteria
     */
    async getDownloadsList(event) {
        return new Promise((resolve) => {
            const query = {
                orderBy: event.query?.orderBy || ['-startTime'],
                limit: event.query?.limit || 100,
                state: event.query?.state
            };
            chrome.downloads.search(query, (downloads) => {
                const downloadList = downloads.map(download => ({
                    id: download.id,
                    url: download.url,
                    filename: download.filename,
                    state: download.state,
                    bytesReceived: download.bytesReceived,
                    totalBytes: download.totalBytes,
                    startTime: download.startTime,
                    endTime: download.endTime
                }));
                resolve(new download_events_1.DownloadListProvided(event.correlationId, downloadList));
            });
        });
    }
    /**
     * Extracts filename from URL if not provided
     */
    extractFilenameFromUrl(url) {
        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            const filename = pathname.split('/').pop() || 'download';
            return filename.includes('.') ? filename : `${filename}.unknown`;
        }
        catch {
            return 'download.unknown';
        }
    }
    /**
     * Gets the current download state
     */
    getState() {
        return this.state;
    }
    /**
     * Gets the download progress as percentage
     */
    getProgressPercentage() {
        if (this.totalBytes === 0)
            return 0;
        return Math.round((this.bytesReceived / this.totalBytes) * 100);
    }
    /**
     * Gets the download file path (available after completion)
     */
    getFilepath() {
        return this.filepath;
    }
    /**
     * Checks if download is complete and file exists
     */
    isCompleted() {
        return this.state === 'complete' && this.filepath !== '';
    }
}
exports.FileDownload = FileDownload;
__decorate([
    (0, core_1.listen)(download_events_1.FileDownloadRequested),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [download_events_1.FileDownloadRequested]),
    __metadata("design:returntype", Promise)
], FileDownload.prototype, "startDownload", null);
__decorate([
    (0, core_1.listen)(download_events_1.FileDownloadProgress),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [download_events_1.FileDownloadProgress]),
    __metadata("design:returntype", Promise)
], FileDownload.prototype, "updateProgress", null);
__decorate([
    (0, core_1.listen)(download_events_1.FileDownloadStatusRequested),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [download_events_1.FileDownloadStatusRequested]),
    __metadata("design:returntype", Promise)
], FileDownload.prototype, "getDownloadStatus", null);
__decorate([
    (0, core_1.listen)(download_events_1.FileDownloadListRequested),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [download_events_1.FileDownloadListRequested]),
    __metadata("design:returntype", Promise)
], FileDownload.prototype, "getDownloadsList", null);
//# sourceMappingURL=file-download.js.map