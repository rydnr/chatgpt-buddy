/**
 * Time-Travel Debugging UI Component
 *
 * Provides an interactive interface for debugging message flows
 * with time-travel capabilities through the message store.
 */
export declare class TimeTravelUI {
    private isVisible;
    private container;
    private unsubscribe;
    constructor();
    private createUI;
    private subscribeToStore;
    private updateUI;
    private updateMessagesList;
    private getFilteredMessages;
    private getActiveFilters;
    show(): void;
    hide(): void;
    toggle(): void;
    private setupEventListeners;
    goBack(): void;
    goForward(): void;
    resetTimeTravel(): void;
    jumpToMessage(index: number): void;
    clearMessages(): void;
    exportMessages(): void;
    importMessages(): void;
    destroy(): void;
}
export declare const globalTimeTravelUI: TimeTravelUI;
//# sourceMappingURL=time-travel-ui.d.ts.map