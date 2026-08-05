# PLAYWRIGHT_ENVIRONMENT_REPORT.md

## Startup method
- Playwright uses built-in `webServer`
- Command: `npm run dev`
- Reuse existing server: `true`
- Wait URL: `http://localhost:3000`

## Ports
- Frontend: `3000`
- Backend: `5051`

## WebServer configuration
- File: `frontend/playwright.config.js`
- Base URL: `PLAYWRIGHT_BASE_URL` or `FRONTEND_URL`, fallback `http://localhost:3000`
- Backend URL: `PLAYWRIGHT_API_URL` or `NEXT_PUBLIC_API_BASE_URL`, fallback `http://localhost:5051`
- `NEXT_PUBLIC_API_BASE_URL` is injected into the frontend webServer environment

## Timeout
- Web server startup timeout: `120000ms`
- Test timeout: `30000ms`

## Stability verification
- Ran homepage navigation 5 consecutive times
- Result: 5/5 passed

## Remaining blockers
- None for environment startup
- Auth capture can proceed next
