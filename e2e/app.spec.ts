import { expect, test } from '@playwright/test';

test('redirects an anonymous visitor to login', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveURL(/\/login$/);
  await expect(page).toHaveTitle(/Log in/);
  await expect(page.getByRole('heading', { level: 2, name: 'Log in' })).toBeVisible();
});
