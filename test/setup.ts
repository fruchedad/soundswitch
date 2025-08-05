// Test setup for Vitest
import { beforeAll, afterAll, vi } from 'vitest';

// Mock Chrome extension APIs for testing
const chromeMock = {
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn()
    },
    sync: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn()
    }
  },
  cookies: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
    getAll: vi.fn()
  },
  tabs: {
    query: vi.fn(),
    sendMessage: vi.fn(),
    create: vi.fn(),
    update: vi.fn()
  },
  runtime: {
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn()
    }
  },
  alarms: {
    create: vi.fn(),
    get: vi.fn(),
    getAll: vi.fn(),
    clear: vi.fn(),
    onAlarm: {
      addListener: vi.fn(),
      removeListener: vi.fn()
    }
  }
};

// Setup global mocks
beforeAll(() => {
  global.chrome = chromeMock as any;
  // Type the global chrome object properly
  (global as any).chrome = chromeMock;
  // Mock console to prevent noise in tests
  global.console = {
    ...console,
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  };
});

// Cleanup after tests
afterAll(() => {
  vi.clearAllMocks();
}); 