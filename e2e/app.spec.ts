import { expect, test } from '@playwright/test';

test('loads the Drama Watch shell', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle('Drama Watch');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Keep every story');
  await expect(page.getByText('The application foundation is ready.')).toBeVisible();
});
