import { APIRequestContext, expect } from '@playwright/test';
import Ajv, { ValidateFunction } from 'ajv';
import dotenv from 'dotenv';

dotenv.config({ override: true });

export const apiBaseUrl = process.env.API_BASE_URL ?? 'https://fakestoreapi.com';
export const productId = Number(process.env.PRODUCT_ID ?? 1);
export const userId = Number(process.env.USER_ID ?? 1);
export const cartId = Number(process.env.CART_ID ?? 1);
export const resultLimit = Number(process.env.LIMIT ?? 3);
export const startDate = process.env.START_DATE ?? '2019-12-10';
export const endDate = process.env.END_DATE ?? '2020-10-10';

export function route(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (path, [key, value]) => path.replace(`{${key}}`, encodeURIComponent(String(value))),
    template,
  );
}

export async function readJson<T>(response: Awaited<ReturnType<APIRequestContext['get']>>): Promise<T> {
  return (await response.json()) as T;
}

export function expectStatus(response: { status(): number }, expected: number, message: string): void {
  expect(response.status(), message).toBe(expected);
}

export function validateSchema(schema: object, value: unknown, message: string): void {
  const ajv = new Ajv({ allErrors: true });
  const validate: ValidateFunction = ajv.compile(schema);
  expect(validate(value), `${message}: ${JSON.stringify(validate.errors)}`).toBe(true);
}

export function url(path: string): string {
  return `${apiBaseUrl}${path}`;
}
