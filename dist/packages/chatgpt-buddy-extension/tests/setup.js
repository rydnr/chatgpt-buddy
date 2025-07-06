"use strict";
// Mock Chrome APIs for testing
global.chrome = {
    runtime: {
        onMessage: {
            addListener: jest.fn(),
            removeListener: jest.fn(),
        },
        sendMessage: jest.fn(),
        id: 'test-extension-id',
    },
    tabs: {
        sendMessage: jest.fn(),
        query: jest.fn(),
    },
};
//# sourceMappingURL=setup.js.map