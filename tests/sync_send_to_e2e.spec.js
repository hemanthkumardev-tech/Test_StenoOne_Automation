const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const LoginPage = require('../pages/Login');
const JobsPage = require('../pages/Jobs');
const SyncGeneratorPage = require('../pages/SyncGenerator');

test.describe.configure({ mode: 'serial' });

test.describe('Sync Generator – Send To Publication & Recipient Distribution Flow', () => {
    /** @type {import('@playwright/test').BrowserContext} */
    let context;
    /** @type {import('@playwright/test').Page} */
    let page;
    let loginPage;
    let jobsPage;
    let syncPage;

    // Target job ID: default to the completed Sullivan sync job from user screenshots
    const targetJobId = process.env.SYNC_TARGET_JOB_ID || 'dd14d82d-0e78-4b22-8806-dc6ffd6198de';
    const jobUrl = `https://dev.steno.one/jobs/${targetJobId}`;

    async function ensureAuthenticated() {
        const authPath = path.join(__dirname, '..', '.auth', 'sync_admin.json');
        await page.goto('https://dev.steno.one/cases', { waitUntil: 'domcontentloaded', timeout: 35000 });
        await page.waitForTimeout(2000);

        if (page.url().includes('/login')) {
            console.log('[AUTH] Session expired, logging in as sync admin...');
            const email = (process.env.SYNC_ADMIN_EMAIL || '').trim();
            const password = (process.env.SYNC_ADMIN_PASSWORD || '').trim();
            if (!email || !password) {
                throw new Error('SYNC_ADMIN_EMAIL or SYNC_ADMIN_PASSWORD missing in .env');
            }
            await loginPage.navigateToLoginPage();
            await loginPage.enterEmail(email);
            await loginPage.enterPassword(password);
            await loginPage.clickSignIn();
            await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 20000 });
            await context.storageState({ path: authPath });
        }
        expect(page.url()).not.toContain('/login');
    }

    test.beforeAll(async ({ browser }) => {
        const authPath = path.join(__dirname, '..', '.auth', 'sync_admin.json');
        if (fs.existsSync(authPath)) {
            context = await browser.newContext({ storageState: authPath });
        } else {
            context = await browser.newContext();
        }

        page = await context.newPage();
        loginPage = new LoginPage(page);
        jobsPage = new JobsPage(page);
        syncPage = new SyncGeneratorPage(page);

        await ensureAuthenticated();
    });

    test.afterAll(async () => {
        if (context) {
            await context.close();
        }
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Test 1: Navigate to Job Details and open Sync Generator Editor
    // ─────────────────────────────────────────────────────────────────────────
    test('ST001: Navigate to Job Details and open Sync Generator Editor', async () => {
        test.setTimeout(60000);
        console.log(`[ST001] Navigating to Job Details: ${jobUrl}`);
        await page.goto(jobUrl, { waitUntil: 'domcontentloaded', timeout: 35000 });
        await page.waitForTimeout(2000);

        // Verify Job Details header & sections
        await expect(jobsPage.syncGeneratorHeading).toBeVisible({ timeout: 20000 });
        await expect(jobsPage.openSyncGeneratorButton).toBeVisible();

        // Click Open Sync Generator to navigate to Editor
        console.log('[ST001] Clicking Open Sync Generator...');
        await jobsPage.openSyncGeneratorButton.click();
        await page.waitForURL(/\/sync-generator\/[a-f0-9-]+\/(edit|setup)/i, { timeout: 25000 });

        // If at setup with Open Editor button, click it
        if (page.url().includes('/setup')) {
            const openEditorLink = syncPage.openEditorButton;
            if (await openEditorLink.isVisible({ timeout: 5000 }).catch(() => false)) {
                await openEditorLink.click();
                await page.waitForURL(/\/edit/i, { timeout: 20000 });
            }
        }

        expect(page.url()).toContain('/edit');
        console.log(`[ST001] Reached Sync Generator Editor: ${page.url()}`);
        await expect(syncPage.editorTitle).toBeVisible();
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Test 2: Click Approve button and confirm Finalize in modal dialog
    // ─────────────────────────────────────────────────────────────────────────
    test('ST002: Click Approve button and confirm Finalize in modal dialog', async () => {
        test.setTimeout(60000);
        const approveBtn = syncPage.editorApproveButton;
        const isApproveVisible = await approveBtn.isVisible({ timeout: 5000 }).catch(() => false);

        if (isApproveVisible) {
            console.log('[ST002] Approve button is visible, clicking Approve...');
            await approveBtn.click();

            // Verify Finalize AlertDialog
            await expect(syncPage.finalizeDialog).toBeVisible({ timeout: 10000 });
            await expect(syncPage.finalizeHeading).toBeVisible();
            await expect(syncPage.finalizeDescription).toBeVisible();
            await expect(syncPage.finalizeConfirmButton).toBeVisible();
            await expect(syncPage.finalizeCancelButton).toBeVisible();

            console.log('[ST002] Finalize dialog verified, clicking Finalize...');
            await syncPage.finalizeConfirmButton.click();
            await expect(syncPage.finalizeDialog).toBeHidden({ timeout: 15000 });
            console.log('[ST002] Finalize confirmed successfully.');
        } else {
            console.log('[ST002] Job was previously approved and finalized. Verifying editor state...');
            await expect(syncPage.editorExportButton).toBeVisible();
            await expect(approveBtn).toBeHidden();
        }
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Test 3: Return to Job Details, verify Artifacts publication notice and enabled Send To button
    // ─────────────────────────────────────────────────────────────────────────
    test('ST003: Return to Job Details, verify Artifacts status and enabled Send To button', async () => {
        test.setTimeout(60000);
        console.log(`[ST003] Returning to Job Details: ${jobUrl}`);
        await page.goto(jobUrl, { waitUntil: 'domcontentloaded', timeout: 35000 });
        await page.waitForTimeout(3000);

        // Verify Artifacts heading and deliverables
        await expect(jobsPage.artifactsHeading).toBeVisible({ timeout: 20000 });
        const artifactsText = await jobsPage.artifactsHeading.innerText();
        console.log(`[ST003] Artifacts heading: "${artifactsText}"`);

        // Verify publication message and enabled Send To button
        await expect(jobsPage.sendToNoticeReady).toBeVisible({ timeout: 15000 });
        await expect(jobsPage.sendToButton).toBeVisible();
        await expect(jobsPage.sendToButton).toBeEnabled();
        console.log('[ST003] Send To button is enabled and publication notice verified.');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Test 4: Click Send To button, verify link generation, and verify Send To modal dialog
    // ─────────────────────────────────────────────────────────────────────────
    test('ST004: Click Send To button, verify link generation, and verify Send To modal dialog', async () => {
        test.setTimeout(60000);
        console.log('[ST004] Clicking Send To button...');
        await jobsPage.sendToButton.click();

        // Verify Send To modal opens
        await expect(jobsPage.sendToDialog).toBeVisible({ timeout: 15000 });
        await expect(jobsPage.sendToHeading).toBeVisible();
        await expect(jobsPage.sendToHeading).toContainText('Send To');

        // Verify Job / Deposition Information section
        await expect(jobsPage.sendToDepositionInfo).toBeVisible();
        await expect(jobsPage.sendToDialog.getByText('Case Name', { exact: true })).toBeVisible();
        await expect(jobsPage.sendToDialog.getByText('Deponent', { exact: true })).toBeVisible();
        await expect(jobsPage.sendToDialog.getByText('Deposition Date', { exact: true })).toBeVisible();
        await expect(jobsPage.sendToDialog.getByText('Job / Ref', { exact: true })).toBeVisible();
        await expect(jobsPage.sendToDialog.getByText('Product', { exact: true })).toBeVisible();

        console.log('[ST004] Send To modal dialog opened and Job Information section verified.');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Test 5: Fill and verify Send Configuration fields, select dropdowns, and Access Link options
    // ─────────────────────────────────────────────────────────────────────────
    test('ST005: Fill and verify Send Configuration fields, dropdowns, and Access Link options', async () => {
        test.setTimeout(60000);
        await expect(jobsPage.sendConfigurationHeading).toBeVisible();

        // 1. Email Template & Preview button
        await expect(jobsPage.emailTemplateCombobox).toBeVisible();
        await expect(jobsPage.emailPreviewButton).toBeVisible();
        console.log('[ST005] Email Template combobox and Preview button verified.');

        // 2. Access Type combobox: Full Access Link & View Only Link
        await expect(jobsPage.accessTypeCombobox).toBeVisible();
        const initialAccessText = await jobsPage.accessTypeCombobox.innerText();
        console.log(`[ST005] Access Type initial: "${initialAccessText.trim()}"`);
        expect(initialAccessText).toContain('Full Access Link');

        // Open Access Type dropdown and verify both options
        await jobsPage.accessTypeCombobox.click();
        await expect(jobsPage.accessTypeOptions.filter({ hasText: /Full Access Link/i }).first()).toBeVisible({ timeout: 5000 });
        await expect(jobsPage.accessTypeOptions.filter({ hasText: /View Only Link/i }).first()).toBeVisible({ timeout: 5000 });

        // Select View Only Link
        await jobsPage.accessTypeOptions.filter({ hasText: /View Only Link/i }).first().click();
        await page.waitForTimeout(500);
        await expect(jobsPage.accessTypeCombobox).toContainText('View Only Link');
        console.log('[ST005] Selected "View Only Link" successfully.');

        // Switch back to Full Access Link
        await jobsPage.accessTypeCombobox.click();
        await jobsPage.accessTypeOptions.filter({ hasText: /Full Access Link/i }).first().click();
        await page.waitForTimeout(500);
        await expect(jobsPage.accessTypeCombobox).toContainText('Full Access Link');
        console.log('[ST005] Switched back to "Full Access Link" successfully.');

        // 3. Files To Send formats button
        await expect(jobsPage.filesToSendButton).toBeVisible();
        const formatsText = await jobsPage.filesToSendButton.innerText();
        console.log(`[ST005] Files To Send button label: "${formatsText.trim()}"`);
        await jobsPage.filesToSendButton.click();
        await expect(jobsPage.filesToSendMenuItems.first()).toBeVisible({ timeout: 5000 });
        const formatCount = await jobsPage.filesToSendMenuItems.count();
        expect(formatCount).toBeGreaterThan(0);
        console.log(`[ST005] Files To Send formats menu verified with ${formatCount} options.`);
        await page.keyboard.press('Escape');

        // 4. Default Send Date & Time inputs
        await expect(jobsPage.sendDateInput).toBeVisible();
        await expect(jobsPage.sendTimeInput).toBeVisible();
        const sendDateVal = await jobsPage.sendDateInput.inputValue();
        const sendTimeVal = await jobsPage.sendTimeInput.inputValue();
        expect(sendDateVal).toBeTruthy();
        expect(sendTimeVal).toBeTruthy();
        console.log(`[ST005] Default Send Date & Time verified: ${sendDateVal} ${sendTimeVal}`);

        // 5. Default Expiration Date input
        await expect(jobsPage.expirationDateInput).toBeVisible();
        await expect(jobsPage.expirationHelperText).toBeVisible();
        await jobsPage.expirationDateInput.fill('2026-12-31');
        expect(await jobsPage.expirationDateInput.inputValue()).toBe('2026-12-31');
        console.log('[ST005] Default Expiration Date set to 2026-12-31.');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Test 6: Test Add Group modal and options
    // ─────────────────────────────────────────────────────────────────────────
    test('ST006: Test Add Group modal and options', async () => {
        test.setTimeout(60000);
        await expect(jobsPage.addGroupButton).toBeVisible();
        console.log('[ST006] Clicking Add Group button...');
        await jobsPage.addGroupButton.click();

        // Verify Add Group modal opens
        await expect(jobsPage.addGroupDialog).toBeVisible({ timeout: 10000 });
        console.log('[ST006] Add Group dialog opened successfully.');

        // Close Add Group modal
        await jobsPage.closeAddGroupModal();
        await expect(jobsPage.addGroupDialog).toBeHidden({ timeout: 10000 });
        console.log('[ST006] Add Group dialog dismissed cleanly.');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Test 7: Test Add Recipient modal, verify placeholders, fill fields, and submit
    // ─────────────────────────────────────────────────────────────────────────
    test('ST007: Test Add Recipient modal, verify placeholders, fill fields, and submit', async () => {
        test.setTimeout(60000);
        await expect(jobsPage.addRecipientButton).toBeVisible();
        console.log('[ST007] Clicking Add Recipient button...');
        await jobsPage.addRecipientButton.click();

        // Verify Add Recipient nested modal opens
        await expect(jobsPage.addRecipientDialog).toBeVisible({ timeout: 10000 });

        // Verify required elements and placeholders
        await expect(jobsPage.recipientFirstNameInput).toBeVisible();
        await expect(jobsPage.recipientFirstNameInput).toHaveAttribute('placeholder', 'First name');

        await expect(jobsPage.recipientLastNameInput).toBeVisible();
        await expect(jobsPage.recipientLastNameInput).toHaveAttribute('placeholder', 'Last name');

        await expect(jobsPage.recipientEmailInput).toBeVisible();
        await expect(jobsPage.recipientEmailInput).toHaveAttribute('placeholder', 'user@lawfirm.com');

        await expect(jobsPage.recipientGroupCombobox).toBeVisible();
        await expect(jobsPage.recipientGroupCombobox).toContainText('None (Ungrouped)');

        await expect(jobsPage.submitAddRecipientButton).toBeVisible();
        await expect(jobsPage.cancelAddRecipientButton).toBeVisible();
        console.log('[ST007] All Add Recipient fields and placeholders verified.');

        // Fill in recipient details
        const testEmail = `automation.user.${Date.now()}@lawfirm.com`;
        await jobsPage.recipientFirstNameInput.fill('Sarah');
        await jobsPage.recipientLastNameInput.fill('Connor');
        await jobsPage.recipientEmailInput.fill(testEmail);

        console.log(`[ST007] Submitting Add Recipient for ${testEmail}...`);
        await jobsPage.submitAddRecipientButton.click();
        await page.waitForTimeout(1500);

        // Verify recipient was added to the Recipients table in Send To modal
        await expect(jobsPage.recipientsTable).toBeVisible();
        const recipientRow = jobsPage.recipientsRows.filter({ hasText: testEmail }).first();
        await expect(recipientRow).toBeVisible({ timeout: 10000 });
        await expect(recipientRow).toContainText('Sarah Connor');
        await expect(recipientRow).toContainText(testEmail);
        console.log(`[ST007] Recipient "Sarah Connor" (${testEmail}) successfully added to Recipients table.`);
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Test 8: Verify Send To modal actions (Cancel / Send)
    // ─────────────────────────────────────────────────────────────────────────
    test('ST008: Verify Send To modal actions and clean dismissal', async () => {
        test.setTimeout(60000);
        await expect(jobsPage.sendToCancelButton).toBeVisible();
        await expect(jobsPage.sendToSubmitButton).toBeVisible();
        console.log('[ST008] Cancel and Send action buttons verified.');

        // Dismiss the Send To modal cleanly
        console.log('[ST008] Dismissing Send To modal via Cancel button...');
        await jobsPage.sendToCancelButton.click();
        await expect(jobsPage.sendToDialog).toBeHidden({ timeout: 10000 });
        console.log('[ST008] Send To modal dismissed cleanly.');
    });
});
