#!/usr/bin/env node

/**
 * Cross-platform timeout runner.
 * Usage: node ./scripts/run-with-timeout.js <seconds> <command> [...args]
 */

import { spawn } from 'node:child_process';

function printUsageAndExit() {
  console.error('Usage: node ./scripts/run-with-timeout.js <seconds> <command> [...args]');
  process.exit(1);
}

const [, , timeoutSecondsArg, ...commandParts] = process.argv;

if (!timeoutSecondsArg || commandParts.length === 0) {
  printUsageAndExit();
}

const timeoutSeconds = Number(timeoutSecondsArg);

if (Number.isNaN(timeoutSeconds) || timeoutSeconds <= 0) {
  console.error('Timeout must be a positive number of seconds.');
  process.exit(1);
}

const child = spawn(commandParts[0], commandParts.slice(1), {
  stdio: 'inherit',
  shell: process.platform === 'win32'
});

const timeout = setTimeout(() => {
  console.error(`Command timed out after ${timeoutSeconds} seconds. Sending SIGTERM...`);
  child.kill('SIGTERM');

  const killTimer = setTimeout(() => {
    console.error('Command did not exit after SIGTERM. Sending SIGKILL...');
    child.kill('SIGKILL');
  }, 5000);

  child.once('exit', () => {
    clearTimeout(killTimer);
  });
}, timeoutSeconds * 1000);

child.on('exit', (code, signal) => {
  clearTimeout(timeout);

  if (signal === 'SIGTERM' || signal === 'SIGKILL') {
    process.exit(124);
    return;
  }

  process.exit(code ?? 0);
});
child.on('error', error => {
  console.error('Failed to start command:', error);
  process.exit(1);
});

