import { test, expect } from '@playwright/test';
import productSchema from '../../api/schemas/product_api_schema.json';
import { Routes } from '../../api/endpoints/routes';
import {
  expectStatus,
  productId,
  readJson,
  resultLimit,
  route,
  url,
  validateSchema,
} from './apiTestUtils';

type Product = {
  id: number;
  title: string;
  price: number;
  description?: string;
  category: string;
  image: string;
  rating?: { rate: number; count: number };
};

test.describe('Products API', () => {
  test('gets all products @api @master @regression', async ({ request }) => {
    const response = await request.get(url(Routes.GET_ALL_PRODUCTS));
    expectStatus(response, 200, 'All products should be returned successfully');
    const products = await readJson<Product[]>(response);
    expect(Array.isArray(products), 'Products response should be an array').toBe(true);
    expect(products.length, 'Products response should not be empty').toBeGreaterThan(0);
    expect(products[0]).toEqual(expect.objectContaining({
      id: expect.any(Number),
      title: expect.any(String),
      price: expect.any(Number),
      category: expect.any(String),
      image: expect.any(String),
    }));
  });

  test('gets a product by ID @api @master @regression', async ({ request }) => {
    const response = await request.get(url(route(Routes.GET_PRODUCT_BY_ID, { id: productId })));
    expectStatus(response, 200, 'The requested product should be returned');
    const product = await readJson<Product>(response);
    expect(product.id, 'Returned product ID should match the requested ID').toBe(productId);
    expect(product.title, 'Product title should be present').toEqual(expect.any(String));
    expect(product.price, 'Product price should be numeric').toEqual(expect.any(Number));
    expect(product.category, 'Product category should be present').toEqual(expect.any(String));
    expect(product.image, 'Product image should be present').toEqual(expect.any(String));
  });

  test('gets products with the configured limit @api @master @regression', async ({ request }) => {
    const response = await request.get(url(route(Routes.GET_PRODUCTS_WITH_LIMIT, { limit: resultLimit })));
    expectStatus(response, 200, 'Limited products should be returned successfully');
    const products = await readJson<Product[]>(response);
    expect(Array.isArray(products), 'Limited products response should be an array').toBe(true);
    expect(products.length, 'Product count should match the requested limit').toBe(resultLimit);
  });

  for (const sort of ['asc', 'desc'] as const) {
    test(`sorts products ${sort === 'asc' ? 'ascending' : 'descending'} @api @master @regression`, async ({ request }) => {
      const response = await request.get(url(route(Routes.GET_PRODUCTS_SORTED, { sort })));
      expectStatus(response, 200, `Products should support ${sort}ending sorting`);
      const products = await readJson<Product[]>(response);
      const ids = products.map((product) => product.id);
      const expectedIds = [...ids].sort((left, right) => sort === 'asc' ? left - right : right - left);
      expect(ids, `Product IDs should be sorted ${sort}ending`).toEqual(expectedIds);
    });
  }

  test('gets all product categories @api @master @regression', async ({ request }) => {
    const response = await request.get(url(Routes.GET_ALL_CATEGORIES));
    expectStatus(response, 200, 'Product categories should be returned successfully');
    const categories = await readJson<string[]>(response);
    expect(Array.isArray(categories), 'Categories response should be an array').toBe(true);
    expect(categories.length, 'Category list should not be empty').toBeGreaterThan(0);
    expect(categories.every((category) => typeof category === 'string'), 'Categories should be strings').toBe(true);
  });

  test('gets products by category @api @master @regression', async ({ request }) => {
    const category = 'electronics';
    const response = await request.get(url(route(Routes.GET_PRODUCTS_BY_CATEGORY, { category })));
    expectStatus(response, 200, 'Category products should be returned successfully');
    const products = await readJson<Product[]>(response);
    expect(Array.isArray(products), 'Category products response should be an array').toBe(true);
    expect(products.every((product) => product.category === category), 'Every product should belong to the requested category').toBe(true);
  });

  test('creates a product @api @master @regression', async ({ request }) => {
    const product = { title: 'API test product', price: 19.99, description: 'Created by API test', category: 'electronics', image: 'https://example.com/api-test-product.jpg' };
    const response = await request.post(url(Routes.CREATE_PRODUCT), { data: product });
    expectStatus(response, 201, 'Product creation should return HTTP 201');
    const created = await readJson<Product>(response);
    expect(created.id, 'Created product should have an ID').toEqual(expect.any(Number));
    expect(created).toEqual(expect.objectContaining(product));
  });

  test('updates a product @api @master @regression', async ({ request }) => {
    const updated = { title: 'Updated API product', price: 29.99, description: 'Updated by API test', category: 'electronics', image: 'https://example.com/updated-product.jpg' };
    const response = await request.put(url(route(Routes.UPDATE_PRODUCT, { id: productId })), { data: updated });
    expectStatus(response, 200, 'Product update should return HTTP 200');
    const product = await readJson<Product>(response);
    expect(product.id, 'Updated product ID should match the requested ID').toBe(productId);
    expect(product).toEqual(expect.objectContaining(updated));
  });

  test('deletes a product @api @master @regression', async ({ request }) => {
    const response = await request.delete(url(route(Routes.DELETE_PRODUCT, { id: productId })));
    expectStatus(response, 200, 'Product deletion should return HTTP 200');
    const deleted = await readJson<Product>(response);
    expect(deleted.id, 'Deleted product response should identify the requested product').toBe(productId);
  });

  test('validates the product response schema @api @master @regression', async ({ request }) => {
    const response = await request.get(url(route(Routes.GET_PRODUCT_BY_ID, { id: productId })));
    expectStatus(response, 200, 'Product schema fixture should return HTTP 200');
    const product = await readJson<Product>(response);
    validateSchema(productSchema, product, 'Product response schema validation failed');
  });

  test('completes the product CRUD workflow @api @master @regression', async ({ request }) => {
    const product = { title: 'Workflow product', price: 39.99, description: 'CRUD workflow product', category: 'electronics', image: 'https://example.com/workflow-product.jpg' };
    const createdResponse = await request.post(url(Routes.CREATE_PRODUCT), { data: product });
    expectStatus(createdResponse, 201, 'Workflow product creation should return HTTP 201');
    const created = await readJson<Product>(createdResponse);
    expect(created.id, 'Workflow creation should return a product ID').toEqual(expect.any(Number));

    const updated = { ...product, title: 'Updated workflow product', price: 49.99 };
    const updatedResponse = await request.put(url(route(Routes.UPDATE_PRODUCT, { id: created.id })), { data: updated });
    expectStatus(updatedResponse, 200, 'Workflow product update should return HTTP 200');
    const updatedProduct = await readJson<Product>(updatedResponse);
    expect(updatedProduct.id).toBe(created.id);
    expect(updatedProduct).toEqual(expect.objectContaining(updated));

    const deletedResponse = await request.delete(url(route(Routes.DELETE_PRODUCT, { id: created.id })));
    expectStatus(deletedResponse, 200, 'Workflow product deletion should return HTTP 200');
  });

});
