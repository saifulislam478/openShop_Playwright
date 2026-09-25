import { test, expect } from '../../fixtures/pageFixtures';
import { RandomDataUtil } from '../../utils/dataGenerator';
import { closeDatabase, executeQuery } from '../../utils/dbClient';
import dotenv from 'dotenv';
import { RowDataPacket } from 'mysql2/promise';

dotenv.config({ override: true });

type CustomerColumn = RowDataPacket & { Field: string };
type CustomerRecord = RowDataPacket & {
  customer_id: number;
  firstname: string;
  lastname: string;
  email: string;
  status: number;
  date_added?: string | Date;
};

test('registers and validates one customer across UI admin and MySQL @master @e2e @db @regression', async ({ homePage, adminPage }) => {
  const customer = RandomDataUtil.generateCustomerData();
  const adminUsername = process.env.ADMIN_USERNAME ?? '';
  const adminPassword = process.env.ADMIN_PASSWORD ?? '';

  try {
    await test.step('1) Register a unique customer through the frontend', async () => {
      await homePage.openAccountMenu();
      const registerPage = await homePage.clickRegister();
      expect(await registerPage.isRegisterPageExists(), 'Frontend registration page should be displayed').toBeTruthy();
      const accountPage = await registerPage.completeRegistration(customer);
      expect(await registerPage.isAccountCreated(), 'Frontend registration should show account-created confirmation').toBeTruthy();
      expect(await accountPage.isAuthenticatedNavigationVisible(), 'Registered customer account navigation should be available').toBeTruthy();
    });

    await test.step('2) Verify the same customer in the OpenCart Admin Portal', async () => {
      await adminPage.login(adminUsername, adminPassword);
      await adminPage.openCustomers();
      await adminPage.searchCustomerByEmail(customer.email);
      expect(await adminPage.isCustomerListed(customer.email), 'Admin customer list should contain the newly registered email').toBeTruthy();
      const adminCustomer = await adminPage.getCustomerDetails(customer.email);
      expect(adminCustomer.firstName, 'Admin first name should match generated registration data').toBe(customer.firstName);
      expect(adminCustomer.lastName, 'Admin last name should match generated registration data').toBe(customer.lastName);
      expect(adminCustomer.email, 'Admin email should match generated registration data').toBe(customer.email);
      expect(adminCustomer.status, 'Admin customer status should be enabled after registration').toBe('1');
    });

    await test.step('3) Verify the same customer in MySQL', async () => {
      const columns = await executeQuery<CustomerColumn>('SHOW COLUMNS FROM oc_customer');
      const hasDateAdded = columns.some((column) => column.Field === 'date_added');
      const dateColumn = hasDateAdded ? ', date_added' : '';
      const rows = await executeQuery<CustomerRecord>(
        `SELECT customer_id, firstname, lastname, email, status${dateColumn} FROM oc_customer WHERE email = ?`,
        [customer.email],
      );

      expect(rows.length, 'MySQL should contain exactly one customer for the generated email').toBe(1);
      const record = rows[0];
      expect(record.firstname, 'Database first name should match generated registration data').toBe(customer.firstName);
      expect(record.lastname, 'Database last name should match generated registration data').toBe(customer.lastName);
      expect(record.email, 'Database email should match generated registration data').toBe(customer.email);
      expect(record.status, 'Database customer status should be enabled after registration').toBe(1);
      if (hasDateAdded) {
        expect(record.date_added, 'Database date_added should exist when the column is available').toBeTruthy();
      }
    });
  } finally {
    await closeDatabase();
  }

  console.log('Completed frontend, admin, and MySQL customer validation.');
});
