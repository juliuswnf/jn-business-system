#!/usr/bin/env node
/* eslint-disable no-console */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const SKIP_PREFIXES = [
  'frontend/dist/',
  'frontend/e2e-report/',
  'frontend/test-results/',
  'backend/coverage/',
  'backend/tests/'
];

const SCANNABLE_EXTENSIONS = new Set([
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.json',
  '.yml',
  '.yaml',
  '.md',
  '.env',
  '.txt',
  '.cjs'
]);

const SCANNABLE_FILENAMES = new Set([
  'docker-compose.yml',
  'docker-compose.dev.yml',
  'docker-compose.prod.yml'
]);

const PLACEHOLDER_WORDS = /example|your-|your_|change-me|replace|placeholder|dummy|sample|not set|set in/i;

const PATTERNS = [
  {
    id: 'stripe_live_key',
    regex: /sk_live_[A-Za-z0-9]{16,}/g,
    shouldReport: () => true
  },
  {
    id: 'private_key',
    regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
    shouldReport: () => true
  },
  {
    id: 'hardcoded_jwt_secret',
    regex: /\bJWT_SECRET\b\s*[:=]\s*["']?([^"'\s]{16,})["']?/gi,
    shouldReport: (match, line) =>
      !line.includes('${') &&
      !line.includes('process.env') &&
      !PLACEHOLDER_WORDS.test(match[1]) &&
      !String(match[1]).toLowerCase().startsWith('test-')
  },
  {
    id: 'hardcoded_twilio_token',
    regex: /\bTWILIO_AUTH_TOKEN\b\s*[:=]\s*["']?([^"'\s]{16,})["']?/gi,
    shouldReport: (match, line) =>
      !line.includes('${') &&
      !line.includes('process.env') &&
      !PLACEHOLDER_WORDS.test(match[1])
  },
  {
    id: 'hardcoded_api_key',
    regex: /\bAPI_KEY\b\s*[:=]\s*["']?([^"'\s]{20,})["']?/gi,
    shouldReport: (match, line) =>
      !line.includes('${') &&
      !line.includes('process.env') &&
      !PLACEHOLDER_WORDS.test(match[1])
  }
];

const getRepoRoot = () => execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();

const isScannableFile = (relativeFilePath) => {
  if (SKIP_PREFIXES.some((prefix) => relativeFilePath.startsWith(prefix))) {
    return false;
  }

  const ext = path.extname(relativeFilePath);
  const fileName = path.basename(relativeFilePath);

  return SCANNABLE_EXTENSIONS.has(ext) || SCANNABLE_FILENAMES.has(fileName);
};

const maskSecret = (value) => {
  if (!value || value.length < 8) {
    return '***';
  }

  return `${value.slice(0, 4)}...${value.slice(-4)}`;
};

const scanFile = (repoRoot, relativeFilePath) => {
  const absolutePath = path.join(repoRoot, relativeFilePath);
  let content = '';

  try {
    content = fs.readFileSync(absolutePath, 'utf8');
  } catch {
    return [];
  }

  const findings = [];
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    PATTERNS.forEach((pattern) => {
      pattern.regex.lastIndex = 0;

      let match = pattern.regex.exec(line);
      while (match) {
        if (pattern.shouldReport(match, line)) {
          const detectedValue = match[1] || match[0];
          findings.push({
            file: relativeFilePath,
            line: index + 1,
            type: pattern.id,
            preview: maskSecret(detectedValue)
          });
        }

        match = pattern.regex.exec(line);
      }
    });
  });

  return findings;
};

const main = () => {
  const repoRoot = getRepoRoot();
  const trackedFiles = execSync('git ls-files', {
    cwd: repoRoot,
    encoding: 'utf8'
  })
    .split(/\r?\n/)
    .filter(Boolean)
    .filter(isScannableFile);

  const findings = trackedFiles.flatMap((file) => scanFile(repoRoot, file));

  if (findings.length === 0) {
    console.log('No hardcoded secrets detected in tracked files.');
    process.exit(0);
  }

  console.error('Potential hardcoded secrets found:');
  findings.forEach((finding) => {
    console.error(`- ${finding.file}:${finding.line} [${finding.type}] ${finding.preview}`);
  });

  process.exit(1);
};

main();
