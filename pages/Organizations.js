class OrganizationsPage {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;

        // Navigation & header
        this.heading = page.getByRole('heading', { name: /Organization/i }).or(page.getByText(/Organization/i)).first();
        this.createOrgButton = page.getByRole('button', { name: /Create Organization|New Organization|Add Organization/i })
            .or(page.locator('button:has-text("Create"), button:has-text("New")')).first();

        // Form fields
        this.orgNameInput = page.getByLabel(/Organization Name|Name/i).or(page.locator('input[name="name"], input[placeholder*="Organization" i]')).first();
        this.orgEmailInput = page.getByLabel(/Email/i).or(page.locator('input[type="email"], input[name="email"]')).first();
        this.saveButton = page.getByRole('button', { name: /Save|Submit|Create/i }).first();
        this.cancelButton = page.getByRole('button', { name: /Cancel|Close/i }).first();

        // Search & table listing
        this.searchInput = page.getByPlaceholder(/Search/i).or(page.locator('input[type="search"]')).first();
        this.orgListingTable = page.locator('table, [role="grid"], .org-list, main').first();
        this.editButton = page.getByRole('button', { name: /Edit/i }).first();
        this.deleteButton = page.getByRole('button', { name: /Delete|Remove/i }).first();
        this.confirmDeleteButton = page.getByRole('button', { name: /Confirm|Yes|Delete/i }).last();

        // Validation messages
        this.validationError = page.locator('.error, [role="alert"], .text-destructive, .invalid-feedback').first();
    }

    async navigate() {
        await this.page.goto('https://dev.steno.one/organizations', { waitUntil: 'domcontentloaded' }).catch(() => {});
    }

    async openCreateForm() {
        if (await this.createOrgButton.isVisible({ timeout: 5000 }).catch(() => false)) {
            await this.createOrgButton.click();
        }
    }

    async fillDetails(name, email = '') {
        if (name !== undefined) await this.orgNameInput.fill(name);
        if (email && (await this.orgEmailInput.isVisible().catch(() => false))) {
            await this.orgEmailInput.fill(email);
        }
    }

    async save() {
        await this.saveButton.click();
    }

    async cancel() {
        await this.cancelButton.click();
    }

    async search(term) {
        if (await this.searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
            await this.searchInput.fill(term);
            await this.page.keyboard.press('Enter');
        }
    }
}

module.exports = OrganizationsPage;
