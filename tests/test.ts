import { expect, test, type Page } from '@playwright/test';
import { createTestUser } from './testDataFactory';

test('home page redirects to game page', async ({ page }) => {
	await page.goto('/');
	expect(page.url()).toContain('/game');
});

async function waitForChapterLoad(page: Page) {
	expect((await page.locator('#divTask h2, #divTask h3, #divTask h4').innerText()).length).toBeGreaterThan(5);
}

test.describe('Game, not signed in', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/game');
	});
	
	test('game page has h1 titled "LanGam"', async ({ page }) => {
		expect(page.locator('h1', { hasText: 'LanGam' })).toBeVisible();
	});
	
	test('game page has #divTask containing title with #1 and more than 300 words', async ({ page }) => {
		expect(page.locator('#divTask')).toBeVisible();
		expect(page.locator('#divTask h2, #divTask h3, #divTask h4')).toBeVisible();
		expect((await page.locator('#divTask h2, #divTask h3, #divTask h4').innerText()).length).toBeGreaterThan(5);
		expect((await page.locator('#divTask h2, #divTask h3, #divTask h4').innerText())).toContain('#1');
		expect((await page.locator('#divTask').innerText()).length).toBeGreaterThan(300);
	});
	
	test('when chapter is completely scrolled, the gameNavBtn has flash class', async ({ page }) => {
		await waitForChapterLoad(page);
		await page.evaluate(() => {
			const taskDiv = document.querySelector('#divTask');
			if (taskDiv) {
				taskDiv.scrollTop = taskDiv.scrollHeight;
			}
		});
		await page.waitForSelector('.gameNavBtn.flash', { timeout: 1000 }); // Wait for any animations or updates to complete
		expect(page.locator('.gameNavBtn:not([hidden])')).toHaveClass(/.*flash.*/);
	});
	
	test('when "Show translation" button is clicked, we ask to choose a language. After choosing, the translation is shown. Language is remembered on page reload.', async ({ page }) => {
		await page.getByRole('button', { name: 'Show translation' }).click();
	
		// select with options and label
		expect(page.locator('select#nativeLang')).toBeVisible();
		await expect(page.locator("select#nativeLang option").nth(3)).toBeAttached(); // equivalent to this, but waits: expect(await page.locator('select#nativeLang option').count()).toBeGreaterThan(2);
		expect(page.locator('label[for="nativeLang"]')).toBeVisible();
	
		await page.selectOption('select#nativeLang', 'it');
	
		// solution field with translation > 300 characters
		await expect(page.locator('#solutionField')).toBeVisible({timeout: 10000});
		await expect((await page.locator('#solutionField').innerText()).length).toBeGreaterThan(300);
	
		await page.reload();
		await waitForChapterLoad(page);
		await page.getByRole('button', { name: 'Show translation' }).click();
	
		// select should not be visible anymore, just solution field
		await expect(page.locator('select#nativeLang')).toHaveCount(0);
		await expect(page.locator('#solutionField')).toBeVisible({timeout: 10000});
		expect((await page.locator('#solutionField').innerText()).length).toBeGreaterThan(300);
	});
	
	test('when help button is clicked, a popup with heading and >200 chars is shown can can be closed', async ({ page }) => {
	  await waitForChapterLoad(page);
	  await page.getByRole('button', { name: '❔' }).click();
	  let popup = page.locator('.popup');
	  await expect(popup).toBeVisible();
	  await expect(popup.getByRole('heading')).toBeVisible();
	  expect((await popup.textContent())?.length).toBeGreaterThan(200);
	  await page.locator('.close-button').click();
	  await expect(popup).not.toBeVisible();
	});
	
	test('when register button is clicked, we navigate to the signup page', async ({ page }) => {
		await waitForChapterLoad(page);
		await page.getByRole('button', { name: 'Register' }).click();
		await expect(page).toHaveURL('/signup');
	});

	test('tts button cycles through 3 states: off, autoplay, and playing', async ({ page }) => {
		await expect(page.getByRole('button', { name: '🔈' })).toBeVisible();
		await page.getByRole('button', { name: '🔈' }).click();
		await expect(page.getByRole('button', { name: '🔊' })).toBeVisible();
		await page.getByRole('button', { name: '🔊' }).click();
		await expect(page.getByRole('button', { name: '🔉' })).toBeVisible();
		await page.getByRole('button', { name: '🔉' }).click();
		await expect(page.getByRole('button', { name: '🔈' })).toBeVisible();
	});

	test('tutor chat can be opened and closed', async ({ page }) => {
		await page.getByRole('button', { name: '🗨' }).click();
		await expect(page.locator('#iChat')).toBeVisible();
		await page.getByRole('button', { name: 'x' }).click();
		await expect(page.locator('#iChat')).not.toBeVisible();
	});

	test('tutor chat can submit messages and gets a response which persists when chat is reopened', async ({ page }) => {
		let prompt = 'What\'s your name?';

		await page.getByRole('button', { name: '🗨' }).click();
		await expect(page.locator('#iChat')).toBeVisible();
		// Click, Fill the chat input and submit
		await page.locator('#iChat').click();
		await page.locator('#iChat').fill(prompt);
		await page.getByRole('button', { name: '➥' }).click();

		await expect(page.locator('#messageHistoryContainer')).toBeVisible();
		await expect(page.locator('#messageHistoryContainer')).toContainText(prompt);
		await expect(page.locator('#messageHistoryContainer > *')).toHaveCount(2); // one for user, one for AI response
		await expect(page.locator('#messageHistoryContainer')).toContainText('AI'); // we need to clarify that the response is by AI

		// Close the chat
		await page.getByRole('button', { name: 'x' }).click();
		await expect(page.locator('#iChat')).not.toBeVisible();

		// Reopen the chat
		await page.getByRole('button', { name: '🗨' }).click();
		await expect(page.locator('#iChat')).toBeVisible();

		await expect(page.locator('#messageHistoryContainer')).toBeVisible();
		await expect(page.locator('#messageHistoryContainer')).toContainText(prompt);
		await expect(page.locator('#messageHistoryContainer > *')).toHaveCount(2); // one for user, one for AI response
		await expect(page.locator('#messageHistoryContainer')).toContainText('AI'); // we need to clarify that the response is by AI
	});

	test('tutor chat shows at least one suggested prompt and gets a response if that is submitted', async ({ page }) => {
		await page.getByRole('button', { name: '🗨' }).click();
		await expect(page.locator('#iChat')).toBeVisible();
		// Click suggested prompt
  		await expect(page.locator('.promptSuggestion')).toBeVisible();
		let prompt = await page.locator('.promptSuggestion').first().textContent();
		await page.locator('.promptSuggestion').click();

		await expect(page.locator('#messageHistoryContainer')).toBeVisible();
		await expect(page.locator('#messageHistoryContainer')).toContainText(prompt!);
		await expect(page.locator('#messageHistoryContainer > *')).toHaveCount(2); // one for user, one for AI response
		await expect(page.locator('#messageHistoryContainer')).toContainText('AI'); // we need to clarify that the response is by AI

		// Close the chat
		await page.getByRole('button', { name: 'x' }).click();
		await expect(page.locator('#iChat')).not.toBeVisible();
	});

	test('when forward gameNavBtn button is clicked, and success popup dismissed, the next chapter is shown', async ({ page }) => {
		await waitForChapterLoad(page);
		await page.locator('.gameNavBtn:not([hidden])').click();
	
		// popup with title
		expect(page.locator('.popup')).toBeVisible();
		expect(page.locator('.popup h1, .popup h2, .popup h3, .popup h4')).toBeVisible();
		expect(page.locator('.close-button')).toBeVisible();
		await page.locator('.close-button').click();
	
		// next chapter with title containing #2 and divTask more than 300 characters
		await expect(page.locator('#divTask')).toBeVisible();
		await expect(page.locator('#divTask h2, #divTask h3, #divTask h4')).toBeVisible();
		expect((await page.locator('#divTask h2, #divTask h3, #divTask h4').innerText()).length).toBeGreaterThan(5);
		expect((await page.locator('#divTask h2, #divTask h3, #divTask h4').innerText())).toContain('#2');
		expect((await page.locator('#divTask').innerText()).length).toBeGreaterThan(300);
	});

	test('Happy path til level 3 including chat and eventual signup', async ({ page }) => {
		await page.getByRole('button', { name: '▶' }).click();
		await page.getByRole('button', { name: 'Close' }).click();

		await expect(page.getByText('#2')).toBeVisible();
		await expect(page.locator('.gameNavBtn:not(.nav-locked)', {hasText: '▶'})).toHaveCount(0);
		await expect(page.locator('.gameNavBtn.nav-locked', {hasText: '▶'})).toHaveCount(2);

		await page.locator('.gameNavBtn.nav-locked', {hasText: '▶'}).first().click();
		await expect(page.locator('#toast')).toBeVisible();

		await expect(page.locator('#divTask #messageHistoryContainer')).toBeVisible();
		await expect(page.locator('#divTask #iChat')).toBeVisible();
		await page.getByRole('button', { name: 'AI' }).click();
		await page.locator('#divTask #iChat').fill('Ready!');
		await page.getByRole('button', { name: '➥' }).click();

		let enabledForwardBtn = page.locator('.gameNavBtn:not(.nav-locked)', {hasText: '▶'});
		await expect(enabledForwardBtn).toHaveCount(1);
		await expect(enabledForwardBtn).toBeVisible();
		await enabledForwardBtn.click();

		await page.getByRole('button', { name: 'Close' }).click();
		await expect(page.getByText('Save your progress!')).toBeVisible();
		await page.getByRole('button', { name: 'Later' }).click();

		await page.getByRole('button', { name: '🪄' }).click();
		await expect(page.getByText('Stats and Powers')).toBeVisible();
		await page.getByRole('button', { name: 'Done' }).click();
		await page.getByRole('button', { name: 'Register' }).click();
		await expect(page).toHaveURL('/signup');
	});
});

