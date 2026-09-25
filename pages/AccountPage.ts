import { Locator, Page } from '@playwright/test';
import { HomePage } from './HomePage';
import { LoginPage } from './LoginPage';

export class AccountPage {
  private readonly page: Page;

  // Locators
  private readonly accountHeading: Locator;
  private readonly logoutLink: Locator;
  private readonly continueButton: Locator;
  private readonly accountMenu: Locator;

  constructor(page: Page) {
    this.page = page;

    // Initialize locators with CSS selectors
    this.accountHeading = page.locator('#content h1');
    this.logoutLink = page.getByRole('link', { name: /^logout$/i });
    this.continueButton = page.getByRole('link', { name: /^continue$/i });
    this.accountMenu = page.getByRole('link', { name: /my account/i });
  }

  /** Verifies that the authenticated My Account page is displayed. */
  async isMyAccountPageExists(): Promise<boolean> {
    return this.accountHeading.isVisible();
  }

  /** Verifies that authenticated account navigation is available. */
  async isAuthenticatedNavigationVisible(): Promise<boolean> {
    return this.logoutLink.isVisible();
  }

  /** Logs out the current customer. */
  async logout(): Promise<void> {
    await this.logoutLink.click();
  }

  /** Returns to the home page from the logout confirmation page. */
  async continueAfterLogout(): Promise<HomePage> {
    await this.continueButton.click();
    return new HomePage(this.page);
  }

  /** Opens the account menu from an authenticated page. */
  async openAccountMenu(): Promise<void> {
    await this.accountMenu.click();
  }

  /** Navigates to the login page from the account menu. */
  async openLogin(): Promise<LoginPage> {
    const loginLink = this.page.getByRole('link', { name: /^login$/i });
    await loginLink.click();
    return new LoginPage(this.page);
  }
}
