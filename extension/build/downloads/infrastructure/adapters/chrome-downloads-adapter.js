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
import { Adapter, listen } from '@typescript-eda/core';
import { FileDownloadProgress, FileDownloadCompleted, FileDownloadFailed, ServerFileAccessRequested, ServerFileAccessProvided } from '../../domain/events/download-events';
/**
 * Chrome Downloads Adapter - Bridges Chrome Downloads API with domain events
 *
 * Responsibilities:
 * - Listen to Chrome downloads API events
 * - Convert Chrome download states to domain events
 * - Provide file system access for downloaded files
 * - Handle download interruptions and errors
 */
let ChromeDownloadsAdapter = (() => {
    var _a;
    let _classSuper = Adapter;
    let _instanceExtraInitializers = [];
    let _handleServerFileAccess_decorators;
    return _a = class ChromeDownloadsAdapter extends _classSuper {
            constructor() {
                super();
                this.activeDownloads = (__runInitializers(this, _instanceExtraInitializers), new Map());
                this.downloadListeners = new Set();
                this.initializeDownloadListeners();
            }
            /**
             * Initializes Chrome Downloads API listeners
             */
            initializeDownloadListeners() {
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
            handleDownloadChange(downloadDelta) {
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
                }
                else if (downloadDelta.state?.current === 'interrupted') {
                    this.handleDownloadFailed(updatedDownload, downloadDelta.error?.current);
                }
            }
            /**
             * Applies download delta changes to cached download item
             */
            applyDownloadDelta(download, delta) {
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
            emitProgressEvent(download) {
                const progressEvent = new FileDownloadProgress(download.id, download.url, download.filename, download.state, download.bytesReceived, download.totalBytes, download.filename, // filepath is same as filename in Chrome downloads
                download.error);
                // Emit to all registered listeners
                this.downloadListeners.forEach(listener => {
                    try {
                        listener(progressEvent);
                    }
                    catch (error) {
                        console.error('Error in download progress listener:', error);
                    }
                });
            }
            /**
             * Handles successful download completion
             */
            handleDownloadCompleted(download) {
                const completedEvent = new FileDownloadCompleted(download.id, download.url, download.filename, download.filename, // Chrome provides relative path
                download.totalBytes, download.mime);
                this.emit(completedEvent);
                // Clean up from active downloads after a delay (keep for status queries)
                setTimeout(() => {
                    this.activeDownloads.delete(download.id);
                }, 60000); // Keep for 1 minute
            }
            /**
             * Handles download failures
             */
            handleDownloadFailed(download, error) {
                const failedEvent = new FileDownloadFailed('', // No correlation ID for Chrome-initiated events
                download.url, error || download.error || 'Download interrupted', download.id);
                this.emit(failedEvent);
                // Clean up from active downloads
                setTimeout(() => {
                    this.activeDownloads.delete(download.id);
                }, 30000); // Keep for 30 seconds for error analysis
            }
            /**
             * Registers a progress listener
             */
            addProgressListener(listener) {
                this.downloadListeners.add(listener);
            }
            /**
             * Removes a progress listener
             */
            removeProgressListener(listener) {
                this.downloadListeners.delete(listener);
            }
            /**
             * Handles server file access requests
             */
            async handleServerFileAccess(event) {
                try {
                    const download = this.activeDownloads.get(event.downloadId);
                    if (!download || download.state !== 'complete') {
                        const errorEvent = new ServerFileAccessProvided(event.correlationId, event.downloadId, event.requestedOperation, false, undefined, undefined, 'Download not found or not completed');
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
                }
                catch (error) {
                    const errorEvent = new ServerFileAccessProvided(event.correlationId, event.downloadId, event.requestedOperation, false, undefined, undefined, error instanceof Error ? error.message : 'File operation failed');
                    this.emit(errorEvent);
                }
            }
            /**
             * Handles file read operations (limited in browser context)
             */
            async handleFileRead(event, download) {
                // Note: Direct file reading is limited in browser extension context
                // This would typically require native messaging or file system API
                const responseEvent = new ServerFileAccessProvided(event.correlationId, event.downloadId, 'read', true, download.filename, undefined, // Content reading requires additional permissions
                undefined);
                this.emit(responseEvent);
            }
            /**
             * Handles file copy operations
             */
            async handleFileCopy(event, download) {
                // File copy operations require native messaging or additional APIs
                // For now, we provide the file path information
                const responseEvent = new ServerFileAccessProvided(event.correlationId, event.downloadId, 'copy', true, download.filename, undefined, undefined);
                this.emit(responseEvent);
            }
            /**
             * Handles file move operations
             */
            async handleFileMove(event, download) {
                // File move operations are limited in browser context
                const responseEvent = new ServerFileAccessProvided(event.correlationId, event.downloadId, 'move', false, undefined, undefined, 'File move not supported in browser context');
                this.emit(responseEvent);
            }
            /**
             * Handles file delete operations
             */
            async handleFileDelete(event, download) {
                try {
                    // Use Chrome Downloads API to remove download
                    await new Promise((resolve, reject) => {
                        chrome.downloads.removeFile(download.id, () => {
                            if (chrome.runtime.lastError) {
                                reject(new Error(chrome.runtime.lastError.message));
                            }
                            else {
                                resolve();
                            }
                        });
                    });
                    const responseEvent = new ServerFileAccessProvided(event.correlationId, event.downloadId, 'delete', true, download.filename, undefined, undefined);
                    this.emit(responseEvent);
                }
                catch (error) {
                    const errorEvent = new ServerFileAccessProvided(event.correlationId, event.downloadId, 'delete', false, undefined, undefined, error instanceof Error ? error.message : 'File deletion failed');
                    this.emit(errorEvent);
                }
            }
            /**
             * Gets current downloads status
             */
            getActiveDownloads() {
                return new Map(this.activeDownloads);
            }
            /**
             * Cleanup method
             */
            dispose() {
                this.downloadListeners.clear();
                this.activeDownloads.clear();
            }
        },
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _handleServerFileAccess_decorators = [listen(ServerFileAccessRequested)];
            __esDecorate(_a, null, _handleServerFileAccess_decorators, { kind: "method", name: "handleServerFileAccess", static: false, private: false, access: { has: obj => "handleServerFileAccess" in obj, get: obj => obj.handleServerFileAccess }, metadata: _metadata }, null, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
export { ChromeDownloadsAdapter };