test.describe('Game, signed in', () => {

});

test.describe('Signup', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/signup', {waitUntil: 'networkidle'}); // even though discouraged, in this case we need to wait for all svelte chunks to be loaded. If we don't the form will be submitted as html form instead of using eventHandler with preventDefault
	});

	test('signup page has heading', async ({ page }) => {
		expect(page.getByRole('heading')).toBeVisible();
	});
	
	test('signup form has email, password and password confirm fields, acceptConditions checkbox and a submit button', async ({ page }) => {
		expect(page.locator('input[name="email"]')).toBeVisible();
		expect(page.locator('input[name="password"]')).toBeVisible();
		expect(page.locator('input[name="passwordConfirm"]')).toBeVisible();
		expect(page.locator('input[name="acceptConditions"][type="checkbox"]')).toBeVisible();
		expect(page.getByRole('button', { name: 'Register' })).toBeVisible();
	});
	
	test('when signup form is submitted with valid data, we are redirected to the game page', async ({ page }) => {
		const currentTime = new Date().getTime();
		await page.fill('input[name="email"]', `testuser${currentTime}@example.com`);
		await page.fill('input[name="password"]', 'passwOrd123!');
		await page.fill('input[name="passwordConfirm"]', 'passwOrd123!');
		await page.check('input[name="acceptConditions"]');
		await page.getByRole('button', { name: 'Register' }).click();
		await expect(page).toHaveURL('/game');
	});

	test('does not succeed for invalid email', async ({ page }) => {
		await page.fill('input[name="email"]', 'invalid@email');
		await page.fill('input[name="password"]', 'passwOrd123!');
		await page.fill('input[name="passwordConfirm"]', 'passwOrd123!');
		await page.check('input[name="acceptConditions"]');
		await page.getByRole('button', { name: 'Register' }).click();

		// expect to remain on signup page
		await page.waitForTimeout(500);
		expect(page.url()).toContain('/signup');
	});

	test('does not succeed for password mismatch', async ({ page }) => {
		await page.fill('input[name="email"]', 'testuser@example.com');
		await page.fill('input[name="password"]', 'passwOrd123!');
		await page.fill('input[name="passwordConfirm"]', 'differentPassword!');
		await page.check('input[name="acceptConditions"]');
		await page.getByRole('button', { name: 'Register' }).click();

		// expect to remain on signup page
		await page.waitForTimeout(500);
		expect(page.url()).toContain('/signup');
	});

	test('does not succeed when conditions not accepted', async ({ page }) => {
		await page.fill('input[name="email"]', 'testuser@example.com');
		await page.fill('input[name="password"]', 'passwOrd123!');
		await page.fill('input[name="passwordConfirm"]', 'passwOrd123!');
		await page.uncheck('input[name="acceptConditions"]');
		await page.getByRole('button', { name: 'Register' }).click();

		// expect to remain on signup page
		await page.waitForTimeout(500);
		expect(page.url()).toContain('/signup');
	});

	test('shows Go to login link that redirects to login page', async ({ page }) => {
		await page.getByRole('link', { name: 'login' }).click();
		await expect(page.locator('input[type="submit"]')).toContainText('Login');
	});
});

