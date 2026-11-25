const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const LoginPage = require('../pages/Login');
const CasesPage = require('../pages/Cases');
const JobsPage = require('../pages/Jobs');
const SyncGeneratorPage = require('../pages/SyncGenerator');

test.describe.configure({ mode: 'serial' });

test.describe('Sync Generator – End-to-End Scenarios (MP4 and MPG Workflows)', () => {
    /** @type {import('@playwright/test').BrowserContext} */
    let context;
    /** @type {import('@playwright/test').Page} */
    let page;
    let loginPage;
    let casesPage;
    let jobsPage;
    let syncPage;

    // Test asset directories and paths
    const testAssetsDir = process.env.TEST_ASSETS_DIR || 'C:\\Users\\Dell\\Downloads\\Test-assets (1)\\Test-assets';
    const transcriptSullivan = path.join(testAssetsDir, 'transcript', 'Sullivan.txt');
    const transcriptEberline = path.join(testAssetsDir, 'transcript', 'eberline.mdb');
    const mediaSullivan2 = path.join(testAssetsDir, 'media', 'Sullivan2.mp4');
    const mediaEberline = path.join(testAssetsDir, 'media', 'eberline.mpg');

    // Helper: auto-login / session refresh
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
        casesPage = new CasesPage(page);
        jobsPage = new JobsPage(page);
        syncPage = new SyncGeneratorPage(page);

        // Verify test assets exist on disk
        expect(fs.existsSync(transcriptSullivan), `Sullivan.txt must exist at ${transcriptSullivan}`).toBeTruthy();
        expect(fs.existsSync(transcriptEberline), `eberline.mdb must exist at ${transcriptEberline}`).toBeTruthy();
        expect(fs.existsSync(mediaSullivan2), `Sullivan2.mp4 must exist at ${mediaSullivan2}`).toBeTruthy();
        expect(fs.existsSync(mediaEberline), `eberline.mpg must exist at ${mediaEberline}`).toBeTruthy();

        await ensureAuthenticated();
    });

    test.afterAll(async () => {
        if (context) {
            await context.close();
        }
    });

    // ═════════════════════════════════════════════════════════════════════════════
    // Scenario A — MP4 workflow (Sullivan.txt + Sullivan2.mp4)
    // ═════════════════════════════════════════════════════════════════════════════
    test.describe('Scenario A — MP4 workflow', () => {
        const stampA = Date.now().toString();
        const jobNameA = `Job_MP4_${stampA}`;
        const jobRefA = `REF-MP4-${stampA}`;

        test('A1: Select a Case and create a Job', async () => {
            test.setTimeout(60000);
            await page.goto('https://dev.steno.one/cases', { waitUntil: 'domcontentloaded', timeout: 30000 });
            await expect(casesPage.heading).toBeVisible();

            await casesPage.caseRows.first().waitFor({ state: 'visible', timeout: 15000 });
            const targetRow = casesPage.caseRows.first();
            await targetRow.locator('td').first().click();
            await page.waitForURL(/\/cases\/[a-f0-9-]+/i, { timeout: 15000 });
            await expect(jobsPage.jobsHeading).toBeVisible();

            // Create Job
            await jobsPage.openCreateJobModal();
            await jobsPage.fillJobDetails({
                name: jobNameA,
                category: 'Deposition',
                clientJobRef: jobRefA,
                mode: 'Remote',
                description: `Scenario A MP4 workflow test job created at ${stampA}`
            });
            await jobsPage.submitCreateJob();
            await jobsPage.createJobDialog.waitFor({ state: 'hidden', timeout: 35000 });

            // Confirm Job created in table
            const newRow = jobsPage.rowForJob(jobNameA);
            await expect(newRow).toBeVisible({ timeout: 25000 });
            console.log(`[Scenario A] Created Job: "${jobNameA}"`);
        });

        test('A2: Open Sync Generator Setup', async () => {
            test.setTimeout(60000);
            const newRow = jobsPage.rowForJob(jobNameA);
            await newRow.locator('td').first().click();
            await page.waitForURL(/\/jobs\/[a-f0-9-]+/i, { timeout: 15000 });

            // Click Create sync job under Sync Generator section
            await expect(jobsPage.syncGeneratorHeading).toBeVisible();
            await expect(jobsPage.createSyncJobButton).toBeVisible();
            await jobsPage.createSyncJobButton.click();

            await page.waitForURL(/\/sync-generator\/[a-f0-9-]+\/setup/i, { timeout: 20000 });
            await expect(syncPage.setupHeading).toBeVisible();
            await expect(syncPage.transcriptHeading).toBeVisible();
            await expect(syncPage.mediaHeading).toBeVisible();
            console.log('[Scenario A] Sync Generator Setup opened.');
        });

        test('A3: Upload Sullivan.txt', async () => {
            test.setTimeout(60000);
            console.log(`[Scenario A] Uploading transcript: ${transcriptSullivan}`);
            await syncPage.uploadTranscript(transcriptSullivan);

            await expect(page.getByText(/Uploaded "Sullivan\.txt" as Source Final Transcript/i)
                .or(syncPage.toasts.filter({ hasText: /Sullivan\.txt/i }))
                .first()).toBeVisible({ timeout: 25000 });

            // Dismiss Set Transcript Lines dialog if auto-detected modal appears
            const confirmBtn = page.getByRole('button', { name: /Confirm defaults/i });
            try {
                await confirmBtn.waitFor({ state: 'visible', timeout: 8000 });
                await confirmBtn.click();
                await page.waitForTimeout(1000);
            } catch (e) {
                // Modal did not appear or was already dismissed
            }

            await expect(syncPage.transcriptRadioItem).toBeVisible({ timeout: 10000 });
            await expect(syncPage.transcriptName).toHaveText('Sullivan.txt');
            console.log('[Scenario A] Sullivan.txt uploaded and verified.');
        });

        test('A4: Upload Sullivan2.mp4', async () => {
            test.setTimeout(300000); // 5 minutes for uploading 300MB video asset
            console.log(`[Scenario A] Uploading media: ${mediaSullivan2}`);
            await syncPage.uploadMedia(mediaSullivan2);

            // Wait for media upload to fully complete and render in list
            await expect(page.getByText(/1 media file/i)
                .or(page.getByText(/Added "Sullivan2\.mp4"/i))
                .or(page.getByText(/30m 25s/i))
                .first()).toBeVisible({ timeout: 240000 });

            console.log('[Scenario A] Sullivan2.mp4 upload completed and added to Media list.');
        });

        test('A5: Attempt to upload eberline.mpg and verify format locking', async () => {
            test.setTimeout(60000);
            console.log(`[Scenario A] Attempting to upload incompatible format: ${mediaEberline}`);
            await syncPage.uploadMedia(mediaEberline);

            // Verify format locking rejection toast
            await expect(syncPage.toasts.filter({
                hasText: /All videos in a Sync Job must use the same file format\. You cannot mix \.mp4 and \.mpg/i
            }).first()).toBeVisible({ timeout: 15000 });

            // Verify media list still contains only the .mp4 file
            const mediaItems = await syncPage.mediaListItems.allInnerTexts();
            expect(mediaItems.some(item => item.includes('Sullivan2.mp4'))).toBeTruthy();
            expect(mediaItems.some(item => item.includes('eberline.mpg'))).toBeFalsy();
            console.log('[Scenario A] Format locking verified: .mpg upload was rejected while .mp4 is active.');
        });

        test('A6: Verify Process becomes enabled', async () => {
            test.setTimeout(60000);
            // Dismiss Set Transcript Lines dialog if still visible
            const confirmBtn = page.getByRole('button', { name: /Confirm defaults/i });
            if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
                await confirmBtn.click().catch(() => {});
                await page.waitForTimeout(500);
            }

            // Verify Section 3 indicates readiness
            await expect(syncPage.processHeading).toBeVisible();
            await expect(syncPage.readyToProcessText).toBeVisible({ timeout: 20000 });

            // Verify Process button is enabled
            await expect(syncPage.processButton).toBeVisible();
            await expect(syncPage.processButton).toBeEnabled();
            console.log('[Scenario A] Process button is enabled and ready to run alignment.');
        });

        test('A7: Click Process and verify the synchronization progress message', async () => {
            test.setTimeout(60000);
            await syncPage.processButton.click();

            // Verify progress message / state
            await expect(syncPage.processingStatusText
                .or(page.getByText(/Processing alignment…|Job submitted for processing|Processing/i))
                .first()).toBeVisible({ timeout: 15000 });
            console.log('[Scenario A] Synchronization started and progress message verified.');
        });

        test('A8: Wait for the Editor to open and verify the recording', async () => {
            test.setTimeout(300000); // 5 minutes timeout for alignment and editor transition
            const openEditorBtn = syncPage.openEditorButton;
            const startTime = Date.now();
            let isEditorOpen = page.url().includes('/edit');

            while (!isEditorOpen && (Date.now() - startTime < 240000)) {
                if (await openEditorBtn.isVisible().catch(() => false)) {
                    console.log('[Scenario A] Alignment ready, clicking Open Editor button...');
                    await openEditorBtn.click();
                    await page.waitForURL(/\/sync-generator\/[a-f0-9-]+\/edit/i, { timeout: 25000 }).catch(() => {});
                    isEditorOpen = page.url().includes('/edit');
                    if (isEditorOpen) break;
                }
                if (page.url().includes('/edit')) {
                    isEditorOpen = true;
                    break;
                }
                await page.waitForTimeout(6000);
                if (await syncPage.refreshButton.isVisible().catch(() => false)) {
                    await syncPage.refreshButton.click().catch(() => {});
                }
            }

            // Verify Editor elements
            expect(page.url()).toContain('/edit');
            await expect(syncPage.editorBackButton).toBeVisible({ timeout: 15000 });
            await expect(syncPage.playerContainer).toBeVisible();

            // Verify recording / transcript text
            const titleHeading = page.getByRole('heading', { level: 1 }).first();
            await expect(titleHeading).toBeVisible({ timeout: 15000 });
            const titleText = await titleHeading.innerText();
            console.log(`[Scenario A] Editor opened with Title: "${titleText}"`);
            expect(titleText.toLowerCase()).toMatch(/sullivan|job_mp4/i);

            // Verify transcript line rows are rendered
            await expect(syncPage.transcriptLines.first()).toBeVisible({ timeout: 15000 });
            console.log('[Scenario A] Editor recording and transcript lines verified successfully.');
        });
    });

    // ═════════════════════════════════════════════════════════════════════════════
    // Scenario B — MPG workflow (eberline.mdb + eberline.mpg)
    // ═════════════════════════════════════════════════════════════════════════════
    test.describe('Scenario B — MPG workflow', () => {
        const stampB = Date.now().toString();
        const jobNameB = `Job_MPG_${stampB}`;
        const jobRefB = `REF-MPG-${stampB}`;

        test('B1: Select another Case and create another Job', async () => {
            test.setTimeout(60000);
            await page.goto('https://dev.steno.one/cases', { waitUntil: 'domcontentloaded', timeout: 30000 });
            await expect(casesPage.heading).toBeVisible();

            await casesPage.caseRows.first().waitFor({ state: 'visible', timeout: 15000 });
            const totalCases = await casesPage.caseRows.count();

            // Select a different case if more than 1 available
            const targetRow = totalCases > 1 ? casesPage.caseRows.nth(1) : casesPage.caseRows.first();
            await targetRow.locator('td').first().click();
            await page.waitForURL(/\/cases\/[a-f0-9-]+/i, { timeout: 15000 });
            await expect(jobsPage.jobsHeading).toBeVisible();

            // Create Job
            await jobsPage.openCreateJobModal();
            await jobsPage.fillJobDetails({
                name: jobNameB,
                category: 'Deposition',
                clientJobRef: jobRefB,
                mode: 'Remote',
                description: `Scenario B MPG workflow test job created at ${stampB}`
            });
            await jobsPage.submitCreateJob();
            await jobsPage.createJobDialog.waitFor({ state: 'hidden', timeout: 35000 });

            // Confirm Job created in table
            const newRow = jobsPage.rowForJob(jobNameB);
            await expect(newRow).toBeVisible({ timeout: 25000 });
            console.log(`[Scenario B] Created Job: "${jobNameB}"`);
        });

        test('B2: Open Sync Generator Setup', async () => {
            test.setTimeout(60000);
            const newRow = jobsPage.rowForJob(jobNameB);
            await newRow.locator('td').first().click();
            await page.waitForURL(/\/jobs\/[a-f0-9-]+/i, { timeout: 15000 });

            await expect(jobsPage.syncGeneratorHeading).toBeVisible();
            await expect(jobsPage.createSyncJobButton).toBeVisible();
            await jobsPage.createSyncJobButton.click();

            await page.waitForURL(/\/sync-generator\/[a-f0-9-]+\/setup/i, { timeout: 20000 });
            await expect(syncPage.setupHeading).toBeVisible();
            await expect(syncPage.transcriptHeading).toBeVisible();
            await expect(syncPage.mediaHeading).toBeVisible();
            console.log('[Scenario B] Sync Generator Setup opened.');
        });

        test('B3: Upload eberline.mdb', async () => {
            test.setTimeout(60000);
            console.log(`[Scenario B] Uploading transcript: ${transcriptEberline}`);
            await syncPage.uploadTranscript(transcriptEberline);

            await expect(page.getByText(/Uploaded "eberline\.mdb" as Source Final Transcript/i)
                .or(syncPage.toasts.filter({ hasText: /eberline\.mdb/i }))
                .first()).toBeVisible({ timeout: 25000 });

            // Dismiss Set Transcript Lines dialog if auto-detected modal appears
            const confirmBtn = page.getByRole('button', { name: /Confirm defaults/i });
            try {
                await confirmBtn.waitFor({ state: 'visible', timeout: 8000 });
                await confirmBtn.click();
                await page.waitForTimeout(1000);
            } catch (e) {
                // Modal did not appear or was already dismissed
            }

            await expect(syncPage.transcriptRadioItem).toBeVisible({ timeout: 10000 });
            await expect(syncPage.transcriptName).toHaveText('eberline.mdb');
            console.log('[Scenario B] eberline.mdb uploaded and verified.');
        });

        test('B4: Upload eberline.mpg', async () => {
            test.setTimeout(300000); // 5 minutes for uploading 130MB video asset
            console.log(`[Scenario B] Uploading media: ${mediaEberline}`);
            await syncPage.uploadMedia(mediaEberline);

            // Wait for media upload to fully complete and render in list
            await expect(page.getByText(/1 media file/i)
                .or(page.getByText(/Added "eberline\.mpg"/i))
                .or(page.getByText(/eberline\.mpg/i))
                .first()).toBeVisible({ timeout: 240000 });

            console.log('[Scenario B] eberline.mpg uploaded and added to Media list.');
        });

        test('B5: Attempt to upload Sullivan2.mp4 and verify format locking', async () => {
            test.setTimeout(60000);
            console.log(`[Scenario B] Attempting to upload incompatible format: ${mediaSullivan2}`);
            await syncPage.uploadMedia(mediaSullivan2);

            // Verify format locking rejection toast
            await expect(syncPage.toasts.filter({
                hasText: /All videos in a Sync Job must use the same file format\. You cannot mix \.mp4 and \.mpg/i
            }).first()).toBeVisible({ timeout: 15000 });

            // Verify media list still contains only the .mpg file
            const mediaItems = await syncPage.mediaListItems.allInnerTexts();
            expect(mediaItems.some(item => item.includes('eberline.mpg'))).toBeTruthy();
            expect(mediaItems.some(item => item.includes('Sullivan2.mp4'))).toBeFalsy();
            console.log('[Scenario B] Format locking verified: .mp4 upload was rejected while .mpg is active.');
        });

        test('B6: Verify Process becomes enabled', async () => {
            test.setTimeout(60000);
            // Dismiss Set Transcript Lines dialog if still visible
            const confirmBtn = page.getByRole('button', { name: /Confirm defaults/i });
            if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
                await confirmBtn.click().catch(() => {});
                await page.waitForTimeout(500);
            }

            await expect(syncPage.processHeading).toBeVisible();
            await expect(syncPage.readyToProcessText).toBeVisible({ timeout: 20000 });

            await expect(syncPage.processButton).toBeVisible();
            await expect(syncPage.processButton).toBeEnabled();
            console.log('[Scenario B] Process button is enabled and ready to run alignment.');
        });

        test('B7: Click Process and verify the progress message', async () => {
            test.setTimeout(60000);
            await syncPage.processButton.click();

            await expect(syncPage.processingStatusText
                .or(page.getByText(/Processing alignment…|Job submitted for processing|Processing/i))
                .first()).toBeVisible({ timeout: 15000 });
            console.log('[Scenario B] Synchronization started and progress message verified.');
        });

        test('B8: Wait for the Editor to open and verify the recording', async () => {
            test.setTimeout(300000); // 5 minutes timeout for alignment and editor transition
            const openEditorBtn = syncPage.openEditorButton;
            const startTime = Date.now();
            let isEditorOpen = page.url().includes('/edit');

            while (!isEditorOpen && (Date.now() - startTime < 240000)) {
                if (await openEditorBtn.isVisible().catch(() => false)) {
                    console.log('[Scenario B] Alignment ready, clicking Open Editor button...');
                    await openEditorBtn.click();
                    await page.waitForURL(/\/sync-generator\/[a-f0-9-]+\/edit/i, { timeout: 25000 }).catch(() => {});
                    isEditorOpen = page.url().includes('/edit');
                    if (isEditorOpen) break;
                }
                if (page.url().includes('/edit')) {
                    isEditorOpen = true;
                    break;
                }
                await page.waitForTimeout(6000);
                if (await syncPage.refreshButton.isVisible().catch(() => false)) {
                    await syncPage.refreshButton.click().catch(() => {});
                }
            }

            // Verify Editor elements
            expect(page.url()).toContain('/edit');
            await expect(syncPage.editorBackButton).toBeVisible({ timeout: 15000 });
            await expect(syncPage.playerContainer).toBeVisible();

            // Verify recording / transcript text
            const titleHeading = page.getByRole('heading', { level: 1 }).first();
            await expect(titleHeading).toBeVisible({ timeout: 15000 });
            const titleText = await titleHeading.innerText();
            console.log(`[Scenario B] Editor opened with Title: "${titleText}"`);
            expect(titleText.toLowerCase()).toMatch(/eberline|job_mpg/i);

            await expect(syncPage.transcriptLines.first()).toBeVisible({ timeout: 15000 });
            console.log('[Scenario B] Editor recording and transcript lines verified successfully.');
        });
    });
});
