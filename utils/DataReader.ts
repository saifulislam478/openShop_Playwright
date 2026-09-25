import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'csv-parse/sync';
import XLSX from 'xlsx';

export type LoginData = {
	testName?: string;
	TestName?: string;
	email: string;
	password: string;
	expected: 'success' | 'failure';
};

export class DataProvider {
	/** Reads a JSON test-data file, returning an empty list for an empty file. */
	static readJson<T>(filePath: string): T[] {
		const content = fs.readFileSync(path.resolve(filePath), 'utf8').trim();
		return content ? JSON.parse(content) as T[] : [];
	}

	/** Reads a CSV test-data file, returning an empty list for an empty file. */
	static readCsv<T>(filePath: string): T[] {
		const content = fs.readFileSync(path.resolve(filePath), 'utf8').trim();
		return content ? parse(content, { columns: true, skip_empty_lines: true }) as T[] : [];
	}

	/** Reads the first worksheet from an Excel test-data file. */
	static readExcel<T>(filePath: string): T[] {
		const workbook = XLSX.readFile(path.resolve(filePath));
		const sheet = workbook.Sheets[workbook.SheetNames[0]];
		return sheet ? XLSX.utils.sheet_to_json<T>(sheet, { defval: '' }) : [];
	}

	/** Reads the supplied OpenCart login dataset. */
	static readLoginData(filePath = 'testdata/opencart_logindata.xlsx'): LoginData[] {
		if (filePath.endsWith('.json')) return this.readJson<LoginData>(filePath);
		if (filePath.endsWith('.csv')) return this.readCsv<LoginData>(filePath);
		return this.readExcel<LoginData>(filePath);
	}
}
