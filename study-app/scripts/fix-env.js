/**
 * Converts multi-line JSON values in .env.local to single-line so dotenv can parse them.
 * Run once: node scripts/fix-env.js
 */
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env.local');
if (!fs.existsSync(envPath)) {
  console.log('No .env.local found, nothing to do.');
  process.exit(0);
}

const content = fs.readFileSync(envPath, 'utf8');
const lines = content.split('\n');
const result = [];
let accumulating = false;
let jsonLines = [];
let key = '';
let braceCount = 0;

for (const line of lines) {
  if (!accumulating && /^[A-Z_]+=\s*[{\[]/.test(line)) {
    const eqIdx = line.indexOf('=');
    key = line.substring(0, eqIdx);
    const val = line.substring(eqIdx + 1);
    accumulating = true;
    jsonLines = [val];
    braceCount = (val.match(/[{[]/g) || []).length - (val.match(/[}\]]/g) || []).length;
    if (braceCount <= 0) {
      // Already on one line
      try {
        const parsed = JSON.parse(val);
        result.push(key + '=' + JSON.stringify(parsed));
        console.log('Already single-line:', key);
      } catch (e) {
        result.push(line);
      }
      accumulating = false;
      jsonLines = [];
      key = '';
      braceCount = 0;
    }
  } else if (accumulating) {
    jsonLines.push(line);
    braceCount += (line.match(/[{[]/g) || []).length - (line.match(/[}\]]/g) || []).length;
    if (braceCount <= 0) {
      const jsonStr = jsonLines.join('\n');
      try {
        const parsed = JSON.parse(jsonStr);
        result.push(key + '=' + JSON.stringify(parsed));
        console.log('Converted to single line:', key, '(' + JSON.stringify(parsed).length + ' chars)');
      } catch (e) {
        result.push(key + '=' + jsonStr);
        console.error('Could not parse:', key, '-', e.message);
      }
      accumulating = false;
      jsonLines = [];
      key = '';
      braceCount = 0;
    }
  } else {
    result.push(line);
  }
}

fs.writeFileSync(envPath, result.join('\n'));
console.log('Done. Total lines written:', result.length);
