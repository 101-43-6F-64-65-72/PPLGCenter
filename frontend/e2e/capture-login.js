const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on('request', req => {
    if (req.url().includes('/auth/login')) {
      console.log('REQUEST_URL=' + req.url());
      console.log('REQUEST_METHOD=' + req.method());
      console.log('REQUEST_HEADERS=' + JSON.stringify(req.headers()));
      console.log('REQUEST_POST_DATA=' + req.postData());
    }
  });
  page.on('response', async res => {
    if (res.url().includes('/auth/login')) {
      console.log('RESPONSE_URL=' + res.url());
      console.log('RESPONSE_STATUS=' + res.status());
      try { console.log('RESPONSE_BODY=' + await res.text()); } catch (e) { console.log('RESPONSE_BODY=<unreadable>'); }
    }
  });
  await page.goto('http://localhost:3000/login');
  await page.locator('input[name="email"]').fill('admin@studentcenter.id');
  await page.locator('input[name="password"]').fill('admin1234');
  await page.getByRole('button', { name: /masuk ke student center/i }).click();
  await page.waitForTimeout(4000);
  console.log('FINAL_URL=' + page.url());
  console.log('LOCAL_STORAGE=' + JSON.stringify(await page.evaluate(() => ({ token: localStorage.getItem('token'), auth_token: document.cookie.includes('auth_token=') }))))
  await browser.close();
})();
