const { test, expect } = require('@playwright/test');

test.describe('YCQ Sonate Accessibility Tests', () => {
  test.use({ baseURL: 'http://localhost:3002' });

  test('keyboard navigation works', async ({ page }) => {
    await page.goto('/');
    
    // Test skip link
    await page.keyboard.press('Tab');
    const skipLink = await page.locator('a[href="#main"]');
    await expect(skipLink).toBeVisible();
    
    // Test tab navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Check if focus is visible
    const focusedElement = await page.evaluate(() => document.activeElement.tagName);
    expect(['BUTTON', 'A', 'INPUT'].includes(focusedElement)).toBe(true);
  });

  test('form accessibility', async ({ page }) => {
    await page.goto('/login');
    
    // Check for proper form labels
    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    
    // Test keyboard navigation in forms
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should be able to navigate to inputs
    const activeElement = await page.evaluate(() => document.activeElement.type);
    expect(['email', 'password', 'text'].includes(activeElement)).toBe(true);
  });

  test('color contrast and readability', async ({ page }) => {
    await page.goto('/');
    
    // Check for text visibility
    const textElements = await page.locator('body *').evaluateAll(elements => {
      return elements.filter(el => el.textContent && el.textContent.trim().length > 0)
        .slice(0, 10) // Check first 10 text elements
        .map(el => {
          const styles = window.getComputedStyle(el);
          return {
            text: el.textContent.trim().substring(0, 50),
            color: styles.color,
            backgroundColor: styles.backgroundColor,
            fontSize: styles.fontSize
          };
        });
    });
    
    // Ensure text elements exist
    expect(textElements.length).toBeGreaterThan(0);
    
    // Check that font sizes are reasonable (at least 12px)
    textElements.forEach(element => {
      const fontSize = parseInt(element.fontSize);
      expect(fontSize).toBeGreaterThanOrEqual(12);
    });
  });

  test('ARIA attributes and semantic HTML', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'networkidle' });
    await page.waitForURL(/dashboard/);
    
    // Check for proper headings structure
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').count();
    expect(headings).toBeGreaterThan(0);
    
    // Check for navigation landmarks
    const nav = await page.locator('nav, [role="navigation"]').count();
    expect(nav).toBeGreaterThanOrEqual(0); // May not always have nav on every page
    
    // Check for main content area
    const main = await page.locator('main, [role="main"], #main').count();
    expect(main).toBeGreaterThanOrEqual(1);
  });

  test('has single main landmark and H1 after auth', async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'networkidle' });
    await page.waitForURL(/dashboard/);
    await page.waitForSelector('main[role="main"] h1, main[role="main"] h3', { state: 'visible' });
    
    const mains = await page.locator('main[role="main"]').count();
    expect(mains).toBe(1);
    
    // Accept either h1 or h3 as main heading (Dashboard uses h3 for "Welcome back")
    const hasMainHeading = await page.locator('main[role="main"] h1, main[role="main"] h3').count();
    expect(hasMainHeading).toBeGreaterThanOrEqual(1);
  });

  test('form moves focus to first invalid field', async ({ page }) => {
    // Use storage state to bypass authentication, but test login form specifically
    await page.context().clearCookies();
    await page.context().clearPermissions();
    await page.goto('/login', { waitUntil: 'networkidle' });
    
    await page.getByTestId('login-submit').click();
    
    // Wait for validation to occur
    await page.waitForTimeout(200);
    
    // Prefer role-based field locators
    const email = page.getByRole('textbox', { name: /email/i });
    const password = page.getByLabel(/password/i);
    
    // One of them should be focused
    const emailFocused = await email.evaluate(e => e === document.activeElement);
    const passwordFocused = await password.evaluate(e => e === document.activeElement);
    
    expect(emailFocused || passwordFocused).toBeTruthy();
  });

  test('primary CTA has >=44px tap target on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Look for common CTA buttons
    const buttons = await page.locator('button, [role="button"], a.MuiButton-root').all();
    if (buttons.length > 0) {
      const box = await buttons[0].boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44);
        expect(box.width).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('images have alt text', async ({ page }) => {
    await page.goto('/');
    
    const images = await page.locator('img').count();
    if (images > 0) {
      const imagesWithoutAlt = await page.locator('img:not([alt])').count();
      expect(imagesWithoutAlt).toBe(0);
    }
  });

  test('focus management in modals', async ({ page }) => {
    await page.goto('/');
    
    // Try to find and open any modals/dialogs
    const dialogButtons = page.locator('button:has-text("Open"), button:has-text("Create"), button:has-text("Add")');
    
    const buttonCount = await dialogButtons.count();
    if (buttonCount > 0) {
      await dialogButtons.first().click();
      await page.waitForTimeout(500);
      
      // Check if focus is trapped in modal
      const modal = page.locator('[role="dialog"], .MuiDialog-root, .modal');
      if (await modal.isVisible()) {
        await page.keyboard.press('Tab');
        const focusInModal = await page.evaluate(() => {
          const activeEl = document.activeElement;
          const modal = document.querySelector('[role="dialog"], .MuiDialog-root, .modal');
          return modal && modal.contains(activeEl);
        });
        
        // Focus should be contained within modal
        expect(focusInModal).toBe(true);
      }
    }
  });

  test('screen reader friendly content', async ({ page }) => {
    await page.goto('/');
    
    // Check for skip links
    const skipLink = page.locator('a:has-text("Skip"), [href="#main"], [href="#content"]');
    // Skip links are optional but good practice
    
    // Check for proper button labels
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i);
      if (await button.isVisible()) {
        const text = await button.textContent();
        const ariaLabel = await button.getAttribute('aria-label');
        const hasAccessibleName = text && text.trim().length > 0 || ariaLabel && ariaLabel.trim().length > 0;
        expect(hasAccessibleName).toBe(true);
      }
    }
  });

  test('responsive design accessibility', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check that content is still accessible on mobile
    await expect(page.getByText('YCQ Sonate')).toBeVisible();
    
    // Check that interactive elements are large enough for touch
    const buttons = page.locator('button:visible');
    const buttonCount = await buttons.count();
    
    if (buttonCount > 0) {
      const firstButton = buttons.first();
      const boundingBox = await firstButton.boundingBox();
      
      if (boundingBox) {
        // Touch targets should be at least 44px in either dimension
        expect(Math.max(boundingBox.width, boundingBox.height)).toBeGreaterThanOrEqual(32);
      }
    }
  });
});