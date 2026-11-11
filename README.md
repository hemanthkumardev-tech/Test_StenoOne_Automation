# StenoOne Automation

Playwright end-to-end tests for [dev.steno.one](https://dev.steno.one).

## Setup

1. Install dependencies and the Chromium browser:

   ```powershell
   npm install
   npx playwright install chromium
   ```

2. Create a `.env` file in the project root with the login credentials (this file is gitignored):

   ```
   STENO_EMAIL=your.email@example.com
   STENO_PASSWORD=your-password
   ```

## Run only the Cases tests

```powershell
npm run test:cases
```

This runs `tests/04_create_case.spec.js` (TC029 - TC044) in a single, maximized Chrome window so you can watch every step:

- Logs in once, then runs all case tests in order on the same page.
- Actions are slowed down (`slowMo: 500`) so each step is visible.
- Uses the `cases-chrome` project in `playwright.config.js`; change `slowMo` there to speed up or slow down.

To run a single case test, add `--grep` with its ID:

```powershell
npm run test:cases -- --grep TC031
```

Note: each run creates a real case named `Case_<timestamp>` (renamed to `Case_<timestamp>_Updated` by TC042) in dev.steno.one.

## Run all tests

```powershell
npx playwright test
```
