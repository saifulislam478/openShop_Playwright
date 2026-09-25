import { test, expect } from '@playwright/test';
import userSchema from '../../api/schemas/user_api_schema.json';
import { Routes } from '../../api/endpoints/routes';
import { expectStatus, readJson, resultLimit, route, url, userId, validateSchema } from './apiTestUtils';

type User = {
  id: number;
  email: string;
  username: string;
  password: string;
  name: { firstname: string; lastname: string };
  address: Record<string, unknown>;
  phone: string;
};

test.describe('Users API', () => {
  test('gets all users @api @master @regression', async ({ request }) => {
    const response = await request.get(url(Routes.GET_ALL_USERS));
    expectStatus(response, 200, 'All users should be returned successfully');
    const users = await readJson<User[]>(response);
    expect(Array.isArray(users), 'Users response should be an array').toBe(true);
    expect(users.length, 'Users response should not be empty').toBeGreaterThan(0);
  });

  test('gets a user by ID @api @master @regression', async ({ request }) => {
    const response = await request.get(url(route(Routes.GET_USER_BY_ID, { id: userId })));
    expectStatus(response, 200, 'The requested user should be returned');
    const user = await readJson<User>(response);
    expect(user.id, 'Returned user ID should match the requested ID').toBe(userId);
  });

  test('gets users with the configured limit @api @master @regression', async ({ request }) => {
    const response = await request.get(url(route(Routes.GET_USERS_WITH_LIMIT, { limit: resultLimit })));
    expectStatus(response, 200, 'Limited users should be returned successfully');
    const users = await readJson<User[]>(response);
    expect(Array.isArray(users), 'Limited users response should be an array').toBe(true);
    expect(users.length, 'User count should match the requested limit').toBe(resultLimit);
  });

  for (const sort of ['asc', 'desc'] as const) {
    test(`sorts users ${sort === 'asc' ? 'ascending' : 'descending'} @api @master @regression`, async ({ request }) => {
      const response = await request.get(url(route(Routes.GET_USERS_SORTED, { sort })));
      expectStatus(response, 200, `Users should support ${sort}ending sorting`);
      const users = await readJson<User[]>(response);
      const ids = users.map((user) => user.id);
      const expectedIds = [...ids].sort((left, right) => sort === 'asc' ? left - right : right - left);
      expect(ids, `User IDs should be sorted ${sort}ending`).toEqual(expectedIds);
    });
  }

  test('creates a user @api @master @regression', async ({ request }) => {
    const user = {
      email: 'api.test@example.com', username: 'api_test_user', password: 'api-test-password',
      name: { firstname: 'API', lastname: 'Tester' },
      address: { city: 'Test City', street: 'Test Street', number: 1, zipcode: '12345', geolocation: { lat: '0', long: '0' } },
      phone: '555-0100',
    };
    const response = await request.post(url(Routes.CREATE_USER), { data: user });
    expectStatus(response, 201, 'User creation should return HTTP 201');
    const created = await readJson<User>(response);
    expect(created.id, 'Created user response should contain a generated ID').toEqual(expect.any(Number));
  });

  test('updates a user @api @master @regression', async ({ request }) => {
    const updated = { email: 'updated.api.test@example.com', username: 'updated_api_user', password: 'updated-password', name: { firstname: 'Updated', lastname: 'Tester' }, phone: '555-0101' };
    const response = await request.put(url(route(Routes.UPDATE_USER, { id: userId })), { data: updated });
    expectStatus(response, 200, 'User update should return HTTP 200');
    const user = await readJson<User>(response);
    expect(user).toEqual(expect.objectContaining(updated));
  });

  test('deletes a user @api @master @regression', async ({ request }) => {
    const response = await request.delete(url(route(Routes.DELETE_USER, { id: userId })));
    expectStatus(response, 200, 'User deletion should return HTTP 200');
    const deleted = await readJson<User>(response);
    expect(deleted.id, 'Deleted user response should identify the requested user').toBe(userId);
  });

  test('validates the user response schema @api @master @regression', async ({ request }) => {
    const response = await request.get(url(route(Routes.GET_USER_BY_ID, { id: userId })));
    expectStatus(response, 200, 'User schema fixture should return HTTP 200');
    const user = await readJson<User>(response);
    validateSchema(userSchema, user, 'User response schema validation failed');
  });

  test('completes the user CRUD workflow @api @master @regression', async ({ request }) => {
    const user = {
      email: 'workflow.api@example.com', username: 'workflow_api_user', password: 'workflow-password',
      name: { firstname: 'Workflow', lastname: 'Tester' },
      address: { city: 'Workflow City', street: 'Workflow Street', number: 2, zipcode: '54321', geolocation: { lat: '1', long: '1' } },
      phone: '555-0102',
    };
    const createdResponse = await request.post(url(Routes.CREATE_USER), { data: user });
    expectStatus(createdResponse, 201, 'Workflow user creation should return HTTP 201');
    const created = await readJson<User>(createdResponse);
    expect(created.id, 'Workflow creation should return a user ID').toEqual(expect.any(Number));

    const updated = { ...user, username: 'updated_workflow_user' };
    const updatedResponse = await request.put(url(route(Routes.UPDATE_USER, { id: created.id })), { data: updated });
    expectStatus(updatedResponse, 200, 'Workflow user update should return HTTP 200');
    const updatedUser = await readJson<User>(updatedResponse);
    expect(updatedUser).toEqual(expect.objectContaining(updated));

    const deletedResponse = await request.delete(url(route(Routes.DELETE_USER, { id: created.id })));
    expectStatus(deletedResponse, 200, 'Workflow user deletion should return HTTP 200');
  });
});
