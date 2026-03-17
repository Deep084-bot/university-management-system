const dotenv = require('dotenv');

dotenv.config();

const required = ['DATABASE_URL', 'SESSION_SECRET'];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number.parseInt(process.env.PORT || '3000', 10),
  databaseUrl: process.env.DATABASE_URL,
  sessionSecret: process.env.SESSION_SECRET,
  currentAcademicYear: process.env.CURRENT_ACADEMIC_YEAR || '2025-2026',
  currentSemester: Number.parseInt(process.env.CURRENT_SEMESTER || '2', 10)
};
