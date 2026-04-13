const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function runSchema() {
  const schemaPath = path.join(__dirname, '..', '..', 'sql', 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  const client = await pool.connect();

  try {
    await client.query(schemaSql);
    console.log('✓ Schema applied');
  } finally {
    client.release();
    await pool.end();
  }
}

runSchema().catch((error) => {
  console.error('✗ Schema failed:', error.message);
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