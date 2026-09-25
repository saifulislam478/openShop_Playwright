import { Locator, Page } from '@playwright/test';

export class CartPage {
  private readonly page: Page;

  // Locators
  private readonly cartHeading: Locator;
  private readonly productRows: Locator;
  private readonly quantityInputs: Locator;
  private readonly totalRows: Locator;
  private readonly continueButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Initialize locators with CSS selectors
    this.cartHeading = page.getByRole('heading', { name: /shopping cart/i });
    this.productRows = page.locator('#content table tbody tr');
    this.quantityInputs = page.locator('input[name^="quantity"]');
    this.totalRows = page.locator('#content .table-responsive tfoot tr');
    this.continueButton = page.getByRole('link', { name: /^continue$/i });
  }

  /** Verifies that the shopping cart page is displayed. */
  async isCartPageExists(): Promise<boolean> {
    return this.cartHeading.isVisible();
  }

  /** Verifies that a product name is present in the cart. */
  async isProductInCart(productName: string): Promise<boolean> {
    return this.productRows.getByText(productName, { exact: false }).isVisible();
  }

  /** Reads the quantity of the selected product in the cart. */
  async getProductQuantity(): Promise<number> {
    return Number(await this.quantityInputs.first().inputValue());
  }

  /** Reads the total displayed in the cart summary. */
  async getCartTotal(): Promise<string> {
    return (await this.totalRows.last().textContent())?.trim() ?? '';
  }

  /** Returns to the home page from the cart. */
  async continueShopping(): Promise<void> {
    await this.continueButton.click();
  }
}
