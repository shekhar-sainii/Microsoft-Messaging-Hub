import { test, expect } from '@playwright/test';

/**
 * Microsoft Messaging Hub E2E Tests
 * Covers: MSAL Login, Team Browsing, and Message Composing
 */
test.describe('Messaging Hub Core Flow', () => {
  
  test('should redirect to login when unauthenticated', async ({ page }) => {
    await page.goto('/');
    // Check for login button presence (Polished UI uses "Login")
    const loginBtn = page.getByRole('button', { name: /login/i });
    await expect(loginBtn).toBeVisible();
  });

  test('should display dashboard after successful mock login', async ({ page }) => {
    await page.goto('/');
    
    // Click the main CTA
    await page.getByRole('button', { name: /get started free/i }).click();
    
    // Check for dashboard components
    await expect(page.getByText(/Microsoft Teams/i)).toBeVisible();
    await expect(page.getByText(/Interactive Designer/i)).toBeVisible();
  });

  test('should allow composing a rich message', async ({ page }) => {
    await page.goto('/');
    
    // Wait for sidebar to load teams (skeleton should be visible first)
    await expect(page.locator('.animate-pulse')).toBeVisible();
    
    // Navigate to composer
    const editor = page.locator('.ProseMirror');
    await editor.fill('E2E Test Message from Playwright');
    
    // Check char count
    await expect(page.getByText(/28,000/)).toBeVisible();
    
    // Click send (expect error since no real token, but test the UI flow)
    await page.getByRole('button', { name: /send now/i }).click();
  });

  test('should navigate to Admin Dashboard and check charts', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Admin/i }).click();
    
    await expect(page.getByText(/Command Center/i)).toBeVisible();
    // Check if Recharts containers are rendered
    await expect(page.locator('.recharts-responsive-container')).toHaveCount(2);
  });
});
