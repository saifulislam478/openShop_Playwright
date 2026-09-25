import { Locator, Page } from '@playwright/test';

export type AdminCustomer = {
  firstName: string;
  lastName: string;
  email: string;
  status: string;
};

export class AdminPage {
  private readonly page: Page;

  // Locators
  private readonly usernameInput: Locator;
  private readonly passwordInput: Locator;
  private readonly loginButton: Locator;
  private readonly securityModal: Locator;
  private readonly customersMenu: Locator;
  private readonly customersLink: Locator;
  private readonly emailFilter: Locator;
  private readonly filterButton: Locator;
  private readonly customerRows: Locator;

  constructor(page: Page) {
    this.page = page;

    // Initialize locators with CSS selectors
    this.usernameInput = page.getByLabel('Username');
    this.passwordInput = page.getByLabel('Password');
    this.loginButton = page.getByRole('button', { name: /^login$/i });
    this.securityModal = page.locator('.modal.show');
    this.customersMenu = page.getByRole('link', { name: /^customers/i });
    this.customersLink = page.locator('#collapse-6 a').first();
    this.emailFilter = page.locator('input[name="filter_email"]');
    this.filterButton = page.locator('#button-filter');
    this.customerRows = page.locator('table tbody tr');
  }

  /** Logs in to the OpenCart administration portal. */
  async login(username: string, password: string): Promise<void> {
    await this.page.goto(`${process.env.ADMIN_URL ?? 'http://localhost/opencart/upload/admin/index.php'}`);
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    await this.page.waitForLoadState('networkidle');
    if (await this.securityModal.isVisible()) {
      await this.securityModal.locator('.btn-close').click();
    }
  }

  /** Opens the Customers list in the administration portal. */
  async openCustomers(): Promise<void> {
    await this.customersMenu.click();
    await this.customersLink.click();
    await this.page.waitForLoadState('networkidle');
  }

  /** Searches the customer list by email address. */
  async searchCustomerByEmail(email: string): Promise<void> {
    await this.emailFilter.fill(email);
    await this.filterButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /** Verifies that the filtered customer record is listed. */
  async isCustomerListed(email: string): Promise<boolean> {
    return this.customerRows.filter({ hasText: email }).first().isVisible();
  }

  /** Opens the matching customer record and reads its editable fields. */
  async getCustomerDetails(email: string): Promise<AdminCustomer> {
    const row = this.customerRows.filter({ hasText: email }).first();
    await row.locator('a[href*="customer/customer."]').first().click();
    await this.page.waitForLoadState('networkidle');
    const statusField = this.page.locator('select[name="status"], input[name="status"]').first();
    const status = await statusField.getAttribute('type') === 'checkbox'
      ? (await statusField.isChecked() ? '1' : '0')
      : await statusField.inputValue();
    return {
      firstName: await this.page.locator('input[name="firstname"]').inputValue(),
      lastName: await this.page.locator('input[name="lastname"]').inputValue(),
      email: await this.page.locator('input[name="email"]').inputValue(),
      status,
    };
  }
}
