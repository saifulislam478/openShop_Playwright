import { Locator, Page } from '@playwright/test';
import { CartPage } from './CartPage';
import { LoginPage } from './LoginPage';
import { RegisterPage } from './RegisterPage';
import { ProductPage } from './ProductPage';

export class HomePage {
  private readonly page: Page;

  // Locators
  private readonly accountMenu: Locator;
  private readonly registerLink: Locator;
  private readonly loginLink: Locator;
  private readonly searchInput: Locator;
  private readonly searchButton: Locator;
  private readonly cartLink: Locator;
  private readonly searchResultsHeading: Locator;
  private readonly logoutLink: Locator;

  constructor(page: Page) {
    this.page = page;

    // Initialize locators with CSS selectors
    this.accountMenu = page.getByRole('link', { name: /My Account/i }).first();
    this.registerLink = page.getByRole('link', { name: /^register$/i });
    this.loginLink = page.getByRole('link', { name: /^login$/i }).first();
    this.searchInput = page.getByPlaceholder(/search/i);
    this.searchButton = page.locator('form[action*="search"] button, button[aria-label*="Search"]');
    this.cartLink = page.getByRole('link', { name: /shopping cart/i }).first();
    this.searchResultsHeading = page.locator('#content h1');
    this.logoutLink = page.getByRole('link', { name: /^logout$/i });
  }

  /** Opens the My Account menu. */
  async openAccountMenu(): Promise<void> {
    if (!(await this.accountMenu.isVisible().catch(() => false))) {
      // await this.page.goto('http://localhost/opencart/upload/');
      await this.page.goto("https://awesomeqa.com/ui/");
    }
    await this.accountMenu.click();
  }

  /** Navigates to customer registration. */
  async clickRegister(): Promise<RegisterPage> {
    const registerUrl = new URL('index.php?route=account/register', this.page.url()).toString();
    if (await this.registerLink.isVisible().catch(() => false)) {
      await this.registerLink.click();
    } else {
      await this.page.goto(registerUrl);
    }
    return new RegisterPage(this.page);
  }

  /** Navigates to customer login. */
  async clickLogin(): Promise<LoginPage> {
    const loginUrl = new URL('index.php?route=account/login', 'http://localhost/opencart/upload/').toString();
    if (await this.loginLink.isVisible().catch(() => false)) {
      await this.loginLink.click();
    } else {
      await this.page.goto(loginUrl, { waitUntil: 'domcontentloaded' });
    }
    return new LoginPage(this.page);
  }

  /** Searches for a product by name. */
  async searchFor(productName: string): Promise<void> {
    await this.searchInput.fill(productName);
    await this.searchButton.click();
  }

  /** Verifies that the product search results page is displayed. */
  async isSearchResultsPageExists(): Promise<boolean> {
    return this.searchResultsHeading.isVisible();
  }

  /** Verifies that authenticated logout navigation is unavailable. */
  async isAuthenticatedNavigationUnavailable(): Promise<boolean> {
    return this.logoutLink.isHidden();
  }

  /** Opens the shopping cart. */
  async openCart(): Promise<CartPage> {
    await this.cartLink.click();
    return new CartPage(this.page);
  }

  /** Opens the first product card whose name contains the supplied text. */
  async openProduct(productName: string): Promise<ProductPage> {
    const productLink = this.page.getByRole('link', { name: new RegExp(productName, 'i') }).first();
    await productLink.click();
    return new ProductPage(this.page);
  }
}
