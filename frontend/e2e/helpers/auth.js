import { expect } from '@playwright/test';

export const TEST_ADMIN = {
  loginType: 'Admin',
  identifier: 'admin@pplgcenter.id',
  email: 'admin@pplgcenter.id',
  password: 'Admin123!',
};

export const TEST_TEACHER = {
  loginType: 'Teacher',
  fullName: 'Budi Santoso, M.Pd.',
  identifier: 'guru.pplg@pplgcenter.id',
  password: 'Teacher123!',
};

export const TEST_STUDENT = {
  loginType: 'Student',
  fullName: 'Ahmad Rizky Pratama',
  identifier: 'siswa.pplg@pplgcenter.id',
  password: 'Student123!',
};

export async function login(page, credentials = TEST_ADMIN) {
  await page.goto('/login');

  const loginType = credentials.loginType || 'Admin';
  const identifier = credentials.identifier || credentials.email || 'admin@pplgcenter.id';
  const password = credentials.password || 'Admin123!';

  // Click role tab button
  const roleLabel = loginType === 'Student' ? 'Siswa' : loginType === 'Teacher' ? 'Guru' : 'Admin';
  const roleBtn = page.getByRole('button', { name: roleLabel, exact: true });
  if (await roleBtn.count() > 0) {
    await roleBtn.click({ force: true });
    await page.waitForTimeout(300);
  } else {
    const selectLoc = page.locator('select');
    if (await selectLoc.count() > 0) {
      await selectLoc.selectOption(loginType);
    }
  }

  // Fill identifier & password
  await page.locator('input[name="identifier"]').fill(identifier);
  await page.locator('input[name="password"]').fill(password);

  // Click Submit Button
  await page.locator('button[type="submit"]').click({ force: true });

  // Verify redirect to profile or admin
  await expect(page).toHaveURL(/\/(profile|admin)/, { timeout: 15000 });
}

export async function expectLoggedOut(page) {
  await expect(page.getByRole('button', { name: /login/i }).first()).toBeVisible();
}
