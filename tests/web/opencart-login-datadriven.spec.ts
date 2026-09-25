import { test, expect } from '../../fixtures/pageFixtures';
import { DataProvider } from '../../utils/DataReader';

const loginRows = DataProvider.readLoginData();

if (loginRows.length === 0) {
  test('requires supplied OpenCart login data @web @master @datadriven @regression', async () => {
    test.skip(true, 'The supplied opencart_logindata.xlsx/csv/json files contain no rows.');
  });
}

for (const row of loginRows) {
  const scenarioName = row.testName ?? row.TestName ?? 'OpenCart login data row';
  test(`${scenarioName} @web @master @datadriven @regression`, async ({ homePage }) => {
    await test.step('1) Open the OpenCart login page', async () => {
      await homePage.openAccountMenu();
    });

    await test.step('2) Submit the external test-data credentials', async () => {
      const loginPage = await homePage.clickLogin();
      const email = row.email?.trim() ?? '';
      const password = row.password?.trim() ?? '';

      if (row.expected.toLowerCase() === 'success') {
        const accountPage = await loginPage.login(email, password);
        expect(await accountPage.isMyAccountPageExists(), 'My Account page should be displayed for a successful data row').toBeTruthy();
      } else {
        await loginPage.submitCredentials(email, password);
        expect(await loginPage.isWarningVisible(), 'Failure data row should display an OpenCart warning').toBeTruthy();
        expect(await loginPage.getWarningText(), 'Failure warning should identify the invalid credentials')
          .toContain('Warning: No match for E-Mail Address and/or Password.');
      }
    });

    console.log(`Completed data-driven login scenario: ${scenarioName}`);
  });
}
