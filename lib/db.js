import { Pool } from "pg";

const globalForPg = globalThis;

export const pool =
  globalForPg.__pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false,
  });

if (!globalForPg.__pgPool) globalForPg.__pgPool = pool;