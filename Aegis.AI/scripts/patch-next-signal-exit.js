const fs = require('fs');
const path = require('path');

const target = path.join(
  __dirname,
  '..',
  'node_modules',
  'next',
  'dist',
  'server',
  'lib',
  'start-server.js',
);

if (!fs.existsSync(target)) {
  process.exit(0);
}

const source = fs.readFileSync(target, 'utf8');
const needle = 'process.exit(code ?? 0);';
const replacement = 'process.exit(typeof code === "number" ? code : 0);';

if (source.includes(replacement) || !source.includes(needle)) {
  process.exit(0);
}

fs.writeFileSync(target, source.replace(needle, replacement));
