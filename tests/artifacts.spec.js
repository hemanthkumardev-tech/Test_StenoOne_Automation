const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const LoginPage = require('../pages/Login');
const DashboardPage = require('../pages/Dashboard');
const CasesPage = require('../pages/Cases');
const JobsPage = require('../pages/Jobs');

// Run tests in sequence in a single worker sharing page state
test.describe.configure({ mode: 'default' });

test.describe('Artifacts Management (TC_ART01 - TC_ART05)', () => {
    /** @type {import('@playwright/test').Page} */
    let page;
    let casesPage;
    let jobsPage;

    const stamp = process.env.TEST_RUN_ID || Date.now().toString();
    const caseName = `ArtCase_${stamp}`;
    const caseNumber = `CN-ART-${stamp}`;
    const jobName = `ArtJob_${stamp}`;
    const jobRef = `REF-ART-${stamp}`;

    // Test artifacts directory & local files
    const testFilesDir = path.join(__dirname, '..', 'test-data', `temp_${stamp}`);
    const file1Name = 'deposition_transcript_v1.txt';
    const file2Name = 'exhibit_a_contract.pdf';
    const file3Name = 'witness_audio_snippet.m4a';
    const file1Path = path.join(testFilesDir, file1Name);
    const file2Path = path.join(testFilesDir, file2Name);
    const file3Path = path.join(testFilesDir, file3Name);

    test.beforeAll(async ({ browser }) => {
        // Create local test files
        fs.mkdirSync(testFilesDir, { recursive: true });
        fs.writeFileSync(file1Path, 'Sample deposition transcript content for artifact upload test.', 'utf-8');
        fs.writeFileSync(file2Path, '%PDF-1.4 sample exhibit pdf mock content', 'utf-8');
        fs.writeFileSync(file3Path, 'mock m4a audio binary content header', 'utf-8');

        page = await browser.newPage();
        casesPage = new CasesPage(page);
        jobsPage = new JobsPage(page);

        // 1. Authenticate
        const loginPage = new LoginPage(page);
        await loginPage.navigateToLoginPage();
        await loginPage.login(process.env.STENO_EMAIL, process.env.STENO_PASSWORD);
        await expect(page).not.toHaveURL(/\/login(?:[/?#]|$)/, { timeout: 15000 });

        // 2. Create a dedicated Case and open it
        await casesPage.goto();
        await casesPage.openCreateCaseForm();
        await casesPage.fillCaseDetails({
            name: caseName,
            description: 'Dedicated Case for Artifacts Upload Suite',
            number: caseNumber,
            venue: 'State of California',
            product: /^Publish/
        });
        await casesPage.submitCreateAndOpen();
        await expect(casesPage.createDialog).toBeHidden();
        await expect(page).toHaveURL(/\/cases\/[a-f0-9-]+/i, { timeout: 15000 });

        // 3. Create a dedicated Job inside this Case
        await jobsPage.openCreateJobModal();
        await jobsPage.fillJobDetails({
            name: jobName,
            category: 'Deposition',
            clientJobRef: jobRef,
            description: 'Job for Artifacts testing'
        });
        await jobsPage.submitCreateJob();
        await expect(jobsPage.createJobDialog).toBeHidden();

        // 4. Open the created Job to land on Job Details (/jobs/<jobId>)
        await jobsPage.openJobFromTable(jobName);
        await expect(page).toHaveURL(/\/jobs\/[a-f0-9-]+/i, { timeout: 15000 });
        await expect(jobsPage.assignedReporterHeading).toBeVisible();
    });

    test.afterAll(async () => {
        // Clean up temporary local files
        try {
            if (fs.existsSync(testFilesDir)) {
                fs.rmSync(testFilesDir, { recursive: true, force: true });
            }
        } catch {
            // ignore cleanup error
        }
        await page?.close();
    });

    test('TC_ART01: Verify initial Artifacts section elements, heading count, and Upload button', async () => {
        // Verify Artifacts section heading starts with (0)
        await expect(jobsPage.artifactsHeading).toBeVisible();
        await expect(jobsPage.artifactsHeading).toHaveText(/Artifacts \(0\)/);

        // Verify Upload button is visible, enabled, and contains the upload svg icon
        await expect(jobsPage.uploadArtifactButton).toBeVisible();
        await expect(jobsPage.uploadArtifactButton).toBeEnabled();
        await expect(jobsPage.uploadArtifactButton.locator('svg.lucide-upload')).toBeVisible();

        // Verify empty state prompt
        await expect(jobsPage.noArtifactsMessage).toBeVisible();

        // Verify publication banner and Send To button initial state
        await expect(jobsPage.sendToPublicationNotice).toBeVisible();
        await expect(jobsPage.sendToButton).toBeVisible();
        await expect(jobsPage.sendToButton).toBeDisabled();
    });

    test('TC_ART02: Upload local artifact file via the Upload button and verify card details', async () => {
        // Upload the primary transcript file
        await jobsPage.uploadArtifactFile(file1Path);

        // Verify Artifacts heading count increments to (1)
        await expect(jobsPage.artifactsHeading).toHaveText(/Artifacts \(1\)/, { timeout: 10000 });

        // Verify the artifact card appears in the list
        const card = jobsPage.artifactCardFor(file1Name);
        await expect(card).toBeVisible({ timeout: 10000 });

        // Verify filename
        await expect(card.getByText(file1Name)).toBeVisible();

        // Verify badges: Source origin badge, Uploaded status badge
        await expect(card.getByText('Source')).toBeVisible();
        await expect(card.getByText('Uploaded')).toBeVisible();

        // Verify Action buttons: Download & Delete
        const downloadBtn = jobsPage.artifactDownloadButton(file1Name);
        const deleteBtn = jobsPage.artifactDeleteButton(file1Name);
        await expect(downloadBtn).toBeVisible();
        await expect(deleteBtn).toBeVisible();
    });

    test('TC_ART03: Upload multiple local files simultaneously and verify batch addition', async () => {
        // Upload 2 additional files in batch
        await jobsPage.uploadMultipleArtifactFiles([file2Path, file3Path]);

        // Verify Artifacts heading count increments to (3)
        await expect(jobsPage.artifactsHeading).toHaveText(/Artifacts \(3\)/, { timeout: 15000 });

        // Verify both new cards appear in the list
        const card2 = jobsPage.artifactCardFor(file2Name);
        const card3 = jobsPage.artifactCardFor(file3Name);
        await expect(card2).toBeVisible({ timeout: 10000 });
        await expect(card3).toBeVisible({ timeout: 10000 });

        await expect(card2.getByText(file2Name)).toBeVisible();
        await expect(card3.getByText(file3Name)).toBeVisible();
    });

    test('TC_ART04: Verify Download action for an uploaded artifact', async () => {
        const downloadBtn = jobsPage.artifactDownloadButton(file1Name);
        await expect(downloadBtn).toBeVisible();

        // Intercept download event
        const [download] = await Promise.all([
            page.waitForEvent('download', { timeout: 15000 }),
            downloadBtn.click()
        ]);

        // Assert download initiated with correct filename
        expect(download.suggestedFilename()).toBe(file1Name);
    });

    test('TC_ART05: Delete an uploaded artifact and verify confirmation modal and list update', async () => {
        const card1 = jobsPage.artifactCardFor(file1Name);
        await expect(card1).toBeVisible();

        // Click delete on the first artifact
        const deleteBtn = jobsPage.artifactDeleteButton(file1Name);
        await deleteBtn.click();

        // Verify Delete Artifact confirmation dialog
        await expect(jobsPage.deleteArtifactDialog).toBeVisible();
        await expect(jobsPage.deleteArtifactDialog.getByText('Delete Artifact')).toBeVisible();
        await expect(jobsPage.deleteArtifactDialog.getByText(new RegExp(`Permanently delete "${file1Name}"`, 'i'))).toBeVisible();
        await expect(jobsPage.cancelDeleteArtifactButton).toBeVisible();
        await expect(jobsPage.confirmDeleteArtifactButton).toBeVisible();

        // Confirm deletion
        await jobsPage.confirmDeleteArtifactButton.click();
        await expect(jobsPage.deleteArtifactDialog).toBeHidden();

        // Verify card is removed from list
        await expect(card1).toBeHidden({ timeout: 10000 });

        // Verify Artifacts count decrements to (2)
        await expect(jobsPage.artifactsHeading).toHaveText(/Artifacts \(2\)/);
    });
});
