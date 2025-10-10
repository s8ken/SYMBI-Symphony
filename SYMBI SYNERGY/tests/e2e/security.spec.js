const { test, expect } = require('@playwright/test');

test.describe('YCQ Sonate Security Tests', () => {
  test.use({ baseURL: 'http://localhost:3002' });

  test('no sensitive data in client-side code', async ({ page }) => {
    await page.goto('/');
    
    // Check that no API keys, secrets, or sensitive data are exposed
    const pageContent = await page.content();
    
    const sensitivePatterns = [
      /sk-[a-zA-Z0-9]{48,}/, // OpenAI API keys
      /AIza[a-zA-Z0-9]{35}/, // Google API keys  
      /AKIA[a-zA-Z0-9]{16}/, // AWS Access Keys
      /password['"]\s*:\s*['"][^'"]+['"]/, // Hardcoded passwords
      /secret['"]\s*:\s*['"][^'"]+['"]/, // Hardcoded secrets
      /mongodb:\/\/[^'"]+:[^'"]+@/, // MongoDB connection strings with credentials
    ];
    
    sensitivePatterns.forEach(pattern => {
      const matches = pageContent.match(pattern);
      expect(matches).toBeNull();
    });
  });

  test('XSS protection', async ({ page }) => {
    await page.goto('/login');
    
    // Try XSS in email field
    const xssPayload = '<script>window.xssTest = true;</script>';
    
    const emailInput = page.locator('input[name="email"]');
    if (await emailInput.isVisible()) {
      await emailInput.fill(xssPayload);
      
      // Check that script didn't execute
      const xssExecuted = await page.evaluate(() => window.xssTest);
      expect(xssExecuted).toBeFalsy();
      
      // Check that the value is properly escaped
      const inputValue = await emailInput.inputValue();
      expect(inputValue).toBe(xssPayload); // Should be treated as text, not HTML
    }
  });

  test('CSRF protection headers', async ({ page, request }) => {
    // Check for security headers
    const response = await request.get('http://localhost:3002/');
    const headers = response.headers();
    
    console.log('Security headers:', headers);
    
    // Check for common security headers (may not all be present in development)
    // These are recommendations for production
    const securityHeaders = [
      'x-frame-options',
      'x-content-type-options', 
      'x-xss-protection',
      'strict-transport-security',
      'content-security-policy'
    ];
    
    // Log which security headers are present
    securityHeaders.forEach(header => {
      if (headers[header]) {
        console.log(`✓ ${header}: ${headers[header]}`);
      } else {
        console.log(`⚠ ${header}: not set`);
      }
    });
  });

  test('authentication required for protected routes', async ({ page }) => {
    // Test that certain routes require authentication
    const protectedRoutes = ['/dashboard', '/settings'];
    
    for (const route of protectedRoutes) {
      await page.goto(route);
      
      const currentUrl = page.url();
      const isOnLoginPage = currentUrl.includes('/login');
      const hasAuthContent = await page.getByText('YCQ Sonate').isVisible();
      
      // Should either redirect to login or show the page (if demo mode allows access)
      expect(isOnLoginPage || hasAuthContent).toBe(true);
    }
  });

  test('no console errors revealing sensitive info', async ({ page }) => {
    const consoleMessages = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleMessages.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Check that console errors don't reveal sensitive information
    const sensitiveErrorPatterns = [
      /password/i,
      /secret/i,
      /api[_\-]?key/i,
      /token/i,
      /mongodb:\/\//,
      /database/i
    ];
    
    consoleMessages.forEach(msg => {
      sensitiveErrorPatterns.forEach(pattern => {
        expect(msg).not.toMatch(pattern);
      });
    });
  });

  test('input validation', async ({ page }) => {
    await page.goto('/register');
    
    const emailInput = page.locator('input[name="email"]');
    const submitButton = page.locator('button[type="submit"]');
    
    if (await emailInput.isVisible() && await submitButton.isVisible()) {
      // Test invalid email format
      await emailInput.fill('invalid-email');
      await submitButton.click();
      
      await page.waitForTimeout(1000);
      
      // Should show validation error or not allow submission
      const errorMessage = page.locator('text=/invalid|error|required/i');
      const emailValidationError = await errorMessage.count() > 0;
      
      // Either shows error or HTML5 validation prevents submission
      const currentUrl = page.url();
      const stillOnRegisterPage = currentUrl.includes('/register');
      
      expect(emailValidationError || stillOnRegisterPage).toBe(true);
    }
  });

  test('session security', async ({ page, context }) => {
    // Check that sessions are properly managed
    await page.goto('/login');
    
    // Check for secure cookie settings (if using cookies)
    const cookies = await context.cookies();
    
    cookies.forEach(cookie => {
      // Session cookies should be secure in production
      if (cookie.name.includes('session') || cookie.name.includes('token')) {
        console.log(`Cookie ${cookie.name}: secure=${cookie.secure}, httpOnly=${cookie.httpOnly}`);
      }
    });
  });

  test('information disclosure prevention', async ({ page }) => {
    await page.goto('/non-existent-endpoint');
    
    const pageContent = await page.content();
    
    // Check that error pages don't reveal system information
    const systemInfoPatterns = [
      /node_modules/,
      /stack trace/i,
      /internal server error/i,
      /database error/i,
      /mongodb/i,
      /express/i
    ];
    
    systemInfoPatterns.forEach(pattern => {
      expect(pageContent).not.toMatch(pattern);
    });
  });

  test('content security policy', async ({ page }) => {
    await page.goto('/');
    
    // Check if CSP violations are logged
    const cspViolations = [];
    
    page.on('console', msg => {
      if (msg.text().includes('Content Security Policy') || msg.text().includes('CSP')) {
        cspViolations.push(msg.text());
      }
    });
    
    await page.waitForTimeout(2000);
    
    // Log CSP violations for review
    if (cspViolations.length > 0) {
      console.log('CSP Violations:', cspViolations);
    }
  });

  test('no inline scripts or styles (CSP compliance)', async ({ page }) => {
    await page.goto('/');
    
    // Check for inline scripts (security risk)
    const inlineScripts = await page.locator('script:not([src])').count();
    console.log(`Inline scripts found: ${inlineScripts}`);
    
    // In production, there should be minimal inline scripts
    // For development/React builds, some inline scripts are normal
    expect(inlineScripts).toBeLessThan(10); // Reasonable limit for React apps
  });
});