import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { _electron as electron, expect, test } from '@playwright/test';

test('launches the desktop app, unlocks, and organizes a day from the command bar', async () => {
  const tempHome = fs.mkdtempSync(path.join(os.tmpdir(), 'daily-notes-desktop-smoke-'));

  const app = await electron.launch({
    args: ['.'],
    cwd: process.cwd(),
    env: {
      ...process.env,
      HOME: tempHome
    }
  });

  try {
    const window = await app.firstWindow();

    await expect(window.getByRole('heading', { name: /unlock daily notes/i })).toBeVisible();
    await window.getByLabel('PIN Code').fill('1234');
    await window.getByRole('button', { name: /unlock workspace/i }).click();

    await expect(window.getByRole('heading', { name: /daily notes workspace/i })).toBeVisible();

    await window.getByLabel('Quick project name').fill('Project Gamma');
    await window.getByRole('button', { name: 'Add project' }).click();

    await expect(window.getByRole('button', { name: 'Project Gamma' })).toBeVisible();
    await expect(window.getByText('Filter: Project Gamma')).toBeVisible();

    await window
      .getByLabel('Organizer command')
      .fill('add task Plan launch assets for Project Gamma on 2026-05-27');
    await window.getByRole('button', { name: 'Organize' }).click();

    await expect(window.getByText('Plan launch assets')).toBeVisible();
    await expect(window.getByText('Command saved to the selected workspace.')).toBeVisible();
    await expect(window.locator('[data-date="2026-05-27"]')).toHaveClass(/day-card--filtered-match/);
  } finally {
    await app.close();
    fs.rmSync(tempHome, { recursive: true, force: true });
  }
});
