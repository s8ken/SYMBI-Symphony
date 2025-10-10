const { test, expect } = require('@playwright/test');

test.describe('YCQ Sonate Website', () => {
  test('homepage loads correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check main branding - use more specific locator
    await expect(page.getByRole('heading', { name: 'YCQ Sonate', exact: true })).toBeVisible();
    await expect(page.getByText('AI Trust & Compliance Platform')).toBeVisible();
    
    // Check provisional patent badge
    await expect(page.getByText('Provisional Patent Filed (Australia)')).toBeVisible();
    
    // Check navigation elements
    await expect(page.getByRole('link', { name: 'Technology' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Solutions' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Contact' })).toBeVisible();
  });

  test('technology page loads and download links work', async ({ page }) => {
    await page.goto('/technology');
    
    // Check page title
    await expect(page.getByRole('heading', { name: 'Technology Stack' })).toBeVisible();
    
    // Check download buttons exist
    const uatButton = page.getByRole('link', { name: /Download UAT Report/i });
    const postmanButton = page.getByRole('link', { name: /Download Postman Collection/i });
    
    await expect(uatButton).toBeVisible();
    await expect(postmanButton).toBeVisible();
    
    // Verify download attributes
    await expect(uatButton).toHaveAttribute('href', '/YCQ_Sonate_UAT_Report.md');
    await expect(postmanButton).toHaveAttribute('href', '/YCQ_Sonate_API_Collection.json');
  });

  test('solutions page loads correctly', async ({ page }) => {
    await page.goto('/solutions');
    
    // Check page loads (adjust based on actual content)
    await expect(page.getByText('Solutions')).toBeVisible();
  });

  test('contact page loads correctly', async ({ page }) => {
    await page.goto('/contact');
    
    // Check page loads (adjust based on actual content)
    await expect(page.getByText('Contact')).toBeVisible();
  });

  test('responsive design works on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check mobile navigation - use specific locator
    await expect(page.getByRole('heading', { name: 'YCQ Sonate', exact: true })).toBeVisible();
    await expect(page.getByText('AI Trust & Compliance Platform')).toBeVisible();
  });
});