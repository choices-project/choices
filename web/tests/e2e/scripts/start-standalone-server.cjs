'use strict';

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '../../..');
const standaloneDir = path.resolve(projectRoot, '.next/standalone');
const staticSource = path.resolve(projectRoot, '.next/static');
const staticTarget = path.resolve(standaloneDir, '.next/static');
const publicSource = path.resolve(projectRoot, 'public');
const publicTarget = path.resolve(standaloneDir, 'public');

if (fs.existsSync(staticSource)) {
  fs.mkdirSync(staticTarget, { recursive: true });
  for (const entry of fs.readdirSync(staticSource)) {
    fs.cpSync(path.join(staticSource, entry), path.join(staticTarget, entry), {
      recursive: true,
    });
  }
}

if (fs.existsSync(publicSource)) {
  fs.mkdirSync(publicTarget, { recursive: true });
  for (const entry of fs.readdirSync(publicSource)) {
    fs.cpSync(path.join(publicSource, entry), path.join(publicTarget, entry), {
      recursive: true,
    });
  }
}

const hostname = process.env.HOSTNAME ?? 'localhost';
const port = process.env.PORT ?? '3000';

const serverEntrypoint = path.resolve(projectRoot, '.next/standalone/server.js');

const server = spawn(
  process.execPath,
  [serverEntrypoint],
  {
    cwd: standaloneDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: process.env.NODE_ENV ?? 'production',
      HOSTNAME: hostname,
      PORT: port,
      NEXT_PUBLIC_DISABLE_FEEDBACK_WIDGET:
        process.env.NEXT_PUBLIC_DISABLE_FEEDBACK_WIDGET ?? '1',
      NEXT_PUBLIC_ENABLE_E2E_HARNESS:
        process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS ?? '1',
    },
  },
);

server.on('exit', (code, signal) => {
  if (typeof code === 'number') {
    process.exit(code);
  }
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(0);
  }
});

