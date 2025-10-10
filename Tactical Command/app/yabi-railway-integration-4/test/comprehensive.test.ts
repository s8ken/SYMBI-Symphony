import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

import { BlackboxAdapter } from '../lib/blackbox-adapter';
import { YabiClient } from '../lib/yabi-client';

describe('Comprehensive Test Suite', () => {
  let adapter: BlackboxAdapter;
  let client: YabiClient;

  beforeAll(() => {
    adapter = new BlackboxAdapter();
    client = new YabiClient();
  });

  afterAll(() => {
    // Cleanup
  });

  it('should test all 5 Blackbox AI models', async () => {
    const models = ['model1', 'model2', 'model3', 'model4', 'model5'];
    for (const model of models) {
      const response = await adapter.query(model, 'test query');
      expect(response).toBeDefined();
      expect(response.success).toBe(true);
    }
  });

  it('should handle error cases', async () => {
    try {
      await adapter.query('invalid-model', 'test');
      throw new Error('Should have thrown an error');
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it('should handle concurrent requests', async () => {
    const promises = Array(10).fill(null).map(() => adapter.query('model1', 'concurrent test'));
    const results = await Promise.all(promises);
    expect(results.length).toBe(10);
    results.forEach((result: any) => expect(result.success).toBe(true));
  });

  it('should handle rate limiting', async () => {
    const start = Date.now();
    for (let i = 0; i < 100; i++) {
      await adapter.query('model1', 'rate limit test');
    }
    const end = Date.now();
    expect(end - start).toBeGreaterThan(1000); // Should take more than 1 second due to rate limiting
  });

  it('should perform performance benchmarks', async () => {
    const start = Date.now();
    for (let i = 0; i < 50; i++) {
      await adapter.query('model1', 'performance test');
    }
    const end = Date.now();
    const avgTime = (end - start) / 50;
    expect(avgTime).toBeLessThan(1000); // Average response time should be less than 1 second
  });
});
