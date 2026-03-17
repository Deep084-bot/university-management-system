const { Pool } = require('pg');
const env = require('./env');

const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: env.nodeEnv === 'production' ? { rejectUnauthorized: false } : false
});

async function query(text, params = []) {
  return pool.query(text, params);
}

async function withTransaction(work, isolationLevel = 'SERIALIZABLE') {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query(`SET LOCAL TRANSACTION ISOLATION LEVEL ${isolationLevel}`);
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  query,
  withTransaction
};
