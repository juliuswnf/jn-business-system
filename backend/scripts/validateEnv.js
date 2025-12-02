#!/usr/bin/env node
import logger from '../utils/logger.js';

const required = [
  'NODE_ENV',
  'PORT',
  'MONGODB_URI',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET'
];

const missing = required.filter((k) => !process.env[k]);

if (missing.length) {
  logger.error('Missing required environment variables:', missing.join(', '));
  process.exitCode = 1;
} else {
  logger.log('All required environment variables are present.');
}
