import { Locator, Page } from '@playwright/test';
import { AccountPage } from './AccountPage';

export class LoginPage {
  private readonly page: Page;

  // Locators
  private readonly emailInput: Locator;
  private readonly passwordInput: Locator;
  private readonly continueButton: Locator;
  private readonly warning: Locator;
  private readonly loginHeading: Locator;

  constructor(page: Page) {
    this.page = page;

    // Initialize locators with CSS selectors
    this.emailInput = page.getByLabel(/e-mail address/i);
    this.passwordInput = page.getByLabel(/^password$/i);
    this.continueButton = page.getByRole('button', { name: /^login$/i });
    this.warning = page.locator('.alert-danger, .text-danger');
    this.loginHeading = page.getByRole('heading', { name: /account login/i });
  }

  /** Verifies that the login page is displayed. */
  async isLoginPageExists(): Promise<boolean> {
    return this.loginHeading.isVisible();
  }

  /** Logs in with the supplied customer credentials. */
  async login(email: string, password: string): Promise<AccountPage> {
    try {
      await this.emailInput.fill(email);
      await this.passwordInput.fill(password);
      await this.continueButton.click();
      await this.page.waitForLoadState('networkidle');
      return new AccountPage(this.page);
    } catch (error) {
      console.log(`Login failed: ${error}`);
      throw error;
    }
  }

  /** Submits invalid or incomplete credentials without assuming navigation. */
  async submitCredentials(email: string, password: string): Promise<void> {
    if (email.trim()) await this.emailInput.fill(email);
    if (password.trim()) await this.passwordInput.fill(password);
    await this.continueButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /** Returns the visible login warning text. */
  async getWarningText(): Promise<string> {
    return (await this.warning.first().textContent())?.trim() ?? '';
  }

  /** Verifies that the login warning is displayed. */
  async isWarningVisible(): Promise<boolean> {
    return this.warning.first().isVisible();
  }
}
