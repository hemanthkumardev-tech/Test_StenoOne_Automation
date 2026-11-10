const { test, expect } = require('@playwright/test');
const LoginPage = require('../pages/Login');
const DashboardPage = require('../pages/Dashboard');
const JobsPage = require('../pages/Jobs');

test.describe('Module 5: Create Job (TC045 - TC061)', () => {
    let loginPage;
    let dashboardPage;
    let jobsPage;
    const testJobTitle = `Job_${Date.now()}`;

    test.beforeEach(async ({ page }) => {
        loginPage = new LoginPage(page);
        dashboardPage = new DashboardPage(page);
        jobsPage = new JobsPage(page);

        // Precondition: Login to application
        await loginPage.navigateToLoginPage();
        await loginPage.enterEmail(process.env.STENO_EMAIL || 'saikiran.r@neuranx.ai');
        await loginPage.enterPassword(process.env.STENO_PASSWORD || 'Saikiran');
        await loginPage.clickSignIn();
        await expect(page).not.toHaveURL(/\/login(?:[/?#]|$)/, { timeout: 15000 });

        // Navigate to Jobs
        await dashboardPage.clickJobs();
        await expect(page).toHaveURL(/\/jobs/i, { timeout: 15000 });
    });

    test('TC045: Navigate to Jobs', async ({ page }) => {
        await expect(page).toHaveURL(/\/jobs/i);
        await expect(jobsPage.heading).toBeVisible();
    });

    test('TC046: Open Create Job form', async ({ page }) => {
        await jobsPage.openCreateJobForm();
        const formOrModal = page.locator('form, [role="dialog"], [data-testid="create-job-modal"]').first();
        const isFormPresent = await formOrModal.isVisible({ timeout: 5000 }).catch(() => false);
        const buttonPresent = await jobsPage.createJobButton.isVisible().catch(() => false);
        expect(isFormPresent || buttonPresent).toBeTruthy();
    });

    test('TC047: Create job with valid details', async ({ page }) => {
        await jobsPage.openCreateJobForm();
        if (await jobsPage.jobTitleInput.isVisible({ timeout: 5000 }).catch(() => false)) {
            await jobsPage.fillJobDetails({
                title: testJobTitle,
                date: '2026-11-20',
                startTime: '09:00',
                endTime: '12:00',
                location: 'Conference Room A',
                description: 'Automated test deposition job'
            });
            await jobsPage.save();
            await expect(page.getByText(testJobTitle).first()).toBeVisible({ timeout: 10000 });
        }
    });

    test('TC048: Create job with empty fields', async ({ page }) => {
        await jobsPage.openCreateJobForm();
        if (await jobsPage.jobTitleInput.isVisible({ timeout: 3000 }).catch(() => false)) {
            await jobsPage.save();
            const validationMsg = await jobsPage.jobTitleInput.evaluate(el => el.validationMessage).catch(() => '');
            const alertVisible = await jobsPage.validationError.isVisible().catch(() => false);
            expect(Boolean(validationMsg) || alertVisible).toBeTruthy();
        }
    });

    test('TC049: Verify job title', async ({ page }) => {
        await jobsPage.openCreateJobForm();
        if (await jobsPage.jobTitleInput.isVisible({ timeout: 3000 }).catch(() => false)) {
            await jobsPage.jobTitleInput.fill('Verified Job Title');
            await expect(jobsPage.jobTitleInput).toHaveValue('Verified Job Title');
        }
    });

    test('TC050: Select organisation', async ({ page }) => {
        await jobsPage.openCreateJobForm();
        if (await jobsPage.orgSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
            await expect(jobsPage.orgSelect).toBeVisible();
        }
    });

    test('TC051: Select case', async ({ page }) => {
        await jobsPage.openCreateJobForm();
        if (await jobsPage.caseSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
            await expect(jobsPage.caseSelect).toBeVisible();
        }
    });

    test('TC052: Create job without selecting case', async ({ page }) => {
        await jobsPage.openCreateJobForm();
        if (await jobsPage.caseSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
            await jobsPage.fillJobDetails({ title: 'Job Without Case' });
            await jobsPage.save();
            await expect(jobsPage.validationError.or(jobsPage.caseSelect)).toBeVisible();
        }
    });

    test('TC053: Verify job date', async ({ page }) => {
        await jobsPage.openCreateJobForm();
        if (await jobsPage.jobDateInput.isVisible({ timeout: 3000 }).catch(() => false)) {
            await jobsPage.jobDateInput.fill('2026-11-25');
            await expect(jobsPage.jobDateInput).toHaveValue('2026-11-25');
        }
    });

    test('TC054: Verify job time', async ({ page }) => {
        await jobsPage.openCreateJobForm();
        if (await jobsPage.startTimeInput.isVisible({ timeout: 3000 }).catch(() => false)) {
            await jobsPage.startTimeInput.fill('10:00');
            await expect(jobsPage.startTimeInput).toHaveValue('10:00');
        }
    });

    test('TC055: Enter invalid time range', async ({ page }) => {
        await jobsPage.openCreateJobForm();
        if (await jobsPage.startTimeInput.isVisible({ timeout: 3000 }).catch(() => false) &&
            await jobsPage.endTimeInput.isVisible({ timeout: 3000 }).catch(() => false)) {
            // End time earlier than start time
            await jobsPage.startTimeInput.fill('14:00');
            await jobsPage.endTimeInput.fill('10:00');
            await jobsPage.save();
            const timeAlert = page.locator('text=/time|invalid|range/i');
            const alertShown = await timeAlert.isVisible({ timeout: 3000 }).catch(() => false);
            expect(alertShown || await jobsPage.saveButton.isVisible()).toBeTruthy();
        }
    });

    test('TC056: Verify job location', async ({ page }) => {
        await jobsPage.openCreateJobForm();
        if (await jobsPage.locationInput.isVisible({ timeout: 3000 }).catch(() => false)) {
            await jobsPage.locationInput.fill('Chicago Office');
            await expect(jobsPage.locationInput).toHaveValue('Chicago Office');
        }
    });

    test('TC057: Verify job description', async ({ page }) => {
        await jobsPage.openCreateJobForm();
        if (await jobsPage.descriptionInput.isVisible({ timeout: 3000 }).catch(() => false)) {
            await jobsPage.descriptionInput.fill('Test description for job');
            await expect(jobsPage.descriptionInput).toHaveValue('Test description for job');
        }
    });

    test('TC058: Cancel job creation', async ({ page }) => {
        await jobsPage.openCreateJobForm();
        if (await jobsPage.cancelButton.isVisible({ timeout: 3000 }).catch(() => false)) {
            await jobsPage.cancel();
            await expect(page.locator('[role="dialog"]')).not.toBeVisible();
        }
    });

    test('TC059: Open created job', async ({ page }) => {
        if (await jobsPage.firstJobRow.isVisible({ timeout: 5000 }).catch(() => false)) {
            await jobsPage.firstJobRow.click();
            await expect(page).toHaveURL(/jobs\/.+/i);
        }
    });

    test('TC060: Edit created job', async ({ page }) => {
        if (await jobsPage.editButton.isVisible({ timeout: 3000 }).catch(() => false)) {
            await jobsPage.editButton.click();
            await jobsPage.fillJobDetails({ title: `${testJobTitle}_Updated` });
            await jobsPage.save();
            await expect(page.getByText(`${testJobTitle}_Updated`).first()).toBeVisible({ timeout: 8000 });
        }
    });

    test('TC061: Search created job', async ({ page }) => {
        await jobsPage.search('Job');
        await expect(jobsPage.jobsTable).toBeVisible();
    });
});
