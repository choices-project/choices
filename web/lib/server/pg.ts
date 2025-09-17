/* eslint-disable import/no-extraneous-dependencies */
import { Pool } from 'pg';

// Client-safe interface; no 'pg' in client code.
export type DatabaseConfig = {
  connectionString: string;
  ssl?: boolean | { rejectUnauthorized: boolean };
};

export const databaseConfig: DatabaseConfig = {
  connectionString: process.env.DATABASE_URL ?? '',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};

export const pool = new Pool({
  connectionString: databaseConfig.connectionString,
  ssl: databaseConfig.ssl,
});
