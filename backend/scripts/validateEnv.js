#!/usr/bin/env node
const required = [
  'NODE_ENV',
  'PORT',
  'MONGODB_URI',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
];

const missing = required.filter((k) => !process.env[k]);

if (missing.length) {
  console.error('Missing required environment variables:', missing.join(', '));
  process.exitCode = 1;
} else {
  console.log('All required environment variables are present.');
}
