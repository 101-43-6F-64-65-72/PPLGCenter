const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('--- START TRACE ---');

  // 1. Intercept network for JWT
  page.on('response', async res => {
    if (res.url().includes('/api/auth/login')) {
      console.log('RESPONSE_STATUS=' + res.status());
      console.log('RESPONSE_BODY=' + await res.text());
    }
  });

  // 2. Trace execution
  await page.goto('http://localhost:3000/login');
  
  await page.evaluate(() => {
    console.log('BEFORE_LOGIN localStorage=' + JSON.stringify(localStorage));
  });

  await page.locator('input[name="email"]').fill('admin@studentcenter.id');
  await page.locator('input[name="password"]').fill('admin1234');
  
  console.log('CLICKING_LOGIN');
  await page.getByRole('button', { name: /masuk ke student center/i }).click();

  // 3. Monitor navigation & storage
  await page.waitForTimeout(3000);
  
  const state = await page.evaluate(() => {
    return {
      url: location.href,
      localStorage: { ...localStorage },
      cookies: document.cookie,
      isAuth: !!localStorage.getItem('token') // Simplified check
    };
  });
  
  console.log('POST_LOGIN_STATE=' + JSON.stringify(state, null, 2));
  
  await browser.close();
})();
