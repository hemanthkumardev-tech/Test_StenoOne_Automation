
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

        this.createDialogSubtitle = this.createDialog.getByText(/Enter case basics now/i);
        this.closeDialogButton = this.createDialog.getByRole('button', {
            name: 'Close',
            exact: true
        });

        // Basic details
        this.caseNameInput = this.createDialog.getByLabel(/Case Name/i)
            .or(this.createDialog.getByPlaceholder('e.g., Smith v. Acme Corp'));
        this.descriptionInput = this.createDialog.getByLabel(/Description/i)
            .or(this.createDialog.getByPlaceholder('Brief summary of the case'));
        this.caseNumberInput = this.createDialog.getByLabel(/Case Number/i)
            .or(this.createDialog.getByPlaceholder('e.g., 2026-CV-1142'));
        this.venueInput = this.createDialog.getByLabel(/Venue Location/i)
            .or(this.createDialog.getByPlaceholder('e.g., State of California'));

        // Product selection
        this.productSelect = this.createDialog.getByRole('combobox', {
            name: 'Product'
        }).or(this.createDialog.locator('button[role="combobox"]').filter({ hasText: /Select a product instance|Publish|Sync Generator|Capture/i })).first();

        // Ownership selection
        this.ownerSelect = this.createDialog.getByRole('combobox', {
            name: 'Owner'
        }).or(this.createDialog.locator('button[role="combobox"]').filter({ hasText: /Organization|Sub-Organization|Department/i })).first();

        // Matter details
        this.matterDetailsToggle = this.createDialog.getByRole('button', {
            name: 'Matter details (optional)'
        }).or(this.createDialog.getByText('Matter details (optional)')).first();

        this.courtJurisdictionInput = this.createDialog.getByLabel(/Court \/ Jurisdiction/i)
            .or(this.createDialog.getByPlaceholder('e.g., Superior Court of Cook County'));

        this.matterTypeSelect = this.createDialog.getByRole('combobox', {
            name: 'Matter Type'
        }).or(this.createDialog.locator('button[role="combobox"]').filter({ hasText: /Select type|Civil|Criminal|Deposition|Arbitration|Other/i })).first();

        // Additional details
        this.clientFirmInput = this.createDialog.getByLabel(/Client \/ Firm/i)
            .or(this.createDialog.locator('input').filter({ has: page.locator('xpath=preceding-sibling::label[contains(text(), "Client")]') }))
            .or(this.createDialog.locator('div:has-text("Client / Firm") > input')).first();

        this.opposingPartyInput = this.createDialog.getByLabel(/Opposing Party/i)
            .or(this.createDialog.locator('input').filter({ has: page.locator('xpath=preceding-sibling::label[contains(text(), "Opposing")]') }))
            .or(this.createDialog.locator('div:has-text("Opposing Party") > input')).first();

        this.hearingDateInput = this.createDialog.getByLabel(
            'Hearing / Deposition Date'
        ).or(this.createDialog.locator('input[type="date"], input[placeholder*="yyyy" i], input[placeholder*="mm/dd" i]'));

        // Actions
        this.createCaseButton = this.createDialog.getByRole('button', {
            name: 'Create Case',
            exact: true
        });

        this.createAndOpenButton = this.createDialog.getByRole('button', {
            name: 'Create & Open',
            exact: true
        });

        this.cancelButton = this.createDialog.getByRole('button', {
            name: 'Cancel',
            exact: true
        });

        this.duplicateNameError = this.createDialog.getByText(
            'A case with this name already exists'
        );

        // Edit Case dialog
        this.editDialog = page.getByRole('dialog').filter({
            has: page.getByRole('heading', { name: 'Edit Case' })
        });
        this.editDialogHeading = this.editDialog.getByRole('heading', { name: 'Edit Case' });
        this.editCloseButton = this.editDialog.getByRole('button', { name: 'Close', exact: true });

        // Edit form fields
        this.editCaseNameInput = this.editDialog.getByRole('textbox').nth(0);
        this.editCaseNumberInput = this.editDialog.getByRole('textbox').nth(1);
        this.editVenueInput = this.editDialog.getByRole('textbox').nth(2);
        this.editDescriptionInput = this.editDialog.getByRole('textbox').nth(3);

        // Edit Status dropdown
        this.editStatusSelect = this.editDialog.getByRole('combobox').nth(0);

        this.editCourtJurisdictionInput = this.editDialog.getByRole('textbox').nth(4);

        // Edit Matter Type dropdown
        this.editMatterTypeSelect = this.editDialog.getByRole('combobox').nth(1);

        this.editClientFirmInput = this.editDialog.getByRole('textbox').nth(5);
        this.editOpposingPartyInput = this.editDialog.getByRole('textbox').nth(6);
        this.editHearingDateInput = this.editDialog.getByRole('textbox').nth(7);

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
        product,
        owner,
        court,
        matterType,
        clientFirm,
        opposingParty,
        hearingDate
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

        if (owner !== undefined) {
            await this.selectOwner(owner);
        }

        if (court !== undefined || matterType !== undefined || clientFirm !== undefined || opposingParty !== undefined || hearingDate !== undefined) {
            await this.expandMatterDetails();

            if (court !== undefined) {
                await this.courtJurisdictionInput.fill(court);
            }

            if (matterType !== undefined) {
                await this.selectMatterType(matterType);
            }

            if (clientFirm !== undefined) {
                await this.clientFirmInput.fill(clientFirm);
            }

            if (opposingParty !== undefined) {
                await this.opposingPartyInput.fill(opposingParty);
            }

            if (hearingDate !== undefined) {
                await this.hearingDateInput.fill(hearingDate);
            }
        }
    }

    // Select Product in Create Case dialog
    async selectProduct(product) {
        await this.productSelect.click();

        await this.page.getByRole('option', {
            name: product
        }).click();
    }

    // Select Owner in Create Case dialog
    async selectOwner(owner) {
        await this.ownerSelect.click();

        await this.page.getByRole('option', {
            name: owner,
            exact: true
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

    async submitCreateAndOpen() {
        await this.createAndOpenButton.click();
    }

    async closeCreateDialog() {
        await this.closeDialogButton.click();
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

    async openEditCaseForm(name) {
        await this.rowFor(name).getByRole('button', {
            name: 'Edit'
        }).or(this.rowFor(name).locator('button').first()).click();

        await this.editDialog.waitFor();
    }

    async selectEditStatus(status) {
        await this.editStatusSelect.click();
        await this.page.getByRole('option', {
            name: status,
            exact: true
        }).click();
    }

    async selectEditMatterType(type) {
        await this.editMatterTypeSelect.click();
        await this.page.getByRole('option', {
            name: type,
            exact: true
        }).click();
    }

    async editCaseName(currentName, newName) {
        await this.openEditCaseForm(currentName);

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
