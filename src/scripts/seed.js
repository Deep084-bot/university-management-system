const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function runSeed() {
  const seedPath = path.join(__dirname, '..', '..', 'sql', 'seed.sql');
  const seedSql = fs.readFileSync(seedPath, 'utf8');

  const client = await pool.connect();

  try {
    await client.query(seedSql);
    console.log('✓ Admin seed applied');
  } finally {
    client.release();
    await pool.end();
  }
}

runSeed().catch((error) => {
  console.error('✗ Seed failed:', error.message);
  if (error.code) {
    console.error('  code:', error.code);
  }
  if (error.table) {
    console.error('  table:', error.table);
  }
  if (error.constraint) {
    console.error('  constraint:', error.constraint);
  }
  if (error.detail) {
    console.error('  detail:', error.detail);
  }
  process.exit(1);
});
