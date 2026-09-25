import { test, expect } from '@playwright/test';
import { Routes } from '../../api/endpoints/routes';
import { expectStatus, readJson, url } from './apiTestUtils';

const username = process.env.USERNAME ?? 'mor_2314';
const password = process.env.PASSWORD ?? '83r5^_';

test.describe('Authentication API', () => {
  test('logs in with valid credentials @api @master @sanity', async ({ request }) => {
    const response = await request.post(url(Routes.AUTH_LOGIN), { data: { username, password } });
    expectStatus(response, 201, 'Successful login should return HTTP 201');
    const body = await readJson<{ token?: unknown }>(response);
    expect(body, 'Login response should contain a token field').toHaveProperty('token');
    expect(typeof body.token, 'Authentication token should be a string').toBe('string');
    expect((body.token as string).length, 'Authentication token should not be empty').toBeGreaterThan(0);
  });

  test('rejects invalid credentials @api @master @regression', async ({ request }) => {
    const response = await request.post(url(Routes.AUTH_LOGIN), { data: { username: 'invalid_user', password: 'invalid_password' } });
    expectStatus(response, 401, 'Invalid login should return HTTP 401');
    const body = await response.text();
    expect(body, 'Invalid login should return the expected error message').toContain('username or password is incorrect');
  });
});
