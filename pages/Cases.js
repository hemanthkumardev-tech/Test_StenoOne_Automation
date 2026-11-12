
class CasesPage {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;

        // Header & list
        this.heading = page.getByRole('heading', {
            name: 'Cases',
            level: 1
        });

        this.newCaseButton = page.getByRole('button', {
            name: 'New Case'
        });

        this.searchInput = page.getByPlaceholder(
            'Search name or case #…'
        );

        this.casesTable = page.getByRole('table');
        this.caseRows = this.casesTable.locator('tbody tr');
        this.noDataMessage = page.getByText('No data found');

        // Cases listing page filters
        this.statusFilter = page.locator('[role="combobox"]').nth(0);
        this.matterTypeFilter = page.locator('[role="combobox"]').nth(1);
        this.subOrgFilter = page.locator('[role="combobox"]').nth(2);
        this.departmentFilter = page.locator('[role="combobox"]').nth(3);
        this.productFilter = page.locator('[role="combobox"]').nth(4);

        // Create Case dialog
        this.createDialog = page.getByRole('dialog').filter({
            has: page.getByRole('heading', { name: 'Create Case' })
        });

        this.caseNameInput = this.createDialog.getByLabel('Case Name');
        this.descriptionInput = this.createDialog.getByLabel('Description');
        this.caseNumberInput = this.createDialog.getByLabel('Case Number');
        this.venueInput = this.createDialog.getByLabel('Venue Location');

        this.productSelect = this.createDialog.getByRole('combobox', {
            name: 'Product'
        });

        this.matterDetailsToggle = this.createDialog.getByRole('button', {
            name: 'Matter details (optional)'
        });

        this.matterTypeSelect = this.createDialog.getByRole('combobox', {
            name: 'Matter Type'
        });

        this.hearingDateInput = this.createDialog.getByLabel(
            'Hearing / Deposition Date'
        );

        this.createCaseButton = this.createDialog.getByRole('button', {
            name: 'Create Case',
            exact: true
        });

        this.cancelButton = this.createDialog.getByRole('button', {
            name: 'Cancel'
        });

        this.duplicateNameError = this.createDialog.getByText(
            'A case with this name already exists'
        );

        // Edit Case dialog
        this.editDialog = page.getByRole('dialog').filter({
            has: page.getByRole('heading', { name: 'Edit Case' })
        });

        this.editCaseNameInput = this.editDialog.getByRole('textbox').first();

        this.saveChangesButton = this.editDialog.getByRole('button', {
            name: 'Save Changes'
        });
    }

    // Navigation
    async goto() {
        await this.page.goto('https://dev.steno.one/cases', {
            waitUntil: 'domcontentloaded'
        });

        await this.heading.waitFor();
    }

    // Create Case actions
    async openCreateCaseForm() {
        await this.newCaseButton.click();
        await this.createDialog.waitFor();
    }

    async fillCaseDetails({
        name,
        description,
        number,
        venue,
        product
    } = {}) {
        if (name !== undefined) {
            await this.caseNameInput.fill(name);
        }

        if (description !== undefined) {
            await this.descriptionInput.fill(description);
        }

        if (number !== undefined) {
            await this.caseNumberInput.fill(number);
        }

        if (venue !== undefined) {
            await this.venueInput.fill(venue);
        }

        if (product !== undefined) {
            await this.selectProduct(product);
        }
    }

    // Select Product in Create Case dialog
    async selectProduct(product) {
        await this.productSelect.click();

        await this.page.getByRole('option', {
            name: product
        }).click();
    }

    // Expand Matter Details
    async expandMatterDetails() {
        if (
            await this.matterDetailsToggle.getAttribute('aria-expanded') !== 'true'
        ) {
            await this.matterDetailsToggle.click();
        }
    }

    // Select Matter Type in Create Case dialog
    async selectMatterType(type) {
        await this.expandMatterDetails();

        await this.matterTypeSelect.click();

        await this.page.getByRole('option', {
            name: type,
            exact: true
        }).click();
    }

    async submitCreate() {
        await this.createCaseButton.click();
    }

    async cancel() {
        await this.cancelButton.click();
    }

    // Search and case actions
    async search(term) {
        await this.searchInput.fill(term);
    }

    rowFor(text) {
        return this.caseRows.filter({
            hasText: text
        }).first();
    }

    async openCase(name) {
        await this.rowFor(name).getByText(name, {
            exact: true
        }).click();
    }

    async editCaseName(currentName, newName) {
        await this.rowFor(currentName).getByRole('button', {
            name: 'Edit'
        }).click();

        await this.editDialog.waitFor();

        await this.editCaseNameInput.fill(newName);

        await this.saveChangesButton.click();
    }

    // Cases listing page filter actions

    async selectStatusFilter(status) {
        await this.statusFilter.click();

        await this.page.getByRole('option', {
            name: status,
            exact: true
        }).click();
    }

    async selectMatterTypeFilter(type) {
        await this.matterTypeFilter.click();

        await this.page.getByRole('option', {
            name: type,
            exact: true
        }).click();
    }

    async selectSubOrgFilter(subOrg) {
        await this.subOrgFilter.click();

        await this.page.getByRole('option', {
            name: subOrg,
            exact: true
        }).click();
    }

    async selectProductFilter(product) {
        await this.productFilter.click();

        await this.page.getByRole('option', {
            name: product,
            exact: true
        }).click();
    }
}

module.exports = CasesPage;
