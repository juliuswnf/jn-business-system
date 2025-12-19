#!/usr/bin/env node

/*
 * Jest runner wrapper.
 *
 * Workaround for environments where `node_modules/jest/bin/jest.js` ships with a UTF-8 BOM,
 * which can cause Node to fail parsing the shebang line.
 */

const jest = require('jest');

jest.run(process.argv.slice(2));
