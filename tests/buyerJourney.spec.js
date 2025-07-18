// tests/buyer-journey.spec.ts
import { test, expect } from '@playwright/test';

// Test suite for the main Buyer Journey
test.describe('Buyer Journey', () => {

  // Before each test, navigate to the login page and log in
  test.beforeEach(async ({ page }) => {
    await page.goto('https://es.beta.wallapop.com/');


    // Click the login link and fill out the form
    await page.getByRole('button', { name: 'Regístrate o inicia sesión' }).click();
    const acceptCookiesButton = page.getByRole('button', { name: 'Aceptar todo' })
    expect(acceptCookiesButton).toBeVisible();
    await acceptCookiesButton.click({ force: true });

    await page.getByRole('button', { name: 'Iniciar sesión' }).click();
    await page.locator('input[type="email"]').fill('qa.test@wallapop.com');
    await page.locator('input[type="password"]').fill('12345678');
    await page.getByRole('button', { name: 'Acceder a Wallapop' }).click();

    // Wait for the main page to load after login by checking for the search bar
    await expect(page.locator('input[type="search"]')).toBeVisible({ timeout: 15_000 });
  });

  // Test 1: Verify user can search for an item and see results
  test('should allow a user to search for an item', async ({ page }) => {
    const searchTerm = 'bicicleta';

    // Type in the search term and press Enter
    await page.locator('input[type="search"]').fill(searchTerm);
    await page.keyboard.press('Enter');

    //verify that at least one item is displayed and the search term matches the search results
    const firstBikeLink = page.locator('a', { hasText: searchTerm }).first();
    await expect(firstBikeLink).toBeVisible();
  });

  // Test 2: Verify user can open a product and see its details
  test('should allow a user to view a product detail page', async ({ page }) => {
    const searchTerm = 'bicicleta';
  
    // Perform the search
    await page.locator('input[type="search"]').fill(searchTerm);
    await page.keyboard.press('Enter');
  
    // Click on the first bike link
    const firstBikeLink = page.locator('a', { hasText: searchTerm }).first();
    await firstBikeLink.evaluate(el => el.removeAttribute('target'));
    await firstBikeLink.click();
  
    // Setup popup listener before the click
    const popupPromise = new Promise(resolve => {
      page.once('popup', popup => resolve(popup));
    });
  
    // Click 'Comprar'
    const comprarButton = page.getByRole('button', { name: 'Comprar' });
    await comprarButton.click();
  
    // Wait for popup page and interact with it
    const newPage = await popupPromise;
    await newPage.waitForLoadState();
  
    await newPage.getByText('En persona').click();
    await newPage.waitForTimeout(300);
    await newPage.getByText('Continuar').click();
    await newPage.waitForTimeout(300);
    await newPage.getByText('Continuar').click();
    //expect the Pay button to be visible
    expect(await newPage.getByText('Pagar')).toBeVisible();
  });
  // Test 3: Verify that the user can login and change its personal information
  test ('should login and change some personal information', async ({ page }) => {
    const myProfile = await page.getByRole('link', { name: 'Avatar Tú' });

    // Navigate to profile/settings
    await myProfile.click();
    await page.waitForTimeout(300);
    await page.getByText('Configuración').click();
    await page.getByText('Dirección de envío').click();

    // Update personal information
    const newName = `Test Name ${Date.now()}`;
    const newStreet = 'Test123'
    const newPostalCode = '08023'
    const newPhone = '653192183'
    await page.getByRole('textbox', { name: 'Nombre y apellidos Calle y nú' }).fill(newName)
    await page.getByText('Calle y número').fill(newStreet);
    await page.getByText('Código postal').fill(newPostalCode);
    await page.getByText('Número de teléfono móvil').fill(newPhone);

    // Save changes
    await page.getByRole('button', { name: 'Guardar' }).click();

    // Assertion
    await expect(page.getByText('La dirección se ha editado correctamente. ¡Perfecto!')).toBeVisible();
  });
  // Test 4: Search for a product and speak to the buyer
  test ('should search for a product and speak to the buyer', async ({ page }) => {
    const searchTerm = 'bicicleta';

    // Perform the search first
    await page.locator('input[type="search"]').fill(searchTerm);
    await page.keyboard.press('Enter');
    const firstBikeLink = page.locator('a', { hasText: searchTerm }).first();
    //remove the target to not let the page to go to another tab
    await firstBikeLink.evaluate(element => element.removeAttribute('target'));
    await firstBikeLink.click();

    // Open the chat
    const chatBuyer = page.getByRole('button', { name: 'Chat' });
    await chatBuyer.click();
    const popupPromise = new Promise(resolve => {
      page.once('popup', popup => resolve(popup));
    });
    const newPage = await popupPromise; 
    await newPage.waitForLoadState();
    
    // Send a message to the buyer
    const textmessage = 'test message'
    await newPage.getByRole('textbox', {name: 'Escribe un mensaje...' }).fill(textmessage);
    await newPage.keyboard.press('Enter');
    //check that the last message sent is the message sent by the system
    expect (await newPage.getByText(textmessage).last()).toBeVisible();
  });
});