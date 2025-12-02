/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const backendRoot = path.join(__dirname, '..');
const loggerPath = path.join(backendRoot, 'utils', 'logger.js');

function walk(dir) {
  const results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    const fp = path.join(dir, file);
    const stat = fs.statSync(fp);
    if (stat && stat.isDirectory()) {
      // skip node_modules if accidentally present
      if (file === 'node_modules') { return; }
      results.push(...walk(fp));
    } else {
      if (file.endsWith('.js')) { results.push(fp); }
    }
  });
  return results;
}

const files = walk(backendRoot).filter(f => f !== loggerPath && !f.endsWith('replace-console-with-logger.cjs'));
const consoles = /\bconsole\.(log|error|warn|info|debug|trace)\b/g;
const importLoggerRegex = /import\s+logger\b/;

const modified = [];

files.forEach(file => {
  try {
    let content = fs.readFileSync(file, 'utf8');
    if (!consoles.test(content)) { return; }
    // reset regex state
    consoles.lastIndex = 0;

    let newContent = content.replace(consoles, 'logger.$1');

    if (!importLoggerRegex.test(newContent)) {
      // compute relative path from file to logger
      let rel = path.relative(path.dirname(file), loggerPath).split(path.sep).join('/');
      if (!rel.startsWith('.')) rel = './' + rel;
      const importStmt = `import logger from '${rel}';\n`;

      // insert after last import block if present
      const importBlock = newContent.match(/^(?:\s*import[^\n]+\n)+/m);
      if (importBlock && importBlock.index === 0) {
        const idx = importBlock[0].length;
        newContent = newContent.slice(0, idx) + importStmt + newContent.slice(idx);
      } else {
        newContent = importStmt + newContent;
      }
    }

    if (newContent !== content) {
      fs.writeFileSync(file, newContent, 'utf8');
      modified.push(file);
    }
  } catch (err) {
    console.error('Error processing', file, err && err.message);
  }
});

console.log('Modified files count:', modified.length);
modified.forEach(f => console.log('  ', f));

if (modified.length === 0) {
  console.log('No files modified.');
}
