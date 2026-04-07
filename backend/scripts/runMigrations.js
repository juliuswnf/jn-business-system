/**
 * Migration Runner
 *
 * Reads all .js files from backend/migrations/, runs each one that has not
 * been recorded in the "migrations" collection yet, and tracks completed
 * migrations by filename + timestamp.
 *
 * Usage: npm run migrate:run
 */

import mongoose from 'mongoose';
import { readdir } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = resolve(__dirname, '../migrations');

// Minimal schema – just needs name + ranAt
const migrationSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  ranAt: { type: Date, default: Date.now },
});
const Migration = mongoose.models.Migration || mongoose.model('Migration', migrationSchema);

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);

  // Load already-ran migrations
  const completed = new Set(
    (await Migration.find({}).select('name').lean()).map((m) => m.name)
  );

  // Read all migration files, sorted for deterministic order
  const files = (await readdir(MIGRATIONS_DIR))
    .filter((f) => f.endsWith('.js'))
    .sort();

  for (const file of files) {
    if (completed.has(file)) {
      console.log(`⏭  skipped  ${file}`);
      continue;
    }

    const filePath = pathToFileURL(resolve(MIGRATIONS_DIR, file)).href;
    const mod = await import(filePath);

    // Support both default export (function) and named `up` export
    const migrateFn = mod.default ?? mod.up;
    if (typeof migrateFn !== 'function') {
      console.warn(`⚠️  ${file}: no default or "up" export found – skipping`);
      continue;
    }

    await migrateFn();
    await Migration.create({ name: file });
    console.log(`✅ ran       ${file}`);
  }

  console.log('\nAll migrations complete.');
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Migration runner failed:', err);
  process.exit(1);
});
