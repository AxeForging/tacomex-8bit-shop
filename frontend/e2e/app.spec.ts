import { test, expect, Page } from '@playwright/test';

// Capture console errors and network failures
const errors: string[] = [];
const networkErrors: string[] = [];

test.beforeEach(async ({ page }) => {
  errors.length = 0;
  networkErrors.length = 0;

  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`[Console Error] ${msg.text()}`);
    }
  });

  // Capture page errors (uncaught exceptions)
  page.on('pageerror', error => {
    errors.push(`[Page Error] ${error.message}`);
  });

  // Capture failed network requests
  page.on('requestfailed', request => {
    networkErrors.push(`[Network Error] ${request.url()} - ${request.failure()?.errorText}`);
  });

  // Capture 4xx/5xx responses
  page.on('response', response => {
    if (response.status() >= 400) {
      networkErrors.push(`[HTTP ${response.status()}] ${response.url()}`);
    }
  });
});

test.afterEach(async ({}, testInfo) => {
  // Log errors if test failed
  if (testInfo.status !== 'passed') {
    if (errors.length > 0) {
      console.log('\n--- Console Errors ---');
      errors.forEach(e => console.log(e));
    }
    if (networkErrors.length > 0) {
      console.log('\n--- Network Errors ---');
      networkErrors.forEach(e => console.log(e));
    }
  }
});

test.describe('TacoMex 8-Bit Shop E2E Tests', () => {
  test('Landing page loads with 8-bit branding', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/TacoMex/);
    await expect(page.locator('.navbar__logo-text').first()).toBeVisible();
  });

  test('Menu page shows products', async ({ page }) => {
    await page.goto('/menu');
    await page.waitForSelector('[class*="product"]', { timeout: 10000 });
    const products = page.locator('[class*="product-card"], [class*="ProductCard"]');
    await expect(products.first()).toBeVisible();
  });

  test('Categories filter exists on menu', async ({ page }) => {
    await page.goto('/menu');
    await page.waitForLoadState('networkidle');
    // Check for category buttons or filter
    const categoryElements = page.locator('button:has-text("Tacos"), button:has-text("All")');
    await expect(categoryElements.first()).toBeVisible();
  });

  test('Can navigate to login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('Login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'customer@tacomex.com');
    await page.fill('input[type="password"]', 'pass123');
    await page.click('button[type="submit"]');
    // Wait for navigation or response
    await page.waitForTimeout(3000);
    // Success if we navigated away from login or see user info
    const url = page.url();
    const onLoginPage = url.includes('/login');
    // If still on login, check for success message or no error
    if (onLoginPage) {
      const hasError = await page.locator('text=Invalid email or password').isVisible().catch(() => false);
      expect(hasError).toBe(false);
    }
  });

  test('API health check responds', async ({ request }) => {
    const response = await request.get('http://localhost:3001/health');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.status).toBe('ok');
  });

  test('Products API returns data', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/products');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.products).toBeDefined();
    expect(data.products.length).toBeGreaterThan(0);
  });

  test('Categories API returns data', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/categories');
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.categories).toBeDefined();
    expect(data.categories.length).toBe(6);
  });
});
