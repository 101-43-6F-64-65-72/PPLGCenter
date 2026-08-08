import { expect } from '@playwright/test';

export const TEST_ADMIN = {
  loginType: 'Admin',
  identifier: 'admin@studentcenter.id',
  email: 'admin@studentcenter.id',
  password: 'Admin123!',
};

export const TEST_TEACHER = {
  loginType: 'Teacher',
  fullName: 'Budi Santoso, M.Pd.',
  identifier: '198501012010011001',
  password: 'Teacher123!',
};

export const TEST_STUDENT = {
  loginType: 'Student',
  fullName: 'Prilly Latuconsina',
  identifier: '0088884444',
  password: 'Siswa123!',
};

export async function login(page, credentials = TEST_ADMIN) {
  await page.goto('/login');

  const loginType = credentials.loginType || 'Admin';
  const identifier = credentials.identifier || credentials.email || 'admin@studentcenter.id';
  const password = credentials.password || 'Admin123!';
  const fullName = credentials.fullName || '';

  // Select role
  await page.locator('select').selectOption(loginType);

  // Fill fullName if not Admin
  if (loginType !== 'Admin' && fullName) {
    await page.locator('input[name="fullName"]').fill(fullName);
  }

  // Fill identifier & password
  await page.locator('input[name="identifier"]').fill(identifier);
  await page.locator('input[name="password"]').fill(password);

  // Click Submit Button
  await page.locator('button[type="submit"]').click();

  // Verify redirect to profile
  await expect(page).toHaveURL(/\/profile/, { timeout: 15000 });
}

export async function expectLoggedOut(page) {
  await expect(page.getByRole('button', { name: /login/i }).first()).toBeVisible();
}
