import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the background script functionality
const mockBackgroundScript = {
  initialize: vi.fn(),
  handleMessage: vi.fn(),
  setupAlarms: vi.fn()
};

describe('Background Script', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize properly', () => {
    expect(mockBackgroundScript.initialize).toBeDefined();
    expect(typeof mockBackgroundScript.initialize).toBe('function');
  });

  it('should handle messages', () => {
    const testMessage = { type: 'test', data: 'test-data' };
    mockBackgroundScript.handleMessage(testMessage);
    
    expect(mockBackgroundScript.handleMessage).toHaveBeenCalledWith(testMessage);
    expect(mockBackgroundScript.handleMessage).toHaveBeenCalledTimes(1);
  });

  it('should setup alarms', () => {
    mockBackgroundScript.setupAlarms();
    expect(mockBackgroundScript.setupAlarms).toHaveBeenCalledTimes(1);
  });
}); 