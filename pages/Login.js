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
        await this.page.goto(url, { waitUntil: 'domcontentloaded' });
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
