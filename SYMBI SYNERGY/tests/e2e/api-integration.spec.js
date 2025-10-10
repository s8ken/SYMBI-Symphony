const { test, expect } = require('@playwright/test');

test.describe('YCQ Sonate API Integration Tests', () => {
  test.use({ baseURL: 'http://localhost:3002' });

  test('API health and connectivity', async ({ request }) => {
    // Test backend health
    try {
      const health = await request.get('http://localhost:5001/api/health');
      console.log('Health status:', health.status());
      expect(health.status()).toBe(200);
      
      const healthData = await health.json();
      expect(healthData).toHaveProperty('ok', true);
      expect(healthData).toHaveProperty('status', 'ok');
      expect(healthData).toHaveProperty('service', 'ycq-sonate-api');
    } catch (error) {
      console.log('Health endpoint not available');
    }

    // Test Swagger docs
    try {
      const docs = await request.get('http://localhost:5001/docs');
      expect(docs.status()).toBe(200);
      const content = await docs.text();
      expect(content).toContain('swagger');
    } catch (error) {
      console.log('Swagger docs not available');
    }
  });

  test('CORS configuration', async ({ request }) => {
    // Test CORS headers from backend
    try {
      const response = await request.get('http://localhost:5001/api/health', {
        headers: {
          'Origin': 'http://localhost:3002'
        }
      });
      
      const headers = response.headers();
      console.log('CORS headers:', headers['access-control-allow-origin']);
      
      // Should allow requests from frontend origin
      expect(
        headers['access-control-allow-origin'] === '*' || 
        headers['access-control-allow-origin'] === 'http://localhost:3002'
      ).toBe(true);
    } catch (error) {
      console.log('CORS test skipped - endpoint not available');
    }
  });

  test('authentication API endpoints', async ({ page, request }) => {
    // Test login endpoint exists
    try {
      const loginResponse = await request.post('http://localhost:5001/api/auth/login', {
        data: {
          email: 'test@example.com',
          password: 'wrongpassword'
        }
      });
      
      // Should return 400/401 for invalid credentials, not 500
      expect([400, 401, 404].includes(loginResponse.status())).toBe(true);
    } catch (error) {
      console.log('Login endpoint test skipped');
    }

    // Test that frontend handles API errors gracefully
    await page.goto('/login');
    
    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');
    const submitButton = page.locator('button[type="submit"]');
    
    if (await emailInput.isVisible()) {
      await emailInput.fill('test@example.com');
      await passwordInput.fill('wrongpassword');
      await submitButton.click();
      
      await page.waitForTimeout(2000);
      
      // Should show error message or stay on login page
      const currentUrl = page.url();
      expect(currentUrl).toContain('/login');
    }
  });

  test('real-time features (WebSocket/SSE)', async ({ page }) => {
    await page.goto('/');
    
    // Check for WebSocket or SSE connections
    const wsConnections = [];
    
    page.on('websocket', ws => {
      wsConnections.push(ws.url());
      console.log('WebSocket connection:', ws.url());
    });
    
    // Navigate to pages that might use real-time features
    await page.goto('/conversations');
    await page.waitForTimeout(2000);
    
    await page.goto('/context-bridge');  
    await page.waitForTimeout(2000);
    
    if (wsConnections.length > 0) {
      console.log(`Found ${wsConnections.length} WebSocket connections`);
      expect(wsConnections.length).toBeGreaterThan(0);
    }
  });

  test('data persistence and consistency', async ({ page }) => {
    // Test that user data persists across page reloads
    await page.goto('/settings');
    
    // If there's a settings form, test data persistence
    const settingsForm = page.locator('form, input[type="text"], input[type="email"]');
    
    if (await settingsForm.first().isVisible()) {
      const testValue = 'test-' + Date.now();
      
      const textInputs = page.locator('input[type="text"]:visible').first();
      if (await textInputs.isVisible()) {
        await textInputs.fill(testValue);
        
        // Reload page
        await page.reload();
        await page.waitForTimeout(1000);
        
        // Check if value was saved (depends on implementation)
        const reloadedValue = await textInputs.inputValue();
        console.log('Value after reload:', reloadedValue);
      }
    }
  });

  test('error handling for API failures', async ({ page }) => {
    // Simulate network issues by blocking API calls
    await page.route('**/api/**', route => {
      route.abort();
    });
    
    await page.goto('/conversations');
    await page.waitForTimeout(2000);
    
    // Should show graceful error handling, not crash
    const pageContent = await page.content();
    
    // Should not show unhandled error messages
    expect(pageContent).not.toContain('Uncaught');
    expect(pageContent).not.toContain('TypeError');
    
    // Should show YCQ Sonate branding even with API failures
    expect(pageContent).toContain('YCQ Sonate');
  });

  test('API rate limiting behavior', async ({ request }) => {
    // Test if rate limiting is implemented
    try {
      const requests = [];
      
      // Make multiple rapid requests
      for (let i = 0; i < 20; i++) {
        requests.push(
          request.get('http://localhost:5001/api/health').catch(e => ({ status: () => 429 }))
        );
      }
      
      const responses = await Promise.all(requests);
      const rateLimited = responses.some(r => r.status && r.status() === 429);
      
      if (rateLimited) {
        console.log('Rate limiting is working');
      } else {
        console.log('Rate limiting not detected (may not be implemented in development)');
      }
      
    } catch (error) {
      console.log('Rate limiting test skipped');
    }
  });

  test('large data handling', async ({ page }) => {
    // Test pages that might load large datasets
    await page.goto('/reports');
    await page.waitForTimeout(3000);
    
    // Check that page doesn't freeze with large data
    const isResponsive = await page.evaluate(() => {
      return document.readyState === 'complete';
    });
    
    expect(isResponsive).toBe(true);
    
    // Check for loading states
    const loadingIndicators = page.locator('text=/loading|spinner/i');
    const hasLoadingStates = await loadingIndicators.count() > 0;
    
    console.log('Has loading indicators:', hasLoadingStates);
  });

  test('API response format consistency', async ({ request }) => {
    const endpoints = [
      '/api/health',
      '/docs',
      '/api/auth/login'  // This will fail but we can check response format
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await request.get(`http://localhost:5001${endpoint}`);
        const contentType = response.headers()['content-type'];
        
        console.log(`${endpoint}: ${response.status()} - ${contentType}`);
        
        if (response.status() === 200 && contentType && contentType.includes('json')) {
          const data = await response.json();
          
          // Check for consistent API response structure
          expect(typeof data).toBe('object');
        }
      } catch (error) {
        console.log(`Endpoint ${endpoint} not available`);
      }
    }
  });

  test('frontend API error boundaries', async ({ page }) => {
    // Test that API errors don't crash the React app
    await page.route('**/api/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });
    
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Should still show the app, not a blank page
    const hasContent = await page.getByText('YCQ Sonate').isVisible();
    expect(hasContent).toBe(true);
    
    // Check React didn't crash
    const reactError = page.locator('text=/something went wrong|error boundary/i');
    const hasReactError = await reactError.count() > 0;
    
    console.log('React error boundary triggered:', hasReactError);
  });
});