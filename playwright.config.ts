import { PlaywrightTestConfig, devices } from "@playwright/test";

const config: PlaywrightTestConfig = {
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  testDir: "./e2e",
  use: {
    trace: "on-first-retry",
  },
  webServer: {
    command:
      'pnpm run build --filter="basic..." && pnpm run start --filter="basic..."',
    reuseExistingServer: true,
    port: 3000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
};

export default config;
