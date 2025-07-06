"use strict";
/*
                        Web-Buddy Framework
                        Download Domain Events (Server)

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
exports.FileDownloadCompleted = exports.ServerFileAccessProvided = exports.ServerFileAccessRequested = void 0;
/**
 * Server-side download events for file access bridging
 */
class ServerFileAccessRequested {
    constructor(correlationId, downloadId, requestedOperation, targetPath) {
        this.correlationId = correlationId;
        this.downloadId = downloadId;
        this.requestedOperation = requestedOperation;
        this.targetPath = targetPath;
    }
}
exports.ServerFileAccessRequested = ServerFileAccessRequested;
class ServerFileAccessProvided {
    constructor(correlationId, downloadId, operation, success, filepath, content, error) {
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
class FileDownloadCompleted {
    constructor(downloadId, url, filename, filepath, size, mimeType) {
        this.downloadId = downloadId;
        this.url = url;
        this.filename = filename;
        this.filepath = filepath;
        this.size = size;
        this.mimeType = mimeType;
    }
}
exports.FileDownloadCompleted = FileDownloadCompleted;
