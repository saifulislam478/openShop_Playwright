import { test, expect } from '@playwright/test';
import cartSchema from '../../api/schemas/cart_api_schema.json';
import { Routes } from '../../api/endpoints/routes';
import { cartId, endDate, expectStatus, readJson, resultLimit, route, startDate, url, userId, validateSchema } from './apiTestUtils';

type CartProduct = { productId: number; quantity: number };
type Cart = { id: number; userId: number; date: string; products: CartProduct[] };

const cartData = { userId, products: [{ productId: 1, quantity: 2 }] };

test.describe('Carts API', () => {
  test('gets all carts @api @master @regression', async ({ request }) => {
    const response = await request.get(url(Routes.GET_ALL_CARTS));
    expectStatus(response, 200, 'All carts should be returned successfully');
    const carts = await readJson<Cart[]>(response);
    expect(Array.isArray(carts), 'Carts response should be an array').toBe(true);
    expect(carts.length, 'Carts response should not be empty').toBeGreaterThan(0);
  });

  test('gets a cart by ID @api @master @regression', async ({ request }) => {
    const response = await request.get(url(route(Routes.GET_CART_BY_ID, { id: cartId })));
    expectStatus(response, 200, 'The requested cart should be returned');
    const cart = await readJson<Cart>(response);
    expect(cart.id, 'Returned cart ID should match the requested ID').toBe(cartId);
  });

  test('gets carts within the configured date range @api @master @regression', async ({ request }) => {
    const response = await request.get(url(route(Routes.GET_CARTS_BY_DATE_RANGE, { startDate, endDate })));
    expectStatus(response, 200, 'Date-filtered carts should be returned successfully');
    const carts = await readJson<Cart[]>(response);
    expect(Array.isArray(carts), 'Date-filtered carts response should be an array').toBe(true);
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    expect(carts.every((cart) => {
      const date = new Date(cart.date).getTime();
      return date >= start && date <= end;
    }), 'Every returned cart should fall within the requested date range').toBe(true);
  });

  test('gets carts for a user @api @master @regression', async ({ request }) => {
    const response = await request.get(url(route(Routes.GET_USER_CART, { userId })));
    expectStatus(response, 200, 'User carts should be returned successfully');
    const carts = await readJson<Cart[]>(response);
    expect(Array.isArray(carts), 'User carts response should be an array').toBe(true);
    expect(carts.every((cart) => cart.userId === userId), 'Every returned cart should belong to the requested user').toBe(true);
  });

  test('gets carts with the configured limit @api @master @regression', async ({ request }) => {
    const response = await request.get(url(route(Routes.GET_CARTS_WITH_LIMIT, { limit: resultLimit })));
    expectStatus(response, 200, 'Limited carts should be returned successfully');
    const carts = await readJson<Cart[]>(response);
    expect(Array.isArray(carts), 'Limited carts response should be an array').toBe(true);
    expect(carts.length, 'Cart count should match the requested limit').toBe(resultLimit);
  });

  for (const sort of ['asc', 'desc'] as const) {
    test(`sorts carts ${sort === 'asc' ? 'ascending' : 'descending'} @api @master @regression`, async ({ request }) => {
      const response = await request.get(url(route(Routes.GET_CARTS_SORTED, { sort })));
      expectStatus(response, 200, `Carts should support ${sort}ending sorting`);
      const carts = await readJson<Cart[]>(response);
      const ids = carts.map((cart) => cart.id);
      const expectedIds = [...ids].sort((left, right) => sort === 'asc' ? left - right : right - left);
      expect(ids, `Cart IDs should be sorted ${sort}ending`).toEqual(expectedIds);
    });
  }

  test('creates a cart @api @master @regression', async ({ request }) => {
    const response = await request.post(url(Routes.CREATE_CART), { data: cartData });
    expectStatus(response, 201, 'Cart creation should return HTTP 201');
    const created = await readJson<Cart>(response);
    expect(created.id, 'Created cart should have an ID').toEqual(expect.any(Number));
    expect(created.userId, 'Created cart should contain the submitted user ID').toBe(cartData.userId);
    expect(created.products, 'Created cart should contain the submitted products').toEqual(cartData.products);
  });

  test('updates a cart quantity @api @master @regression', async ({ request }) => {
    const updated = { userId, products: [{ productId: 1, quantity: 5 }] };
    const response = await request.put(url(route(Routes.UPDATE_CART, { id: cartId })), { data: updated });
    expectStatus(response, 200, 'Cart update should return HTTP 200');
    const cart = await readJson<Cart>(response);
    expect(cart.products[0].quantity, 'Updated cart quantity should be reflected').toBe(5);
  });

  test('deletes a cart @api @master @regression', async ({ request }) => {
    const response = await request.delete(url(route(Routes.DELETE_CART, { id: cartId })));
    expectStatus(response, 200, 'Cart deletion should return HTTP 200');
    const deleted = await readJson<Cart>(response);
    expect(deleted.id, 'Deleted cart response should identify the requested cart').toBe(cartId);
  });

  test('validates the cart response schema @api @master @regression', async ({ request }) => {
    const response = await request.get(url(route(Routes.GET_CART_BY_ID, { id: cartId })));
    expectStatus(response, 200, 'Cart schema fixture should return HTTP 200');
    const cart = await readJson<Cart>(response);
    validateSchema(cartSchema, cart, 'Cart response schema validation failed');
  });

  test('completes the cart CRUD workflow @api @master @regression', async ({ request }) => {
    const createdResponse = await request.post(url(Routes.CREATE_CART), { data: cartData });
    expectStatus(createdResponse, 201, 'Workflow cart creation should return HTTP 201');
    const created = await readJson<Cart>(createdResponse);
    expect(created.id, 'Workflow creation should return a cart ID').toEqual(expect.any(Number));
    expect(created.userId).toBe(cartData.userId);
    expect(created.products).toEqual(cartData.products);

    const updatedResponse = await request.put(url(route(Routes.UPDATE_CART, { id: created.id })), { data: { userId, products: [{ productId: 1, quantity: 7 }] } });
    expectStatus(updatedResponse, 200, 'Workflow cart update should return HTTP 200');
    const updated = await readJson<Cart>(updatedResponse);
    expect(updated.products[0].quantity, 'Workflow quantity update should be reflected').toBe(7);

    const deletedResponse = await request.delete(url(route(Routes.DELETE_CART, { id: created.id })));
    expectStatus(deletedResponse, 200, 'Workflow cart deletion should return HTTP 200');
  });
});
