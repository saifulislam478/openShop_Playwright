import { Locator, Page } from '@playwright/test';
import { CartPage } from './CartPage';

export class ProductPage {
  private readonly page: Page;

  // Locators
  private readonly productHeading: Locator;
  private readonly quantityInput: Locator;
  private readonly addToCartButton: Locator;
  private readonly successAlert: Locator;
  private readonly cartLink: Locator;

  constructor(page: Page) {
    this.page = page;

    // Initialize locators with CSS selectors
    this.productHeading = page.locator('h1');
    this.quantityInput = page.locator('input[name="quantity"]');
    this.addToCartButton = page.getByRole('button', { name: /add to cart/i });
    this.successAlert = page.locator('.alert-success');
    this.cartLink = page.getByRole('link', { name: /shopping cart/i }).first();
  }

  /** Verifies that the product details page is displayed. */
  async isProductDetailsPageExists(): Promise<boolean> {
    return this.productHeading.isVisible();
  }

  /** Sets the product quantity when the product exposes a quantity field. */
  async setQuantity(quantity: number): Promise<void> {
    if (await this.quantityInput.isVisible()) await this.quantityInput.fill(String(quantity));
  }

  /** Adds the product to the shopping cart. */
  async addToCart(): Promise<void> {
    try {
      await this.addToCartButton.click();
    } catch (error) {
      console.log(`Add to cart failed: ${error}`);
      throw error;
    }
  }

  /** Verifies that the product-added confirmation is displayed. */
  async isProductAdded(): Promise<boolean> {
    try {
      await this.successAlert.waitFor({ state: 'visible' });
      return true;
    } catch {
      return false;
    }
  }

  /** Opens the shopping cart. */
  async openCart(): Promise<CartPage> {
    await this.cartLink.click();
    return new CartPage(this.page);
  }
}
