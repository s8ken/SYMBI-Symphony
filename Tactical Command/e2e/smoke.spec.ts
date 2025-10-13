import { test, expect } from '@playwright/test';

test.describe('Tactical Command Smoke Tests', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Tactical Command/);
  });

  test('command center navigation works', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Command Center');
    await expect(page).toHaveURL(/.*command-center/);
    await expect(page.locator('h1')).toContainText('Command Center');
  });

  test('intelligence dashboard loads', async ({ page }) => {
    await page.goto('/intelligence');
    await expect(page.locator('h1')).toContainText('Intelligence');
  });

  test('agent network page loads', async ({ page }) => {
    await page.goto('/agent-network');
    await expect(page.locator('h1')).toContainText('Agent Network');
  });

  test('operations dashboard loads', async ({ page }) => {
    await page.goto('/operations');
    await expect(page.locator('h1')).toContainText('Operations');
  });

  test('systems page loads', async ({ page }) => {
    await page.goto('/systems');
    await expect(page.locator('h1')).toContainText('Systems');
  });

  test('governance page loads', async ({ page }) => {
    await page.goto('/governance');
    await expect(page.locator('h1')).toContainText('Governance');
  });
});