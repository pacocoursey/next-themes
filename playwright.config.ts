import { PlaywrightTestConfig, devices } from '@playwright/test'

const config: PlaywrightTestConfig = {
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  testDir: './e2e',
  webServer: {
    command: 'yarn run start --filter=with-tailwindcss...',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    stderr: 'pipe'
  },
  use: {
    trace: 'on-first-retry',
    baseURL: process.env.CI ? process.env.BASE_URL : 'http://localhost:3000'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    }
  ]
}

export default config
