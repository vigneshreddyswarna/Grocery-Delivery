import { defineConfig, devices } from "@playwright/test"
import { existsSync } from "node:fs"
import { join } from "node:path"

const downloadedChromium = process.env.LOCALAPPDATA
    ? join(process.env.LOCALAPPDATA, "ms-playwright", "chromium-1228", "chrome-win64", "chrome.exe")
    : ""
const localLaunchOptions = downloadedChromium && existsSync(downloadedChromium)
    ? { executablePath: downloadedChromium }
    : undefined

export default defineConfig({
    testDir: "./e2e",
    fullyParallel: true,
    retries: process.env.CI ? 2 : 0,
    reporter: process.env.CI ? "github" : "list",
    use: { baseURL: "http://127.0.0.1:4173", trace: "retain-on-failure", screenshot: "only-on-failure", launchOptions: localLaunchOptions },
    projects: [
        { name: "chromium", use: { ...devices["Desktop Chrome"] } },
        { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
    ],
    webServer: {
        command: "npm run build && npm run preview -- --host 127.0.0.1",
        url: "http://127.0.0.1:4173",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
    },
})
