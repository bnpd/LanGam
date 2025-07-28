import { expect, test } from '@playwright/test';

test('home page redirects to game page', async ({ page }) => {
	await page.goto('/');
	expect(page.url()).toContain('/game');
});

test('game page has expected h1', async ({ page }) => {
	await page.goto('/game');
	expect(page.locator('h1')).toBeVisible();
	expect(page.locator('h1')).toContainText('LanGam');
});

test('game page has #divTask containing title and more than 100 words', async ({ page }) => {
	await page.goto('/game');
	expect(page.locator('#divTask')).toBeVisible();
	expect(page.locator('#divTask h2, #divTask h3, #divTask h4')).toBeVisible();
	expect((await page.locator('#divTask h2, #divTask h3, #divTask h4').innerText()).length).toBeGreaterThan(1);
	expect((await page.locator('#divTask').innerText()).length).toBeGreaterThan(100);
});

test('when chapter is completely scrolled, the gameNavBtn has flash class', async ({ page }) => {
	await page.goto('/game');
	await page.evaluate(() => {
		const taskDiv = document.querySelector('#divTask');
		if (taskDiv) {
			taskDiv.scrollTop = taskDiv.scrollHeight;
		}
	});
	await page.waitForSelector('.gameNavBtn.flash', { timeout: 1000 }); // Wait for any animations or updates to complete
	expect(page.locator('.gameNavBtn:not([hidden])')).toHaveClass(/.*flash.*/);
});
