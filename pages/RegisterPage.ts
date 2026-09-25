import { Locator, Page } from '@playwright/test';
import { AccountPage } from './AccountPage';

export type CustomerData = {
  firstName: string;
  lastName: string;
  email: string;
  telephone: string;
  password: string;
};

export class RegisterPage {
  private readonly page: Page;

  // Locators
  private readonly firstNameInput: Locator;
  private readonly lastNameInput: Locator;
  private readonly emailInput: Locator;
  private readonly telephoneInput: Locator;
  private readonly passwordInput: Locator;
  private readonly confirmPasswordInput: Locator;
  private readonly privacyCheckbox: Locator;
  private readonly continueButton: Locator;
  private readonly registerHeading: Locator;
  private readonly successHeading: Locator;

  constructor(page: Page) {
    this.page = page;

    // Initialize locators with CSS selectors
    this.firstNameInput = page.getByLabel(/first name/i);
    this.lastNameInput = page.getByLabel(/last name/i);
    this.emailInput = page.locator('#input-email');
    this.telephoneInput = page.locator('#input-telephone');
    this.passwordInput = page.getByLabel(/^password$/i);
    this.confirmPasswordInput = page.locator('#input-confirm');
    this.privacyCheckbox = page.locator('input[name="agree"]');
    this.continueButton = page.getByRole('button', { name: /^continue$/i });
    this.registerHeading = page.getByRole('heading', { name: /register account|create an account/i });
    this.successHeading = page.getByRole('heading', { name: /your account has been created/i });
  }

  /** Verifies that the registration page is displayed. */
  async isRegisterPageExists(): Promise<boolean> {
    return this.registerHeading.isVisible();
  }

  /** Completes and submits the customer registration form. */
  async completeRegistration(customer: CustomerData): Promise<AccountPage> {
    try {
      await this.firstNameInput.fill(customer.firstName);
      await this.lastNameInput.fill(customer.lastName);
      await this.emailInput.fill(customer.email);
      if (await this.telephoneInput.isVisible()) await this.telephoneInput.fill(customer.telephone);
      await this.passwordInput.fill(customer.password);
      if (await this.confirmPasswordInput.isVisible()) await this.confirmPasswordInput.fill(customer.password);
      await this.privacyCheckbox.check();
      await this.continueButton.click();
      await this.page.waitForLoadState('networkidle');
      return new AccountPage(this.page);
    } catch (error) {
      console.log(`Registration failed: ${error}`);
      throw error;
    }
  }

  /** Verifies that the account-created confirmation is displayed. */
  async isAccountCreated(): Promise<boolean> {
    try {
      await this.successHeading.waitFor({ state: 'visible' });
      return true;
    } catch {
      return false;
    }
  }
}
