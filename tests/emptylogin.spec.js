
const { test, expect } = require('@playwright/test');

test('Verify login with empty fields', async ({ page }) => {

    // Open login page
    await page.goto('https://dev.steno.one/login');

    // Identify input fields
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('#password');

    // Click Sign In without entering credentials
    await page.getByRole('button', {
        name: 'Sign In',
        exact: true
    }).click();

    // Check browser validation messages
    const emailValidation = await emailInput.evaluate(
        element => element.validationMessage
    );

    const passwordValidation = await passwordInput.evaluate(
        element => element.validationMessage
    );

    console.log('Email validation:', emailValidation);
    console.log('Password validation:', passwordValidation);

    // Verify required-field validation
    expect(emailValidation).not.toBe('');
    expect(passwordValidation).not.toBe('');

});