test.describe('Login', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/login', {waitUntil: 'networkidle'}); // even though discouraged, in this case we need to wait for all svelte chunks to be loaded. If we don't the form will be submitted as html form instead of using eventHandler with preventDefault
	});

	test('login page has heading', async ({ page }) => {
		expect(page.getByRole('heading')).toBeVisible();
	});

	test('login form has email and password fields and a submit button', async ({ page }) => {
		expect(page.locator('input[name="email"]')).toBeVisible();
		expect(page.locator('input[name="password"]')).toBeVisible();
		expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
	});

	test('when login form is submitted with valid data, we are redirected to the game page', async ({ page }) => {
		let testUser = await createTestUser();
		console.log(`Created test user: ${testUser.email}`);
		
		await page.fill('input[name="email"]', testUser.email);
		await page.fill('input[name="password"]', testUser.password);
		await page.getByRole('button', { name: 'Login' }).click();
		await expect(page).toHaveURL('/game');
	});

	test('does not succeed for invalid password', async ({ page }) => {
		await page.fill('input[name="email"]', 'testuser@example.com');
		await page.fill('input[name="password"]', 'invalidPassword!');
		await page.getByRole('button', { name: 'Login' }).click();

		// expect to remain on login page
		await page.waitForTimeout(500);
		expect(page.url()).toContain('/login');
	});

	test('does not succeed for invalid email', async ({ page }) => {
		await page.fill('input[name="email"]', 'non-existing@email.com');
		await page.fill('input[name="password"]', 'passwOrd123!');
		await page.getByRole('button', { name: 'Login' }).click();

		// expect to remain on login page
		await page.waitForTimeout(500);
		expect(page.url()).toContain('/login');
	});

	test('shows Go to login link that redirects to login page', async ({ page }) => {
		await page.getByRole('link', { name: 'Register' }).click();
		await expect(page.locator('input[type="submit"]')).toContainText('Register');
	});
});
