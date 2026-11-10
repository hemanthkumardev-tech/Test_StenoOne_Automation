class CasesPage {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;

        // Header & Actions
        this.heading = page.getByRole('heading', { name: /Cases/i }).or(page.getByText('Cases', { exact: true })).first();
        this.newCaseButton = page.getByRole('button', { name: /New Case|Create Case/i })
            .or(page.locator('button:has-text("New Case")')).first();

        // Form Fields
        this.caseNameInput = page.getByLabel(/Case Name|Case Title|Title|Name/i)
            .or(page.locator('input[name="name"], input[name="title"], input[placeholder*="Case Name" i]')).first();
        this.caseNumberInput = page.getByLabel(/Case Number/i)
            .or(page.locator('input[name="caseNumber"], input[placeholder*="Case Number" i]')).first();
        this.orgSelect = page.getByLabel(/Organization/i)
            .or(page.locator('select[name="organizationId"], [data-testid="org-select"], button:has-text("All sub-orgs")')).first();
        this.caseTypeSelect = page.getByLabel(/Case Type|Matter Type/i)
            .or(page.locator('button:has-text("All matter types"), select[name="type"]')).first();
        this.startDateInput = page.getByLabel(/Start Date|Date/i)
            .or(page.locator('input[name="startDate"], input[type="date"]')).first();
        this.endDateInput = page.getByLabel(/End Date/i)
            .or(page.locator('input[name="endDate"], input[type="date"]').nth(1));

        this.saveButton = page.getByRole('button', { name: /Save|Create|Submit/i }).first();
        this.cancelButton = page.getByRole('button', { name: /Cancel|Close/i }).first();

        // Search & Table
        this.searchInput = page.getByPlaceholder(/Search/i).or(page.locator('input[type="search"]')).first();
        this.casesTable = page.locator('table, [role="grid"], .cases-list, main').first();
        this.firstCaseRow = page.locator('table tbody tr, [role="row"]').nth(1);
        this.editButton = page.getByRole('button', { name: /Edit/i }).first();
        this.validationError = page.locator('.error, [role="alert"], .text-destructive, .invalid-feedback').first();
    }

    async navigate() {
        await this.page.goto('https://dev.steno.one/cases', { waitUntil: 'domcontentloaded' });
    }

    async openCreateCaseForm() {
        await this.newCaseButton.click();
    }

    async fillCaseDetails({ name, number, startDate, endDate } = {}) {
        if (name !== undefined && (await this.caseNameInput.isVisible().catch(() => false))) {
            await this.caseNameInput.fill(name);
        }
        if (number !== undefined && (await this.caseNumberInput.isVisible().catch(() => false))) {
            await this.caseNumberInput.fill(number);
        }
        if (startDate && (await this.startDateInput.isVisible().catch(() => false))) {
            await this.startDateInput.fill(startDate);
        }
        if (endDate && (await this.endDateInput.isVisible().catch(() => false))) {
            await this.endDateInput.fill(endDate);
        }
    }

    async save() {
        await this.saveButton.click();
    }

    async cancel() {
        await this.cancelButton.click();
    }

    async search(term) {
        if (await this.searchInput.isVisible().catch(() => false)) {
            await this.searchInput.fill(term);
            await this.page.keyboard.press('Enter');
        }
    }
}

module.exports = CasesPage;
