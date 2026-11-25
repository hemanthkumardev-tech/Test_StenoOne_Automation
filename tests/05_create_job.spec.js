const { test, expect } = require('@playwright/test');
const LoginPage = require('../pages/Login');
const DashboardPage = require('../pages/Dashboard');
const CasesPage = require('../pages/Cases');
const JobsPage = require('../pages/Jobs');

// All tests share one logged-in page and run in sequence in a single worker.
test.describe.configure({ mode: 'default' });

test.describe('Module 5: Create Job (TC045 - TC058)', () => {
    /** @type {import('@playwright/test').Page} */
    let page;
    let dashboardPage;
    let casesPage;
    let jobsPage;

    const stamp = process.env.TEST_RUN_ID || Date.now().toString();
    const caseName = `JobCase_${stamp}`;
    const caseNumber = `CN-JOB-${stamp}`;
    const jobName = `Job_${stamp}`;
    const jobRef = `REF-${stamp}`;

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        dashboardPage = new DashboardPage(page);
        casesPage = new CasesPage(page);
        jobsPage = new JobsPage(page);

        // Authenticate
        const loginPage = new LoginPage(page);
        await loginPage.navigateToLoginPage();
        await loginPage.login(process.env.STENO_EMAIL, process.env.STENO_PASSWORD);
        await expect(page).not.toHaveURL(/\/login(?:[/?#]|$)/, { timeout: 15000 });

        // Navigate to Cases and ensure a dedicated case exists for job testing
        await casesPage.goto();
        await casesPage.openCreateCaseForm();
        await casesPage.fillCaseDetails({
            name: caseName,
            description: 'Dedicated case for Create Job suite validation',
            number: caseNumber,
            venue: 'State of California',
            product: /^Publish/
        });
        await casesPage.submitCreateAndOpen();
        await expect(casesPage.createDialog).toBeHidden();

        // Ensure we are on the Case Details page
        await expect(page).toHaveURL(/\/cases\/[a-f0-9-]+/i, { timeout: 15000 });
        await expect(page.getByText(caseName).first()).toBeVisible({ timeout: 10000 });
    });

    test.afterAll(async () => {
        await page?.close();
    });

    test('TC045: Verify Jobs section in Case Details view', async () => {
        await expect(jobsPage.jobsHeading).toBeVisible();
        await expect(jobsPage.searchJobsInput).toBeVisible();
        await expect(jobsPage.newJobButton).toBeVisible();
        await expect(jobsPage.jobsTable).toBeVisible();

        // Verify Jobs table column headers
        await expect(jobsPage.jobsTable.getByRole('columnheader', { name: 'Name', exact: true })).toBeVisible();
        await expect(jobsPage.jobsTable.getByRole('columnheader', { name: 'Ref', exact: true })).toBeVisible();
        await expect(jobsPage.jobsTable.getByRole('columnheader', { name: 'Category', exact: true })).toBeVisible();
        await expect(jobsPage.jobsTable.getByRole('columnheader', { name: 'Status', exact: true })).toBeVisible();
        await expect(jobsPage.jobsTable.getByRole('columnheader', { name: 'Artifacts', exact: true })).toBeVisible();
        await expect(jobsPage.jobsTable.getByRole('columnheader', { name: 'Created', exact: true })).toBeVisible();
    });

    test('TC046: Open Create Job modal and verify all section labels, placeholders, and action controls', async () => {
        await jobsPage.openCreateJobModal();

        // Dialog Header, Subtitle & Close (X)
        await expect(jobsPage.createJobDialog).toBeVisible();
        await expect(jobsPage.createJobHeading).toBeVisible();
        await expect(jobsPage.createJobSubtitle).toBeVisible();
        await expect(jobsPage.closeDialogButton).toBeVisible();

        // Required field labels (with red asterisks)
        await expect(jobsPage.createJobDialog.getByText('Job Name *')).toBeVisible();
        await expect(jobsPage.createJobDialog.getByText('Category *')).toBeVisible();
        await expect(jobsPage.createJobDialog.getByText('Client Job Ref *')).toBeVisible();

        // Optional field labels
        await expect(jobsPage.createJobDialog.getByText('Description', { exact: true })).toBeVisible();
        await expect(jobsPage.createJobDialog.getByText('Scheduled Date/Time', { exact: true })).toBeVisible();
        await expect(jobsPage.createJobDialog.getByText('Mode', { exact: true })).toBeVisible();
        await expect(jobsPage.createJobDialog.getByText('Witness Name', { exact: true })).toBeVisible();

        // Collapsible accordion button
        await expect(jobsPage.detailsToggle).toBeVisible();

        // Placeholders & Inputs
        await expect(jobsPage.jobNameInput).toBeVisible();
        await expect(jobsPage.jobNameInput).toHaveAttribute('placeholder', 'e.g., Smith Deposition — Volume 1');

        await expect(jobsPage.categorySelect).toBeVisible();
        await expect(jobsPage.categorySelect).toContainText('Select category');

        await expect(jobsPage.clientJobRefInput).toBeVisible();
        await expect(jobsPage.clientJobRefInput).toHaveAttribute('placeholder', 'e.g., CAPTURE-J-0091');

        await expect(jobsPage.descriptionInput).toBeVisible();
        await expect(jobsPage.scheduledDateTimeInput).toBeVisible();

        await expect(jobsPage.modeSelect).toBeVisible();
        await expect(jobsPage.modeSelect).toContainText('Select mode');

        await expect(jobsPage.witnessNameInput).toBeVisible();
        await expect(jobsPage.witnessNameInput).toHaveAttribute('placeholder', 'e.g., Jane Doe');

        // Action Buttons
        await expect(jobsPage.cancelButton).toBeVisible();
        await expect(jobsPage.createJobSubmitButton).toBeVisible();

        // Close modal cleanly via Close (X) button
        await jobsPage.closeCreateJobModal();
        await expect(jobsPage.createJobDialog).toBeHidden();
    });

    test('TC047: Verify Category dropdown and all options (Deposition, Examination, Public Hearing, Trial, Other)', async () => {
        await jobsPage.openCreateJobModal();

        await jobsPage.categorySelect.click();
        const listbox = page.locator('[role="listbox"]');
        await expect(listbox).toBeVisible();

        // Verify all 5 Category options shown in UI
        const categories = ['Deposition', 'Examination', 'Public Hearing', 'Trial', 'Other'];
        for (const cat of categories) {
            await expect(page.getByRole('option', { name: cat, exact: true })).toBeVisible();
        }

        // Select Deposition option
        await page.getByRole('option', { name: 'Deposition', exact: true }).click();
        await expect(listbox).toBeHidden();
        await expect(jobsPage.categorySelect).toContainText('Deposition');

        await jobsPage.cancel();
        await expect(jobsPage.createJobDialog).toBeHidden();
    });

    test('TC048: Verify Mode dropdown and all options (In Person, Remote, Hybrid)', async () => {
        await jobsPage.openCreateJobModal();

        await jobsPage.modeSelect.click();
        const listbox = page.locator('[role="listbox"]');
        await expect(listbox).toBeVisible();

        // Verify all 3 Mode options shown in UI
        const modes = ['In Person', 'Remote', 'Hybrid'];
        for (const m of modes) {
            await expect(page.getByRole('option', { name: m, exact: true })).toBeVisible();
        }

        // Select Remote option
        await page.getByRole('option', { name: 'Remote', exact: true }).click();
        await expect(listbox).toBeHidden();
        await expect(jobsPage.modeSelect).toContainText('Remote');

        await jobsPage.cancel();
        await expect(jobsPage.createJobDialog).toBeHidden();
    });

    test('TC049: Verify Details (optional) collapsible section elements and Assigned Reporter dropdown', async () => {
        await jobsPage.openCreateJobModal();
        await jobsPage.expandDetails();

        // Verify expanded field labels
        await expect(jobsPage.createJobDialog.getByText('Location', { exact: true })).toBeVisible();
        await expect(jobsPage.createJobDialog.getByText('Assigned Reporter', { exact: true })).toBeVisible();
        await expect(jobsPage.createJobDialog.getByText('Estimated Duration (minutes)', { exact: true })).toBeVisible();
        await expect(jobsPage.createJobDialog.getByText('Notes', { exact: true })).toBeVisible();

        // Verify expanded inputs and placeholders
        await expect(jobsPage.locationInput).toBeVisible();
        await expect(jobsPage.locationInput).toHaveAttribute('placeholder', 'Address or meeting link');

        await expect(jobsPage.assignedReporterSelect).toBeVisible();
        await expect(jobsPage.durationInput).toBeVisible();
        await expect(jobsPage.notesInput).toBeVisible();

        // Open Assigned Reporter dropdown
        await jobsPage.assignedReporterSelect.click();
        const listbox = page.locator('[role="listbox"]');
        await expect(listbox).toBeVisible();
        // Close listbox by clicking trigger again or pressing Escape
        await page.keyboard.press('Escape');

        await jobsPage.cancel();
        await expect(jobsPage.createJobDialog).toBeHidden();
    });

    test('TC050: Verify Create Job button validation and enablement rules', async () => {
        await jobsPage.openCreateJobModal();

        // Initially disabled
        await expect(jobsPage.createJobSubmitButton).toBeDisabled();
        await expect(jobsPage.cancelButton).toBeEnabled();

        // 1. Enter Job Name only -> still disabled
        await jobsPage.jobNameInput.fill('Validation Test Job');
        await expect(jobsPage.createJobSubmitButton).toBeDisabled();

        // 2. Select Category -> still disabled
        await jobsPage.selectCategory('Deposition');
        await expect(jobsPage.createJobSubmitButton).toBeDisabled();

        // 3. Enter Client Job Ref -> now enabled!
        await jobsPage.clientJobRefInput.fill('REF-VALID-01');
        await expect(jobsPage.createJobSubmitButton).toBeEnabled();

        // 4. Clear Client Job Ref -> becomes disabled again
        await jobsPage.clientJobRefInput.fill('');
        await expect(jobsPage.createJobSubmitButton).toBeDisabled();

        await jobsPage.cancel();
        await expect(jobsPage.createJobDialog).toBeHidden();
    });

    test('TC051: Verify modal dismissal via Close (X) button and Cancel button', async () => {
        await jobsPage.openCreateJobModal();
        await jobsPage.jobNameInput.fill('Dismissal Job Test');

        // Dismiss via Cancel button
        await jobsPage.cancel();
        await expect(jobsPage.createJobDialog).toBeHidden();

        // Reopen and dismiss via Close (X) button
        await jobsPage.openCreateJobModal();
        await jobsPage.closeCreateJobModal();
        await expect(jobsPage.createJobDialog).toBeHidden();
    });

    test('TC052: Create job with valid required and optional details and verify in table', async () => {
        await jobsPage.openCreateJobModal();

        await jobsPage.fillJobDetails({
            name: jobName,
            category: 'Deposition',
            clientJobRef: jobRef,
            description: 'Comprehensive automated deposition job test',
            scheduledDateTime: '2026-12-15T10:00',
            mode: 'Remote',
            witnessName: 'Dr. Jane Smith',
            location: 'https://zoom.us/j/987654321',
            duration: 120,
            notes: 'Deposition conducted via remote video conference.'
        });

        await expect(jobsPage.createJobSubmitButton).toBeEnabled();
        await jobsPage.submitCreateJob();
        await expect(jobsPage.createJobDialog).toBeHidden();

        // Verify the newly created job row appears in the Jobs table
        const jobRow = jobsPage.rowForJob(jobName);
        await expect(jobRow).toBeVisible({ timeout: 10000 });
        await expect(jobRow).toContainText('Draft');
    });

    test('TC053: Search for created job in Jobs section', async () => {
        // Search for the created job
        await jobsPage.searchJobs(jobName);
        const jobRow = jobsPage.rowForJob(jobName);
        await expect(jobRow).toBeVisible();

        // Search for non-existent job
        await jobsPage.searchJobs(`non_existent_job_${stamp}`);
        await expect(jobsPage.noDataMessage).toBeVisible();

        // Clear search to restore table
        await jobsPage.clearSearch();
        await expect(jobRow).toBeVisible();
    });

    test('TC054: Open created job and navigate to Job Details view', async () => {
        await jobsPage.openJobFromTable(jobName);
        await expect(page).toHaveURL(/\/jobs\/[a-f0-9-]+/i, { timeout: 15000 });
        await expect(jobsPage.assignedReporterHeading).toBeVisible();
        await expect(jobsPage.jobTitleHeading).toBeVisible();
        await expect(jobsPage.draftBadge).toBeVisible();
        await expect(jobsPage.backToCaseButton).toBeVisible();
        await expect(jobsPage.editJobButton).toBeVisible();
        await expect(jobsPage.savePushToTMEButton).toBeVisible();
    });

    test('TC055: Verify Artifacts section, Upload button, and artifact listing in Job Details', async () => {
        // Verify Artifacts section heading (e.g. Artifacts (0) or Artifacts)
        await expect(jobsPage.artifactsHeading).toBeVisible();

        // Verify Upload button
        await expect(jobsPage.uploadArtifactButton).toBeVisible();

        // Verify Send To button
        await expect(jobsPage.sendToButton).toBeVisible();
    });

    test('TC056: Open Assign Reporter modal and verify all controls, labels, and Close dismissal', async () => {
        // Assert initial unassigned state
        await expect(jobsPage.assignedReporterSection).toBeVisible();
        await expect(jobsPage.noReporterAssignedMessage).toBeVisible();
        await expect(jobsPage.assignReporterButton).toBeVisible();

        // Open Assign Reporter modal
        await jobsPage.openAssignReporterModal();
        await expect(jobsPage.assignReporterDialog).toBeVisible();
        await expect(jobsPage.assignReporterModalHeading).toBeVisible();
        await expect(jobsPage.assignReporterCloseButton).toBeVisible();

        // Verify Reporter / Scopist label and combobox
        await expect(jobsPage.assignReporterDialog.getByText('Reporter / Scopist', { exact: true })).toBeVisible();
        await expect(jobsPage.assignReporterCombobox).toBeVisible();
        await expect(jobsPage.assignReporterSubmitButton).toBeVisible();

        // Dismiss modal via Close (X) button
        await jobsPage.closeAssignReporterModal();
        await expect(jobsPage.assignReporterDialog).toBeHidden();
    });

    test('TC057: Verify Assign Reporter dropdown list, select user, and assign reporter to job', async () => {
        await jobsPage.openAssignReporterModal();

        // Wait for combobox to resolve from Loading state
        await expect(jobsPage.assignReporterCombobox).not.toContainText('Loading', { timeout: 10000 });

        // Open dropdown list
        await jobsPage.assignReporterCombobox.click();
        const listbox = page.locator('[role="listbox"]');
        await expect(listbox).toBeVisible();

        // Assert at least one reporter option is available
        const options = page.getByRole('option');
        await expect(options.first()).toBeVisible();
        const optionCount = await options.count();
        expect(optionCount).toBeGreaterThan(0);

        // Select the first reporter option
        const selectedUser = await options.first().innerText();
        await options.first().click();
        await expect(listbox).toBeHidden();
        await expect(jobsPage.assignReporterCombobox).toContainText(selectedUser);

        // Submit assignment
        await jobsPage.submitAssignReporter();
        await expect(jobsPage.assignReporterDialog).toBeHidden();

        // Verify assigned reporter is now reflected in the Assigned Reporter section
        await expect(jobsPage.assignedReporterSection).toContainText(selectedUser);
    });

    test('TC058: Verify Repository Link, Publication History, and Sync Generator sections in Job Details', async () => {
        await expect(jobsPage.repositoryLinkHeading).toBeVisible();
        await expect(jobsPage.formatsButton).toBeVisible();
        await expect(jobsPage.generateRepoButton).toBeVisible();

        await expect(jobsPage.publicationHistoryHeading).toBeVisible();
        await expect(jobsPage.syncGeneratorHeading).toBeVisible();
    });
});
