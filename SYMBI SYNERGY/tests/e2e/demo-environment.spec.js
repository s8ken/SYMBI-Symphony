const { test, expect } = require('@playwright/test');

test.describe('YCQ Sonate Demo Environment', () => {
  test.use({ baseURL: 'http://localhost:3002' });

  test('demo environment loads with correct branding', async ({ page }) => {
    await page.goto('/');
    
    // Check that it shows YCQ Sonate, not SYMBI
    await expect(page.getByText('YCQ Sonate')).toBeVisible();
    await expect(page.getByText('SYMBI')).not.toBeVisible();
    
    // Check demo mode indicator
    await expect(page.getByText('🎭 Demo')).toBeVisible();
  });

  test('login page has correct branding', async ({ page }) => {
    await page.goto('/login');
    
    // Check login page shows YCQ Sonate
    await expect(page.getByText('YCQ Sonate')).toBeVisible();
    await expect(page.getByText('Welcome back to the Trust First Platform')).toBeVisible();
    
    // Check form elements
    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /password/i })).toBeVisible();
  });

  test('register page has correct branding', async ({ page }) => {
    await page.goto('/register');
    
    // Check register page shows YCQ Sonate
    await expect(page.getByText('YCQ Sonate')).toBeVisible();
    await expect(page.getByText('Join the future of AI collaboration')).toBeVisible();
    
    // Check form elements
    await expect(page.getByRole('textbox', { name: /full name/i })).toBeVisible();
    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible();
  });

  test('navigation header shows correct branding', async ({ page }) => {
    await page.goto('/');
    
    // Test header branding
    const header = page.locator('header, [role="banner"], .MuiAppBar-root');
    await expect(header.getByText('YCQ Sonate')).toBeVisible();
  });

  test('sidebar shows correct branding when opened', async ({ page }) => {
    await page.goto('/');
    
    // Try to open sidebar (might require login, so we'll handle both cases)
    const menuButton = page.getByRole('button', { name: /menu/i });
    
    if (await menuButton.isVisible()) {
      await menuButton.click();
      
      // Check sidebar branding
      await expect(page.getByText('YCQ Sonate')).toBeVisible();
      await expect(page.getByText('Trust First Platform')).toBeVisible();
    }
  });

  test('demo mode functionality works', async ({ page }) => {
    await page.goto('/');
    
    // Check demo environment specific features
    await expect(page.getByText('🎭 Demo')).toBeVisible();
    
    // Test that demo mode doesn't show real data warnings
    const demoIndicator = page.locator('[data-testid="demo-indicator"], .demo-badge, :has-text("🎭 Demo")');
    await expect(demoIndicator).toBeVisible();
  });

  test('responsive design in demo environment', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    
    // Check mobile responsive elements
    await expect(page.getByText('YCQ Sonate')).toBeVisible();
  });
});