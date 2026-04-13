const dotenv = require('dotenv');

dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

const required = ['DATABASE_URL', 'SESSION_SECRET'];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

module.exports = {
  nodeEnv,
  port: Number.parseInt(process.env.PORT || '3000', 10),
  databaseUrl: process.env.DATABASE_URL,
  sessionSecret: process.env.SESSION_SECRET,
  trustProxy: process.env.TRUST_PROXY ? process.env.TRUST_PROXY === 'true' : isProduction,
  currentAcademicYear: process.env.CURRENT_ACADEMIC_YEAR || '2025-2026',
  currentSemester: Number.parseInt(process.env.CURRENT_SEMESTER || '2', 10)
};
