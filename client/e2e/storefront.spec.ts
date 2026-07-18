import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
    await page.route("**/api/**", async (route) => {
        const url = route.request().url()
        if (url.includes("/products")) return route.fulfill({ json: { products: [] } })
        if (url.includes("/auth/me")) {
            const customer=route.request().headers()["authorization"]?.includes("customer")
            const address={id:"address-1",label:"Home",address:"1 Market Road",city:"Nellore",state:"Andhra Pradesh",zip:"524001",isDefault:true,lat:14.4426,lng:79.9865}
            return route.fulfill({ json: { user: customer
                ? { id:"customer-1", name:"Customer", email:"customer@example.com", isAdmin:false, addresses:[address] }
                : { id:"admin-1", name:"Admin", email:"admin@example.com", isAdmin:true, addresses:[] } } })
        }
        if (url.includes("/auth/")) return route.fulfill({ status: 401, json: { message: "Not signed in" } })
        if (url.includes("/admin/stats")) return route.fulfill({ json: { totalOrders:2, totalUsers:3, totalProducts:4, outOfStock:0, recentOrders:[] } })
        if (url.includes("/delivery/me")) return route.fulfill({ json: { partner: { id:"partner-1", name:"Rider", email:"rider@example.com", phone:"9999999999", vehicleType:"bike", isActive:true } } })
        if (url.includes("/delivery/my-deliveries")) return route.fulfill({ json: { orders: [] } })
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

test("authentication page has no automated accessibility violations", async ({ page }) => {
    await page.goto("/login")
    await expect(page.getByRole("heading", { name: "Sign in to your account" })).toBeVisible()
    const results = await new AxeBuilder({ page }).analyze()
    expect(results.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(node => node.target) }))).toEqual([])
})

test("authenticated admin dashboard is keyboard and screen-reader ready", async ({ page }) => {
    await page.addInitScript(() => {
        localStorage.setItem("auth_token", "test-admin-token")
        localStorage.setItem("auth_user", JSON.stringify({id:"admin-1",name:"Admin",email:"admin@example.com",isAdmin:true,addresses:[]}))
    })
    await page.goto("/admin")
    await expect(page.getByRole("heading", { name: "Admin Panel" })).toBeVisible()
    await expect(page.getByText("Total Orders", { exact:true })).toBeVisible()
    const results = await new AxeBuilder({ page }).analyze()
    expect(results.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(node => node.target) }))).toEqual([])
})

test("delivery dashboard exposes named controls without accessibility violations", async ({ page }) => {
    await page.addInitScript(() => {
        localStorage.setItem("delivery_token", "test-delivery-token")
        localStorage.setItem("delivery_partner", JSON.stringify({id:"partner-1",name:"Rider",email:"rider@example.com",phone:"9999999999",vehicleType:"bike",isActive:true}))
    })
    await page.goto("/delivery")
    await expect(page.getByRole("button", { name: "Share Location" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Sign out delivery partner" })).toBeVisible()
    const results = await new AxeBuilder({ page }).analyze()
    expect(results.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(node => node.target) }))).toEqual([])
})

test("authenticated checkout address step is accessible and keyboard operable", async ({ page }) => {
    await page.addInitScript(() => {
        const address={id:"address-1",label:"Home",address:"1 Market Road",city:"Nellore",state:"Andhra Pradesh",zip:"524001",isDefault:true,lat:14.4426,lng:79.9865}
        localStorage.setItem("auth_token", "test-customer-token")
        localStorage.setItem("auth_user", JSON.stringify({id:"customer-1",name:"Customer",email:"customer@example.com",isAdmin:false,addresses:[address]}))
        localStorage.setItem("app_cart", JSON.stringify([{quantity:1,product:{id:"product-1",name:"Rice",price:125,originalPrice:140,image:"/rice.webp",category:"Pantry",unit:"1 kg",stock:5}}]))
    })
    await page.goto("/checkout")
    await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible()
    await expect(page.getByRole("button", { name: /Home/ })).toBeVisible()
    await expect(page.getByRole("button", { name: /Continue to Payment/ })).toBeEnabled()
    const results = await new AxeBuilder({ page }).analyze()
    expect(results.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(node => node.target) }))).toEqual([])
})
