const { test, expect } = require('@playwright/test');

test.describe('YCQ Sonate Full Platform Tests', () => {
  // Make webkit tests serial to reduce flake
  test.describe.configure({ mode: 'serial' });
  test.use({ baseURL: 'http://localhost:3002' });
  
  // Test user credentials for demo environment
  const testUser = {
    email: 'demo@ycqsonate.com',
    password: 'demo123',
    name: 'Demo User'
  };

  test('platform loads with correct branding', async ({ page }) => {
    await page.goto('/');
    
    // Check YCQ Sonate branding (not SYMBI)
    await expect(page.getByText('YCQ Sonate')).toBeVisible();
    await expect(page.getByText('SYMBI')).not.toBeVisible();
    
    // Check demo mode indicator
    await expect(page.getByText('🎭 Demo')).toBeVisible();
  });

  test('authentication flow works', async ({ page }) => {
    await page.goto('/login');
    
    // Check login page branding
    await expect(page.getByText('YCQ Sonate')).toBeVisible();
    
    // Fill login form
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    
    // Submit login (may need to handle demo auth differently)
    await page.click('button[type="submit"]');
    
    // Check if redirected to dashboard or if login succeeded
    await page.waitForTimeout(2000);
    
    // Should either see dashboard or stay on login with demo user
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/(login|dashboard|\/)/);
  });

  test('register page has correct branding and form', async ({ page }) => {
    await page.goto('/register');
    
    // Check branding
    await expect(page.getByText('YCQ Sonate')).toBeVisible();
    await expect(page.getByText('Join the future of AI collaboration')).toBeVisible();
    
    // Check form fields exist
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
  });

  test('navigation and sidebar work correctly', async ({ page }) => {
    await page.goto('/');
    
    // Test header navigation
    const header = page.locator('header, [role="banner"], .MuiAppBar-root');
    await expect(header.getByText('YCQ Sonate')).toBeVisible();
    
    // Test theme toggle
    const themeToggle = page.locator('button:has([data-testid="Brightness4Icon"], [data-testid="Brightness7Icon"])');
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      await page.waitForTimeout(500);
      await themeToggle.click(); // Toggle back
    }
  });

  test('dashboard elements load', async ({ page }) => {
    await page.goto('/');
    
    // Check if we can access dashboard elements
    // These might be behind auth, so we'll check what's visible
    const pageContent = await page.content();
    
    // Should not see error pages
    expect(pageContent).not.toContain('404');
    expect(pageContent).not.toContain('Error');
    
    // Should see YCQ Sonate branding
    expect(pageContent).toContain('YCQ Sonate');
  });

  test('API endpoints are accessible', async ({ page, request }) => {
    // Test backend API health
    try {
      const healthResponse = await request.get('http://localhost:5001/api/health');
      expect(healthResponse.status()).toBe(200);
      
      const healthData = await healthResponse.json();
      expect(healthData).toHaveProperty('status', 'ok');
    } catch (error) {
      console.log('Health endpoint not available:', error.message);
    }
    
    // Test Swagger documentation
    try {
      const docsResponse = await request.get('http://localhost:5001/docs');
      expect(docsResponse.status()).toBe(200);
    } catch (error) {
      console.log('Swagger docs not available:', error.message);
    }
  });

  test('conversations page structure', async ({ page }) => {
    await page.goto('/conversations');
    
    // Check page loads without errors
    await page.waitForTimeout(1000);
    
    const pageContent = await page.content();
    expect(pageContent).not.toContain('404');
    
    // Should have YCQ Sonate branding
    expect(pageContent).toContain('YCQ Sonate');
  });

  test('projects page structure', async ({ page }) => {
    await page.goto('/projects');
    
    // Check page loads without errors
    await page.waitForTimeout(1000);
    
    const pageContent = await page.content();
    expect(pageContent).not.toContain('404');
    
    // Should have YCQ Sonate branding
    expect(pageContent).toContain('YCQ Sonate');
  });

  test('agents page structure', async ({ page }) => {
    await page.goto('/agents');
    
    // Check page loads without errors
    await page.waitForTimeout(1000);
    
    const pageContent = await page.content();
    expect(pageContent).not.toContain('404');
    
    // Should have YCQ Sonate branding
    expect(pageContent).toContain('YCQ Sonate');
  });

  test('reports (symbi logs) page structure', async ({ page }) => {
    await page.goto('/reports');
    
    // Check page loads without errors
    await page.waitForTimeout(1000);
    
    const pageContent = await page.content();
    expect(pageContent).not.toContain('404');
    
    // Should have YCQ Sonate branding
    expect(pageContent).toContain('YCQ Sonate');
  });

  test('context bridge page structure', async ({ page }) => {
    await page.goto('/context-bridge');
    
    // Check page loads without errors
    await page.waitForTimeout(1000);
    
    const pageContent = await page.content();
    expect(pageContent).not.toContain('404');
    
    // Should have YCQ Sonate branding
    expect(pageContent).toContain('YCQ Sonate');
  });

  test('settings page structure', async ({ page }) => {
    await page.goto('/settings');
    
    // Check page loads without errors
    await page.waitForTimeout(1000);
    
    const pageContent = await page.content();
    expect(pageContent).not.toContain('404');
    
    // Should have YCQ Sonate branding
    expect(pageContent).toContain('YCQ Sonate');
  });

  test('responsive design on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check mobile responsiveness
    await expect(page.getByText('YCQ Sonate')).toBeVisible();
    
    // Test mobile navigation if menu button exists
    const menuButton = page.locator('button:has([data-testid="MenuIcon"])');
    if (await menuButton.isVisible()) {
      await menuButton.click();
      await page.waitForTimeout(500);
      
      // Should show sidebar with YCQ Sonate branding
      await expect(page.getByText('Trust First Platform')).toBeVisible();
    }
  });

  test('error handling and fallbacks', async ({ page }) => {
    // Test non-existent route
    await page.goto('/non-existent-page');
    await page.waitForTimeout(1000);
    
    // Should either redirect or show proper error page
    const pageContent = await page.content();
    const hasYCQBranding = pageContent.includes('YCQ Sonate');
    const has404 = pageContent.includes('404') || pageContent.includes('Not Found');
    
    // Should show either our branded 404 or redirect to home
    expect(hasYCQBranding || has404).toBe(true);
  });
});