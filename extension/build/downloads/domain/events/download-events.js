/*
                        Web-Buddy Framework
                        Download Domain Events

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
import { Event } from '@typescript-eda/core';
/**
 * Download Request Events - User/API initiated download operations
 */
export class FileDownloadRequested extends Event {
    constructor(correlationId, url, filename, conflictAction, saveAs) {
        super();
        this.correlationId = correlationId;
        this.url = url;
        this.filename = filename;
        this.conflictAction = conflictAction;
        this.saveAs = saveAs;
    }
}
export class FileDownloadStatusRequested extends Event {
    constructor(correlationId, downloadId) {
        super();
        this.correlationId = correlationId;
        this.downloadId = downloadId;
    }
}
export class FileDownloadListRequested extends Event {
    constructor(correlationId, query) {
        super();
        this.correlationId = correlationId;
        this.query = query;
    }
}
/**
 * Download State Events - Internal download lifecycle events
 */
export class FileDownloadStarted extends Event {
    constructor(correlationId, downloadId, url, filename) {
        super();
        this.correlationId = correlationId;
        this.downloadId = downloadId;
        this.url = url;
        this.filename = filename;
    }
}
export class FileDownloadProgress extends Event {
    constructor(downloadId, url, filename, state, bytesReceived, totalBytes, filepath, error) {
        super();
        this.downloadId = downloadId;
        this.url = url;
        this.filename = filename;
        this.state = state;
        this.bytesReceived = bytesReceived;
        this.totalBytes = totalBytes;
        this.filepath = filepath;
        this.error = error;
    }
}
export class FileDownloadCompleted extends Event {
    constructor(downloadId, url, filename, filepath, size, mimeType) {
        super();
        this.downloadId = downloadId;
        this.url = url;
        this.filename = filename;
        this.filepath = filepath;
        this.size = size;
        this.mimeType = mimeType;
    }
}
export class FileDownloadFailed extends Event {
    constructor(correlationId, url, error, downloadId) {
        super();
        this.correlationId = correlationId;
        this.url = url;
        this.error = error;
        this.downloadId = downloadId;
    }
}
/**
 * Download Response Events - Information provision events
 */
export class DownloadStatusProvided extends Event {
    constructor(correlationId, status) {
        super();
        this.correlationId = correlationId;
        this.status = status;
    }
}
export class DownloadListProvided extends Event {
    constructor(correlationId, downloads) {
        super();
        this.correlationId = correlationId;
        this.downloads = downloads;
    }
}
/**
 * Training Integration Events - Download pattern learning
 */
export class DownloadPatternDetected extends Event {
    constructor(url, selector, elementContext, pageContext) {
        super();
        this.url = url;
        this.selector = selector;
        this.elementContext = elementContext;
        this.pageContext = pageContext;
    }
}
export class DownloadPatternLearned extends Event {
    constructor(patternId, url, selector, context, confidence) {
        super();
        this.patternId = patternId;
        this.url = url;
        this.selector = selector;
        this.context = context;
        this.confidence = confidence;
    }
}
export class DownloadPatternExecuted extends Event {
    constructor(patternId, downloadId, success, executionTime) {
        super();
        this.patternId = patternId;
        this.downloadId = downloadId;
        this.success = success;
        this.executionTime = executionTime;
    }
}
/**
 * Server Integration Events - File access bridging
 */
export class ServerFileAccessRequested extends Event {
    constructor(correlationId, downloadId, requestedOperation, targetPath) {
        super();
        this.correlationId = correlationId;
        this.downloadId = downloadId;
        this.requestedOperation = requestedOperation;
        this.targetPath = targetPath;
    }
}
export class ServerFileAccessProvided extends Event {
    constructor(correlationId, downloadId, operation, success, filepath, content, error) {
        super();
        this.correlationId = correlationId;
        this.downloadId = downloadId;
        this.operation = operation;
        this.success = success;
        this.filepath = filepath;
        this.content = content;
        this.error = error;
    }
}
/**
 * Google Images Integration Events - Specific to POC
 */
export class GoogleImageDownloadRequested extends Event {
    constructor(correlationId, imageElement, searchQuery, filename) {
        super();
        this.correlationId = correlationId;
        this.imageElement = imageElement;
        this.searchQuery = searchQuery;
        this.filename = filename;
    }
}
export class GoogleImageDownloadCompleted extends Event {
    constructor(correlationId, downloadId, imageUrl, filename, filepath, metadata) {
        super();
        this.correlationId = correlationId;
        this.downloadId = downloadId;
        this.imageUrl = imageUrl;
        this.filename = filename;
        this.filepath = filepath;
        this.metadata = metadata;
    }
}
