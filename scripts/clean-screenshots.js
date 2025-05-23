#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const targetDir = path.resolve(__dirname, '../tests/__screenshots__');

try {
  fs.rmSync(targetDir, { recursive: true, force: true });
  console.log(`✅ Cleaned: ${targetDir}`);
} catch (err) {
  console.error(`Failed to clean ${targetDir}`, err);
  process.exitCode = 1;
} 