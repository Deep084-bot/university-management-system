const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true
});

async function runSetup() {
  try {
    console.log('Connecting to Neon database...');
    const client = await pool.connect();
    console.log('✓ Connected to Neon');

    const schemaPath = path.join(__dirname, 'sql', 'schema.sql');
    const seedPath = path.join(__dirname, 'sql', 'seed.sql');

    console.log('\nRunning schema.sql...');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await client.query(schema);
    console.log('✓ Schema created successfully');

    console.log('\nRunning seed.sql...');
    const seed = fs.readFileSync(seedPath, 'utf8');
    await client.query(seed);
    console.log('✓ Database seeded successfully');

    client.release();
    await pool.end();

    console.log('\n✓ Setup complete!');
    console.log('\nYou can now login with:');
    console.log('  Admin: admin@sums.edu / Admin@123');
    console.log('  Faculty: faculty@sums.edu / Faculty@123');
    console.log('  Student: student@sums.edu / Student@123');
    console.log('\nRun: npm run dev');
  } catch (error) {
    console.error('✗ Setup failed:', error.message);
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
    if (error.where) {
      console.error('  where:', error.where);
    }
    process.exit(1);
  }
}

runSetup();
