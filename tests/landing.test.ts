import { test, expect } from '@playwright/test';

test.describe('Landing page', () => {
  test('video should be there when page loads', async ({ page }) => {
    await page.goto('/');
    
    // Wait for video element to be present
    const video = page.locator('video').first();
    await expect(video).toBeVisible();
    
    // Check video attributes
    await expect(video).toHaveAttribute('autoplay', '');
    await expect(video).toHaveAttribute('muted', '');
    await expect(video).toHaveAttribute('playsinline', '');
  });

  test('CTA buttons should navigate to /game', async ({ page }) => {
    await page.goto('/');
    
    // Test hero CTA button
    const heroCta = page.getByRole('button', { name: /start/i }).first();
    await expect(heroCta).toBeVisible();
    await expect(heroCta).toHaveAttribute('data-umami-event', 'Landing Hero CTA');

    await heroCta.click();
	await expect(page).toHaveURL('/game');
    
    // Go back and test footer CTA button
    await page.goto('/');
    const footerCta = page.getByRole('button', { name: /start/i }).last();
    await expect(footerCta).toBeVisible();
    await expect(footerCta).toHaveAttribute('data-umami-event', 'Landing Footer CTA');
    
    await footerCta.click();
	await expect(page).toHaveURL('/game');
  });

  test('localization should work for all languages', async ({ page }) => {
    // Test English (default)
    await page.goto('/');
    expect(await page.locator('html').getAttribute('lang')).toBe('en');
    
    // Store English texts for comparison
    const enPageTitle = await page.title();
    const enHeroText = await page.locator('.card h1').textContent();
    
    // Test Spanish
    await page.evaluate(() => localStorage.setItem('PARAGLIDE_LOCALE', 'es'));
    await page.reload({ waitUntil: 'networkidle'});
    //expect(await page.locator('html').getAttribute('lang')).toBe('es');
    const esPageTitle = await page.title();
    const esHeroText = await page.locator('.card h1').textContent();
    expect(enPageTitle).not.toBe(esPageTitle);
    expect(esHeroText).not.toBe(enHeroText);
    
    // Test Hindi
    await page.evaluate(() => localStorage.setItem('PARAGLIDE_LOCALE', 'hi'));
    await page.reload({ waitUntil: 'networkidle'});
    //expect(await page.locator('html').getAttribute('lang')).toBe('hi');
    const hiPageTitle = await page.title();
    const hiHeroText = await page.locator('.card h1').textContent();
    expect(hiPageTitle).not.toBe(enPageTitle);
    expect(hiPageTitle).not.toBe(esPageTitle);
    expect(hiHeroText).not.toBe(enHeroText);
    expect(hiHeroText).not.toBe(esHeroText);
  });
});
