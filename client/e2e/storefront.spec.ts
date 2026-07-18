import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
    await page.route("**/api/**", async (route) => {
        const url = route.request().url()
        if (url.includes("/products")) return route.fulfill({ json: { products: [] } })
        if (url.includes("/auth/")) return route.fulfill({ status: 401, json: { message: "Not signed in" } })
        return route.fulfill({ json: {} })
    })
})

test("storefront navigation works without accessibility violations", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByRole("navigation").getByRole("link", { name: "FreshCart" })).toBeVisible()
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
    await page.goto("/products")
    await expect(page).toHaveURL(/\/products$/)
    await expect(page.getByRole("heading", { name: /products/i })).toBeVisible()
    const results = await new AxeBuilder({ page }).analyze()
    expect(results.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(node => node.target) }))).toEqual([])
})

test("keyboard users can skip navigation", async ({ page, isMobile }) => {
    test.skip(isMobile, "Mobile browser uses a touch-first navigation layout")
    await page.goto("/")
    await page.getByRole("link", { name: "Skip to main content" }).focus()
    await page.keyboard.press("Enter")
    await expect(page.locator("#main-content")).toBeFocused()
})

test("mobile navigation exposes named controls", async ({ page, isMobile }) => {
    test.skip(!isMobile, "Mobile-only behavior")
    await page.goto("/")
    await page.getByRole("button", { name: "Open navigation menu" }).click()
    await expect(page.getByRole("link", { name: "Products", exact: true })).toBeVisible()
    await expect(page.getByRole("button", { name: /Open cart/ })).toBeVisible()
})
