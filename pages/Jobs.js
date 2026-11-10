class JobsPage {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;

        // Navigation & Actions
        this.heading = page.getByRole('heading', { name: /Jobs/i }).or(page.getByText('Jobs', { exact: true })).first();
        this.createJobButton = page.getByRole('button', { name: /Create Job|New Job|Schedule Job/i })
            .or(page.locator('button:has-text("Create Job"), button:has-text("New Job")')).first();

        // Form Fields
        this.jobTitleInput = page.getByLabel(/Job Title|Title|Name/i)
            .or(page.locator('input[name="title"], input[name="name"], input[placeholder*="Job Title" i]')).first();
        this.orgSelect = page.getByLabel(/Organization/i)
            .or(page.locator('select[name="organizationId"], [data-testid="org-select"]')).first();
        this.caseSelect = page.getByLabel(/Case/i)
            .or(page.locator('select[name="caseId"], [data-testid="case-select"]')).first();
        this.jobDateInput = page.getByLabel(/Job Date|Date/i)
            .or(page.locator('input[name="date"], input[type="date"]')).first();
        this.startTimeInput = page.getByLabel(/Start Time/i)
            .or(page.locator('input[name="startTime"], input[type="time"]').first());
        this.endTimeInput = page.getByLabel(/End Time/i)
            .or(page.locator('input[name="endTime"], input[type="time"]').nth(1));
        this.locationInput = page.getByLabel(/Location/i)
            .or(page.locator('input[name="location"], input[placeholder*="Location" i]')).first();
        this.descriptionInput = page.getByLabel(/Description/i)
            .or(page.locator('textarea[name="description"], textarea[placeholder*="Description" i]')).first();

        this.saveButton = page.getByRole('button', { name: /Save|Create|Submit/i }).first();
        this.cancelButton = page.getByRole('button', { name: /Cancel|Close/i }).first();

        // Search & Table Listing
        this.searchInput = page.getByPlaceholder(/Search/i).or(page.locator('input[type="search"]')).first();
        this.jobsTable = page.locator('table, [role="grid"], .jobs-list, main').first();
        this.firstJobRow = page.locator('table tbody tr, [role="row"]').nth(1);
        this.editButton = page.getByRole('button', { name: /Edit/i }).first();
        this.validationError = page.locator('.error, [role="alert"], .text-destructive, .invalid-feedback').first();
    }

    async navigate() {
        await this.page.goto('https://dev.steno.one/jobs', { waitUntil: 'domcontentloaded' });
    }

    async openCreateJobForm() {
        if (await this.createJobButton.isVisible({ timeout: 5000 }).catch(() => false)) {
            await this.createJobButton.click();
        }
    }

    async fillJobDetails({ title, date, startTime, endTime, location, description } = {}) {
        if (title !== undefined && (await this.jobTitleInput.isVisible().catch(() => false))) {
            await this.jobTitleInput.fill(title);
        }
        if (date && (await this.jobDateInput.isVisible().catch(() => false))) {
            await this.jobDateInput.fill(date);
        }
        if (startTime && (await this.startTimeInput.isVisible().catch(() => false))) {
            await this.startTimeInput.fill(startTime);
        }
        if (endTime && (await this.endTimeInput.isVisible().catch(() => false))) {
            await this.endTimeInput.fill(endTime);
        }
        if (location && (await this.locationInput.isVisible().catch(() => false))) {
            await this.locationInput.fill(location);
        }
        if (description && (await this.descriptionInput.isVisible().catch(() => false))) {
            await this.descriptionInput.fill(description);
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

module.exports = JobsPage;
