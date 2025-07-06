"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleImageDownloadCompleted = exports.GoogleImageDownloadRequested = exports.ServerFileAccessProvided = exports.ServerFileAccessRequested = exports.DownloadPatternExecuted = exports.DownloadPatternLearned = exports.DownloadPatternDetected = exports.DownloadListProvided = exports.DownloadStatusProvided = exports.FileDownloadFailed = exports.FileDownloadCompleted = exports.FileDownloadProgress = exports.FileDownloadStarted = exports.FileDownloadListRequested = exports.FileDownloadStatusRequested = exports.FileDownloadRequested = void 0;
const core_1 = require("@typescript-eda/core");
/**
 * Download Request Events - User/API initiated download operations
 */
class FileDownloadRequested extends core_1.Event {
    constructor(correlationId, url, filename, conflictAction, saveAs) {
        super();
        this.correlationId = correlationId;
        this.url = url;
        this.filename = filename;
        this.conflictAction = conflictAction;
        this.saveAs = saveAs;
    }
}
exports.FileDownloadRequested = FileDownloadRequested;
class FileDownloadStatusRequested extends core_1.Event {
    constructor(correlationId, downloadId) {
        super();
        this.correlationId = correlationId;
        this.downloadId = downloadId;
    }
}
exports.FileDownloadStatusRequested = FileDownloadStatusRequested;
class FileDownloadListRequested extends core_1.Event {
    constructor(correlationId, query) {
        super();
        this.correlationId = correlationId;
        this.query = query;
    }
}
exports.FileDownloadListRequested = FileDownloadListRequested;
/**
 * Download State Events - Internal download lifecycle events
 */
class FileDownloadStarted extends core_1.Event {
    constructor(correlationId, downloadId, url, filename) {
        super();
        this.correlationId = correlationId;
        this.downloadId = downloadId;
        this.url = url;
        this.filename = filename;
    }
}
exports.FileDownloadStarted = FileDownloadStarted;
class FileDownloadProgress extends core_1.Event {
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
exports.FileDownloadProgress = FileDownloadProgress;
class FileDownloadCompleted extends core_1.Event {
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
exports.FileDownloadCompleted = FileDownloadCompleted;
class FileDownloadFailed extends core_1.Event {
    constructor(correlationId, url, error, downloadId) {
        super();
        this.correlationId = correlationId;
        this.url = url;
        this.error = error;
        this.downloadId = downloadId;
    }
}
exports.FileDownloadFailed = FileDownloadFailed;
/**
 * Download Response Events - Information provision events
 */
class DownloadStatusProvided extends core_1.Event {
    constructor(correlationId, status) {
        super();
        this.correlationId = correlationId;
        this.status = status;
    }
}
exports.DownloadStatusProvided = DownloadStatusProvided;
class DownloadListProvided extends core_1.Event {
    constructor(correlationId, downloads) {
        super();
        this.correlationId = correlationId;
        this.downloads = downloads;
    }
}
exports.DownloadListProvided = DownloadListProvided;
/**
 * Training Integration Events - Download pattern learning
 */
class DownloadPatternDetected extends core_1.Event {
    constructor(url, selector, elementContext, pageContext) {
        super();
        this.url = url;
        this.selector = selector;
        this.elementContext = elementContext;
        this.pageContext = pageContext;
    }
}
exports.DownloadPatternDetected = DownloadPatternDetected;
class DownloadPatternLearned extends core_1.Event {
    constructor(patternId, url, selector, context, confidence) {
        super();
        this.patternId = patternId;
        this.url = url;
        this.selector = selector;
        this.context = context;
        this.confidence = confidence;
    }
}
exports.DownloadPatternLearned = DownloadPatternLearned;
class DownloadPatternExecuted extends core_1.Event {
    constructor(patternId, downloadId, success, executionTime) {
        super();
        this.patternId = patternId;
        this.downloadId = downloadId;
        this.success = success;
        this.executionTime = executionTime;
    }
}
exports.DownloadPatternExecuted = DownloadPatternExecuted;
/**
 * Server Integration Events - File access bridging
 */
class ServerFileAccessRequested extends core_1.Event {
    constructor(correlationId, downloadId, requestedOperation, targetPath) {
        super();
        this.correlationId = correlationId;
        this.downloadId = downloadId;
        this.requestedOperation = requestedOperation;
        this.targetPath = targetPath;
    }
}
exports.ServerFileAccessRequested = ServerFileAccessRequested;
class ServerFileAccessProvided extends core_1.Event {
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
exports.ServerFileAccessProvided = ServerFileAccessProvided;
/**
 * Google Images Integration Events - Specific to POC
 */
class GoogleImageDownloadRequested extends core_1.Event {
    constructor(correlationId, imageElement, searchQuery, filename) {
        super();
        this.correlationId = correlationId;
        this.imageElement = imageElement;
        this.searchQuery = searchQuery;
        this.filename = filename;
    }
}
exports.GoogleImageDownloadRequested = GoogleImageDownloadRequested;
class GoogleImageDownloadCompleted extends core_1.Event {
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
exports.GoogleImageDownloadCompleted = GoogleImageDownloadCompleted;
//# sourceMappingURL=download-events.js.map