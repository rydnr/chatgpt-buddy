declare const mockDocument: {
    createElement: jest.Mock<any, any, any>;
    body: {
        appendChild: jest.Mock<any, any, any>;
        removeChild: jest.Mock<any, any, any>;
        contains: jest.Mock<any, any, any>;
        style: {
            cursor: string;
        };
    };
    querySelector: jest.Mock<any, any, any>;
    addEventListener: jest.Mock<any, any, any>;
    removeEventListener: jest.Mock<any, any, any>;
};
declare let mockElement: HTMLElement;
//# sourceMappingURL=training-ui.test.d.ts.map