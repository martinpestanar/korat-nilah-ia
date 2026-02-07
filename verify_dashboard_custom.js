
import { chromium } from 'playwright';
import path from 'path';
import process from 'process';

// FORCE SET HOME to USERPROFILE to bypass the missing env var issue
process.env.HOME = process.env.USERPROFILE || "C:\\Users\\Martin";

console.log('🚀 Starting custom browser verification (ESM)...');
console.log('🏠 HOME set to:', process.env.HOME);

(async () => {
    try {
        const browser = await chromium.launch({ headless: true });
        const context = await browser.newContext();
        const page = await context.newPage();

        console.log('🌐 Navigating to Dashboard...');
        await page.goto('http://localhost:5173/app/dashboard', { waitUntil: 'networkidle' });

        console.log('✅ Page loaded. Title:', await page.title());

        // Check for key widgets
        const atRiskVisible = await page.isVisible('text=Requieren Atención');
        const retentionVisible = await page.isVisible('text=Inteligencia de Retención');
        const operativaVisible = await page.isVisible('text=Operativa del Día');
        const heatmapVisible = await page.isVisible('text=Mapa de Calor');

        console.log('Widgets Visibility:');
        console.log('- At Risk Clients:', atRiskVisible ? 'VISIBLE' : 'NOT FOUND');
        console.log('- Retention Intelligence:', retentionVisible ? 'VISIBLE' : 'NOT FOUND');
        console.log('- Operativa:', operativaVisible ? 'VISIBLE' : 'NOT FOUND');
        console.log('- Heatmap:', heatmapVisible ? 'VISIBLE' : 'NOT FOUND');

        // Take screenshot
        const screenshotPath = path.resolve('dashboard_verification.png');
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log('📸 Screenshot saved to:', screenshotPath);

        await browser.close();
        console.log('🎉 Verification Complete!');

    } catch (error) {
        console.error('❌ Browser Verification Failed:', error);
        process.exit(1);
    }
})();
