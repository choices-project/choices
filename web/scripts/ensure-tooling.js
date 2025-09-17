#!/usr/bin/env node

/**
 * Toolchain version enforcement script
 * 
 * Ensures all developers and CI use the exact same Node.js and npm versions
 * to prevent "works on my machine" issues and lockfile inconsistencies.
 */

const semverEq = (a, b) => a.trim() === b.trim();
const reqNode = "22.19.0";
const reqNpm = "10.9.3";

import { execSync } from "child_process";
const npmV = execSync("npm -v").toString().trim();
const nodeV = process.versions.node;

if (!semverEq(nodeV, reqNode) || !semverEq(npmV, reqNpm)) {
  console.error(
    `\n✖ Tooling mismatch\n  node: have ${nodeV}, need ${reqNode}\n  npm:  have ${npmV},  need ${reqNpm}\n\n` +
    `Fix:\n  Volta → volta install node@${reqNode} npm@${reqNpm}\n  nvm   → nvm install ${reqNode} && corepack enable && corepack prepare npm@${reqNpm} --activate\n`
  );
  process.exit(1);
}

console.log(`✓ Toolchain OK: node ${nodeV}, npm ${npmV}`);
