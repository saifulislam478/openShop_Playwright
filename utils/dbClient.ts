import mysql, { Pool, RowDataPacket } from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ override: true });

let pool: Pool | undefined;

function getPool(): Pool {
	pool ??= mysql.createPool({
		host: process.env.DB_HOST ?? 'localhost',
		port: Number(process.env.DB_PORT ?? 3306),
		user: process.env.DB_USER ?? 'root',
		password: process.env.DB_PASSWORD ?? '',
		database: process.env.DB_NAME ?? 'openshop',
		waitForConnections: true,
		connectionLimit: 4,
	});
	return pool;
}

/** Executes a parameterized query through the shared MySQL pool. */
export async function executeQuery<T extends RowDataPacket = RowDataPacket>(
	sql: string,
	parameters: unknown[] = [],
): Promise<T[]> {
	const [rows] = await getPool().execute<T[]>(sql, parameters);
	return rows;
}

/** Closes the shared pool and releases all database connections. */
export async function closeDatabase(): Promise<void> {
	if (pool) {
		await pool.end();
		pool = undefined;
	}
}
