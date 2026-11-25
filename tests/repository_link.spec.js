const { test, expect } = require('@playwright/test');
const LoginPage = require('../pages/Login');
const CasesPage = require('../pages/Cases');
const JobsPage = require('../pages/Jobs');

test.describe.configure({ mode: 'serial' });

test.describe('Repository Link Verification (TC_REPO01 - TC_REPO07)', () => {
    /** @type {import('@playwright/test').BrowserContext} */
    let context;
    /** @type {import('@playwright/test').Page} */
    let page;
    let jobsPage;
    let casesPage;

    const targetJobUrl = 'https://dev.steno.one/jobs/dd14d82d-0e78-4b22-8806-dc6ffd6198de';
    let fullAccessUrl = '';
    let viewOnlyUrl = '';

    const expectedFormats = [
        { name: 'PDF', desc: 'Human-readable deliverable' },
        { name: 'Text', desc: 'Plain .sync.txt' },
        { name: 'SubRip (SRT)', desc: 'Captions / video sync' },
        { name: 'JSON', desc: 'Structured data' },
        { name: 'XML', desc: 'Structured interchange' },
        { name: 'Sanction II (MDB)', desc: 'Exhibit / trial presentation' },
        { name: 'TrialDirector (CMS)', desc: 'TrialDirector case file' },
        { name: 'LiveNote (PTF)', desc: 'Page/Text File' },
        { name: 'Stenograph Binary (SBF)', desc: 'Sanction Briefcase File' },
        { name: 'XMEF', desc: 'XML Exchange Format' },
        { name: 'LiveNote LEF', desc: 'LiveNote Exhibit File' },
        { name: 'LiveNote VID', desc: 'Video Sync File' },
        { name: 'Video', desc: 'Deposition video recording' }
    ];

    test.beforeAll(async ({ browser }) => {
        // Use sync_admin storage state if available or perform login
        const fs = require('fs');
        const path = require('path');
        const authPath = path.join(__dirname, '..', '.auth', 'sync_admin.json');

        if (fs.existsSync(authPath)) {
            context = await browser.newContext({
                storageState: authPath,
                permissions: ['clipboard-read', 'clipboard-write']
            });
            page = await context.newPage();
            jobsPage = new JobsPage(page);
            casesPage = new CasesPage(page);
            await page.goto(targetJobUrl, { waitUntil: 'networkidle' });
        } else {
            context = await browser.newContext({
                permissions: ['clipboard-read', 'clipboard-write']
            });
            page = await context.newPage();
            jobsPage = new JobsPage(page);
            casesPage = new CasesPage(page);
            const loginPage = new LoginPage(page);
            await loginPage.navigateToLoginPage();
            await loginPage.login(
                process.env.SYNC_ADMIN_EMAIL || process.env.STENO_EMAIL,
                process.env.SYNC_ADMIN_PASSWORD || process.env.STENO_PASSWORD
            );
            await expect(page).not.toHaveURL(/\/login(?:[/?#]|$)/, { timeout: 15000 });
            await page.goto(targetJobUrl, { waitUntil: 'networkidle' });
        }
    });

    test.afterAll(async () => {
        await context?.close();
    });

    test('TC_REPO01: Verify Repository Link section heading, subtext, Formats button, and initial Regenerate state', async () => {
        // Section heading
        await expect(jobsPage.repositoryLinkHeading).toBeVisible();

        // Subtext description
        await expect(jobsPage.repositoryLinkSubtext).toBeVisible();

        // Formats button
        await expect(jobsPage.formatsButton).toBeVisible();
        await expect(jobsPage.formatsButton).toBeEnabled();
        await expect(jobsPage.formatsButton).toHaveText(/Formats/i);

        // Regenerate button initial state: disabled with tooltip
        await expect(jobsPage.regenerateRepoButton).toBeVisible();
        await expect(jobsPage.regenerateRepoButton).toBeDisabled();
        await expect(jobsPage.regenerateRepoButton).toHaveAttribute('title', 'Change formats to enable Regenerate');
    });

    test('TC_REPO02: Verify Formats dropdown menu contains title and all 13 deliverable formats with descriptions', async () => {
        // Open Formats menu
        await jobsPage.openFormatsMenu();
        await expect(jobsPage.formatsMenuHeading).toBeVisible();

        // Verify total format options count
        await expect(jobsPage.formatsMenuItems).toHaveCount(expectedFormats.length);

        // Verify each format item label and sub-description
        for (const fmt of expectedFormats) {
            const item = jobsPage.getFormatCheckbox(fmt.name);
            await expect(item).toBeVisible();
            await expect(item.getByText(fmt.name, { exact: true })).toBeVisible();
            await expect(item.getByText(fmt.desc, { exact: true })).toBeVisible();

            // Verify each item is checked by default
            const isChecked = await item.getAttribute('aria-checked') || await item.getAttribute('data-state');
            expect(isChecked === 'true' || isChecked === 'checked').toBeTruthy();
        }

        // Close menu
        await jobsPage.closeFormatsMenu();
        await expect(jobsPage.formatsMenu).toBeHidden();
    });

    test('TC_REPO03: Verify Active Repository Links cards (Full Access & View-Only), URLs, and informational bullets', async () => {
        // Section sub-heading
        await expect(jobsPage.activeRepoLinksHeading).toBeVisible();

        // Full Access Link card
        await expect(jobsPage.fullAccessLinkLabel).toBeVisible();
        await expect(jobsPage.fullAccessLinkAnchor).toBeVisible();
        fullAccessUrl = await jobsPage.fullAccessLinkAnchor.innerText();
        expect(fullAccessUrl).toMatch(/^https:\/\/dev\.steno\.one\/r\/[a-zA-Z0-9_-]+$/);
        await expect(jobsPage.fullAccessCopyButton).toBeVisible();
        await expect(jobsPage.fullAccessCopyButton).toBeEnabled();
        await expect(jobsPage.fullAccessExternalLink).toBeVisible();
        await expect(jobsPage.fullAccessExternalLink).toHaveAttribute('href', fullAccessUrl);

        // View-Only Link card
        await expect(jobsPage.viewOnlyLinkLabel).toBeVisible();
        await expect(jobsPage.viewOnlyLinkAnchor).toBeVisible();
        viewOnlyUrl = await jobsPage.viewOnlyLinkAnchor.innerText();
        expect(viewOnlyUrl).toMatch(/^https:\/\/dev\.steno\.one\/r\/[a-zA-Z0-9_-]+$/);
        await expect(jobsPage.viewOnlyCopyButton).toBeVisible();
        await expect(jobsPage.viewOnlyCopyButton).toBeEnabled();
        await expect(jobsPage.viewOnlyExternalLink).toBeVisible();
        await expect(jobsPage.viewOnlyExternalLink).toHaveAttribute('href', viewOnlyUrl);

        // Informational bullets
        await expect(jobsPage.fullAccessBullet).toBeVisible();
        await expect(jobsPage.viewOnlyBullet).toBeVisible();
    });

    test('TC_REPO04: Verify toggling formats enables Regenerate button and regenerates repository links', async () => {
        const initialFormatsText = await jobsPage.formatsButton.innerText();

        // 1. Toggle Video format off
        await jobsPage.toggleFormat('Video');

        // Formats button text should update (e.g. from Formats (12+V) to Formats (12))
        await expect(jobsPage.formatsButton).not.toHaveText(initialFormatsText);

        // Regenerate button should now be enabled with updated title
        await expect(jobsPage.regenerateRepoButton).toBeEnabled();
        await expect(jobsPage.regenerateRepoButton).toHaveAttribute('title', 'Generate Full Access + View-Only links');

        // 2. Click Regenerate button and verify API returns 200
        const [response] = await Promise.all([
            page.waitForResponse(res => res.url().includes('/repository-links') && res.status() === 200, { timeout: 15000 }),
            jobsPage.regenerateRepoButton.click()
        ]);
        expect(response.status()).toBe(200);

        // 3. Restore state: toggle Video format back on
        await jobsPage.toggleFormat('Video');
        await expect(jobsPage.formatsButton).toHaveText(initialFormatsText);

        // Regenerate again to restore original settings
        const [restoreResponse] = await Promise.all([
            page.waitForResponse(res => res.url().includes('/repository-links') && res.status() === 200, { timeout: 15000 }),
            jobsPage.regenerateRepoButton.click()
        ]);
        expect(restoreResponse.status()).toBe(200);
    });

    test('TC_REPO05: Verify Copy button functionality copies repository URL to clipboard', async () => {
        // Copy Full Access Link
        await jobsPage.fullAccessCopyButton.click();
        await page.waitForTimeout(400);
        const copiedFullAccess = await page.evaluate(() => navigator.clipboard.readText());
        expect(copiedFullAccess).toBe(fullAccessUrl);

        // Copy View-Only Link
        await jobsPage.viewOnlyCopyButton.click();
        await page.waitForTimeout(400);
        const copiedViewOnly = await page.evaluate(() => navigator.clipboard.readText());
        expect(copiedViewOnly).toBe(viewOnlyUrl);
    });

    test('TC_REPO06: Verify Guest Public Access via Repository Link without authentication', async ({ browser }) => {
        // Create an isolated unauthenticated browser context (no cookies or stored auth)
        const guestContext = await browser.newContext();
        const guestPage = await guestContext.newPage();

        try {
            const guestResponse = await guestPage.goto(fullAccessUrl, { waitUntil: 'networkidle' });
            expect(guestResponse.status()).toBe(200);

            // Verify Portal Branding & Title
            await expect(guestPage).toHaveTitle(/Stenograph One Portal/i);
            await expect(guestPage.getByText('Stenograph One', { exact: true })).toBeVisible();
            await expect(guestPage.getByText('Deposition Artifact Repository')).toBeVisible();

            // Verify Case Name & Access Level
            await expect(guestPage.getByText('Case Name: Case_PW_7492')).toBeVisible();
            await expect(guestPage.getByText('Full Access', { exact: true })).toBeVisible();

            // Verify Action Buttons
            await expect(guestPage.getByRole('button', { name: /Download All Files/i })).toBeVisible();
            await expect(guestPage.getByRole('button', { name: /Download Transcripts/i })).toBeVisible();

            // Verify Artifacts Heading and Table
            await expect(guestPage.getByRole('heading', { name: 'Artifacts', exact: true })).toBeVisible();
            await expect(guestPage.getByText('pod_raw.json')).toBeVisible();
        } finally {
            await guestContext.close();
        }
    });

    test('TC_REPO07: Verify initial / unconfigured job displays disabled repository state and prompt notice', async () => {
        // Create a quick temporary job without deliverables to verify unconfigured state
        const stamp = Date.now().toString().slice(-6);
        const emptyJobName = `RepoEmpty_${stamp}`;

        // Return to case details via back button
        await jobsPage.backToCaseButton.click();
        await expect(jobsPage.newJobButton).toBeVisible();

        await jobsPage.openCreateJobModal();
        await jobsPage.fillJobDetails({
            name: emptyJobName,
            category: 'Deposition',
            clientJobRef: `REF-${stamp}`,
            description: 'Temporary job for repository disabled state verification'
        });
        await jobsPage.submitCreateJob();
        await expect(jobsPage.createJobDialog).toBeHidden();

        // Search and open newly created job
        await jobsPage.searchJobs(emptyJobName);
        await jobsPage.openJobFromTable(emptyJobName);
        await expect(jobsPage.repositoryLinkHeading).toBeVisible();

        // Verify disabled notice banner is displayed
        await expect(jobsPage.repoDisabledNotice).toBeVisible();

        // Verify Formats button is visible
        await expect(jobsPage.formatsButton).toBeVisible();

        // Verify Generate button is present and disabled
        await expect(jobsPage.generateRepoButton).toBeVisible();
        await expect(jobsPage.generateRepoButton).toBeDisabled();
    });
});
