import dotenv from 'dotenv';

dotenv.config({ override: true });

export class Helper {
	/** Returns configured OpenCart customer credentials. */
	static getLoginDetails(): { email: string; password: string } {
		return {
			email: process.env.APP_EMAIL ?? '',
			password: process.env.APP_PASSWORD ?? '',
		};
	}

	/** Returns the configured known product and default quantity. */
	static getProductDetails(): { name: string; quantity: number } {
		return {
			name: process.env.PRODUCT_NAME ?? 'MacBook',
			quantity: Number(process.env.PRODUCT_QUANTITY ?? 1),
		};
	}

	/** Indicates whether usable configured customer credentials are available. */
	static hasConfiguredLogin(): boolean {
		const { email, password } = Helper.getLoginDetails();
		return Boolean(email && password && !email.startsWith('YOUR_') && !password.startsWith('YOUR_'));
	}
}
