import { chromium } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const assetDir = path.join(projectRoot, 'public', 'demo-assets');
const baseUrl = process.env.DEMO_BASE_URL ?? 'http://127.0.0.1:4173';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: {
    width: 1600,
    height: 1000
  },
  colorScheme: 'light'
});

await page.goto(`${baseUrl}/?demo=pin`, { waitUntil: 'networkidle' });
await page.screenshot({
  path: path.join(assetDir, 'pin-lock.png'),
  fullPage: true
});

await page.goto(`${baseUrl}/?demo=workspace`, { waitUntil: 'networkidle' });
await page.screenshot({
  path: path.join(assetDir, 'workspace-overview.png'),
  fullPage: true
});

await page.getByRole('button', { name: 'Journal', exact: true }).click();
await page.screenshot({
  path: path.join(assetDir, 'project-filter.png'),
  fullPage: true
});

await page.getByRole('button', { name: 'Open editor' }).first().click();
await page.screenshot({
  path: path.join(assetDir, 'popup-editor.png'),
  fullPage: true
});

await browser.close();
