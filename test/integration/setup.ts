// Integration test setup
import { beforeAll, afterAll } from 'vitest';

// Setup for integration tests
beforeAll(() => {
  // Setup test environment for integration tests
  process.env.NODE_ENV = 'test';
});

afterAll(() => {
  // Cleanup after integration tests
}); 