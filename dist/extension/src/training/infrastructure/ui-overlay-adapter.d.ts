import { SecondaryAdapter } from 'typescript-eda';
import { UserGuidanceData } from '../domain/events/training-events';
export interface UIOverlayPort {
    showGuidance(guidance: UserGuidanceData): Promise<void>;
    hideGuidance(): Promise<void>;
    enableElementSelection(): Promise<void>;
    disableElementSelection(): Promise<void>;
    showConfirmation(element: Element, selector: string): Promise<boolean>;
    highlightElement(element: Element): void;
    removeHighlight(element: Element): void;
}
export declare class UIOverlayAdapter implements UIOverlayPort, SecondaryAdapter {
    private overlay;
    private confirmationOverlay;
    private isSelectionMode;
    private currentGuidance;
    private elementSelectionHandler;
    private mouseOverHandler;
    private mouseOutHandler;
    private onElementSelected;
    private onUserConfirmed;
    private onUserCancelled;
    constructor();
    onElementSelectionEvent(handler: (element: Element, selector: string) => void): void;
    onUserConfirmationEvent(handler: (action: string, selector: string) => void): void;
    onUserCancellationEvent(handler: (action: string, reason: string) => void): void;
    showGuidance(guidance: UserGuidanceData): Promise<void>;
    hideGuidance(): Promise<void>;
    enableElementSelection(): Promise<void>;
    disableElementSelection(): Promise<void>;
    showConfirmation(element: Element, selector: string): Promise<boolean>;
    highlightElement(element: Element): void;
    removeHighlight(element: Element): void;
    private setupEventHandlers;
    private generateGuidanceHTML;
    private getEmojiForMessageType;
    private handleElementSelection;
    private handleMouseOver;
    private handleMouseOut;
    private isTrainingOverlayElement;
    private removeHighlightFromAllElements;
    private removeConfirmationOverlay;
    private generateOptimalSelector;
}
//# sourceMappingURL=ui-overlay-adapter.d.ts.map