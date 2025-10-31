import { Pool, PoolClient, QueryResult } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Determine if we're in production (Cloud Run)
const isProduction = process.env.NODE_ENV === 'production';
const cloudSqlConnection = process.env.CLOUD_SQL_CONNECTION_NAME;

// Create PostgreSQL connection pool
const poolConfig: any = {
  database: process.env.DB_NAME || 'teamsso_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

// In production (Cloud Run), use Unix socket for Cloud SQL
if (isProduction && cloudSqlConnection) {
  poolConfig.host = `/cloudsql/${cloudSqlConnection}`;
  console.log(`📡 Connecting to Cloud SQL via socket: ${poolConfig.host}`);
} else {
  // Local development
  poolConfig.host = process.env.DB_HOST || 'localhost';
  poolConfig.port = parseInt(process.env.DB_PORT || '5432');
  console.log(`📡 Connecting to database at ${poolConfig.host}:${poolConfig.port}`);
}

const pool = new Pool(poolConfig);

// Test database connection
pool.on('connect', () => {
  console.log('✅ Database connected successfully');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err.message);
  // Don't exit - let the app handle individual query errors
});

// Query helper function with error handling
export const query = async (text: string, params?: any[]): Promise<QueryResult> => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Get a client from the pool for transactions
export const getClient = async (): Promise<PoolClient> => {
  const client = await pool.connect();
  return client;
};

// Close pool (for graceful shutdown)
export const closePool = async (): Promise<void> => {
  await pool.end();
  console.log('Database pool closed');
};

export default pool;
