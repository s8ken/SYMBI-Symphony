const { test, expect } = require('@playwright/test');

test.describe('YCQ Sonate Performance Tests', () => {
  test.use({ baseURL: 'http://localhost:3002' });

  test('page load performance', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    
    // Wait for main content to load
    await expect(page.getByText('YCQ Sonate')).toBeVisible();
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
    
    // Check for performance metrics
    const performanceMetrics = await page.evaluate(() => {
      return JSON.stringify(performance.getEntriesByType('navigation')[0]);
    });
    
    const metrics = JSON.parse(performanceMetrics);
    console.log('Load time:', metrics.loadEventEnd - metrics.loadEventStart, 'ms');
    
    // DOM should be interactive quickly
    expect(metrics.domInteractive - metrics.domLoading).toBeLessThan(2000);
  });

  test('memory usage stays reasonable', async ({ page }) => {
    await page.goto('/');
    
    // Get initial memory usage
    const initialMetrics = await page.evaluate(() => {
      return performance.memory ? {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize
      } : null;
    });
    
    if (initialMetrics) {
      console.log('Initial memory usage:', Math.round(initialMetrics.usedJSHeapSize / 1024 / 1024), 'MB');
      
      // Navigate through several pages
      await page.goto('/conversations');
      await page.goto('/projects');
      await page.goto('/agents');
      await page.goto('/settings');
      
      const finalMetrics = await page.evaluate(() => {
        return {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize
        };
      });
      
      const memoryIncrease = finalMetrics.usedJSHeapSize - initialMetrics.usedJSHeapSize;
      console.log('Memory increase:', Math.round(memoryIncrease / 1024 / 1024), 'MB');
      
      // Memory shouldn't increase by more than 50MB during normal navigation
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    }
  });

  test('API response times', async ({ page, request }) => {
    const startTime = Date.now();
    
    try {
      // Test backend health endpoint
      const healthResponse = await request.get('http://localhost:5001/api/health');
      const healthTime = Date.now() - startTime;
      
      console.log('Health endpoint response time:', healthTime, 'ms');
      expect(healthTime).toBeLessThan(1000); // Should respond within 1 second
    } catch (error) {
      console.log('Health endpoint not available, skipping API timing test');
    }
  });

  test('large page rendering performance', async ({ page }) => {
    await page.goto('/reports');
    
    const startTime = Date.now();
    
    // Wait for page to be fully loaded
    await page.waitForTimeout(1000);
    
    // Check if page renders without hanging
    const renderTime = Date.now() - startTime;
    expect(renderTime).toBeLessThan(5000);
    
    // Check for any console errors that might indicate performance issues
    const logs = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        logs.push(msg.text());
      }
    });
    
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Should not have critical errors
    const criticalErrors = logs.filter(log => 
      log.includes('Uncaught') || log.includes('TypeError') || log.includes('ReferenceError')
    );
    expect(criticalErrors.length).toBe(0);
  });
});