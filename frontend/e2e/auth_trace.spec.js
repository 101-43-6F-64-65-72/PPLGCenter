import { test, expect } from '@playwright/test';

test('auth flow trace', async ({ page }) => {
  // 1. Intercept Network
  page.on('response', async res => {
    if (res.url().includes('/api/auth/login')) {
      console.log('TRACE_RESPONSE_STATUS=' + res.status());
      console.log('TRACE_RESPONSE_BODY=' + await res.text().catch(() => 'unreadable'));
    }
  });

  // 2. Navigation & Actions
  await page.goto('/login');
  await page.getByRole('button', { name: 'Admin', exact: true }).click();
  await page.locator('input[name="identifier"]').fill('admin@pplgcenter.id');
  await page.locator('input[name="password"]').fill('Admin123!');
  
  console.log('TRACE_ACTION=click_login');
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(/\/(profile|admin)/);
  
  const postLoginState = await page.evaluate(() => {
    return {
      url: location.href,
      token: localStorage.getItem('token'),
      cookies: document.cookie,
    };
  });
  
  console.log('TRACE_POST_LOGIN_STATE=' + JSON.stringify(postLoginState, null, 2));
  
  // Inspect AuthGuard redirect condition
  const pathname = await page.evaluate(() => location.pathname);
  console.log('TRACE_PATHNAME=' + pathname);
});
