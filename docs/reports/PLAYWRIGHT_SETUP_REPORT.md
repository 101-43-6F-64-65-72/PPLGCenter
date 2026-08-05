# PLAYWRIGHT_SETUP_REPORT.md

## Installed packages
- `@playwright/test`
- Chromium browser via `playwright install chromium`

## Configuration
- `frontend/playwright.config.js`
- Base URL autodetects from `PLAYWRIGHT_BASE_URL` or `FRONTEND_URL`, defaulting to `http://localhost:3000`
- Backend URL autodetects from `PLAYWRIGHT_API_URL` or `NEXT_PUBLIC_API_BASE_URL`, defaulting to `http://localhost:5051`
- Web server starts with `npm run dev`

## Commands
- `npm run test:e2e`
- `npm run test:e2e:headed`
- `npm run test:e2e:debug`

## Folder structure
- `frontend/e2e/helpers/auth.js`
- `frontend/e2e/smoke/homepage.spec.js`
- `frontend/e2e/smoke/login-page.spec.js`
- `frontend/e2e/smoke/login-success.spec.js`
- `frontend/e2e/smoke/login-failed.spec.js`
- `frontend/e2e/smoke/logout.spec.js`

## Remaining blockers
- None for Playwright setup
- Full browser verification still depends on successful app-level test execution
