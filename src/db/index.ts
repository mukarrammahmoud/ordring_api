import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Use postgres (pure JS) as the driver — no native binaries required
const queryClient = postgres(connectionString);
export const db = drizzle(queryClient, { schema });
export type Db = typeof db;
