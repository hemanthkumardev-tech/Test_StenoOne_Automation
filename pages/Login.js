class LoginPage {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;

        // Core Locators
        this.emailInput = page.getByLabel('Email').or(page.locator('input[type="email"], input[name="email"]')).first();
        this.passwordInput = page.locator('#password').or(page.locator('input[type="password"]')).first();
        this.signInButton = page.getByRole('button', { name: 'Sign In', exact: true })
            .or(page.getByRole('button', { name: 'Log in', exact: true }))
            .or(page.locator('button[type="submit"]')).first();
        this.showPasswordButton = page.getByRole('button', { name: 'Show password' });
        this.hidePasswordButton = page.getByRole('button', { name: 'Hide password' });
        this.dashboardHeader = page.getByText('Dashboard', { exact: true }).first();
        this.errorMessage = page.locator('[role="alert"], .error, .toast-error, [data-testid="error-message"]').first();
    }

    async navigateToLoginPage(url = 'https://dev.steno.one/login') {
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                const response = await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
                const status = response ? response.status() : 200;
                const isCloudflareError = await this.page.locator('text=/Error code 52[0-9]|Connection timed out|Bad gateway/i').isVisible({ timeout: 1500 }).catch(() => false);
                if ((status >= 500 || isCloudflareError) && attempt < 3) {
                    console.log(`Login page returned HTTP ${status} / Cloudflare error on attempt ${attempt}, retrying in 3s...`);
                    await this.page.waitForTimeout(3000);
                    continue;
                }
                await this.emailInput.waitFor({ state: 'visible', timeout: 20000 });
                return;
            } catch (err) {
                if (attempt >= 3) throw err;
                console.log(`Login navigation attempt ${attempt} failed, retrying in 3s...`);
                await this.page.waitForTimeout(3000);
            }
        }
    }

    async enterEmail(email) {
        await this.emailInput.fill(email);
    }

    async enterPassword(password) {
        await this.passwordInput.fill(password);
    }

    async clickSignIn() {
        await this.signInButton.click();
    }

    async login(email, password) {
        await this.enterEmail(email);
        await this.enterPassword(password);
        await this.clickSignIn();
    }

    async clickPasswordVisibility() {
        if (await this.showPasswordButton.isVisible()) {
            await this.showPasswordButton.click();
        } else if (await this.hidePasswordButton.isVisible()) {
            await this.hidePasswordButton.click();
        }
    }
}

module.exports = LoginPage;