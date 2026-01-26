
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../db/schema';

// Connection pool configuration optimized for serverless/edge environments
const pool = new Pool({
    connectionString: process.env.DATABASE_URL!,
    // Pool size settings
    max: parseInt(process.env.DB_POOL_MAX || '10'), // Maximum connections
    min: parseInt(process.env.DB_POOL_MIN || '0'),  // Minimum idle connections (0 for serverless)
    // Connection timeout settings
    idleTimeoutMillis: 10000,      // Close idle connections after 10s
    connectionTimeoutMillis: 5000, // Fail if can't connect in 5s
    // Keep connections alive
    allowExitOnIdle: true,         // Allow process to exit when pool is idle
});

// Handle pool errors gracefully
pool.on('error', (err) => {
    console.error('Unexpected database pool error:', err);
});

export const db = drizzle(pool, { schema });
