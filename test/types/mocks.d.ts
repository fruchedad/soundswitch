// Mock type declarations for tests

import { MockedFunction } from 'vitest';

declare global {
  var chrome: {
    storage: {
      local: {
        get: MockedFunction<any>;
        set: MockedFunction<any>;
        remove: MockedFunction<any>;
        clear: MockedFunction<any>;
      };
      sync: {
        get: MockedFunction<any>;
        set: MockedFunction<any>;
        remove: MockedFunction<any>;
        clear: MockedFunction<any>;
      };
    };
    cookies: {
      get: MockedFunction<any>;
      set: MockedFunction<any>;
      remove: MockedFunction<any>;
      getAll: MockedFunction<any>;
    };
    tabs: {
      query: MockedFunction<any>;
      sendMessage: MockedFunction<any>;
      create: MockedFunction<any>;
      update: MockedFunction<any>;
    };
    runtime: {
      sendMessage: MockedFunction<any>;
      onMessage: {
        addListener: MockedFunction<any>;
        removeListener: MockedFunction<any>;
      };
    };
    alarms: {
      create: MockedFunction<any>;
      get: MockedFunction<any>;
      getAll: MockedFunction<any>;
      clear: MockedFunction<any>;
      onAlarm: {
        addListener: MockedFunction<any>;
        removeListener: MockedFunction<any>;
      };
    };
  };
  
  var console: {
    log: MockedFunction<any>;
    warn: MockedFunction<any>;
    error: MockedFunction<any>;
    info: MockedFunction<any>;
  } & Console;
}

export {};