/**
 * @fileoverview Core events for browser extension background script
 * @description Domain events for browser extension coordination and communication
 * @author Web-Buddy Team
 */

import { Event } from '../../stubs/typescript-eda-stubs';

/**
 * Event triggered when a connection to the Web-Buddy server is requested
 */
export class ConnectionRequestedEvent extends Event {
  public readonly type = 'ConnectionRequested';
  
  constructor(
    public readonly serverUrl: string,
    public readonly autoReconnect: boolean = false
  ) {
    super();
  }

  public toJSON(): Record<string, unknown> {
    return {
      type: this.type,
      serverUrl: this.serverUrl,
      autoReconnect: this.autoReconnect,
      timestamp: this.timestamp.toISOString(),
      id: this.id
    };
  }
}

/**
 * Event triggered when a connection to the server is established
 */
export class ConnectionEstablishedEvent extends Event {
  public readonly type = 'ConnectionEstablished';
  
  constructor(
    public readonly serverUrl: string,
    public readonly extensionId: string
  ) {
    super();
  }

  public toJSON(): Record<string, unknown> {
    return {
      type: this.type,
      serverUrl: this.serverUrl,
      extensionId: this.extensionId,
      timestamp: this.timestamp.toISOString(),
      id: this.id
    };
  }
}

/**
 * Event triggered when the connection to the server is lost
 */
export class ConnectionLostEvent extends Event {
  public readonly type = 'ConnectionLost';
  
  constructor(
    public readonly reason: string,
    public readonly code: number = 0
  ) {
    super();
  }

  public toJSON(): Record<string, unknown> {
    return {
      type: this.type,
      reason: this.reason,
      code: this.code,
      timestamp: this.timestamp.toISOString(),
      id: this.id
    };
  }
}

/**
 * Event triggered when a message is received from the server
 */
export class MessageReceivedEvent extends Event {
  public readonly type = 'MessageReceived';
  
  constructor(
    public readonly messageType: string,
    public readonly payload: any,
    public readonly correlationId: string
  ) {
    super();
  }

  public toJSON(): Record<string, unknown> {
    return {
      type: this.type,
      messageType: this.messageType,
      payload: this.payload,
      correlationId: this.correlationId,
      timestamp: this.timestamp.toISOString(),
      id: this.id
    };
  }
}

/**
 * Event triggered when an automation request is received
 */
export class AutomationRequestedEvent extends Event {
  public readonly type = 'AutomationRequested';
  
  constructor(
    public readonly action: string,
    public readonly target: any,
    public readonly parameters: Record<string, unknown> = {},
    public readonly correlationId?: string
  ) {
    super();
  }

  public toJSON(): Record<string, unknown> {
    return {
      type: this.type,
      action: this.action,
      target: this.target,
      parameters: this.parameters,
      correlationId: this.correlationId,
      timestamp: this.timestamp.toISOString(),
      id: this.id
    };
  }
}

/**
 * Event triggered when a tab switch is requested
 */
export class TabSwitchRequestedEvent extends Event {
  public readonly type = 'TabSwitchRequested';
  
  constructor(
    public readonly title: string,
    public readonly correlationId?: string
  ) {
    super();
  }

  public toJSON(): Record<string, unknown> {
    return {
      type: this.type,
      title: this.title,
      correlationId: this.correlationId,
      timestamp: this.timestamp.toISOString(),
      id: this.id
    };
  }
}

/**
 * Event triggered when a tab switch is completed
 */
export class TabSwitchedEvent extends Event {
  public readonly type = 'TabSwitched';
  
  constructor(
    public readonly tabId: number,
    public readonly title: string,
    public readonly url: string,
    public readonly windowId: number
  ) {
    super();
  }

  public toJSON(): Record<string, unknown> {
    return {
      type: this.type,
      tabId: this.tabId,
      title: this.title,
      url: this.url,
      windowId: this.windowId,
      timestamp: this.timestamp.toISOString(),
      id: this.id
    };
  }
}

/**
 * Event triggered when a heartbeat is received from the server
 */
export class HeartbeatReceivedEvent extends Event {
  public readonly type = 'HeartbeatReceived';
  
  constructor(
    public readonly serverTimestamp: string
  ) {
    super();
  }

  public toJSON(): Record<string, unknown> {
    return {
      type: this.type,
      serverTimestamp: this.serverTimestamp,
      timestamp: this.timestamp.toISOString(),
      id: this.id
    };
  }
}

/**
 * Event triggered when an extension registration is acknowledged
 */
export class RegistrationAcknowledgedEvent extends Event {
  public readonly type = 'RegistrationAcknowledged';
  
  constructor(
    public readonly serverId: string,
    public readonly capabilities: string[]
  ) {
    super();
  }

  public toJSON(): Record<string, unknown> {
    return {
      type: this.type,
      serverId: this.serverId,
      capabilities: this.capabilities,
      timestamp: this.timestamp.toISOString(),
      id: this.id
    };
  }
}