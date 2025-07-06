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
import { Entity, listen } from '@typescript-eda/core';
import { FileDownloadRequested, FileDownloadStarted, FileDownloadFailed, FileDownloadProgress, FileDownloadStatusRequested, FileDownloadListRequested, DownloadStatusProvided, DownloadListProvided } from '../events/download-events';
/**
 * FileDownload Entity - Manages file download operations and state
 *
 * Responsibilities:
 * - Handle download initiation through Chrome Downloads API
 * - Track download progress and state changes
 * - Provide download status and list management
 * - Coordinate with training system for learned download patterns
 */
let FileDownload = (() => {
    var _a;
    let _classSuper = Entity;
    let _instanceExtraInitializers = [];
    let _startDownload_decorators;
    let _updateProgress_decorators;
    let _getDownloadStatus_decorators;
    let _getDownloadsList_decorators;
    return _a = class FileDownload extends _classSuper {
            constructor() {
                super(...arguments);
                this.downloadId = (__runInitializers(this, _instanceExtraInitializers), null);
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
                                resolve(new FileDownloadFailed(event.correlationId, this.url, this.error));
                                return;
                            }
                            this.downloadId = downloadId;
                            this.state = 'in_progress';
                            resolve(new FileDownloadStarted(event.correlationId, downloadId, this.url, this.filename));
                        });
                    });
                }
                catch (error) {
                    this.error = error instanceof Error ? error.message : 'Download initialization failed';
                    this.state = 'interrupted';
                    return new FileDownloadFailed(event.correlationId, this.url, this.error);
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
                                resolve(new DownloadStatusProvided(event.correlationId, {
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
                                resolve(new DownloadStatusProvided(event.correlationId, {
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
                return new DownloadStatusProvided(event.correlationId, {
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
                        resolve(new DownloadListProvided(event.correlationId, downloadList));
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
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _startDownload_decorators = [listen(FileDownloadRequested)];
            _updateProgress_decorators = [listen(FileDownloadProgress)];
            _getDownloadStatus_decorators = [listen(FileDownloadStatusRequested)];
            _getDownloadsList_decorators = [listen(FileDownloadListRequested)];
            __esDecorate(_a, null, _startDownload_decorators, { kind: "method", name: "startDownload", static: false, private: false, access: { has: obj => "startDownload" in obj, get: obj => obj.startDownload }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _updateProgress_decorators, { kind: "method", name: "updateProgress", static: false, private: false, access: { has: obj => "updateProgress" in obj, get: obj => obj.updateProgress }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _getDownloadStatus_decorators, { kind: "method", name: "getDownloadStatus", static: false, private: false, access: { has: obj => "getDownloadStatus" in obj, get: obj => obj.getDownloadStatus }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(_a, null, _getDownloadsList_decorators, { kind: "method", name: "getDownloadsList", static: false, private: false, access: { has: obj => "getDownloadsList" in obj, get: obj => obj.getDownloadsList }, metadata: _metadata }, null, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
export { FileDownload };
