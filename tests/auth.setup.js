
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const LoginPage = require('../pages/Login');

async function performLoginAndSave(browser, email, password, storageFileName) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const loginPage = new LoginPage(page);

    try {
        console.log(`[AUTH] Initiating authentication for: ${email}`);

        await test.step(`Login using ${storageFileName}`, async () => {
            await loginPage.navigateToLoginPage();

            await expect(loginPage.emailInput).toBeVisible({ timeout: 15000 });
            await expect(loginPage.passwordInput).toBeVisible({ timeout: 15000 });

            await loginPage.enterEmail(email);
            await loginPage.enterPassword(password);
            await loginPage.clickSignIn();

            await Promise.race([
                page.waitForURL(
                    url => !url.pathname.includes('/login'),
                    { timeout: 20000 }
                ).catch(() => null),

                loginPage.errorMessage.waitFor({
                    state: 'visible',
                    timeout: 20000
                }).catch(() => null)
            ]);

            await loginPage.dashboardHeader.waitFor({
                state: 'visible',
                timeout: 15000
            }).catch(() => null);

            const dashboardVisible = await loginPage.dashboardHeader
                .isVisible()
                .catch(() => false);

            console.log(
                `[AUTH] Dashboard visible for ${email}: ${dashboardVisible}`
            );

            if (!dashboardVisible) {
                throw new Error(
                    `Login was not successful for ${email}. Check credentials.`
                );
            }
        });

        await test.step(`Save ${storageFileName} authentication state`, async () => {
            const authDirectory = path.join(process.cwd(), '.auth');

            fs.mkdirSync(authDirectory, { recursive: true });

            const targetPath = path.join(authDirectory, storageFileName);

            await context.storageState({ path: targetPath });

            console.log(
                `[AUTH] Authentication state saved to: ${storageFileName}`
            );
        });
    } finally {
        await context.close();
    }
}

// Existing Organization Admin authentication
test('authenticate organization admin and save session', async ({ browser }) => {
    test.setTimeout(90000);

    const email = (process.env.STENO_EMAIL || '').trim();
    const password = (process.env.STENO_PASSWORD || '').trim();

    if (!email || !password) {
        throw new Error('STENO_EMAIL or STENO_PASSWORD missing in .env');
    }

    await performLoginAndSave(browser, email, password, 'user.json');

    const authDir = path.join(process.cwd(), '.auth');

    fs.copyFileSync(
        path.join(authDir, 'user.json'),
        path.join(authDir, 'orgadmin.json')
    );

    console.log('[AUTH] Mirrored session to orgadmin.json successfully.');
});

// Existing SuperAdmin authentication
test('authenticate super admin and save session', async ({ browser }) => {
    test.setTimeout(90000);

    const email = (process.env.SUPERADMIN_EMAIL || '').trim();
    const password = (process.env.SUPERADMIN_PASSWORD || '').trim();

    if (email && password) {
        await performLoginAndSave(
            browser,
            email,
            password,
            'superadmin.json'
        );
    } else {
        console.log(
            '[AUTH] SuperAdmin credentials not configured, skipping.'
        );
    }
});

// NEW: Second Admin authentication for Product Sync Generator testing
test('authenticate sync admin and save session', async ({ browser }) => {
    test.setTimeout(90000);

    const email = (process.env.SYNC_ADMIN_EMAIL || '').trim();
    const password = (process.env.SYNC_ADMIN_PASSWORD || '').trim();

    if (email && password) {
        await performLoginAndSave(
            browser,
            email,
            password,
            'sync_admin.json'
        );
    } else {
        console.log(
            '[AUTH] Sync Admin credentials not configured, skipping.'
        );
    }
});
