import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    const errors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            errors.push(msg.text());
        }
    });
    page.on('pageerror', error => {
        errors.push(error.message);
    });

    await page.goto('http://localhost:3000/#/nilah/login');

    // Login with correct email according to loginMock
    await page.fill('input[type="email"]', 'admin@korat.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(3000); // give it time to load the dashboard and trigger RPC calls

    console.log('CONSOLE ERRORS DUMP:');
    console.log(JSON.stringify(errors, null, 2));

    await browser.close();
})();
