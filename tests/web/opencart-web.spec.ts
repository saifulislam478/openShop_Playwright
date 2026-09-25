import { test, expect } from '../../fixtures/pageFixtures';
import { RandomDataUtil } from '../../utils/dataGenerator';
import { DataProvider } from '../../utils/DataReader';
import { Helper } from '../../utils/helper';

const loginData = DataProvider.readLoginData();
const configuredCustomerCredentials = loginData.find((row) =>
  row.expected?.toLowerCase() === 'success'
  && row.email?.trim()
  && row.password?.trim(),
);

test.describe('OpenCart customer and shopping flows', () => {
  test('registers a new customer @web @master @sanity @regression', async ({ homePage }) => {
    const customer = {
      ...RandomDataUtil.generateCustomerData(),
      ...(configuredCustomerCredentials && {
        email: configuredCustomerCredentials.email.trim(),
        password: configuredCustomerCredentials.password.trim(),
      }),
    };

    await test.step('1) Navigate to customer registration', async () => {
      await homePage.openAccountMenu();
      const registerPage = await homePage.clickRegister();
      expect(await registerPage.isRegisterPageExists(), 'Registration page should be displayed').toBeTruthy();

      const accountPage = await registerPage.completeRegistration(customer);
      expect(await registerPage.isAccountCreated(), 'Account-created confirmation should be displayed').toBeTruthy();
      expect(await accountPage.isAuthenticatedNavigationVisible(), 'Account navigation should be available after registration').toBeTruthy();
    });

    console.log('Completed customer registration flow.');
  });

  test('logs in with configured customer credentials @web @master @sanity @regression', async ({ homePage }) => {
    const customer = {
      ...RandomDataUtil.generateCustomerData(),
      ...(configuredCustomerCredentials && {
        email: configuredCustomerCredentials.email.trim(),
        password: configuredCustomerCredentials.password.trim(),
      }),
    };

    if (!configuredCustomerCredentials) {
      await test.step('1) Register a customer when login data is unavailable', async () => {
        await homePage.openAccountMenu();
        const registerPage = await homePage.clickRegister();
        const accountPage = await registerPage.completeRegistration(customer);
        expect(await registerPage.isAccountCreated(), 'Account registration should be completed before login').toBeTruthy();
        await accountPage.logout();
        await accountPage.continueAfterLogout();
      });
    }

    await test.step(configuredCustomerCredentials ? '1) Log in with credentials from opencart_logindata' : '2) Log in with the registered customer', async () => {
      await homePage.openAccountMenu();
      const loginPage = await homePage.clickLogin();

      if (!(await loginPage.isLoginPageExists())) {
        await homePage.page.goto('http://localhost/opencart/upload/index.php?route=account/login', { waitUntil: 'domcontentloaded' });
      }

      expect(await loginPage.isLoginPageExists() || homePage.page.url().includes('route=account/login'), 'Login page should be displayed').toBeTruthy();
      const accountPage = await loginPage.login(customer.email, customer.password);
      expect(await accountPage.isMyAccountPageExists(), 'My Account page should be displayed after login').toBeTruthy();
      expect(await accountPage.isAuthenticatedNavigationVisible(), 'Authenticated account navigation should be visible').toBeTruthy();
    });

    console.log('Completed valid login flow.');
  });

  test('rejects invalid customer credentials @web @master @regression', async ({ homePage }) => {
    await test.step('1) Submit invalid credentials', async () => {
      await homePage.openAccountMenu();
      const loginPage = await homePage.clickLogin();
      await loginPage.submitCredentials('invalid@example.com', 'invalid-password');
      expect(await loginPage.isWarningVisible(), 'Login warning should be displayed').toBeTruthy();

      const warningText = await loginPage.getWarningText();
      expect(warningText, 'Login warning should explain the authentication failure')
        .toMatch(/Warning:\s*(No match for E-Mail Address and\/or Password\.|Your account has exceeded allowed number of login attempts\.)/i);
    });

    console.log('Completed invalid login flow.');
  });

  test('logs out an authenticated customer @web @master @regression', async ({ homePage }) => {
    test.skip(!Helper.hasConfiguredLogin(), 'Configure APP_EMAIL and APP_PASSWORD in .env to run the logout scenario.');
    const { email, password } = Helper.getLoginDetails();

    await test.step('1) Log in with configured credentials', async () => {
      await homePage.openAccountMenu();
      const loginPage = await homePage.clickLogin();
      const accountPage = await loginPage.login(email, password);
      expect(await accountPage.isMyAccountPageExists(), 'My Account page should be displayed before logout').toBeTruthy();
      await accountPage.logout();
      await accountPage.continueAfterLogout();
      await homePage.openAccountMenu();
      expect(await homePage.isAuthenticatedNavigationUnavailable(), 'Logout should remove authenticated account navigation').toBeTruthy();
    });

    console.log('Completed logout flow.');
  });

  test('searches for a known product @web @master @sanity @regression', async ({ homePage }) => {
    const { name } = Helper.getProductDetails();

    await test.step('1) Search for the configured product', async () => {
      await homePage.searchFor(name);
      expect(await homePage.isSearchResultsPageExists(), 'Search results page should be displayed').toBeTruthy();
    });

    await test.step('2) Verify the product appears in results', async () => {
      const productPage = await homePage.openProduct(name);
      expect(await productPage.isProductDetailsPageExists(), 'Search results should contain the configured product').toBeTruthy();
    });

    console.log('Completed product search flow.');
  });

  test('adds a product to the shopping cart @web @master @sanity @regression', async ({ homePage, productPage }) => {
    const { name, quantity } = Helper.getProductDetails();

    await test.step('1) Find and open the product', async () => {
      await homePage.searchFor(name);
      const openedProductPage = await homePage.openProduct(name);
      expect(await openedProductPage.isProductDetailsPageExists(), 'Product details page should be displayed').toBeTruthy();
      await openedProductPage.setQuantity(quantity);
      await openedProductPage.addToCart();
      expect(await openedProductPage.isProductAdded(), 'Product-added confirmation should be displayed').toBeTruthy();
    });

    await test.step('2) Verify product and quantity in the cart', async () => {
      const cartPage = await productPage.openCart();
      expect(await cartPage.isCartPageExists(), 'Shopping cart page should be displayed').toBeTruthy();
      expect(await cartPage.isProductInCart(name), 'Selected product should be present in the cart').toBeTruthy();
      expect(await cartPage.getProductQuantity(), 'Cart quantity should match the requested quantity').toBe(quantity);
    });

    console.log('Completed add-to-cart flow.');
  });

  test('completes the end-to-end shopping journey @web @master @e2e @regression', async ({ homePage }) => {
    const customer = RandomDataUtil.generateCustomerData();
    const { name, quantity } = Helper.getProductDetails();

    await test.step('1) Register and log out the new customer', async () => {
      await homePage.openAccountMenu();
      const registerPage = await homePage.clickRegister();
      const accountPage = await registerPage.completeRegistration(customer);
      expect(await registerPage.isAccountCreated(), 'Registration should complete successfully').toBeTruthy();
      expect(await accountPage.isAuthenticatedNavigationVisible(), 'New customer account navigation should be available').toBeTruthy();
      await accountPage.logout();
      await accountPage.continueAfterLogout();
    });

    await test.step('2) Log in again with the new customer credentials', async () => {
      await homePage.openAccountMenu();
      const loginPage = await homePage.clickLogin();
      const accountPage = await loginPage.login(customer.email, customer.password);
      expect(await accountPage.isMyAccountPageExists(), 'New customer should reach My Account after re-login').toBeTruthy();
    });

    await test.step('3) Search, add, and validate the product cart', async () => {
      await homePage.searchFor(name);
      const productPage = await homePage.openProduct(name);
      await productPage.setQuantity(quantity);
      await productPage.addToCart();
      const cartPage = await productPage.openCart();
      expect(await cartPage.isProductInCart(name), 'The expected product should be in the cart').toBeTruthy();
      expect(await cartPage.getProductQuantity(), 'The cart quantity should match the requested quantity').toBe(quantity);
      expect(await cartPage.getCartTotal(), 'The cart should display an applicable total').toContain('$');
    });

    console.log('Completed end-to-end shopping journey.');
  });
});
