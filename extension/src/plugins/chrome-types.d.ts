/**
 * Basic Chrome API type declarations for plugin system
 */

declare namespace chrome {
  namespace tabs {
    interface Tab {
      id?: number;
      url?: string;
      title?: string;
      active?: boolean;
      windowId?: number;
    }

    interface InjectDetails {
      code?: string;
      file?: string;
      allFrames?: boolean;
      matchAboutBlank?: boolean;
      runAt?: string;
    }
  }

  namespace runtime {
    const onMessage: any;
    function sendMessage(message: any, callback?: (response: any) => void): void;
    const id: string;
    function getManifest(): any;
    const lastError: { message: string } | undefined;
  }

  namespace storage {
    namespace local {
      function get(keys: string | string[] | null, callback: (items: any) => void): void;
      function set(items: any, callback?: () => void): void;
      function remove(keys: string | string[], callback?: () => void): void;
      function clear(callback?: () => void): void;
    }
  }

  namespace permissions {
    function request(permissions: any, callback?: (granted: boolean) => void): void;
    function contains(permissions: any, callback?: (result: boolean) => void): void;
  }
}