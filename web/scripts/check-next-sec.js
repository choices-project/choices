#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const req = require('module').createRequire(process.cwd() + '/package.json');
const semver = req('semver');

const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json')));
const v = (pkg.dependencies && pkg.dependencies.next) || (pkg.devDependencies && pkg.devDependencies.next) || '';
if (!v) {
  console.log('ℹ️  No Next.js dependency found; skipping version gate.');
  process.exit(0);
}
const coerce = semver.coerce(v);
if (!coerce) {
  console.log('ℹ️  Could not parse Next.js version; skipping.');
  process.exit(0);
}
// Allowed: >=14.2.25 <15  OR  >=15.2.3
const ok = semver.satisfies(coerce, '>=14.2.25 <15 || >=15.2.3');
if (!ok) {
  console.error(`❌ Next.js ${coerce.version} is in a known vulnerable range (middleware bypass). Require >=14.2.25 or >=15.2.3.`);
  process.exit(1);
}
console.log(`✅ Next.js ${coerce.version} passes security gate.`);
