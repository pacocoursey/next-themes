import { PlaywrightTestConfig, devices } from '@playwright/test'

const config: PlaywrightTestConfig = {
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  testDir: './test',
  webServer: [
    {
      command: 'pnpm start --filter=example...',
      port: 3000,
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000
    },
    {
      command: 'pnpm --filter=with-cache-components build && pnpm --filter=with-cache-components exec next start --port 3001',
      port: 3001,
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000
    }
  ],
  use: {
    trace: 'on-first-retry'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:3000' },
      testIgnore: /cache-components/
    },
    {
      name: 'cache-components',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:3001' },
      testMatch: /cache-components/
    }
  ]
}

export default config
