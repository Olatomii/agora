import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
 testDir: './e2e', workers: 1, retries: process.env.CI ? 1 : 0,
 use: { baseURL: 'http://127.0.0.1:5181', trace: 'retain-on-failure' },
 projects: [{name:'chromium', use: {...devices['Desktop Chrome'], ...(process.env.PLAYWRIGHT_CHANNEL ? {channel:process.env.PLAYWRIGHT_CHANNEL} : {})}}],
 webServer: {command:'npx vite preview --host 127.0.0.1 --port 5181 --strictPort', url:'http://127.0.0.1:5181', reuseExistingServer:false},
});
