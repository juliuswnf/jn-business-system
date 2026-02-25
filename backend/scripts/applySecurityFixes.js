#!/usr/bin/env node
/**
 * SECURITY FIX AUTOMATION SCRIPT
 * Applies Codacy Critical Security Fixes Systematically
 *
 * Run: node backend/scripts/applySecurityFixes.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

// ==================== FIX PATTERNS ====================

const fixes = [
  {
    name: 'Replace Math.random() with crypto.randomBytes() for IDs',
    pattern: /Math\.random\(\)\.toString\(36\)\.substr\(2, 9\)/g,
    replacement: "crypto.randomBytes(6).toString('hex')",
    addImport: "import crypto from 'crypto';"
  },
  {
    name: 'Replace Math.random() for file suffixes',
    pattern: /Date\.now\(\) \+ '-' \+ Math\.round\(Math\.random\(\) \* 1E9\)/g,
    replacement: "`${Date.now()}-${crypto.randomBytes(8).toString('hex')}`",
    addImport: "import crypto from 'crypto';"
  },
  {
    name: 'Fix NoSQL Injection in findOne with user email',
    pattern: /findOne\(\{ email: email\b/g,
    replacement: 'findOne({ email: String(email).toLowerCase()',
    note: 'Validates email is string before query'
  },
  {
    name: 'Fix password comparison timing attack',
    pattern: /if \(password !== confirmPassword\)/g,
    replacement: 'if (!crypto.timingSafeEqual(Buffer.from(password), Buffer.from(confirmPassword)))',
    addImport: "import crypto from 'crypto';"
  },
  {
    name: 'Escape HTML in template strings',
    pattern: /<p>\$\{([^}]+)\}<\/p>/g,
    replacement: (match, p1) => `<p>\${escapeHtml(${p1})}</p>`,
    addImport: "import { escapeHtml } from '../utils/securityHelpers.js';"
  }
];

// ==================== FILE SCANNER ====================

const scanFile = async (filePath) => {
  const content = await fs.promises.readFile(filePath, 'utf-8');
  let modified = content;
  let changes = [];
  const importsToAdd = new Set();

  for (const fix of fixes) {
    if (modified.match(fix.pattern)) {
      modified = modified.replace(fix.pattern, fix.replacement);
      changes.push(fix.name);
      if (fix.addImport) {
        importsToAdd.add(fix.addImport);
      }
    }
  }

  if (changes.length > 0) {
    // Add missing imports at the top
    if (importsToAdd.size > 0) {
      const imports = Array.from(importsToAdd).join('\n');
      modified = imports + '\n' + modified;
    }

    return { filePath, changes, newContent: modified };
  }

  return null;
};

// ==================== DIRECTORY SCANNER ====================

const scanDirectory = async (dir, results = []) => {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip node_modules, .git, etc.
      if (['node_modules', '.git', 'dist', 'build', 'coverage'].includes(entry.name)) {
        continue;
      }
      await scanDirectory(fullPath, results);
    } else if (entry.name.endsWith('.js') || entry.name.endsWith('.jsx')) {
      const result = await scanFile(fullPath);
      if (result) {
        results.push(result);
      }
    }
  }

  return results;
};

// ==================== MAIN EXECUTION ====================

const main = async () => {
  console.log('🔒 Starting Security Fix Automation...\n');

  const backendDir = path.join(projectRoot, 'backend');
  const frontendDir = path.join(projectRoot, 'frontend', 'src');

  console.log('📁 Scanning backend...');
  const backendResults = await scanDirectory(backendDir);

  console.log('📁 Scanning frontend...');
  const frontendResults = await scanDirectory(frontendDir);

  const allResults = [...backendResults, ...frontendResults];

  if (allResults.length === 0) {
    console.log('✅ No security issues found or all already fixed!');
    return;
  }

  console.log(`\n🔧 Found ${allResults.length} files with security issues:\n`);

  for (const result of allResults) {
    const relativePath = path.relative(projectRoot, result.filePath);
    console.log(`📝 ${relativePath}`);
    result.changes.forEach(change => console.log(`   - ${change}`));
    console.log();
  }

  // Ask for confirmation (skipped in automated mode)
  console.log(`\n⚠️  This will modify ${allResults.length} files.`);
  console.log('Run with --apply to apply changes:\n');
  console.log('  node backend/scripts/applySecurityFixes.js --apply\n');

  if (process.argv.includes('--apply')) {
    console.log('🚀 Applying fixes...\n');

    for (const result of allResults) {
      await fs.promises.writeFile(result.filePath, result.newContent, 'utf-8');
      const relativePath = path.relative(projectRoot, result.filePath);
      console.log(`✅ Fixed: ${relativePath}`);
    }

    console.log(`\n✨ Successfully fixed ${allResults.length} files!`);
    console.log('\n📋 Next steps:');
    console.log('1. Review changes: git diff');
    console.log('2. Run tests: npm test');
    console.log('3. Commit: git add . && git commit -m "Security: Fix Codacy critical issues"');
  }
};

main().catch(console.error);
