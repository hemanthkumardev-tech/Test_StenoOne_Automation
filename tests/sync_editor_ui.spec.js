const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const LoginPage = require('../pages/Login');
const JobsPage = require('../pages/Jobs');
const SyncGeneratorPage = require('../pages/SyncGenerator');

test.describe.configure({ mode: 'serial' });

test.describe('Sync Generator - UI Component & Player Regression Flow', () => {
    /** @type {import('@playwright/test').BrowserContext} */
    let context;
    /** @type {import('@playwright/test').Page} */
    let page;
    let jobsPage;
    let syncPage;

    const targetJobUrl = 'https://dev.steno.one/jobs/dd14d82d-0e78-4b22-8806-dc6ffd6198de';

    async function ensureAuthenticated() {
        const authPath = path.join(__dirname, '..', '.auth', 'sync_admin.json');
        try {
            await page.goto(targetJobUrl, { waitUntil: 'commit', timeout: 40000 });
            await page.waitForLoadState('domcontentloaded', { timeout: 30000 }).catch(() => {});
        } catch {
            await page.goto(targetJobUrl, { timeout: 60000 }).catch(() => {});
        }
        await page.waitForTimeout(2000);

        if (page.url().includes('/login')) {
            console.log('[AUTH] Session expired, logging in as sync admin...');
            const email = (process.env.SYNC_ADMIN_EMAIL || '').trim();
            const password = (process.env.SYNC_ADMIN_PASSWORD || '').trim();
            if (!email || !password) {
                throw new Error('SYNC_ADMIN_EMAIL or SYNC_ADMIN_PASSWORD missing in .env');
            }
            const loginPage = new LoginPage(page);
            await loginPage.navigateToLoginPage();
            await loginPage.enterEmail(email);
            await loginPage.enterPassword(password);
            await loginPage.clickSignIn();
            await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 30000 });
            await context.storageState({ path: authPath });
            await page.goto(targetJobUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
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
        jobsPage = new JobsPage(page);
        syncPage = new SyncGeneratorPage(page);

        await ensureAuthenticated();
    });

    test.afterAll(async () => {
        await context?.close();
    });

    // ─────────────────────────────────────────────────────────────
    // Phase 1: Job Details & In-App Navigation to Sync Setup
    // ─────────────────────────────────────────────────────────────

    test('Step 1: Open Job Details and launch Sync Generator Setup via UI', async () => {
        if (!page.url().includes('/jobs/')) {
            await page.goto(targetJobUrl, { waitUntil: 'commit', timeout: 40000 });
            await page.waitForLoadState('domcontentloaded', { timeout: 30000 }).catch(() => {});
            await page.waitForTimeout(2000);
        }

        // Verify Sync Generator card on Job Details
        await expect(jobsPage.syncGeneratorHeading).toBeVisible({ timeout: 20000 });
        await expect(jobsPage.syncCompletedBadge).toBeVisible();
        await expect(jobsPage.syncAlignmentStats).toBeVisible();
        await expect(jobsPage.openSyncGeneratorButton).toBeVisible();
        await expect(jobsPage.openSyncGeneratorButton).toBeEnabled();

        // Click Open Sync Generator button from the UI
        await jobsPage.openSyncGeneratorButton.click();
        await page.waitForURL(/\/sync-generator\/.+/i, { timeout: 25000 });

        // If the finalized job lands directly in the Editor, smoothly navigate to Setup
        if (page.url().includes('/edit')) {
            await expect(syncPage.editorSetupButton).toBeVisible({ timeout: 15000 });
            await syncPage.editorSetupButton.click();
            await page.waitForURL(/\/sync-generator\/[a-f0-9-]+\/setup/i, { timeout: 15000 });
        }

        // Confirm we are on the Setup screen
        await expect(page).toHaveURL(/\/sync-generator\/[a-f0-9-]+\/setup/i);
        await expect(syncPage.breadcrumbSyncSetup).toBeVisible();
    });

    // ─────────────────────────────────────────────────────────────
    // Phase 2: Setup Page Configuration, Metrics & Guardrails
    // ─────────────────────────────────────────────────────────────

    test('Step 2: Inspect Sync Setup configuration, statistics metrics, and input cards', async () => {
        // Setup header and navigation buttons
        await expect(syncPage.setupHeading).toBeVisible();
        await expect(syncPage.refreshButton).toBeVisible();
        await expect(syncPage.refreshButton).toBeEnabled();
        await expect(syncPage.backToJobButton).toBeVisible();
        await expect(syncPage.backToJobButton).toBeEnabled();

        // Statistics summary metrics
        await expect(syncPage.linesStat).toBeVisible();
        await expect(syncPage.transcriptWordsStat).toBeVisible();
        await expect(syncPage.mediaDurationStat).toBeVisible();
        await expect(syncPage.alignedWordsStat).toBeVisible();

        // Section 1: Inputs - Transcript Card
        await expect(syncPage.inputsHeading).toBeVisible();
        await expect(syncPage.transcriptHeading).toBeVisible();
        await expect(syncPage.transcriptRadioItem).toBeVisible();
        await expect(syncPage.transcriptName).toBeVisible();
        await expect(syncPage.finalTranscriptBadge).toBeVisible();
        await expect(syncPage.sourceBadge).toBeVisible();
        await expect(syncPage.spokenLinesStatus).toBeVisible();

        // Section 1: Inputs - Media Card
        await expect(syncPage.mediaHeading).toBeVisible();
        await expect(syncPage.mediaOrderedItem).toBeVisible();
        await expect(syncPage.mediaStitchWarning).toBeVisible();

        // Section 1: Inputs - Exhibits Card
        await expect(syncPage.exhibitsHeading).toBeVisible();
        await expect(syncPage.exhibitsNotice).toBeVisible();
        await expect(syncPage.requiredFooterNote).toBeVisible();

        // Verify aligned job inputs are locked against modification
        await expect(syncPage.uploadTranscriptButton).toBeDisabled();
        await expect(syncPage.uploadMediaButton).toBeDisabled();
        await expect(syncPage.uploadExhibitsButton).toBeDisabled();
    });

    test('Step 3: Validate Sync Type pricing estimate and Process diagnostics', async () => {
        // Section 2: Sync Type
        await expect(syncPage.syncTypeHeading).toBeVisible();
        await expect(syncPage.syncTypeCombobox).toBeVisible();
        await expect(syncPage.syncTypeCombobox).toHaveText(/Automatic Sync/);
        await expect(syncPage.syncTypeDescription).toBeVisible();
        await expect(syncPage.syncTypePriceEstimate).toBeVisible();

        // Section 3: Process & Alignment Status
        await expect(syncPage.processHeading).toBeVisible();
        await expect(syncPage.alignmentReadyText).toBeVisible();
        await expect(syncPage.orderReferenceText).toBeVisible();

        // Re-process is guarded to prevent duplicate execution
        await expect(syncPage.reprocessButton).toBeVisible();
        await expect(syncPage.reprocessButton).toBeDisabled();

        // Debug details collapsible inspection
        await expect(syncPage.debugDetailsSummary).toBeVisible();
        await syncPage.debugDetailsSummary.click();
        await expect(syncPage.debugDetailsContent).toBeVisible();
        await syncPage.debugDetailsSummary.click();
    });

    // ─────────────────────────────────────────────────────────────
    // Phase 3: Transition to Editor & Header Verification
    // ─────────────────────────────────────────────────────────────

    test('Step 4: Transition into Sync Editor and verify workspace metadata', async () => {
        // Seamlessly click Open Editor from the Setup screen
        await expect(syncPage.openEditorButton).toBeVisible();
        await expect(syncPage.openEditorButton).toBeEnabled();
        await syncPage.openEditorButton.click();

        // Wait for Editor URL
        await page.waitForURL(/\/sync-generator\/[a-f0-9-]+\/edit/i, { timeout: 25000 });
        await expect(page).toHaveURL(/\/sync-generator\/[a-f0-9-]+\/edit/i);

        // Header and Deponent details
        await expect(syncPage.editorBackButton).toBeVisible();
        await expect(syncPage.editorTitle).toBeVisible();
        await expect(syncPage.editorStatusBadge).toBeVisible();
        await expect(syncPage.editorAnchoredStat).toBeVisible();
        await expect(syncPage.editorInterpolatedStat).toBeVisible();
    });

    test('Step 5: Verify Editor action toolbar and export/approve controls', async () => {
        // Action toolbar buttons
        await expect(syncPage.editorEditExhibitsButton).toBeVisible();
        await expect(syncPage.editorSetupButton).toBeVisible();
        await expect(syncPage.editorSetupButton).toBeEnabled();
        await expect(syncPage.editorRefreshButton).toBeVisible();
        await expect(syncPage.editorRefreshButton).toBeEnabled();
        await expect(syncPage.editorExportButton).toBeVisible();

        // Verify Approve / Finalized status
        const isApproveVisible = await syncPage.editorApproveButton.isVisible().catch(() => false);
        if (isApproveVisible) {
            await expect(syncPage.editorApproveButton).toBeEnabled();
        } else {
            await expect(syncPage.editorExportButton).toBeEnabled();
        }
    });

    // ─────────────────────────────────────────────────────────────
    // Phase 4: Media Player Playback & Control Suite
    // ─────────────────────────────────────────────────────────────

    test('Step 6: Interact with Media Player controls (Play/Pause, scrubber, speed rate, mute)', async () => {
        await expect(syncPage.playerContainer).toBeVisible();

        // Initial play button state
        await expect(syncPage.playButton).toBeVisible();

        // Toggle playback to Play
        await syncPage.playButton.click();
        await expect(syncPage.pauseButton).toBeVisible({ timeout: 5000 });

        // Toggle playback back to Pause
        await syncPage.pauseButton.click();
        await expect(syncPage.playButton).toBeVisible({ timeout: 5000 });

        // Scrubber / timeline range slider
        await expect(syncPage.timeSlider).toBeVisible();
        const minVal = await syncPage.timeSlider.getAttribute('min');
        const maxVal = await syncPage.timeSlider.getAttribute('max');
        expect(Number(minVal)).toBe(0);
        expect(Number(maxVal)).toBeGreaterThan(0);

        // Timecode readout (MM:SS / MM:SS)
        await expect(syncPage.timecodeDisplay).toBeVisible();
        const timeText = await syncPage.timecodeDisplay.innerText();
        expect(timeText).toMatch(/\d{1,2}:\d{2}\s*\/\s*\d{1,2}:\d{2}/);

        // Playback speed dropdown
        await expect(syncPage.speedSelect).toBeVisible();
        const speedOptions = await syncPage.speedSelect.locator('option').allInnerTexts();
        expect(speedOptions).toEqual(['0.50x', '0.75x', '1.00x', '1.25x', '1.50x', '1.75x', '2.00x']);

        // Switch playback speed to 1.50x and restore to 1.00x
        await syncPage.setPlaybackSpeed('1.5');
        expect(await syncPage.speedSelect.inputValue()).toBe('1.5');
        await syncPage.setPlaybackSpeed('1');
        expect(await syncPage.speedSelect.inputValue()).toBe('1');

        // Mute / Volume control
        await expect(syncPage.muteButton).toBeVisible();
    });

    // ─────────────────────────────────────────────────────────────
    // Phase 5: Transcript Review, Search & Filtering
    // ─────────────────────────────────────────────────────────────

    test('Step 7: Filter and search transcript lines in real-time', async () => {
        await expect(syncPage.searchLinesInput).toBeVisible();
        const totalLinesBefore = await syncPage.transcriptLines.count();
        expect(totalLinesBefore).toBeGreaterThan(0);

        // Real-time transcript keyword search
        await syncPage.searchTranscript('Sullivan');
        const filteredLines = await syncPage.transcriptLines.count();
        expect(filteredLines).toBeGreaterThan(0);
        expect(filteredLines).toBeLessThan(totalLinesBefore);

        // Clear search restores all transcript lines
        await syncPage.clearTranscriptSearch();
        const totalLinesAfter = await syncPage.transcriptLines.count();
        expect(totalLinesAfter).toBe(totalLinesBefore);

        // Filter pills: All, Low Confidence, Interpolated
        await expect(syncPage.filterAllButton).toBeVisible();
        await expect(syncPage.filterLowConfidenceButton).toBeVisible();
        await expect(syncPage.filterInterpolatedButton).toBeVisible();

        // Default active pill is All
        expect(await syncPage.filterAllButton.getAttribute('class')).toContain('bg-primary');

        // Click Low Confidence filter
        await syncPage.filterLowConfidenceButton.click();
        await page.waitForTimeout(300);
        expect(await syncPage.filterLowConfidenceButton.getAttribute('class')).toContain('bg-primary');

        // Click Interpolated filter
        await syncPage.filterInterpolatedButton.click();
        await page.waitForTimeout(300);
        expect(await syncPage.filterInterpolatedButton.getAttribute('class')).toContain('bg-primary');

        // Restore All filter
        await syncPage.filterAllButton.click();
        await page.waitForTimeout(300);
        expect(await syncPage.filterAllButton.getAttribute('class')).toContain('bg-primary');

        // More options dropdown menu (⋮)
        await expect(syncPage.moreOptionsButton).toBeVisible();
        await syncPage.moreOptionsButton.click();
        await expect(page.getByRole('menuitem', { name: 'Unaligned' })).toBeVisible();
        await expect(page.getByRole('menuitem', { name: 'Manual' })).toBeVisible();
        await page.getByRole('menuitem', { name: 'Unaligned' }).click();
        await page.waitForTimeout(300);
        await syncPage.filterAllButton.click();
        await page.waitForTimeout(300);

        // Mode switch: Review vs Edit
        await expect(syncPage.reviewModeButton).toBeVisible();
        await expect(syncPage.editModeButton).toBeVisible();

        await syncPage.setEditorMode('Edit');
        expect(await syncPage.editModeButton.getAttribute('class')).toContain('bg-primary');

        await syncPage.setEditorMode('Review');
        expect(await syncPage.reviewModeButton.getAttribute('class')).toContain('bg-primary');
    });

    // ─────────────────────────────────────────────────────────────
    // Phase 6: Precision Seeking & Round-Trip Navigation
    // ─────────────────────────────────────────────────────────────

    test('Step 8: Seek media player using transcript timestamp and navigate round-trip back to Job', async () => {
        // Verify line indicators and timestamps
        await expect(syncPage.transcriptLines.first()).toBeVisible();
        const firstLineIndicator = await syncPage.transcriptLines.first().innerText();
        expect(firstLineIndicator).toMatch(/^P\d+:L\d+$/);

        // Click timestamp to seek playback
        const targetTimestampBtn = syncPage.timestampButtons.first();
        await expect(targetTimestampBtn).toBeVisible();
        await targetTimestampBtn.click({ force: true });
        await page.waitForTimeout(500);

        // Player updates timecode display
        const timeDisplay = await syncPage.timecodeDisplay.innerText();
        expect(timeDisplay).toMatch(/\d{1,2}:\d{2}\s*\/\s*\d{1,2}:\d{2}/);

        // Return to Setup page using Header Setup button
        await syncPage.editorSetupButton.click();
        await page.waitForURL(/\/sync-generator\/[a-f0-9-]+\/setup/i, { timeout: 15000 });
        await expect(syncPage.setupHeading).toBeVisible();

        // Return to Job Details using Back to Job button
        await syncPage.backToJobButton.click();
        await page.waitForURL(/\/jobs\/.+/i, { timeout: 15000 });
        await expect(jobsPage.syncGeneratorHeading).toBeVisible();
    });
});
