const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const loginEvents = [];
  page.on('request', req => {
    if (req.url().includes('/auth/login')) {
      loginEvents.push({ type: 'request', url: req.url(), method: req.method(), headers: req.headers(), postData: req.postData() });
    }
  });
  page.on('response', async res => {
    if (res.url().includes('/auth/login')) {
      loginEvents.push({ type: 'response', url: res.url(), status: res.status(), headers: res.headers(), body: await res.text().catch(() => '<unreadable>') });
    }
  });

  await page.goto('http://localhost:3000/login');
  console.log('STEP=login_page URL=' + page.url());
  await page.locator('input[name="email"]').fill('admin@studentcenter.id');
  await page.locator('input[name="password"]').fill('admin1234');
  await page.getByRole('button', { name: /masuk ke student center/i }).click();
  await page.waitForTimeout(6000);

  const storage = await page.evaluate(() => ({
    currentUrl: location.href,
    localStorage: { ...localStorage },
    sessionStorage: { ...sessionStorage },
    cookies: document.cookie,
  }));

  console.log('AUTH_EVENTS=' + JSON.stringify(loginEvents, null, 2));
  console.log('STORAGE=' + JSON.stringify(storage, null, 2));
  console.log('TITLE=' + await page.title());
  console.log('BODY_TEXT=' + (await page.locator('body').innerText()).slice(0, 2000));

  await browser.close();
})();
