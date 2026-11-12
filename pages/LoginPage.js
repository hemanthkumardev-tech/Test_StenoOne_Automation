
class LoginPage {
    constructor(page) {
        this.page = page;

        // Login page locators
        this.emailInput = page.getByLabel('Email');
        this.passwordInput = page.locator('input#password');
        this.signInButton = page.getByRole('button', {
            name: 'Sign In',
            exact: true
        });
    }

    // Navigate to login page
   async navigateToLoginPage(url = 'https://dev.steno.one/login') {
    await this.page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 60000
    });
}
    }

    // Enter email
    async enterEmail(email) {
        if (!email) {
            throw new Error('STENO_EMAIL is missing. Check your .env file.');
        }
        await this.emailInput.fill(email);
    }

    // Enter password
    async enterPassword(password) {
        if (!password) {
            throw new Error('STENO_PASSWORD is missing. Check your .env file.');
        }
        await this.passwordInput.fill(password);
    }

    // Click Sign In
    async clickSignIn() {
        await this.signInButton.click();
    }

    // Show password
    async clickPasswordVisibility() {
        await this.page.getByRole('button', {
            name: 'Show password'
        }).click();
    }
}

module.exports = LoginPage;
