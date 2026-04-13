const dotenv = require('dotenv');

dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

const required = ['DATABASE_URL', 'SESSION_SECRET'];

function deriveAcademicYearFromDate(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const startYear = month >= 6 ? year : year - 1;
  const endYear = startYear + 1;
  return `${startYear}-${endYear}`;
}

function resolveAcademicYear() {
  const configured = String(process.env.CURRENT_ACADEMIC_YEAR || '').trim();

  if (!configured) {
    return deriveAcademicYearFromDate();
  }

  const normalized = configured
    .replace(/[\u2012\u2013\u2014\u2212]/g, '-')
    .replace(/\s+/g, '');
  const match = normalized.match(/^(\d{4})-(\d{4})$/);

  if (!match) {
    throw new Error('CURRENT_ACADEMIC_YEAR must be in YYYY-YYYY format (example: 2025-2026).');
  }

  const startYear = Number.parseInt(match[1], 10);
  const endYear = Number.parseInt(match[2], 10);

  if (endYear !== startYear + 1) {
    throw new Error('CURRENT_ACADEMIC_YEAR must span consecutive years (example: 2025-2026).');
  }

  return `${startYear}-${endYear}`;
}

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
  currentAcademicYear: resolveAcademicYear()
};
