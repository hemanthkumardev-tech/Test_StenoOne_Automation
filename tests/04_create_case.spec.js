const { test, expect } = require('@playwright/test');
const LoginPage = require('../pages/Login');
const DashboardPage = require('../pages/Dashboard');
const CasesPage = require('../pages/Cases');

// All tests share one logged-in page, so they must run in order in a single worker.
test.describe.configure({ mode: 'default' });

test.describe('Module 4: Create Case (TC029 - TC044)', () => {
    /** @type {import('@playwright/test').Page} */
    let page;
    let dashboardPage;
    let casesPage;

    const stamp = process.env.TEST_RUN_ID || Date.now().toString();
    const caseName = `Case_${stamp}`;
    const caseNumber = `CN-${stamp}`;
    const updatedCaseName = `${caseName}_Updated`;
    const product = /^Publish/;

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        dashboardPage = new DashboardPage(page);
        casesPage = new CasesPage(page);

        const loginPage = new LoginPage(page);
        await loginPage.navigateToLoginPage();
        await loginPage.login(process.env.STENO_EMAIL, process.env.STENO_PASSWORD);
        await expect(page).not.toHaveURL(/\/login(?:[/?#]|$)/, { timeout: 15000 });
    });

    test.afterAll(async () => {
        await page?.close();
    });

    test('TC029: Navigate to Cases', async () => {
        await dashboardPage.clickCases();
        await expect(page).toHaveURL(/\/cases$/i);
        await expect(casesPage.heading).toBeVisible();
        await expect(casesPage.newCaseButton).toBeVisible();
    });

    test.describe('Cases page', () => {
        test.beforeEach(async () => {
            await casesPage.goto();
        });

        test('TC030: Open Create Case form', async () => {
            await casesPage.openCreateCaseForm();
            await expect(casesPage.createDialog).toBeVisible();
            await expect(casesPage.caseNameInput).toBeVisible();
            await expect(casesPage.createCaseButton).toBeDisabled();
            await casesPage.cancel();
        });

        test('TC030A: Verify all sections, labels, placeholders, and action buttons in Create Case modal', async () => {
            await casesPage.openCreateCaseForm();

            // Modal Header & Subtitle
            await expect(casesPage.createDialog.getByRole('heading', { name: 'Create Case' })).toBeVisible();
            await expect(casesPage.createDialogSubtitle).toBeVisible();
            await expect(casesPage.closeDialogButton).toBeVisible();

            // Basic details: Case Name, Description, Case Number, Venue Location
            await expect(casesPage.createDialog.getByText('Case Name *')).toBeVisible();
            await expect(casesPage.caseNameInput).toBeVisible();
            await expect(casesPage.caseNameInput).toHaveAttribute('placeholder', 'e.g., Smith v. Acme Corp');

            await expect(casesPage.createDialog.getByText('Description *')).toBeVisible();
            await expect(casesPage.descriptionInput).toBeVisible();
            await expect(casesPage.descriptionInput).toHaveAttribute('placeholder', 'Brief summary of the case');

            await expect(casesPage.createDialog.getByText('Case Number', { exact: true })).toBeVisible();
            await expect(casesPage.caseNumberInput).toBeVisible();
            await expect(casesPage.caseNumberInput).toHaveAttribute('placeholder', 'e.g., 2026-CV-1142');

            await expect(casesPage.createDialog.getByText('Venue Location', { exact: true })).toBeVisible();
            await expect(casesPage.venueInput).toBeVisible();
            await expect(casesPage.venueInput).toHaveAttribute('placeholder', 'e.g., State of California');

            // Product section
            await expect(casesPage.createDialog.getByText('Product *')).toBeVisible();
            await expect(casesPage.productSelect).toBeVisible();

            // Ownership section
            await expect(casesPage.createDialog.getByText('Owner *')).toBeVisible();
            await expect(casesPage.ownerSelect).toBeVisible();

            // Matter details collapsible toggle
            await expect(casesPage.matterDetailsToggle).toBeVisible();

            // Actions: Cancel, Create & Open, Create Case, Close
            await expect(casesPage.cancelButton).toBeVisible();
            await expect(casesPage.createAndOpenButton).toBeVisible();
            await expect(casesPage.createCaseButton).toBeVisible();

            // Close modal cleanly via Close (X) button
            await casesPage.closeCreateDialog();
            await expect(casesPage.createDialog).toBeHidden();
        });

        test('TC030B: Verify Product instance selection dropdown and options', async () => {
            await casesPage.openCreateCaseForm();

            await casesPage.productSelect.click();
            const listbox = page.locator('[role="listbox"]');
            await expect(listbox).toBeVisible();

            // Verify product instance options
            await expect(page.getByRole('option', { name: /Publish/i }).first()).toBeVisible();
            await expect(page.getByRole('option', { name: /Sync Generator/i }).first()).toBeVisible();
            await expect(page.getByRole('option', { name: /Capture/i }).first()).toBeVisible();

            // Select an option
            await page.getByRole('option', { name: /Publish/i }).first().click();
            await expect(listbox).toBeHidden();
            await expect(casesPage.productSelect).toContainText(/Publish/i);

            await casesPage.cancel();
        });

        test('TC030C: Verify Ownership dropdown options (Organization, Sub-Organization, Department)', async () => {
            await casesPage.openCreateCaseForm();

            await casesPage.ownerSelect.click();
            const listbox = page.locator('[role="listbox"]');
            await expect(listbox).toBeVisible();

            // Verify all 3 options shown
            await expect(page.getByRole('option', { name: 'Organization', exact: true })).toBeVisible();
            await expect(page.getByRole('option', { name: 'Sub-Organization', exact: true })).toBeVisible();
            await expect(page.getByRole('option', { name: 'Department', exact: true })).toBeVisible();

            // Select Sub-Organization, then Department, then back to Organization
            await page.getByRole('option', { name: 'Sub-Organization', exact: true }).click();
            await expect(casesPage.ownerSelect).toContainText('Sub-Organization');

            await casesPage.ownerSelect.click();
            await page.getByRole('option', { name: 'Department', exact: true }).click();
            await expect(casesPage.ownerSelect).toContainText('Department');

            await casesPage.ownerSelect.click();
            await page.getByRole('option', { name: 'Organization', exact: true }).click();
            await expect(casesPage.ownerSelect).toContainText('Organization');

            await casesPage.cancel();
        });

        test('TC030D: Verify Matter details and Additional details elements', async () => {
            await casesPage.openCreateCaseForm();
            await casesPage.expandMatterDetails();

            // Matter details: Court / Jurisdiction, Matter Type
            await expect(casesPage.createDialog.getByText('Court / Jurisdiction', { exact: true })).toBeVisible();
            await expect(casesPage.courtJurisdictionInput).toBeVisible();
            await expect(casesPage.courtJurisdictionInput).toHaveAttribute('placeholder', 'e.g., Superior Court of Cook County');

            await expect(casesPage.createDialog.getByText('Matter Type', { exact: true })).toBeVisible();
            await expect(casesPage.matterTypeSelect).toBeVisible();

            // Additional details: Client / Firm, Opposing Party, Hearing / Deposition Date
            await expect(casesPage.createDialog.getByText('Client / Firm', { exact: true })).toBeVisible();
            await expect(casesPage.clientFirmInput).toBeVisible();

            await expect(casesPage.createDialog.getByText('Opposing Party', { exact: true })).toBeVisible();
            await expect(casesPage.opposingPartyInput).toBeVisible();

            await expect(casesPage.createDialog.getByText(/Hearing \/ Deposition Date/i)).toBeVisible();
            await expect(casesPage.hearingDateInput).toBeVisible();

            // Fill sample data
            await casesPage.courtJurisdictionInput.fill('Superior Court of California');
            await casesPage.clientFirmInput.fill('Apex Law Partners');
            await casesPage.opposingPartyInput.fill('Global Enterprises Inc');
            await casesPage.hearingDateInput.fill('2026-12-15');

            await expect(casesPage.courtJurisdictionInput).toHaveValue('Superior Court of California');
            await expect(casesPage.clientFirmInput).toHaveValue('Apex Law Partners');
            await expect(casesPage.opposingPartyInput).toHaveValue('Global Enterprises Inc');

            await casesPage.cancel();
        });

        test('TC030E: Verify Matter Type dropdown options (Civil, Criminal, Deposition, Arbitration, Other)', async () => {
            await casesPage.openCreateCaseForm();
            await casesPage.expandMatterDetails();

            await casesPage.matterTypeSelect.click();
            const listbox = page.locator('[role="listbox"]');
            await expect(listbox).toBeVisible();

            // Verify all 5 options shown
            const matterTypes = ['Civil', 'Criminal', 'Deposition', 'Arbitration', 'Other'];
            for (const type of matterTypes) {
                await expect(page.getByRole('option', { name: type, exact: true })).toBeVisible();
            }

            // Select Deposition option
            await page.getByRole('option', { name: 'Deposition', exact: true }).click();
            await expect(casesPage.matterTypeSelect).toContainText('Deposition');

            await casesPage.cancel();
        });

        test('TC030F: Verify Modal Actions: Close, Cancel, and button enablement states', async () => {
            await casesPage.openCreateCaseForm();

            // Initial button states: Create buttons disabled until required fields are filled
            await expect(casesPage.createCaseButton).toBeDisabled();
            await expect(casesPage.createAndOpenButton).toBeDisabled();
            await expect(casesPage.cancelButton).toBeEnabled();

            // Verify Close (X) button dismisses the dialog
            await casesPage.closeCreateDialog();
            await expect(casesPage.createDialog).toBeHidden();

            // Reopen and verify Cancel button dismisses the dialog
            await casesPage.openCreateCaseForm();
            await casesPage.caseNameInput.fill('Test Dismissal Case');
            await casesPage.cancel();
            await expect(casesPage.createDialog).toBeHidden();
        });

        test('TC030G: Verify Create & Open action navigates directly to case details', async () => {
            const openStamp = `${Date.now()}_Open`;
            const openCaseName = `Case_${openStamp}`;
            const openCaseNumber = `CN-${openStamp}`;

            await casesPage.openCreateCaseForm();
            await casesPage.fillCaseDetails({
                name: openCaseName,
                description: 'Full section verification case',
                number: openCaseNumber,
                venue: 'State of Illinois',
                product,
                owner: 'Organization',
                court: 'Superior Court of Cook County',
                matterType: 'Deposition',
                clientFirm: 'Acme Legal LLC',
                opposingParty: 'Universal Corp',
                hearingDate: '2026-12-20'
            });

            await expect(casesPage.createAndOpenButton).toBeEnabled();
            await casesPage.submitCreateAndOpen();
            await expect(casesPage.createDialog).toBeHidden();

            // Verify direct navigation to Case Details view
            await expect(page).toHaveURL(/\/cases\/[a-f0-9-]+/i, { timeout: 15000 });
            await expect(page.getByText(openCaseName).first()).toBeVisible({ timeout: 10000 });

            // Navigate back to Cases
            await casesPage.goto();
            await casesPage.search(openCaseName);
            await expect(casesPage.rowFor(openCaseName)).toBeVisible();
        });

        test('TC031: Create case with valid details', async () => {
            await casesPage.openCreateCaseForm();
            await casesPage.fillCaseDetails({
                name: caseName,
                description: 'Created by Playwright automation',
                number: caseNumber,
                venue: 'State of California',
                product,
            });
            await expect(casesPage.createCaseButton).toBeEnabled();
            await casesPage.submitCreate();
            await expect(casesPage.createDialog).toBeHidden();

            await casesPage.search(caseName);
            await expect(casesPage.rowFor(caseName)).toBeVisible();
        });

        test('TC032: Create case without case name', async () => {
            await casesPage.openCreateCaseForm();
            await casesPage.fillCaseDetails({ description: 'No name', product });
            await expect(casesPage.createCaseButton).toBeDisabled();
        });

        test('TC033: Create case without product', async () => {
            await casesPage.openCreateCaseForm();
            await casesPage.fillCaseDetails({ name: `${caseName}_NoProduct`, description: 'No product' });
            await expect(casesPage.createCaseButton).toBeDisabled();
        });

        test('TC034: Verify case number', async () => {
            await casesPage.search(caseNumber);
            await expect(casesPage.rowFor(caseName)).toContainText(caseNumber);
        });

        test('TC035: Verify case title', async () => {
            await casesPage.search(caseName);
            await expect(casesPage.rowFor(caseName).getByText(caseName, { exact: true })).toBeVisible();
        });

        test('TC036: Verify case type selection', async () => {
            await casesPage.openCreateCaseForm();
            await casesPage.selectMatterType('Civil');
            await expect(casesPage.matterTypeSelect).toHaveText('Civil');
        });

        test('TC037: Verify date field', async () => {
            await casesPage.openCreateCaseForm();
            await casesPage.expandMatterDetails();
            await casesPage.hearingDateInput.fill('2026-11-20');
            await expect(casesPage.hearingDateInput).toHaveValue('2026-11-20');
        });

        test('TC038: Create case without description', async () => {
            await casesPage.openCreateCaseForm();
            await casesPage.fillCaseDetails({ name: `${caseName}_NoDescription`, product });
            await expect(casesPage.createCaseButton).toBeDisabled();
        });

        test('TC039: Create duplicate case', async () => {
            await casesPage.openCreateCaseForm();
            await casesPage.fillCaseDetails({ name: caseName, description: 'Duplicate', product });
            await expect(casesPage.duplicateNameError).toBeVisible();
            await expect(casesPage.createCaseButton).toBeDisabled();
        });

        test('TC040: Cancel case creation', async () => {
            const cancelledName = `${caseName}_Cancelled`;
            await casesPage.openCreateCaseForm();
            await casesPage.fillCaseDetails({ name: cancelledName, description: 'Should not be saved' });
            await casesPage.cancel();
            await expect(casesPage.createDialog).toBeHidden();

            await casesPage.search(cancelledName);
            await expect(casesPage.noDataMessage).toBeVisible();
        });

        test('TC041: Open created case', async () => {
            await casesPage.search(caseName);
            await casesPage.openCase(caseName);
            await expect(page).toHaveURL(/\/cases\/[\w-]+$/i);
            await expect(page.getByRole('heading', { name: caseName, level: 1 })).toBeVisible();
        });

        test('TC042: Edit created case', async () => {
            // Ensure target case exists for editing (handles both standalone -g "TC042" and full suite runs)
            await casesPage.search(caseName);
            if (await casesPage.rowFor(caseName).count() === 0) {
                await casesPage.openCreateCaseForm();
                await casesPage.fillCaseDetails({
                    name: caseName,
                    description: 'Automated test case for TC042 edit verification',
                    number: caseNumber,
                    product
                });
                await casesPage.submitCreate();
                await expect(casesPage.createDialog).toBeHidden();
                await casesPage.search(caseName);
            }
            await expect(casesPage.rowFor(caseName)).toBeVisible();

            // 1. Open Edit Case modal and verify headers & close control
            await casesPage.openEditCaseForm(caseName);
            await expect(casesPage.editDialog).toBeVisible();
            await expect(casesPage.editDialogHeading).toBeVisible();
            await expect(casesPage.editCloseButton).toBeVisible();

            // 2. Verify all field labels
            await expect(casesPage.editDialog.getByText('Case Name', { exact: true })).toBeVisible();
            await expect(casesPage.editDialog.getByText('Case Number', { exact: true })).toBeVisible();
            await expect(casesPage.editDialog.getByText('Venue Location', { exact: true })).toBeVisible();
            await expect(casesPage.editDialog.getByText('Description', { exact: true })).toBeVisible();
            await expect(casesPage.editDialog.getByText('Status', { exact: true })).toBeVisible();
            await expect(casesPage.editDialog.getByText('Court / Jurisdiction', { exact: true })).toBeVisible();
            await expect(casesPage.editDialog.getByText('Matter Type', { exact: true })).toBeVisible();
            await expect(casesPage.editDialog.getByText('Client / Firm', { exact: true })).toBeVisible();
            await expect(casesPage.editDialog.getByText('Opposing Party', { exact: true })).toBeVisible();
            await expect(casesPage.editDialog.getByText('Hearing Date', { exact: true })).toBeVisible();

            // 3. Verify all inputs are visible and prefilled
            await expect(casesPage.editCaseNameInput).toBeVisible();
            await expect(casesPage.editCaseNumberInput).toBeVisible();
            await expect(casesPage.editVenueInput).toBeVisible();
            await expect(casesPage.editDescriptionInput).toBeVisible();
            await expect(casesPage.editCourtJurisdictionInput).toBeVisible();
            await expect(casesPage.editClientFirmInput).toBeVisible();
            await expect(casesPage.editOpposingPartyInput).toBeVisible();
            await expect(casesPage.editHearingDateInput).toBeVisible();

            // 4. Verify Status dropdown and all options (Active, Closed, Archived)
            await expect(casesPage.editStatusSelect).toBeVisible();
            await casesPage.editStatusSelect.click();
            const statusListbox = page.locator('[role="listbox"]');
            await expect(statusListbox).toBeVisible();
            await expect(page.getByRole('option', { name: 'Active', exact: true })).toBeVisible();
            await expect(page.getByRole('option', { name: 'Closed', exact: true })).toBeVisible();
            await expect(page.getByRole('option', { name: 'Archived', exact: true })).toBeVisible();
            await page.getByRole('option', { name: 'Active', exact: true }).click();
            await expect(statusListbox).toBeHidden();
            await expect(casesPage.editStatusSelect).toContainText('Active');

            // 5. Verify Matter Type dropdown and all options (Civil, Criminal, Deposition, Arbitration, Other)
            await expect(casesPage.editMatterTypeSelect).toBeVisible();
            await casesPage.editMatterTypeSelect.click();
            const matterListbox = page.locator('[role="listbox"]');
            await expect(matterListbox).toBeVisible();
            const matterTypes = ['Civil', 'Criminal', 'Deposition', 'Arbitration', 'Other'];
            for (const type of matterTypes) {
                await expect(page.getByRole('option', { name: type, exact: true })).toBeVisible();
            }
            await page.getByRole('option', { name: 'Deposition', exact: true }).click();
            await expect(matterListbox).toBeHidden();
            await expect(casesPage.editMatterTypeSelect).toContainText('Deposition');

            // 6. Edit form fields
            await casesPage.editCaseNameInput.fill(updatedCaseName);
            await casesPage.editVenueInput.fill('State of California');
            await casesPage.editCourtJurisdictionInput.fill('Superior Court of California');
            await casesPage.editClientFirmInput.fill('Apex Law Partners');
            await casesPage.editOpposingPartyInput.fill('Global Enterprises Inc');
            await casesPage.editHearingDateInput.fill('2026-12-15');

            // 7. Verify Save Changes button and submit
            await expect(casesPage.saveChangesButton).toBeVisible();
            await expect(casesPage.saveChangesButton).toBeEnabled();
            await casesPage.saveChangesButton.click();
            await expect(casesPage.editDialog).toBeHidden();

            // 8. Verify the updated case appears in the listing
            await casesPage.search(updatedCaseName);
            await expect(casesPage.rowFor(updatedCaseName)).toBeVisible();
        });

        test('TC043: Search for created case', async () => {
            await casesPage.search(updatedCaseName);
            await expect(casesPage.caseRows).toHaveCount(1);
            await expect(casesPage.rowFor(updatedCaseName)).toBeVisible();

            await casesPage.search(`no_match_${stamp}`);
            await expect(casesPage.noDataMessage).toBeVisible();
        });

        test('TC044: Verify case after refresh', async () => {
            await page.reload({ waitUntil: 'domcontentloaded' });
            await expect(casesPage.heading).toBeVisible();
            await casesPage.search(updatedCaseName);
            await expect(casesPage.rowFor(updatedCaseName)).toBeVisible();
        });

});

       test('TC045: Delete created case', async () => {
    await casesPage.goto();

    // Search for the updated case
    await casesPage.search(updatedCaseName);

    const row = page.locator('table tbody tr')
        .filter({ hasText: updatedCaseName });

    await expect(row).toBeVisible();

    // Click Delete
    await row.getByRole('button', { name: 'Delete' }).click();

    // Verify confirmation dialog
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible();

    // Enter exact case name
    const confirmationInput = dialog.locator('input');
    await confirmationInput.fill(updatedCaseName);

    // Confirm deletion
    await dialog.getByRole('button', { name: 'Delete', exact: true }).click();

    // Verify deleted case is no longer visible
    await expect(row).toHaveCount(0);
    });
});


