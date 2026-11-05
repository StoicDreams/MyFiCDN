import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';

// Playwright does not provide browser builds for every Linux distribution, so prefer a
// system Chromium there. On other systems run: npx playwright install chromium
const systemChromium = process.platform === 'linux' && existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined;
const executablePath = process.env.PW_CHROMIUM_PATH || systemChromium;

export default defineConfig({
    testDir: './tests',
    testMatch: '**/*.spec.mjs',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    reporter: [['list'], ['html', { open: 'never' }]],
    use: {
        baseURL: 'http://localhost:3199',
        serviceWorkers: 'block',
        screenshot: 'only-on-failure',
        trace: 'retain-on-failure',
        launchOptions: executablePath ? { executablePath } : {},
    },
    projects: [
        // Source files give failures with readable code and line numbers. Use this while working.
        { name: 'source', use: { useMinified: false } },
        // The minified files are what sites load. Run this before deploying.
        { name: 'min', use: { useMinified: true } },
    ],
});
