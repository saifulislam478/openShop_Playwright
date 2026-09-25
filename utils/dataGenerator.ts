import { faker } from '@faker-js/faker';

export class RandomDataUtil {
	/** Generates a unique customer registration payload. */
	static generateCustomerData(): {
		firstName: string;
		lastName: string;
		email: string;
		telephone: string;
		password: string;
	} {
		const firstName = faker.person.firstName();
		const lastName = faker.person.lastName();
		return {
			firstName,
			lastName,
			email: `playwright.${Date.now()}@example.com`,
			telephone: faker.phone.number(),
			password: `Pw!${faker.string.alphanumeric(12)}`,
		};
	}
}
